import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyLiveIdentity } from '../scripts/verify-live-identity.mjs';

const candidate = 'bf1ef63eff848252719268eeb16fc31bbc98f52f';
const staleRevision = 'dec081988bd5618f24e555fe9174aa63c8e59fce';

const healthResponse = (sourceRevision = candidate, overrides = {}) => new Response(JSON.stringify({
  service: 'friend-file-drop-api',
  version: '1.1.4',
  sourceRevision,
  deploymentId: 'deployment-under-test',
  status: 'ready',
  ...overrides
}), {
  status: 200,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});

test('deployment identity gate rejects the verifier-observed stale managed API revision @regression:deploy-exact-source-revision', async () => {
  await assert.rejects(
    verifyLiveIdentity('https://friend-file-drop.sociobot.in', candidate, async () => healthResponse(staleRevision)),
    new RegExp(`sourceRevision ${staleRevision} does not match candidate ${candidate}`)
  );
});

test('deployment identity gate accepts only a healthy API for the same full candidate SHA', async () => {
  const body = await verifyLiveIdentity(
    'https://friend-file-drop.sociobot.in',
    candidate,
    async () => healthResponse()
  );
  assert.equal(body.sourceRevision, candidate);

  await assert.rejects(
    verifyLiveIdentity('https://friend-file-drop.sociobot.in', candidate.slice(0, 7), async () => healthResponse()),
    /must be a full lowercase commit SHA/
  );
  await assert.rejects(
    verifyLiveIdentity('https://friend-file-drop.sociobot.in', candidate, async () => healthResponse(candidate, { deploymentId: '' })),
    /did not report a deploymentId/
  );
});
