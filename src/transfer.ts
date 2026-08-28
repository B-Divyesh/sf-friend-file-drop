import type { SavedReceipt } from './db';

export type FileManifest = { id: string; name: string; type: string; size: number; hash: string };
export type TransferHooks = {
  onState: (message: string, tone?: 'note' | 'error' | 'success') => void;
  onProgress: (fileId: string, received: number, total: number) => void;
  onManifest: (files: FileManifest[]) => void;
  onFile: (manifest: FileManifest, blob: Blob) => void;
  onReceipt: (receipt: SavedReceipt) => void;
};

const WORDS = ['amber', 'apple', 'atlas', 'birch', 'blue', 'brisk', 'cedar', 'chime', 'cobalt', 'comet', 'coral', 'daisy', 'delta', 'elm', 'fern', 'field', 'finch', 'fog', 'globe', 'green', 'harbor', 'honey', 'iris', 'juniper', 'kite', 'lake', 'lemon', 'maple', 'mint', 'moon', 'moss', 'north', 'oak', 'olive', 'orbit', 'paper', 'peach', 'pebble', 'pine', 'plum', 'quartz', 'reed', 'river', 'sage', 'shell', 'silver', 'sparrow', 'star', 'stone', 'sunny', 'teal', 'thistle', 'tulip', 'violet', 'warm', 'willow', 'wind', 'winter', 'wren', 'yellow', 'zinnia'];

export function makeRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((byte) => WORDS[byte % WORDS.length]).join('-');
}

export async function hashFile(file: Blob): Promise<string> {
  const bytes = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((part) => part.toString(16).padStart(2, '0')).join('');
}

function encode(value: unknown): string {
  const data = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  data.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function decode<T>(value: string): T {
  const binary = atob(value.trim());
  const data = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(data)) as T;
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
  private incoming = new Map<string, { manifest: FileManifest; chunks: ArrayBuffer[]; received: number }>();
  private currentFile = '';

  constructor(private roomCode: string, private hooks: TransferHooks) {
    this.peer.onconnectionstatechange = () => {
      const state = this.peer.connectionState;
      if (state === 'connected') this.hooks.onState('Devices connected. The direct path is ready.', 'success');
      if (state === 'failed') this.hooks.onState('The direct path failed. Make a new room and exchange fresh pairing notes.', 'error');
      if (state === 'disconnected') this.hooks.onState('Connection paused. Keep both pages open while the browsers reconnect.', 'note');
    };
    this.peer.ondatachannel = (event) => this.attachChannel(event.channel);
  }

  private attachChannel(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => this.hooks.onState('Devices connected. The direct path is ready.', 'success');
    channel.onerror = () => this.hooks.onState('The file path stopped. Keep both pages open and try a fresh room.', 'error');
    channel.onmessage = (event) => void this.receive(event.data);
  }

  async createOffer(): Promise<string> {
    this.attachChannel(this.peer.createDataChannel('files', { ordered: true }));
    await this.peer.setLocalDescription(await this.peer.createOffer());
    await waitForIce(this.peer);
    return encode({ kind: 'friend-file-drop-offer', roomCode: this.roomCode, description: this.peer.localDescription });
  }

  async acceptOffer(note: string): Promise<string> {
    const payload = decode<{ kind: string; roomCode: string; description: RTCSessionDescriptionInit }>(note);
    if (payload.kind !== 'friend-file-drop-offer') throw new Error('This is not a sender pairing note.');
    this.roomCode = payload.roomCode;
    await this.peer.setRemoteDescription(payload.description);
    await this.peer.setLocalDescription(await this.peer.createAnswer());
    await waitForIce(this.peer);
    return encode({ kind: 'friend-file-drop-answer', roomCode: this.roomCode, description: this.peer.localDescription });
  }

  async acceptAnswer(note: string): Promise<void> {
    const payload = decode<{ kind: string; roomCode: string; description: RTCSessionDescriptionInit }>(note);
    if (payload.kind !== 'friend-file-drop-answer') throw new Error('This is not a receiver pairing note.');
    if (payload.roomCode !== this.roomCode) throw new Error('This note belongs to a different six-word room.');
    await this.peer.setRemoteDescription(payload.description);
  }

  get isReady(): boolean {
    return this.channel?.readyState === 'open';
  }

  get code(): string {
    return this.roomCode;
  }

  async send(files: File[], manifests: FileManifest[]): Promise<void> {
    if (!this.channel || this.channel.readyState !== 'open') throw new Error('Connect the other device before sending files.');
    this.channel.send(JSON.stringify({ type: 'manifest', files: manifests }));
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const manifest = manifests[index];
      this.channel.send(JSON.stringify({ type: 'file-start', id: manifest.id }));
      let sent = 0;
      while (sent < file.size) {
        while (this.channel.bufferedAmount > 1024 * 1024) await new Promise((resolve) => setTimeout(resolve, 40));
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
      entry.chunks.push(data);
      entry.received += data.byteLength;
      this.hooks.onProgress(entry.manifest.id, entry.received, entry.manifest.size);
      return;
    }
    const message = JSON.parse(data) as { type: string; files?: FileManifest[]; id?: string };
    if (message.type === 'manifest' && message.files) {
      message.files.forEach((manifest) => this.incoming.set(manifest.id, { manifest, chunks: [], received: 0 }));
      this.hooks.onManifest(message.files);
    }
    if (message.type === 'file-start' && message.id) this.currentFile = message.id;
    if (message.type === 'file-end' && message.id) {
      const entry = this.incoming.get(message.id);
      if (!entry) return;
      const blob = new Blob(entry.chunks, { type: entry.manifest.type });
      const hash = await hashFile(blob);
      if (hash !== entry.manifest.hash) {
        this.hooks.onState(`${entry.manifest.name} did not match its hash. Ask the sender to try again.`, 'error');
        return;
      }
      this.hooks.onFile(entry.manifest, blob);
    }
    if (message.type === 'transfer-end') {
      const files = [...this.incoming.values()].map(({ manifest }) => ({ name: manifest.name, size: manifest.size, hash: manifest.hash }));
      const receipt: SavedReceipt = { id: crypto.randomUUID(), roomCode: this.roomCode, completedAt: new Date().toISOString(), direction: 'received', files };
      this.hooks.onReceipt(receipt);
      this.channel?.send(JSON.stringify({ type: 'receipt', receipt }));
    }
    if (message.type === 'receipt') {
      const receipt = (JSON.parse(data) as { receipt: SavedReceipt }).receipt;
      this.hooks.onReceipt({ ...receipt, direction: 'sent' });
    }
  }
}

export async function buildManifest(files: File[]): Promise<FileManifest[]> {
  return Promise.all(files.map(async (file) => ({ id: crypto.randomUUID(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, hash: await hashFile(file) })));
}
