import { clearPartialChunks, getPartialChunks, savePartialChunk, type SavedReceipt } from './db';
import { RoomService, RoomServiceError, type RoomStatus } from './signaling';

export type FileManifest = { id: string; name: string; type: string; size: number; hash: string };
export type TransferHooks = {
  onState: (message: string, tone?: 'note' | 'error' | 'success') => void;
  onProgress: (fileId: string, received: number, total: number) => void;
  onManifest: (files: FileManifest[]) => void;
  onFile: (manifest: FileManifest, blob: Blob) => void;
  onFileError: (manifest: FileManifest) => void;
  onReceipt: (receipt: SavedReceipt) => void;
};

const WORDS = ['amber', 'apple', 'atlas', 'birch', 'blue', 'brisk', 'cedar', 'chime', 'cobalt', 'comet', 'coral', 'daisy', 'delta', 'elm', 'fern', 'field', 'finch', 'fog', 'globe', 'green', 'harbor', 'honey', 'iris', 'juniper', 'kite', 'lake', 'lemon', 'maple', 'mint', 'moon', 'moss', 'north', 'oak', 'olive', 'orbit', 'paper', 'peach', 'pebble', 'pine', 'plum', 'quartz', 'reed', 'river', 'sage', 'shell', 'silver', 'sparrow', 'star', 'stone', 'sunny', 'teal', 'thistle', 'tulip', 'violet', 'warm', 'willow', 'wind', 'winter', 'wren', 'yellow', 'zinnia'];
const ROOM_PATTERN = /^[a-z]+(?:-[a-z]+){5}$/;
const delay = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

type TransferState =
  | { path: 'direct'; phase: 'pairing' | 'opening' | 'ready' | 'paused' | 'failed' }
  | { path: 'relay'; phase: 'consenting' | 'waiting' | 'ready' | 'transferring' | 'complete' | 'error'; role: 'sender' | 'receiver' };

export function makeRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((byte) => WORDS[byte % WORDS.length]).join('-');
}

export function validRoomCode(code: string): boolean {
  return ROOM_PATTERN.test(code.trim().toLowerCase());
}

