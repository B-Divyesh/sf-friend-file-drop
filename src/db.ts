export type SavedReceipt = {
  id: string;
  roomCode: string;
  completedAt: string;
  direction: 'sent' | 'received';
  files: Array<{ name: string; size: number; hash: string }>;
};

const DB_NAME = 'friend-file-drop';
const STORE = 'receipts';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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
