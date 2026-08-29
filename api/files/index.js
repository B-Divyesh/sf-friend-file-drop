'use strict';

const { ROOM_PATTERN, FILE_ID_PATTERN, clientIdentity } = require('../lib/store');
const persistent = require('../lib/persistent');

module.exports = async function files(context, req) {
  const code = String(context.bindingData.code || '').toLowerCase();
  const fileId = String(context.bindingData.fileId || '');
  const fail = (status, error, extra = {}) => ({ status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra }, body: { error } });
  const validRequest = ROOM_PATTERN.test(code) && FILE_ID_PATTERN.test(fileId);
  const identity = clientIdentity(req);
  const rateScope = validRequest ? `${identity}:room:${code}` : `${identity}:invalid-file`;
  try {
    if (await persistent.rateLimit(rateScope)) { context.res = fail(429, 'Too many relay requests. Wait one minute and try again.', { 'retry-after': '60' }); return; }
  } catch (error) { context.res = fail(error.statusCode || 503, error.message); return; }
  if (!validRequest) { context.res = fail(400, 'The room or file code is invalid.'); return; }
  try {
    const room = await persistent.getRoom(code);
    if (!room) { context.res = fail(404, 'That room expired or does not exist.'); return; }
    if (req.method === 'PUT') {
      const chunk = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody || '');
      const accepted = await persistent.appendFile(code, fileId, Number(req.query.offset || 0), chunk);
      if (accepted === null) { context.res = fail(404, 'That room expired or does not exist.'); return; }
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
