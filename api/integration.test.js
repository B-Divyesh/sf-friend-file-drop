'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const roomsHandler = require('./rooms');
const filesHandler = require('./files');
const healthHandler = require('./health');
const store = require('./lib/store');

const code = 'field-finch-fog-globe-green-harbor';
const fileId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const call = async (handler, bindingData, req) => {
  const context = { bindingData };
  await handler(context, { headers: { 'x-forwarded-for': `integration-${Math.random()}` }, query: {}, ...req });
  return context.res;
};

test('room API signals, requires dual relay consent, relays, and clears bytes', async () => {
  store.rooms.clear();
  let response = await call(roomsHandler, { code }, { method: 'POST', body: { action: 'create', offer: { type: 'offer', sdp: 'local' } } });
  assert.equal(response.status, 200);
  response = await call(roomsHandler, { code }, { method: 'POST', body: { action: 'answer', answer: { type: 'answer', sdp: 'remote' } } });
  assert.equal(response.body.answer.sdp, 'remote');
  await call(roomsHandler, { code }, { method: 'POST', body: { action: 'relay-consent', role: 'sender' } });
  response = await call(filesHandler, { code, fileId }, { method: 'PUT', rawBody: Buffer.from('file') });
  assert.equal(response.status, 400);
  await call(roomsHandler, { code }, { method: 'POST', body: { action: 'relay-consent', role: 'receiver' } });
  await call(roomsHandler, { code }, { method: 'POST', body: { action: 'manifest', manifest: [{ id: fileId, name: 'file.txt', size: 4, type: 'text/plain', hash: fileId }] } });
  response = await call(filesHandler, { code, fileId }, { method: 'PUT', rawBody: Buffer.from('file') });
  assert.equal(response.body.accepted, 4);
  response = await call(filesHandler, { code, fileId }, { method: 'GET' });
  assert.equal(response.body.toString(), 'file');
  await call(roomsHandler, { code }, { method: 'POST', body: { action: 'receipt', receipt: { id: 'done', files: [] } } });
  assert.equal(store.rooms.get(code).files.size, 0);
});

test('room and relay endpoints rate limit a server-derived identity and always send Retry-After', async () => {
  store.rates.clear();
  store.rooms.clear();
  const socket = { remoteAddress: '203.0.113.7' };
  let response;
  for (let index = 0; index < store.MAX_REQUESTS_PER_MINUTE; index += 1) {
    response = await call(roomsHandler, { code }, { method: 'GET', headers: { 'x-forwarded-for': `spoofed-${index}` }, socket });
    assert.equal(response.status, 404);
  }
  response = await call(roomsHandler, { code }, { method: 'GET', headers: { 'x-forwarded-for': 'a-new-spoofed-value' }, socket });
  assert.equal(response.status, 429);
  assert.equal(response.headers['retry-after'], '60');

  store.rates.clear();
  for (let index = 0; index < store.MAX_REQUESTS_PER_MINUTE; index += 1) {
    response = await call(filesHandler, { code, fileId }, { method: 'GET', headers: { 'x-forwarded-for': `spoofed-${index}` }, socket });
    assert.equal(response.status, 404);
  }
  response = await call(filesHandler, { code, fileId }, { method: 'GET', headers: { 'x-forwarded-for': 'another-spoofed-value' }, socket });
  assert.equal(response.status, 429);
  assert.equal(response.headers['retry-after'], '60');
});

test('health endpoint identifies the deployed API build @claim:api-health', async () => {
  const context = {};
  await healthHandler(context);
  assert.equal(context.res.status, 200);
  assert.equal(context.res.headers['cache-control'], 'no-store');
  assert.equal(context.res.body.service, 'friend-file-drop-api');
  assert.match(context.res.body.version, /^1\.1\.1$/);
  assert.ok(Object.hasOwn(context.res.body, 'sourceRevision'));
  assert.ok(Object.hasOwn(context.res.body, 'deploymentId'));
});
