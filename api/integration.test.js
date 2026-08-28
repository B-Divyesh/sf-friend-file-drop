'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const roomsHandler = require('./rooms');
const filesHandler = require('./files');
const store = require('./lib/store');

const code = 'field-finch-fog-globe-green-harbor';
const fileId = 'a'.repeat(64);
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