export async function hashFile(file: Blob): Promise<string> {
  const bytes = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

async function waitForIce(peer: RTCPeerConnection): Promise<void> {
  if (peer.iceGatheringState === 'complete') return;
  await new Promise<void>((resolve) => {
    const stop = () => {
      if (peer.iceGatheringState === 'complete') {
        peer.removeEventListener('icegatheringstatechange', stop);
        resolve();
      }
    };
    peer.addEventListener('icegatheringstatechange', stop);
    window.setTimeout(resolve, 5000);
  });
}

export class DirectTransfer {
  private peer!: RTCPeerConnection;
  private channel?: RTCDataChannel;
  private room: RoomService;
  private incoming = new Map<string, { manifest: FileManifest; chunks: ArrayBuffer[]; received: number }>();
  private verifiedIncoming = new Set<string>();
  private failedIncoming = new Set<string>();
  private currentFile = '';
  private receiveQueue = Promise.resolve();
  private resumeWaiters = new Map<string, (offset: number) => void>();
  private transferState: TransferState = { path: 'direct', phase: 'pairing' };
  private role?: 'sender' | 'receiver';
  private offerVersion = 0;
  private handledRejoinVersion = 0;
  private watching = false;
  private replacingOffer = false;

  constructor(private roomCode: string, private hooks: TransferHooks) {
    this.room = new RoomService(roomCode);
    this.replacePeer();
  }

  private replacePeer(): void {
    this.channel?.close();
    if (this.peer) {
      this.peer.onconnectionstatechange = null;
      this.peer.ondatachannel = null;
      this.peer.close();
    }
    const peer = new RTCPeerConnection({ iceServers: [] });
    this.peer = peer;
    peer.onconnectionstatechange = () => {
      if (this.peer !== peer) return;
      const state = peer.connectionState;
      if (state === 'connected') this.setDirectState('ready', 'Devices connected. The direct path is ready.', 'success');
      if (state === 'failed') this.setDirectState('failed', 'The direct path failed. Choose the private relay below on both devices.', 'error');
      if (state === 'disconnected') this.setDirectState('paused', 'Connection paused. Rejoin this room to resume saved chunks.', 'note');
    };
    peer.ondatachannel = (event) => {
      if (this.peer === peer) this.attachChannel(event.channel);
    };
  }

  private setState(next: TransferState, message?: string, tone: 'note' | 'error' | 'success' = 'note'): boolean {
    // Relay selection is a one-way user decision for this transfer. No
    // callback or in-flight direct request may move the UI back to direct.
    if (this.transferState.path === 'relay' && next.path === 'direct') return false;
    this.transferState = next;
    if (message) this.hooks.onState(message, tone);
    return true;
  }

  private setDirectState(phase: Extract<TransferState, { path: 'direct' }>['phase'], message: string, tone: 'note' | 'error' | 'success' = 'note'): boolean {
    return this.setState({ path: 'direct', phase }, message, tone);
  }

  private setRelayState(phase: Extract<TransferState, { path: 'relay' }>['phase'], role: 'sender' | 'receiver', message?: string, tone: 'note' | 'error' | 'success' = 'note'): boolean {
    return this.setState({ path: 'relay', phase, role }, message, tone);
  }

  private async pollRoomStatus(): Promise<RoomStatus | undefined> {
    try {
      return await this.room.status();
    } catch (error) {
      if (!(error instanceof RoomServiceError) || !error.retryable) throw error;
      await delay(error.retryAfterMs);
      return undefined;
    }
  }

  private attachChannel(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => {
      this.setDirectState('ready', 'Devices connected. The direct path is ready.', 'success');
    };
    channel.onerror = () => {
      this.setDirectState('failed', 'The direct path stopped. Rejoin to resume, or choose the relay.', 'error');
    };
    channel.onmessage = (event) => {
      this.receiveQueue = this.receiveQueue.then(() => this.receive(event.data)).catch(() => {
        this.setDirectState('failed', 'A received chunk could not be saved. Rejoin the room to resume.', 'error');
      });
    };
  }

  private async publishOffer(action: 'create' | 'reopen'): Promise<void> {
    this.replacePeer();
    this.attachChannel(this.peer.createDataChannel('files', { ordered: true }));
    await this.peer.setLocalDescription(await this.peer.createOffer());
    await waitForIce(this.peer);
    const status = await this.room.post(action, { offer: this.peer.localDescription });
    this.offerVersion = status.offerVersion || (action === 'create' ? 1 : this.offerVersion + 1);
    this.handledRejoinVersion = status.rejoinVersion || this.handledRejoinVersion;
  }

  async createRoom(): Promise<void> {
    this.role = 'sender';
    await this.publishOffer('create');
    this.setDirectState('pairing', 'Room ready. Share only the six words with the receiver.');
    this.startWatcher();
  }

  async reopenRoom(): Promise<void> {
    this.role = 'sender';
    await this.publishOffer('reopen');
    this.setDirectState('pairing', 'Room reopened. Waiting for the receiving browser to reconnect.');
    this.startWatcher();
  }

  private async acceptOffer(status: RoomStatus): Promise<void> {
    if (!status.offer) throw new Error('That room is not ready. Check the six words and try again.');
    this.replacePeer();
    await this.peer.setRemoteDescription(status.offer);
    await this.peer.setLocalDescription(await this.peer.createAnswer());
    await waitForIce(this.peer);
    await this.room.post('answer', { answer: this.peer.localDescription, offerVersion: status.offerVersion || 1 });
    this.offerVersion = status.offerVersion || 1;
    this.setDirectState('opening', 'Room joined. Opening the direct path…');
  }

  async joinRoom(): Promise<void> {
    this.role = 'receiver';
    const status = await this.room.status();
    if (!status.offer) throw new Error('That room is not ready. Check the six words and try again.');
    // An answer means this room has already had a peer. Ask the still-open
    // sender to replace its now-dead connection before answering again.
    if (status.answer) {
      await this.room.post('rejoin');
      this.offerVersion = status.offerVersion || 1;
      this.setDirectState('opening', 'Rejoining the room. Waiting for a fresh direct path…');
    } else {
      await this.acceptOffer(status);
    }
    this.startWatcher();
  }

  private startWatcher(): void {
    if (this.watching) return;
    this.watching = true;
    void this.watchRoom();
  }

  private async watchRoom(): Promise<void> {
    for (let attempt = 0; attempt < 900; attempt += 1) {
      if (this.transferState.path !== 'direct') return;
      const status = await this.room.status().catch(() => undefined);
      if (!status || this.transferState.path !== 'direct') {
        await delay(1000);
        continue;
      }
      try {
        if (this.role === 'sender') {
          if ((status.rejoinVersion || 0) > this.handledRejoinVersion && !this.replacingOffer) {
            this.replacingOffer = true;
            this.handledRejoinVersion = status.rejoinVersion || this.handledRejoinVersion;
            this.setDirectState('opening', 'Receiver is rejoining. Creating a fresh direct path…');
            await this.publishOffer('reopen');
            this.setDirectState('pairing', 'Fresh direct path ready. Waiting for the receiver to reconnect.');
            this.replacingOffer = false;
          }
          if (status.answer && (status.answerVersion || 1) === this.offerVersion && !this.peer.remoteDescription) {
            await this.peer.setRemoteDescription(status.answer);
            this.setDirectState('opening', 'Receiver joined. Opening the direct path…');
          }
        } else if (this.role === 'receiver' && status.offer && (status.offerVersion || 1) > this.offerVersion) {
          await this.acceptOffer(status);
        }
      } catch (error) {
        this.replacingOffer = false;
        this.setDirectState('failed', error instanceof Error ? error.message : 'The direct path could not reconnect. Rejoin this room to try again.', 'error');
      }
      await delay(1000);
    }
  }

  async enableRelay(role: 'sender' | 'receiver'): Promise<void> {
    if (this.transferState.path === 'relay' && this.transferState.phase !== 'error') return;
    this.setRelayState('consenting', role, 'Saving your relay choice…');
    try {
      await this.room.post('relay-consent', { role });
    } catch (error) {
      this.setRelayState('error', role);
      throw error;
    }
    this.setRelayState('waiting', role, 'Relay chosen. Waiting for the other person to choose it too.');
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const status = await this.pollRoomStatus();
      if (status?.relay.ready) {
        this.setRelayState('ready', role, 'Relay ready. It will hold this transfer for up to 15 minutes.', 'success');
        if (role === 'receiver') void this.receiveRelay().catch((error) => {
          this.setRelayState('error', 'receiver', error instanceof Error ? error.message : 'The relay stopped. Rejoin the room and try again.', 'error');
        });
        return;
      }
      await delay(1000);
    }
    throw new Error('The other person did not choose the relay.');
  }

  private async receiveRelay(): Promise<void> {
    this.setRelayState('transferring', 'receiver');
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const status = await this.pollRoomStatus();
      if (!status) continue;
      if (!status.manifest) { await delay(1000); continue; }
      this.hooks.onManifest(status.manifest);
      const receivedFiles: SavedReceipt['files'] = [];
      for (const manifest of status.manifest) {
        let blob: Blob | undefined;
        while (!blob) {
          try { blob = await this.room.downloadFile(manifest.id); }
          catch { await delay(800); }
        }
        const hash = await hashFile(blob);
        if (hash !== manifest.hash) throw new Error(`${manifest.name} did not match its hash.`);
        this.hooks.onProgress(manifest.id, manifest.size, manifest.size);
        this.hooks.onFile(manifest, blob);
        receivedFiles.push({ name: manifest.name, size: manifest.size, hash: manifest.hash });
      }
      const receipt: SavedReceipt = { id: crypto.randomUUID(), roomCode: this.roomCode, completedAt: new Date().toISOString(), direction: 'received', files: receivedFiles };
      this.hooks.onReceipt(receipt);
      await this.room.post('receipt', { receipt });
      this.setRelayState('complete', 'receiver');
      return;
    }
    throw new Error('The relay transfer did not arrive before the room expired. Ask the sender to make a new room.');
  }

  get isReady(): boolean {
    if (this.transferState.path === 'relay') return this.transferState.phase === 'ready';
    return this.channel?.readyState === 'open';
  }

  get code(): string {
    return this.roomCode;
  }

  async send(files: File[], manifests: FileManifest[]): Promise<void> {
    if (this.transferState.path === 'relay' && this.transferState.role === 'sender') {
      if (this.transferState.phase !== 'ready') throw new Error('Wait for the other person to choose the relay before sending.');
      this.setRelayState('transferring', 'sender');
      await this.room.post('manifest', { manifest: manifests });
      for (let index = 0; index < files.length; index += 1) {
        await this.room.uploadFile(manifests[index].id, files[index], (sent) => this.hooks.onProgress(manifests[index].id, sent, manifests[index].size));
      }
      this.setRelayState('transferring', 'sender', 'Files uploaded. Waiting for the receiver to verify them.');
      for (let attempt = 0; attempt < 180; attempt += 1) {
        const status = await this.pollRoomStatus();
        if (status?.receipt) {
          this.hooks.onReceipt({ ...status.receipt, direction: 'sent' });
          this.setRelayState('complete', 'sender', 'The receiver verified every file.', 'success');
          return;
        }
        await delay(1000);
      }
      throw new Error('The relay receipt did not arrive before the room expired.');
    }
    if (!this.channel || this.channel.readyState !== 'open') throw new Error('Connect the other device before sending files.');
    this.channel.send(JSON.stringify({ type: 'manifest', files: manifests }));
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const manifest = manifests[index];
      const offsetPromise = new Promise<number>((resolve) => {
        this.resumeWaiters.set(manifest.id, resolve);
        window.setTimeout(() => resolve(0), 2500);
      });
      this.channel.send(JSON.stringify({ type: 'file-start', id: manifest.id }));
      let sent = Math.min(await offsetPromise, file.size);
      if (sent) this.hooks.onState(`Resuming ${manifest.name} at ${Math.round(sent / 1024)} KB.`, 'note');
      while (sent < file.size) {
        while (this.channel.bufferedAmount > 1024 * 1024) await delay(40);
        const chunk = await file.slice(sent, sent + 32 * 1024).arrayBuffer();
        this.channel.send(chunk);
        sent += chunk.byteLength;
        this.hooks.onProgress(manifest.id, sent, file.size);
      }
      this.channel.send(JSON.stringify({ type: 'file-end', id: manifest.id }));
    }
    this.channel.send(JSON.stringify({ type: 'transfer-end' }));
  }

  private async receive(data: string | ArrayBuffer): Promise<void> {
    if (data instanceof ArrayBuffer) {
      const entry = this.incoming.get(this.currentFile);
      if (!entry) return;
      const offset = entry.received;
      await savePartialChunk(this.roomCode, entry.manifest.id, offset, data);
      entry.chunks.push(data);
      entry.received += data.byteLength;
      this.hooks.onProgress(entry.manifest.id, entry.received, entry.manifest.size);
      return;
    }
    const message = JSON.parse(data) as { type: string; files?: FileManifest[]; id?: string; offset?: number; receipt?: SavedReceipt };
    if (message.type === 'manifest' && message.files) {
      this.incoming.clear();
      this.verifiedIncoming.clear();
      this.failedIncoming.clear();
      this.currentFile = '';
      message.files.forEach((manifest) => this.incoming.set(manifest.id, { manifest, chunks: [], received: 0 }));
      this.hooks.onManifest(message.files);
    }
    if (message.type === 'file-start' && message.id) {
      this.currentFile = message.id;
      const entry = this.incoming.get(message.id);
      if (!entry) return;
      this.verifiedIncoming.delete(message.id);
      this.failedIncoming.delete(message.id);
      const chunks = await getPartialChunks(this.roomCode, message.id);
      const received = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
      if (received <= entry.manifest.size) {
        entry.chunks = chunks;
        entry.received = received;
        this.hooks.onProgress(entry.manifest.id, received, entry.manifest.size);
      } else {
        await clearPartialChunks(this.roomCode, message.id);
      }
      this.channel?.send(JSON.stringify({ type: 'resume', id: message.id, offset: entry.received }));
    }
    if (message.type === 'resume' && message.id) {
      this.resumeWaiters.get(message.id)?.(message.offset ?? 0);
      this.resumeWaiters.delete(message.id);
    }
    if (message.type === 'file-end' && message.id) {
      const entry = this.incoming.get(message.id);
      if (!entry) return;
      const blob = new Blob(entry.chunks, { type: entry.manifest.type });
      const hash = await hashFile(blob);
      if (hash !== entry.manifest.hash) {
        await clearPartialChunks(this.roomCode, message.id);
        entry.chunks = [];
        entry.received = 0;
        this.verifiedIncoming.delete(message.id);
        this.failedIncoming.add(message.id);
        this.hooks.onFileError(entry.manifest);
        this.setDirectState('failed', `${entry.manifest.name} did not match its hash. Rejoin to retry it.`, 'error');
        return;
      }
      await clearPartialChunks(this.roomCode, message.id);
      this.failedIncoming.delete(message.id);
      this.verifiedIncoming.add(message.id);
      this.hooks.onFile(entry.manifest, blob);
    }
    if (message.type === 'transfer-end') {
      const everyFileVerified = this.incoming.size > 0
        && [...this.incoming.keys()].every((id) => this.verifiedIncoming.has(id));
      if (!everyFileVerified) {
        if (this.failedIncoming.size === 0) this.setDirectState('failed', 'The transfer ended before every file was verified. Rejoin to retry it.', 'error');
        return;
      }
      const files = [...this.incoming.values()].map(({ manifest }) => ({ name: manifest.name, size: manifest.size, hash: manifest.hash }));
      const receipt: SavedReceipt = { id: crypto.randomUUID(), roomCode: this.roomCode, completedAt: new Date().toISOString(), direction: 'received', files };
      this.hooks.onReceipt(receipt);
      this.channel?.send(JSON.stringify({ type: 'receipt', receipt }));
    }
    if (message.type === 'receipt' && message.receipt) this.hooks.onReceipt({ ...message.receipt, direction: 'sent' });
  }
}

export async function buildManifest(files: File[]): Promise<FileManifest[]> {
  return Promise.all(files.map(async (file) => {
    const hash = await hashFile(file);
    // A hash identifies bytes, not a selected file. Two named copies with the
    // same bytes are two receipt rows, so their transfer/storage keys must be
    // distinct from the content hash.
    return { id: crypto.randomUUID(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, hash };
  }));
}
