'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const roomsHandler = require('./rooms');
const filesHandler = require('./files');
const healthHandler = require('./health');
const store = require('./lib/store');
const persistent = require('./lib/persistent');

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

test('an established room replaces only its direct offer when a peer rejoins @regression:room-reopen-generation', async () => {
  store.rooms.clear();
  let response = await call(roomsHandler, { code }, { method: 'POST', body: { action: 'create', offer: { type: 'offer', sdp: 'first-offer' } } });
  assert.equal(response.body.offerVersion, 1);
  await call(roomsHandler, { code }, { method: 'POST', body: { action: 'answer', offerVersion: 1, answer: { type: 'answer', sdp: 'first-answer' } } });
  response = await call(roomsHandler, { code }, { method: 'POST', body: { action: 'rejoin' } });
  assert.equal(response.body.rejoinVersion, 1);
  response = await call(roomsHandler, { code }, { method: 'POST', body: { action: 'reopen', offer: { type: 'offer', sdp: 'second-offer' } } });
  assert.equal(response.body.offerVersion, 2);
  assert.equal(response.body.answer, null);
  response = await call(roomsHandler, { code }, { method: 'POST', body: { action: 'answer', offerVersion: 1, answer: { type: 'answer', sdp: 'stale-answer' } } });
  assert.equal(response.status, 400);
  response = await call(roomsHandler, { code }, { method: 'POST', body: { action: 'answer', offerVersion: 2, answer: { type: 'answer', sdp: 'second-answer' } } });
  assert.equal(response.status, 200);
  assert.equal(response.body.answer.sdp, 'second-answer');
});

test('concurrent relay-consent updates retain both choices @regression:durable-room-consent', async () => {
  store.rooms.clear();
  await call(roomsHandler, { code }, { method: 'POST', body: { action: 'create', offer: { type: 'offer', sdp: 'local' } } });
  const [sender, receiver] = await Promise.all([
    call(roomsHandler, { code }, { method: 'POST', body: { action: 'relay-consent', role: 'sender' } }),
    call(roomsHandler, { code }, { method: 'POST', body: { action: 'relay-consent', role: 'receiver' } })
  ]);
  assert.equal(sender.status, 200);
  assert.equal(receiver.status, 200);
  const final = await call(roomsHandler, { code }, { method: 'GET' });
  assert.equal(final.status, 200);
  assert.deepEqual(final.body.relay, { sender: true, receiver: true, ready: true });
});

test('configured production refuses per-instance memory rooms @regression:durable-room-required', async () => {
  const previous = process.env.FRIEND_FILE_DROP_REQUIRE_DURABLE_STORAGE;
  delete process.env.FRIEND_FILE_DROP_STORAGE;
  delete process.env.AzureWebJobsStorage;
  process.env.FRIEND_FILE_DROP_REQUIRE_DURABLE_STORAGE = 'true';
  try {
    await assert.rejects(() => persistent.getRoom(code), { statusCode: 503, message: /Durable room storage is unavailable/ });
  } finally {
    if (previous === undefined) delete process.env.FRIEND_FILE_DROP_REQUIRE_DURABLE_STORAGE;
    else process.env.FRIEND_FILE_DROP_REQUIRE_DURABLE_STORAGE = previous;
  }
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

test('one room cannot exhaust another room\'s relay budget @regression:relay-room-rate-isolation', async () => {
  store.rates.clear();
  store.rooms.clear();
  const socket = { remoteAddress: '203.0.113.8' };
  const otherCode = 'iris-juniper-kite-lake-lemon-maple';
  for (let index = 0; index <= store.MAX_REQUESTS_PER_MINUTE; index += 1) {
    const response = await call(roomsHandler, { code }, { method: 'GET', socket });
    assert.equal(response.status, index === store.MAX_REQUESTS_PER_MINUTE ? 429 : 404);
  }
  const independent = await call(roomsHandler, { code: otherCode }, { method: 'GET', socket });
  assert.equal(independent.status, 404);
});

test('health endpoint identifies the exact deployed API build @claim:api-health', async () => {
  const previous = {
    source: process.env.FRIEND_FILE_DROP_SOURCE_REVISION,
    github: process.env.GITHUB_SHA,
    build: process.env.BUILD_SOURCEVERSION,
    deployment: process.env.WEBSITE_DEPLOYMENT_ID,
    instance: process.env.WEBSITE_INSTANCE_ID
  };
  const sourceRevision = '0123456789abcdef0123456789abcdef01234567';
  try {
    process.env.FRIEND_FILE_DROP_SOURCE_REVISION = sourceRevision;
    process.env.GITHUB_SHA = 'ffffffffffffffffffffffffffffffffffffffff';
    process.env.BUILD_SOURCEVERSION = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    process.env.WEBSITE_DEPLOYMENT_ID = 'deployment-under-test';
    delete process.env.WEBSITE_INSTANCE_ID;
    const context = {};
    await healthHandler(context);
    assert.equal(context.res.status, 200);
    assert.equal(context.res.headers['cache-control'], 'no-store');
    assert.equal(context.res.body.service, 'friend-file-drop-api');
    assert.match(context.res.body.version, /^1\.1\.4$/);
    assert.equal(context.res.body.sourceRevision, sourceRevision);
    assert.equal(context.res.body.deploymentId, 'deployment-under-test');
    assert.equal(context.res.body.status, 'ready');
  } finally {
    for (const [key, value] of Object.entries({
      FRIEND_FILE_DROP_SOURCE_REVISION: previous.source,
      GITHUB_SHA: previous.github,
      BUILD_SOURCEVERSION: previous.build,
      WEBSITE_DEPLOYMENT_ID: previous.deployment,
      WEBSITE_INSTANCE_ID: previous.instance
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('health endpoint refuses to report ready without complete build identity @regression:health-build-identity', async () => {
  const keys = ['FRIEND_FILE_DROP_SOURCE_REVISION', 'GITHUB_SHA', 'BUILD_SOURCEVERSION', 'WEBSITE_DEPLOYMENT_ID', 'WEBSITE_INSTANCE_ID'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    keys.forEach((key) => delete process.env[key]);
    const context = {};
    await healthHandler(context);
    assert.equal(context.res.status, 503);
    assert.equal(context.res.headers['cache-control'], 'no-store');
    assert.equal(context.res.body.sourceRevision, null);
    assert.equal(context.res.body.deploymentId, null);
    assert.equal(context.res.body.status, 'build-identity-missing');
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
