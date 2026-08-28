'use strict';

const crypto = require('node:crypto');
const memory = require('./store');

let roomContainer;
let fileContainer;
let rateContainer;
let configuredConnection;

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function storageUnavailable(cause) {
  const error = new Error('Durable room storage is unavailable. Please try again in a minute.');
  error.statusCode = 503;
  error.cause = cause;
  return error;
}

function mustUseDurableStorage() {
  return process.env.FRIEND_FILE_DROP_REQUIRE_DURABLE_STORAGE === 'true';
}

async function containers() {
  // The managed Static Web App receives this explicit setting at deploy time.
  // AzureWebJobsStorage remains useful for conventional Functions hosting.
  const connection = process.env.FRIEND_FILE_DROP_STORAGE || process.env.AzureWebJobsStorage;
  if (!connection || connection === 'UseDevelopmentStorage=true') {
    if (mustUseDurableStorage()) throw storageUnavailable();
    return null;
  }
  if (!roomContainer || configuredConnection !== connection) {
    try {
      const { BlobServiceClient } = require('@azure/storage-blob');
      const service = BlobServiceClient.fromConnectionString(connection);
      roomContainer = service.getContainerClient('friend-file-drop-rooms');
      fileContainer = service.getContainerClient('friend-file-drop-relay');
      rateContainer = service.getContainerClient('friend-file-drop-rate-limits');
      configuredConnection = connection;
      await Promise.all([roomContainer.createIfNotExists(), fileContainer.createIfNotExists(), rateContainer.createIfNotExists()]);
    } catch (error) {
      roomContainer = undefined;
      fileContainer = undefined;
      rateContainer = undefined;
      configuredConnection = undefined;
      throw storageUnavailable(error);
    }
  }
  return { roomContainer, fileContainer, rateContainer };
}

async function rateLimit(identity, now = Date.now()) {
  const clients = await containers();
  if (!clients) return memory.rateLimit(identity, now);

  // One leased blob per server-derived identity makes increments atomic across
  // function instances. Do not silently fail open if storage is unavailable.
  const key = crypto.createHash('sha256').update(identity).digest('hex');
  const blob = clients.rateContainer.getBlockBlobClient(key);
  try {
    const initial = Buffer.from(JSON.stringify({ since: now, count: 1 }));
    await blob.upload(initial, initial.length, { conditions: { ifNoneMatch: '*' }, blobHTTPHeaders: { blobContentType: 'application/json' } });
    return false;
  } catch (error) {
    if (![409, 412].includes(error.statusCode)) throw storageUnavailable(error);
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const lease = blob.getBlobLeaseClient();
    try {
      await lease.acquireLease(15);
    } catch (error) {
      if (![409, 412].includes(error.statusCode)) throw storageUnavailable(error);
      await pause(30);
      continue;
    }
    try {
      let current = { since: now, count: 0 };
      try { current = JSON.parse((await blob.downloadToBuffer()).toString('utf8')); } catch { /* a racing cleanup starts a fresh window */ }
      if (current.since + 60_000 <= now) current = { since: now, count: 0 };
      current.count += 1;
      const data = Buffer.from(JSON.stringify(current));
      await blob.upload(data, data.length, { conditions: { leaseId: lease.leaseId }, blobHTTPHeaders: { blobContentType: 'application/json' } });
      return current.count > memory.MAX_REQUESTS_PER_MINUTE;
    } catch (error) {
      throw storageUnavailable(error);
    } finally {
      await lease.releaseLease().catch(() => undefined);
    }
  }
  throw storageUnavailable();
}

function newRoom(offer, now) {
  return { offer, answer: null, relay: { sender: false, receiver: false }, manifest: null, receipt: null, bytes: 0, expiresAt: now + memory.TTL_MS };
}

async function makeRoom(code, offer, now = Date.now()) {
  const clients = await containers();
  if (!clients) return memory.makeRoom(code, offer, now);
  const room = newRoom(offer, now);
  const bytes = Buffer.from(JSON.stringify(room));
  try {
    await clients.roomContainer.getBlockBlobClient(`${code}.json`).upload(bytes, bytes.length, {
      conditions: { ifNoneMatch: '*' }, blobHTTPHeaders: { blobContentType: 'application/json' }
    });
    return room;
  } catch (error) {
    if ([409, 412].includes(error.statusCode)) throw new Error('That room code is already in use. Make a new room.');
    throw storageUnavailable(error);
  }
}

