import { clearPartialChunks, getPartialChunks, savePartialChunk, type SavedReceipt } from './db';
import { RoomService } from './signaling';

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
  private peer = new RTCPeerConnection({ iceServers: [] });
  private channel?: RTCDataChannel;
  private room: RoomService;
  private incoming = new Map<string, { manifest: FileManifest; chunks: ArrayBuffer[]; received: number }>();
  private verifiedIncoming = new Set<string>();
  private failedIncoming = new Set<string>();
  private currentFile = '';
  private receiveQueue = Promise.resolve();
  private resumeWaiters = new Map<string, (offset: number) => void>();
  private relayReady = false;
  private relayRole?: 'sender' | 'receiver';

  constructor(private roomCode: string, private hooks: TransferHooks) {
    this.room = new RoomService(roomCode);
    this.peer.onconnectionstatechange = () => {
      const state = this.peer.connectionState;
      // Once either person has chosen the relay, its explicit-consent status is
      // the useful state. A late WebRTC event must not hide it.
      if (this.relayRole) return;
      if (state === 'connected') this.hooks.onState('Devices connected. The direct path is ready.', 'success');
      if (state === 'failed') this.hooks.onState('The direct path failed. Choose the private relay below on both devices.', 'error');
      if (state === 'disconnected') this.hooks.onState('Connection paused. Rejoin this room to resume saved chunks.', 'note');
    };
    this.peer.ondatachannel = (event) => this.attachChannel(event.channel);
  }

  private attachChannel(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => {
      if (!this.relayRole) this.hooks.onState('Devices connected. The direct path is ready.', 'success');
    };
    channel.onerror = () => {
      if (!this.relayRole) this.hooks.onState('The direct path stopped. Rejoin to resume, or choose the relay.', 'error');
    };
    channel.onmessage = (event) => {
      this.receiveQueue = this.receiveQueue.then(() => this.receive(event.data)).catch(() => {
        this.hooks.onState('A received chunk could not be saved. Rejoin the room to resume.', 'error');
      });
    };
  }

  async createRoom(): Promise<void> {
    this.attachChannel(this.peer.createDataChannel('files', { ordered: true }));
    await this.peer.setLocalDescription(await this.peer.createOffer());
    await waitForIce(this.peer);
    await this.room.post('create', { offer: this.peer.localDescription });
    this.hooks.onState('Room ready. Share only the six words with the receiver.');
    void this.waitForAnswer();
  }

  private async waitForAnswer(): Promise<void> {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const status = await this.room.status().catch(() => undefined);
      if (status?.answer && !this.peer.remoteDescription) {
        await this.peer.setRemoteDescription(status.answer);
        this.hooks.onState('Receiver joined. Opening the direct path…');
        return;
      }
      await delay(1000);
    }
  }

  async joinRoom(): Promise<void> {
    const status = await this.room.status();
    if (!status.offer) throw new Error('That room is not ready. Check the six words and try again.');
    await this.peer.setRemoteDescription(status.offer);
    await this.peer.setLocalDescription(await this.peer.createAnswer());
    await waitForIce(this.peer);
    await this.room.post('answer', { answer: this.peer.localDescription });
    this.hooks.onState('Room joined. Opening the direct path…');
  }

  async enableRelay(role: 'sender' | 'receiver'): Promise<void> {
    this.relayRole = role;
    await this.room.post('relay-consent', { role });
    this.hooks.onState('Relay chosen. Waiting for the other person to choose it too.');
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const status = await this.room.status();
      if (status.relay.ready) {
        this.relayReady = true;
        this.hooks.onState('Relay ready. It will hold this transfer for up to 15 minutes.', 'success');
        if (role === 'receiver') void this.receiveRelay();
        return;
      }
      await delay(1000);
    }
    throw new Error('The other person did not choose the relay.');
  }

  private async receiveRelay(): Promise<void> {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      const status = await this.room.status();
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
      return;
    }
  }

  get isReady(): boolean {
    return this.channel?.readyState === 'open' || this.relayReady;
  }

  get code(): string {
    return this.roomCode;
  }

  async send(files: File[], manifests: FileManifest[]): Promise<void> {
    if (this.relayReady && this.relayRole === 'sender') {
      await this.room.post('manifest', { manifest: manifests });
      for (let index = 0; index < files.length; index += 1) {
        await this.room.uploadFile(manifests[index].id, files[index], (sent) => this.hooks.onProgress(manifests[index].id, sent, manifests[index].size));
      }
      this.hooks.onState('Files uploaded. Waiting for the receiver to verify them.');
      for (let attempt = 0; attempt < 180; attempt += 1) {
        const status = await this.room.status();
        if (status.receipt) {
          this.hooks.onReceipt({ ...status.receipt, direction: 'sent' });
          this.hooks.onState('The receiver verified every file.', 'success');
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
        this.hooks.onState(`${entry.manifest.name} did not match its hash. Rejoin to retry it.`, 'error');
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
        if (this.failedIncoming.size === 0) this.hooks.onState('The transfer ended before every file was verified. Rejoin to retry it.', 'error');
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
