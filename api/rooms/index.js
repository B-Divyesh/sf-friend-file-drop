'use strict';

const { ROOM_PATTERN, clientIdentity, publicRoom } = require('../lib/store');
const persistent = require('../lib/persistent');

function json(status, body, extra = {}) {
  return { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra }, body };
}

module.exports = async function rooms(context, req) {
  const code = String(context.bindingData.code || '').toLowerCase();
  const validCode = ROOM_PATTERN.test(code);
  const identity = clientIdentity(req);
  const rateScope = validCode
    ? (req.method === 'POST' && req.body?.action === 'create' ? `${identity}:create` : `${identity}:room:${code}`)
    : `${identity}:invalid-room`;
  try {
    if (await persistent.rateLimit(rateScope)) { context.res = json(429, { error: 'Too many room requests. Wait one minute and try again.' }, { 'retry-after': '60' }); return; }
  } catch (error) { context.res = json(error.statusCode || 503, { error: error.message }); return; }
  if (!validCode) { context.res = json(400, { error: 'Use a valid six-word room code.' }); return; }
  if (req.method === 'GET') try {
    const room = await persistent.getRoom(code);
    context.res = room ? json(200, publicRoom(room)) : json(404, { error: 'That room expired or does not exist.' });
    return;
  } catch (error) { context.res = json(error.statusCode || 503, { error: error.message }); return; }
  const body = req.body || {};
  try {
    let room;
    if (body.action === 'create') room = await persistent.makeRoom(code, body.offer);
    else room = await persistent.updateRoom(code, async (current, clients) => {
      if (body.action === 'answer') {
        const offerVersion = Number(body.offerVersion || current.offerVersion || 1);
        if (offerVersion !== (current.offerVersion || 1)) throw new Error('That direct connection was replaced. Join the room again.');
        current.answer = body.answer;
        current.answerVersion = offerVersion;
      } else if (body.action === 'rejoin') {
        // A receiver has lost an established connection. The sender's status
        // watcher will publish a new offer, then this receiver accepts it.
        current.rejoinVersion = (current.rejoinVersion || 0) + 1;
      } else if (body.action === 'reopen') {
        current.offer = body.offer;
        current.answer = null;
        current.offerVersion = (current.offerVersion || 1) + 1;
        current.answerVersion = 0;
      } else if (body.action === 'relay-consent' && ['sender', 'receiver'].includes(body.role)) current.relay[body.role] = true;
      else if (body.action === 'manifest') {
        if (!current.relay.sender || !current.relay.receiver) throw new Error('Both people must choose the relay first.');
        if (!Array.isArray(body.manifest) || body.manifest.length > 20) throw new Error('The manifest must contain 1 to 20 files.');
        current.manifest = body.manifest;
      } else if (body.action === 'receipt') {
        current.receipt = body.receipt;
        if (clients) {
          const ids = (current.manifest || []).map((item) => item.id);
          await Promise.all(ids.map((id) => clients.fileContainer.getBlockBlobClient(`${code}/${id}`).deleteIfExists()));
        } else current.files.clear();
        current.bytes = 0;
        current.offer = null;
        current.answer = null;
      } else throw new Error('Unknown room action.');
    });
    if (!room) throw new Error('That room expired or does not exist.');
    context.res = json(200, publicRoom(room));
  } catch (error) {
    context.res = json(error.statusCode || 400, { error: error.message || 'The room request was rejected.' });
  }
};
