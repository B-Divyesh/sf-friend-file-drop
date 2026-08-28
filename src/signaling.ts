import type { FileManifest } from './transfer';
import type { SavedReceipt } from './db';

export type RoomStatus = {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  relay: { sender: boolean; receiver: boolean; ready: boolean };
  manifest?: FileManifest[];
  receipt?: SavedReceipt;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || `The room service returned ${response.status}.`);
  return payload;
}

export class RoomService {
  constructor(readonly code: string) {}

  private get path(): string {
    return `/api/rooms/${encodeURIComponent(this.code)}`;
  }

  status(): Promise<RoomStatus> {
    return request<RoomStatus>(this.path, { cache: 'no-store' });
  }

  post(action: string, value: Record<string, unknown> = {}): Promise<RoomStatus> {
    return request<RoomStatus>(this.path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...value })
    });
  }

  async uploadFile(fileId: string, file: Blob, onProgress: (sent: number) => void): Promise<void> {
    const chunkSize = 256 * 1024;
    let offset = 0;
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const response = await fetch(`${this.path}/files/${encodeURIComponent(fileId)}?offset=${offset}`, {
        method: 'PUT', headers: { 'content-type': 'application/octet-stream' }, body: chunk
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({})) as { error?: string }).error || 'The relay upload stopped.');
      offset += chunk.size;
      onProgress(offset);
    }
    if (file.size === 0) {
      const response = await fetch(`${this.path}/files/${encodeURIComponent(fileId)}?offset=0`, { method: 'PUT', body: new Blob() });
      if (!response.ok) throw new Error('The relay could not prepare the empty file.');
    }
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.path}/files/${encodeURIComponent(fileId)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('The relayed file is not ready yet.');
    return response.blob();
  }
}
