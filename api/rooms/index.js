'use strict';

const { ROOM_PATTERN, rateLimit, publicRoom } = require('../lib/store');
const persistent = require('../lib/persistent');

function json(status, body, extra = {}) {
  return { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra }, body };
}

module.exports = async function rooms(context, req) {
  const code = String(context.bindingData.code || '').toLowerCase();
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-client-ip'] || 'unknown').split(',')[0].trim();
  if (rateLimit(ip)) { context.res = json(429, { error: 'Too many room requests. Wait one minute and try again.' }, { 'retry-after': '60' }); return; }
  if (!ROOM_PATTERN.test(code)) { context.res = json(400, { error: 'Use a valid six-word room code.' }); return; }
  if (req.method === 'GET') {
    const room = await persistent.getRoom(code);
    context.res = room ? json(200, publicRoom(room)) : json(404, { error: 'That room expired or does not exist.' });
    return;
  }
  const body = req.body || {};
  try {
    let room = await persistent.getRoom(code);
    if (body.action === 'create') room = await persistent.makeRoom(code, body.offer);
    else if (!room) throw new Error('That room expired or does not exist.');
    else if (body.action === 'answer') room.answer = body.answer;
    else if (body.action === 'relay-consent' && ['sender', 'receiver'].includes(body.role)) room.relay[body.role] = true;
    else if (body.action === 'manifest') {
      if (!room.relay.sender || !room.relay.receiver) throw new Error('Both people must choose the relay first.');
      if (!Array.isArray(body.manifest) || body.manifest.length > 20) throw new Error('The manifest must contain 1 to 20 files.');
      room.manifest = body.manifest;
    } else if (body.action === 'receipt') {
      room.receipt = body.receipt;
      await persistent.clearFiles(code, room);
      room.offer = null;
      room.answer = null;
    } else if (body.action !== 'create') throw new Error('Unknown room action.');
    await persistent.saveRoom(code, room);
    context.res = json(200, publicRoom(room));
  } catch (error) {
    context.res = json(400, { error: error.message || 'The room request was rejected.' });
  }
};
