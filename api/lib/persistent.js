'use strict';

const memory = require('./store');
const connection = process.env.AzureWebJobsStorage;
let roomContainer;
let fileContainer;

async function containers() {
  if (!connection || connection === 'UseDevelopmentStorage=true') return null;
  if (!roomContainer) {
    const { BlobServiceClient } = require('@azure/storage-blob');
    const service = BlobServiceClient.fromConnectionString(connection);
    roomContainer = service.getContainerClient('friend-file-drop-rooms');
    fileContainer = service.getContainerClient('friend-file-drop-relay');
    await Promise.all([roomContainer.createIfNotExists(), fileContainer.createIfNotExists()]);
  }
  return { roomContainer, fileContainer };
}

async function saveRoom(code, room) {
  const clients = await containers();
  if (!clients) return;
  const serializable = { ...room, files: undefined };
  const bytes = Buffer.from(JSON.stringify(serializable));
  await clients.roomContainer.getBlockBlobClient(`${code}.json`).upload(bytes, bytes.length, { blobHTTPHeaders: { blobContentType: 'application/json' } });
}

async function clearFiles(code, room) {
  const clients = await containers();
  if (!clients) { memory.finishRoom(room); return; }
  const ids = (room.manifest || []).map((item) => item.id);
  await Promise.all(ids.map((id) => clients.fileContainer.getBlockBlobClient(`${code}/${id}`).deleteIfExists()));
  room.bytes = 0;
}

async function getRoom(code, now = Date.now()) {
  const clients = await containers();
  if (!clients) return memory.getRoom(code, now);
  const blob = clients.roomContainer.getBlockBlobClient(`${code}.json`);
  try {
    const room = JSON.parse((await blob.downloadToBuffer()).toString('utf8'));
    if (room.expiresAt <= now) {
      await clearFiles(code, room);
      await blob.deleteIfExists();
      return null;
    }
    return room;
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw error;
  }
}

async function makeRoom(code, offer, now = Date.now()) {
  const clients = await containers();
  if (!clients) return memory.makeRoom(code, offer, now);
  const room = { offer, answer: null, relay: { sender: false, receiver: false }, manifest: null, receipt: null, bytes: 0, expiresAt: now + memory.TTL_MS };
  await saveRoom(code, room);
  return room;
}

async function appendFile(code, room, fileId, offset, chunk) {
  const clients = await containers();
  if (!clients) return memory.appendFile(room, fileId, offset, chunk);
  if (!room.relay.sender || !room.relay.receiver) throw new Error('Both people must choose the relay first.');
  const blob = clients.fileContainer.getBlockBlobClient(`${code}/${fileId}`);
  let existing = Buffer.alloc(0);
  try { existing = await blob.downloadToBuffer(); } catch (error) { if (error.statusCode !== 404) throw error; }
  if (offset !== existing.length) return existing.length;
  if (room.bytes + chunk.length > memory.MAX_TOTAL_BYTES) throw new Error('This relay accepts up to 25 MB per room.');
  const combined = Buffer.concat([existing, chunk]);
  await blob.upload(combined, combined.length, { overwrite: true, blobHTTPHeaders: { blobContentType: 'application/octet-stream' } });
  room.bytes += chunk.length;
  await saveRoom(code, room);
  return combined.length;
}

async function getFile(code, room, fileId) {
  const clients = await containers();
  if (!clients) return room.files.get(fileId) || null;
  try { return await clients.fileContainer.getBlockBlobClient(`${code}/${fileId}`).downloadToBuffer(); }
  catch (error) { if (error.statusCode === 404) return null; throw error; }
}

module.exports = { getRoom, makeRoom, saveRoom, appendFile, getFile, clearFiles };
