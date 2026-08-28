'use strict';

const TTL_MS = 15 * 60 * 1000;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024;
const MAX_REQUESTS_PER_MINUTE = 90;
const ROOM_PATTERN = /^[a-z]+(?:-[a-z]+){5}$/;
const rooms = new Map();
const rates = new Map();

function cleanup(now = Date.now()) {
  for (const [code, room] of rooms) if (room.expiresAt <= now) rooms.delete(code);
  for (const [ip, rate] of rates) if (rate.since + 60_000 <= now) rates.delete(ip);
}

function rateLimit(ip, now = Date.now()) {
  cleanup(now);
  const current = rates.get(ip);
  if (!current || current.since + 60_000 <= now) {
    rates.set(ip, { since: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_MINUTE;
}

function makeRoom(code, offer, now = Date.now()) {
  if (!ROOM_PATTERN.test(code)) throw new Error('Use a valid six-word room code.');
  const room = { offer, answer: null, relay: { sender: false, receiver: false }, manifest: null, files: new Map(), receipt: null, bytes: 0, expiresAt: now + TTL_MS };
  rooms.set(code, room);
  return room;
}

function getRoom(code, now = Date.now()) {
  cleanup(now);
  const room = rooms.get(code);
  if (!room) return null;
  return room;
}

function publicRoom(room) {
  return {
    offer: room.offer,
    answer: room.answer,
    relay: { ...room.relay, ready: room.relay.sender && room.relay.receiver },
    manifest: room.manifest,
    receipt: room.receipt
  };
}

function appendFile(room, fileId, offset, chunk) {
  if (!room.relay.sender || !room.relay.receiver) throw new Error('Both people must choose the relay first.');
  const existing = room.files.get(fileId) || Buffer.alloc(0);
  if (offset !== existing.length) return existing.length;
  if (room.bytes + chunk.length > MAX_TOTAL_BYTES) throw new Error('This relay accepts up to 25 MB per room.');
  room.files.set(fileId, Buffer.concat([existing, chunk]));
  room.bytes += chunk.length;
  return existing.length + chunk.length;
}

function finishRoom(room) {
  room.files.clear();
  room.bytes = 0;
  room.offer = null;
  room.answer = null;
}

module.exports = { TTL_MS, MAX_TOTAL_BYTES, MAX_REQUESTS_PER_MINUTE, ROOM_PATTERN, rooms, rates, cleanup, rateLimit, makeRoom, getRoom, publicRoom, appendFile, finishRoom };
