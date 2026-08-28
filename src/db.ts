export type SavedReceipt = {
  id: string;
  roomCode: string;
  completedAt: string;
  direction: 'sent' | 'received';
  files: Array<{ name: string; size: number; hash: string }>;
};

const DB_NAME = 'friend-file-drop';
const STORE = 'receipts';
const PARTIALS = 'partial-chunks';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
      if (!request.result.objectStoreNames.contains(PARTIALS)) request.result.createObjectStore(PARTIALS, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

type PartialChunk = { key: string; roomCode: string; fileId: string; offset: number; data: ArrayBuffer };

export async function getPartialChunks(roomCode: string, fileId: string): Promise<ArrayBuffer[]> {
  const db = await openDb();
  const records = await new Promise<PartialChunk[]>((resolve, reject) => {
    const request = db.transaction(PARTIALS).objectStore(PARTIALS).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records
    .filter((record) => record.roomCode === roomCode && record.fileId === fileId)
    .sort((a, b) => a.offset - b.offset)
    .map((record) => record.data);
}

export async function savePartialChunk(roomCode: string, fileId: string, offset: number, data: ArrayBuffer): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(PARTIALS, 'readwrite');
    transaction.objectStore(PARTIALS).put({ key: `${roomCode}:${fileId}:${offset}`, roomCode, fileId, offset, data });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function clearPartialChunks(roomCode: string, fileId: string): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction(PARTIALS, 'readwrite');
  const store = transaction.objectStore(PARTIALS);
  const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  keys.filter((key) => String(key).startsWith(`${roomCode}:${fileId}:`)).forEach((key) => store.delete(key));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function saveReceipt(receipt: SavedReceipt, demo = false): Promise<void> {
  if (demo) {
    sessionStorage.setItem(`demo:receipt:${receipt.id}`, JSON.stringify(receipt));
    return;
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(receipt);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function getReceipts(): Promise<SavedReceipt[]> {
  const db = await openDb();
  const records = await new Promise<SavedReceipt[]>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
