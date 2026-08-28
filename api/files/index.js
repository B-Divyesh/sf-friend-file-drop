'use strict';

const { ROOM_PATTERN, rateLimit } = require('../lib/store');
const persistent = require('../lib/persistent');

module.exports = async function files(context, req) {
  const code = String(context.bindingData.code || '').toLowerCase();
  const fileId = String(context.bindingData.fileId || '');
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-client-ip'] || 'unknown').split(',')[0].trim();
  const fail = (status, error) => ({ status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: { error } });
  if (rateLimit(ip)) { context.res = fail(429, 'Too many relay requests. Wait one minute and try again.'); return; }
  if (!ROOM_PATTERN.test(code) || !/^[a-f0-9]{64}$/.test(fileId)) { context.res = fail(400, 'The room or file code is invalid.'); return; }
  const room = await persistent.getRoom(code);
  if (!room) { context.res = fail(404, 'That room expired or does not exist.'); return; }
  try {
    if (req.method === 'PUT') {
      const chunk = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody || '');
      const accepted = await persistent.appendFile(code, room, fileId, Number(req.query.offset || 0), chunk);
      context.res = { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: { accepted } };
      return;
    }
    const file = await persistent.getFile(code, room, fileId);
    const expected = room.manifest && room.manifest.find((item) => item.id === fileId);
    if (!file || !expected || file.length !== expected.size) { context.res = fail(404, 'That file is not complete yet.'); return; }
    context.res = { status: 200, isRaw: true, headers: { 'content-type': expected.type || 'application/octet-stream', 'content-length': String(file.length), 'cache-control': 'no-store' }, body: file };
  } catch (error) {
    context.res = fail(400, error.message || 'The relay request was rejected.');
  }
};
