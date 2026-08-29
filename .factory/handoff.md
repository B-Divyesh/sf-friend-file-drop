# Friend File Drop repair 5 handoff

## Status

**PASS — committed, pushed, and deployed.**

This repair fixes the nondeterministic `@claim:opt-in-relay` browser test
reported for candidate `5a761321f56d8e69df6f2ea3f6b5a1f3c4c5a285`. The product
remains the same Vite TypeScript offline PWA with its Azure Static Web Apps
managed API.

## Repair

- Playwright is explicitly configured for two parallel workers. `PLAYWRIGHT_PORT`
  selects an isolated preview port when a caller needs to run another local
  check at the same time (default `4173`).
- The relay test now owns two fresh browser contexts, its own intercepted room
  API map, and a generated room code. It waits for the room offer, answer,
  consent POST responses, both stored consent choices, relay-ready state, and
  manifest before asserting the transfer outcome.
- The previous failure was a test orchestration race: it asserted a UI message
  immediately after an asynchronous click without proving the room service had
  received the first consent. The app is not serialized to hide this.
- New `@regression:parallel-relay-isolation` starts two wholly separate relay
  pairs concurrently and proves neither consent nor relayed bytes cross rooms.

## Verification before deployment

- Clean build command: `npm ci && npm run build` — passed; `dist/index.html`
  exists. Production bundle: JS **36.67 kB / 11.94 kB gzip**, CSS **17.17 kB /
  4.84 kB gzip**.
- `npm test` passed **three consecutive times** under the configured two-worker
  run: **10/10** Node API/config tests, **23/23** local Chromium tests, and
  **9** intentionally live-only checks skipped without `LIVE_URL`.
- Focused two-worker regression command passed: `npx playwright test
  tests/product.spec.ts --workers=2 --grep
  '@claim:opt-in-relay|@regression:parallel-relay-isolation' --reporter=line`.
  The same two tests also passed on the isolated `PLAYWRIGHT_PORT=4189` preview
  port, proving the configurable server isolation path.
- All **20/20** commands declared in `.factory/claims.json` passed individually,
  including the three API claims and every browser/demo/privacy/relay claim.
- `npm audit --omit=dev --audit-level=high` and the API equivalent both found
  zero vulnerabilities.
- Pre-deploy live validation passed: `LIVE_URL=https://friend-file-drop.sociobot.in
  npx playwright test tests/live.spec.ts --workers=1 --reporter=line` — **9/9**.
  This covers live accessibility, mobile/demo cleanup, keyboard paths covered
  locally, offline update/reload, privacy boundaries, corrupt direct retry,
  and durable dual-consent relay behavior.

## Deployment and post-deploy evidence

Repair commit `d03e067481268adcf94200f3725d22c4ba4a514e` is pushed to `main`.
The configured factory command deployed the static app successfully:

```sh
/opt/fleet/lib/deploy-static.sh friend-file-drop dist
```

Azure Static Web Apps deployment ID: `918c91aa-5288-43cd-b6d9-6e26a0f4d702`.
The managed API upload was correctly skipped because its content was unchanged.

- Post-deploy `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright
  test tests/live.spec.ts --workers=1 --reporter=line` passed **9/9**.
- `VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh
  https://friend-file-drop.sociobot.in /tmp/friend-file-drop-verify-repair-5`
  passed: HTTPS 200, title, `lang=en`, one h1, main landmark, zero missing
  image alts or unlabelled buttons, and zero console/page errors (582 ms).
- The deployed fingerprinted JS SHA-256 is
  `750cc3fbe60e7b58d1ef5cd3e94d3401d7a59126db5713f5c6a55352352ad025`,
  matching `dist/assets/index-CnVH3YIj.js`. The live health endpoint returns
  `friend-file-drop-api` version `1.1.1`.

## Known gaps

None known. The managed API source revision may remain unavailable from Azure,
but its public health, direct-transfer, and durable relay behavior are covered
by the live checks.
