# Friend File Drop repair handoff

## Status

Release blockers from verifier report `37080fd73138bcbac4d961b4772f86d30d8dce09` are repaired. The PWA is deployed at <https://friend-file-drop.sociobot.in> from `main`. The latest deployed app bundle matches the local production bundle byte for byte.

Artifact class remains `pwa-offline`. The frontend and offline shell remain static. Azure Static Web Apps now deploys the repository's narrow managed API for short-lived signaling and the optional relay.

## What changed

- Replaced manual SDP pairing notes with a six-word room flow. The sender shares only the displayed code; the receiver enters it to connect.
- Added a same-origin managed room API with durable managed blob state, 15-minute expiry, input validation, a 90-request-per-minute IP limit, and no-store responses.
- Added an explicit relay choice on both screens. Relay transfer starts only after both people opt in, accepts at most 25 MB per room, and clears file bytes when the receiver posts its receipt.
- Added IndexedDB checkpoints for direct-transfer chunks. Each stored chunk has its own SHA-256 digest; rejoining the same room resumes from the contiguous verified offset. Senders can reopen their previous room code.
- Expanded `.factory/claims.json` to 13 claims. Each visitor-facing privacy, storage, room, relay, resume, offline, account, price, and receipt promise now points to one tagged regression test.
- Added long-lived immutable caching for `/assets/*`. HTML and the service worker remain revalidated.
- Replaced the catch-all SPA fallback with explicit app-route rewrites. Unknown paths now return the designed `404.html` with HTTP 404.
- Added accessible tab arrow-key behavior, designed focus, form errors, 44 px mobile targets, and a full semantic static 404 page.
- Updated README, demo documentation, privacy/terms copy, copy audit, version, and service-worker cache version.

## Verification evidence — 2026-08-28

Clean local gate:

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

- API/config unit and integration tests: 5 passed.
- Local Playwright: 17 passed; 8 live-only tests skipped unless `LIVE_URL` is set.
- TypeScript/lint: passed.
- Production build: `dist/index.html` exists; JS 35.23 KB raw / 11.57 KB gzip; CSS 17.02 KB raw / 4.81 KB gzip; hero WebP 58 KB.
- Dependency audit: 0 vulnerabilities.
- Claims exercised: all 13 entries in `.factory/claims.json`, including dual-consent relay, verified resume offset, and local receipt storage.
- Browser coverage: desktop Chromium, 390 × 844 mobile, keyboard skip link, arrow-key tabs, 44 px targets, reduced motion, offline reload, and axe checks.

Live gate:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh https://friend-file-drop.sociobot.in /tmp/friend-file-drop-repair-final
```

- Live Playwright: 8 passed. This includes all routes, real HTTP 404, axe with 0 serious/critical findings, live offline reload, a real two-browser six-word direct transfer, and a real dual-opt-in relay transfer.
- URL verifier: 701 ms load; no console/page errors; title, `lang=en`, one h1, main, alt text, and button labels passed.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.3 s, TBT 20 ms, CLS 0.
- `/assets/index-CmkZGAgb.js`: `Cache-Control: public, max-age=31536000, immutable`.
- `/missing-page`: HTTP 404 with the styled notebook page.
- API invalid-room response: HTTP 400, JSON, `Cache-Control: no-store`.
- Local/live JS SHA-256: `58eff10b537bcc8b9b9c753052f741805ed3f77a5f2ad0a62209fc5dee0aa6cc` on both copies.
- Deployment: Azure Static Web Apps production deployment `bdc7ce90-8b57-46fc-bd57-b9e6918ebf84` succeeded; custom domain and TLS are ready.
- Evidence files: `/tmp/friend-file-drop-repair-final/verify.json`, desktop/mobile screenshots, and `/tmp/friend-file-drop-repair-final/lighthouse.json`.

## Operations and known limits

- Direct WebRTC is preferred. On restrictive networks, both people must read the disclosure and choose the relay.
- Relay rooms are deliberately temporary and limited to 25 MB total. This keeps the fallback useful for personal files while limiting abuse and temporary storage.
- A transfer needs another reachable browser and a network. The installed shell, demo, and saved receipts remain available offline.
- Keep the original file until both sides show a receipt. Local receipts are records, not file backups.
