'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('./store');

test('rooms expire after fifteen minutes @claim:room-expiry', () => {
  store.rooms.clear();
  store.makeRoom('amber-apple-atlas-birch-blue-brisk', { type: 'offer' }, 1_000);
  assert.ok(store.getRoom('amber-apple-atlas-birch-blue-brisk', 1_000 + store.TTL_MS - 1));
  assert.equal(store.getRoom('amber-apple-atlas-birch-blue-brisk', 1_000 + store.TTL_MS), null);
});

test('relay requires two explicit consents and enforces its byte cap @claim:relay-cap', () => {
  store.rooms.clear();
  const room = store.makeRoom('cedar-chime-cobalt-comet-coral-daisy', {});
  assert.throws(() => store.appendFile(room, 'a', 0, Buffer.from('x')), /Both people/);
  room.relay.sender = true;
  room.relay.receiver = true;
  assert.equal(store.appendFile(room, 'a', 0, Buffer.from('hello')), 5);
  assert.equal(store.appendFile(room, 'a', 0, Buffer.from('duplicate')), 5);
  room.bytes = store.MAX_TOTAL_BYTES;
  assert.throws(() => store.appendFile(room, 'b', 0, Buffer.from('x')), /25 MB/);
});

test('request bursts are rate limited', () => {
  store.rates.clear();
  for (let index = 0; index < store.MAX_REQUESTS_PER_MINUTE; index += 1) assert.equal(store.rateLimit('test-ip', 2_000), false);
  assert.equal(store.rateLimit('test-ip', 2_000), true);
  assert.equal(store.rateLimit('test-ip', 62_000), false);
});
