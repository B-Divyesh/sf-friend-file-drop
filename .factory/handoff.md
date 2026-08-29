# Friend File Drop repair 10 handoff

## Outcome: PASS

Repair implementation: `9204ce62f01a2e1930c1fc4b1736ce4567eff35f`

Live URL: <https://friend-file-drop.sociobot.in>

Verified: 2026-08-29 UTC

The verification-8 relay blocker is repaired and deployed. The production two-browser suite now completes the opt-in relay transfer on the real receiver. The managed API reports the deployed source revision instead of the stale `d690bb0…` revision.

## Reproduction before repair

No source files were changed before reproduction.

- `GET /api/health` returned version `1.1.2` and source revision `d690bb0ecc2973fbd5b4ef2e9a214e20e558f962`, confirming the split deployment.
- The unchanged real two-browser relay test was repeated six times against production. Four completed, then two timed out in the relay flow. The failures were retained by Playwright under `test-results/`; one sender never observed relay readiness and one stalled while saving consent. This reproduced the production timeout and showed that it was load/rate-window dependent.
- The API charged every room-status poll from both browsers and every unrelated transfer to one IP-wide 90-request bucket. A temporary 429 rejected the detached receiver polling promise permanently, leaving the sender or receiver waiting indefinitely.

## Repairs

- Valid room and relay requests now use a server-derived identity plus room code for their request budget. Creating rooms and malformed requests retain separate server-derived abuse limits. One room can no longer consume another room's relay allowance.
- Relay readiness, manifest, and receipt polling now honor `Retry-After` and retry temporary 429/503 responses. A receiver-side background failure is caught and announced instead of becoming an unhandled rejection.
- The receiver now reports a useful expiry error if no relay transfer arrives.
- Relay chunks increased from 256 KiB to 512 KiB, keeping a full 25 MB transfer below the room's 90-request allowance.
- Version advanced to `1.1.3`; the PWA cache and installed start URL versions advanced so existing installations fetch the repair.
- The managed API build setting was updated during deployment, and both `dist/` and `api/` were deployed together.

## Exact regression coverage

- `api/integration.test.js`: `@regression:relay-room-rate-isolation` exhausts one room's 90-request allowance and proves a second room from the same connection remains available.
- `tests/product.spec.ts`: `@regression:relay-post-upload-timeout` withholds the manifest until relay bytes exist, returns a 429 on the receiver's next status poll, then proves the real browser logic retries and both sides reach **Transfer finished**.
- `tests/live.spec.ts`: `@regression:live-durable-relay` remains the production two-browser acceptance test.

## Local verification

- `npm ci`: passed for the root and managed API; both audits reported 0 vulnerabilities.
- `npm audit --omit=dev --audit-level=high`: passed with 0 vulnerabilities.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm test`: passed — 12 Node/API/config tests and 29 local Chromium tests; 9 live-only tests skipped without `LIVE_URL`.
- All 21 exact commands in `.factory/claims.json`: passed independently.
- The new post-upload timeout regression repeated five times with two workers: 5/5 passed.
- `npm run build`: produced `dist/` with JS 38.69 kB / 12.48 kB gzip and CSS 17.31 kB / 4.87 kB gzip.
- Library/package consumer testing: not applicable to this static PWA.

The browser suite covers direct and relay transfers, receipt persistence/import/export, demo isolation, offline reload, desktop navigation, 390 px mobile layout, 200% text, keyboard tabs, focus visibility, reduced motion, and axe serious/critical checks.

## Live verification

- `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list`: **9/9 passed**. The real relay receiver and sender both reached **Transfer finished**.
- The real relay acceptance test repeated six times with two workers after deployment: **6/6 passed**. Before the repair, the same run produced two timeouts.
- `/api/health` after the implementation deployment returned version `1.1.3`, source revision `9204ce62f01a2e1930c1fc4b1736ce4567eff35f`, and deployment ID `ba9f6f73-97c7-4b2a-84b0-dc9bc0055dea`.
- `/opt/fleet/lib/verify-url.sh`: passed; load 579 ms, no console/page errors, `lang=en`, one `<h1>`, one `<main>`, and no missing alt text or button labels.
- Live 390 × 844 check: `scrollWidth` 390, one `<h1>`, one `<main>`, skip link focused by Tab, 3 px coral focus outline, reduced-motion durations `0.00001s`, no console errors, and no cross-origin requests.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.3 s, TBT 0 ms, CLS 0.
- Response policy: `/`, `/demo`, `/privacy`, and `/terms` return 200; unknown paths return 404; hashed assets are immutable for one year; `sw.js` is `no-cache`; API health is `no-store`; CSP, `nosniff`, no-referrer, and Permissions Policy headers are present.
- Offline/update: the live suite activated the new service worker and reloaded the demo offline successfully.

## Deploy and verify

```sh
npm ci
npm run lint
npm test
npm run build
/opt/fleet/lib/deploy-static.sh friend-file-drop dist
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list
curl -fsS https://friend-file-drop.sociobot.in/api/health
```

Before deployment, set the Static Web App `BUILD_SOURCEVERSION` setting to the exact commit being deployed. This keeps `/api/health` tied to the release revision.

## Known gaps

No release-blocking gaps remain. Relay availability still depends on the managed Azure service and its configured durable blob storage; failures are surfaced to the user and do not silently fall back to per-instance memory in production.