async function removeFiles(clients, code, room) {
  const ids = (room.manifest || []).map((item) => item.id);
  await Promise.all(ids.map((id) => clients.fileContainer.getBlockBlobClient(`${code}/${id}`).deleteIfExists()));
}

async function readRoom(blob) {
  try {
    return JSON.parse((await blob.downloadToBuffer()).toString('utf8'));
  } catch (error) {
    if (error.statusCode === 404) return null;
    throw storageUnavailable(error);
  }
}

async function withRoomLock(code, mutate, now = Date.now()) {
  const clients = await containers();
  if (!clients) {
    const room = memory.getRoom(code, now);
    if (!room) return null;
    await mutate(room, null);
    return room;
  }
  const blob = clients.roomContainer.getBlockBlobClient(`${code}.json`);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const lease = blob.getBlobLeaseClient();
    try {
      await lease.acquireLease(15);
    } catch (error) {
      if (error.statusCode === 404) return null;
      if (![409, 412].includes(error.statusCode)) throw storageUnavailable(error);
      await pause(30);
      continue;
    }
    try {
      const room = await readRoom(blob);
      if (!room) return null;
      if (room.expiresAt <= now) {
        await removeFiles(clients, code, room);
        await blob.delete({ conditions: { leaseId: lease.leaseId } });
        return null;
      }
      await mutate(room, clients);
      const bytes = Buffer.from(JSON.stringify(room));
      await blob.upload(bytes, bytes.length, { conditions: { leaseId: lease.leaseId }, blobHTTPHeaders: { blobContentType: 'application/json' } });
      return room;
    } catch (error) {
      if (error.statusCode === 404) return null;
      if (error.statusCode === 412 || error.statusCode === 409) {
        await pause(30);
        continue;
      }
      // Validation errors come from the caller's mutation and should retain
      // their useful 400-level message. Storage failures fail closed as 503.
      if (!error.statusCode) throw error;
      throw error.statusCode === 503 ? error : storageUnavailable(error);
    } finally {
      await lease.releaseLease().catch(() => undefined);
    }
  }
  throw storageUnavailable();
}

async function getRoom(code, now = Date.now()) {
  const clients = await containers();
  if (!clients) return memory.getRoom(code, now);
  const blob = clients.roomContainer.getBlockBlobClient(`${code}.json`);
  const room = await readRoom(blob);
  if (!room || room.expiresAt > now) return room;
  // Expiry removal is lock-protected so a concurrent read never deletes a
  // newly written room.
  return withRoomLock(code, () => undefined, now);
}

async function updateRoom(code, mutate, now = Date.now()) {
  return withRoomLock(code, mutate, now);
}

async function appendFile(code, fileId, offset, chunk) {
  return withRoomLock(code, async (room, clients) => {
    if (!room.relay.sender || !room.relay.receiver) throw new Error('Both people must choose the relay first.');
    if (!clients) { room.accepted = memory.appendFile(room, fileId, offset, chunk); return; }
    const blob = clients.fileContainer.getBlockBlobClient(`${code}/${fileId}`);
    let existing = Buffer.alloc(0);
    try { existing = await blob.downloadToBuffer(); } catch (error) { if (error.statusCode !== 404) throw storageUnavailable(error); }
    if (offset !== existing.length) { room.accepted = existing.length; return; }
    if (room.bytes + chunk.length > memory.MAX_TOTAL_BYTES) throw new Error('This relay accepts up to 25 MB per room.');
    const combined = Buffer.concat([existing, chunk]);
    await blob.upload(combined, combined.length, { overwrite: true, blobHTTPHeaders: { blobContentType: 'application/octet-stream' } });
    room.bytes += chunk.length;
    room.accepted = combined.length;
  }).then((room) => room === null ? null : room.accepted || 0);
}

async function getFile(code, room, fileId) {
  const clients = await containers();
  if (!clients) return room.files.get(fileId) || null;
  try { return await clients.fileContainer.getBlockBlobClient(`${code}/${fileId}`).downloadToBuffer(); }
  catch (error) { if (error.statusCode === 404) return null; throw storageUnavailable(error); }
}

module.exports = { getRoom, makeRoom, updateRoom, appendFile, getFile, rateLimit, storageUnavailable };
