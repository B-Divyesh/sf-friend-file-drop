# Friend File Drop repair handoff

## Status

**PASS — deployed repair for verifier report `b5ee745e3b76766016989b32003f2a2eae65a313`.**

The repaired source is commit `a6332ad` and is deployed to
<https://friend-file-drop.sociobot.in>. It preserves the Vite TypeScript PWA,
Azure Static Web Apps managed API, browser-direct WebRTC path, demo sandbox,
and all behavior that had passed verification.

## Repaired release blockers

1. **Durable relay rooms.** The managed API now uses the explicitly configured
   Blob storage connection (`FRIEND_FILE_DROP_STORAGE`) in production and
   refuses to create an unsafe per-instance-memory room when durable storage is
   unavailable. Room creation uses create-only semantics; answer, consent,
   manifest, receipt, and relay-byte updates acquire a Blob lease. This makes
   concurrent function instances serialize their writes instead of replacing
   one person's relay consent with a stale room copy.
2. **Exact regression coverage.** `api/integration.test.js` concurrently posts
   sender and receiver relay consent and asserts the persisted room is ready.
   It also asserts configured production fails closed without durable storage.
   The deployed test is named
   `@regression:live-durable-relay` and performs the real two-browser fallback
   against Azure storage; it passed after deploy.
3. **404 build identity.** `public/404.html` now identifies itself as `v1.1.1`,
   consistent with the app and API.

## Verification evidence

- Clean install: `npm ci` passed; root and API production audits reported zero
  vulnerabilities.
- Local suite: `npm test` passed with **10** Node/API/config tests and **22**
  local Chromium tests (the 8 explicitly live-only checks skipped without
  `LIVE_URL`). `npm run lint` and `npm run build` passed; `dist/index.html` is
  present. Production assets are 35.83 kB JS (11.73 kB gzip) and 17.17 kB CSS
  (4.84 kB gzip).
- Claims: every command listed in `.factory/claims.json` was run from this
  clean install and passed. This includes all 20 documented claims, with the
  browser claims run through their declared `npm test -- --grep @claim:…`
  commands.
- Durable-storage integration: a temporary, cleaned-up Azure Blob room was
  created and updated by concurrent sender/receiver consent operations; it
  retained `{ sender: true, receiver: true }`.
- Live browser: `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright
  test tests/live.spec.ts` passed **8/8**. This covers desktop routes and axe,
  offline reload, direct transfer, and the actual relay fallback. Local
  product tests cover 390 px, 200% text reflow, keyboard skip/tabs/file focus,
  touch target size, reduced motion, demo isolation, and receipt flows.
- Accessibility/privacy: Playwright AxeBuilder found zero serious/critical
  violations on `/`, `/demo`, `/privacy`, `/terms`, and `/missing-page`;
  `VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh
  https://friend-file-drop.sociobot.in /tmp/friend-file-drop-verify-repair`
  passed with no console errors. Request-capture claims remain same-origin
  only and demo remains API/file-input free.
- PWA and response policy: deployed `/demo` reloaded offline after service
  worker control. A fingerprinted JS asset returned
  `Cache-Control: public, max-age=31536000, immutable`; `GET /api/health`
  returned `Cache-Control: no-store`, service `friend-file-drop-api`, version
  `1.1.1`, and deployment ID `2e38d8bb-57e2-4590-9332-2f3b60f9dd95`.
  The styled unknown route returns real HTTP 404 and the updated footer.
- Lighthouse, live mobile run: **100** Performance, **100** Accessibility,
  **100** Best Practices, **100** SEO; FCP 0.9 s, LCP 1.3 s, TBT 10 ms, CLS 0.
  Report: `/tmp/friend-file-drop-lighthouse-repair.json`.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
npm audit --prefix api --omit=dev --audit-level=high
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
```

Deploy `dist/` and `api/` through the existing `sf-friend-file-drop` Azure
Static Web App configuration. Production needs the managed, secret app setting
`FRIEND_FILE_DROP_STORAGE` and `FRIEND_FILE_DROP_REQUIRE_DURABLE_STORAGE=true`;
the repair set both without committing any secret.

## Known gaps

None. `sourceRevision` is null because the managed Functions environment does
not supply a source revision variable; the public health response includes the
API version and platform deployment ID for live identity checks.
