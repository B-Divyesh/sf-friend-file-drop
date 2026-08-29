# Friend File Drop repair 4 handoff

## Status

**PASS — repaired, pushed, and deployed.**

This repair addresses every finding in verifier report commit
`7d925dc84438086b13b9581f2bef3ed1fffbb1ac` for candidate
`e49606f060f044ebc30288a3174e81660b2c105f`. The implementation commit is
`4bc2215` and is live at <https://friend-file-drop.sociobot.in>. The artifact
remains a Vite TypeScript offline PWA with the existing Azure Static Web Apps
managed API.

## Repaired findings

1. **Receipts now require verified bytes.** The direct receiver tracks verified
   and failed file IDs. A `transfer-end` message produces and returns a receipt
   only when every current manifest ID has passed SHA-256 verification. A hash
   mismatch clears its partial bytes, marks its row **Failed**, preserves the
   specific retry message, and leaves both browsers without a receipt. A new
   manifest resets the attempt, so a later clean retry can finish normally.
2. **Leaving the demo discards demo state.** **Start for real** now removes all
   `demo:` session-storage keys before routing home. Returning to Demo starts
   with **Send sample files** and no previous receipt. **Reset demo** uses the
   same cleanup helper.
3. **Exact permanent regressions.** The local direct-transfer claim injects
   same-length corrupt bytes after manifest hashing, asserts a failed row, no
   download, no receipt UI, and zero receipt records in both browsers, then
   restores the payload and proves both receipt records appear after retry.
   Local and deployed tests also cover leave-and-return demo cleanup. The live
   suite repeats the corrupt-byte case through the deployed WebRTC/API path.

## Verification evidence

- `npm ci`: passed from the lockfiles for root and `api/`; both installs
  reported zero vulnerabilities.
- `npm test`: passed with **10/10** Node API/config tests and **22/22** local
  Chromium tests; the 9 explicitly live-only tests skipped without `LIVE_URL`.
- Every one of the **20** commands in `.factory/claims.json` was run exactly and
  passed. The `@claim:direct-transfer` command includes the corruption and
  successful-retry regression.
- `npm run lint` and the TypeScript check passed. `npm run build` produced
  `dist/index.html`.
- `npm audit --omit=dev --audit-level=high` and the matching `api` audit both
  found zero vulnerabilities.
- Production output: JS **36.67 kB / 11.94 kB gzip**, CSS **17.17 kB / 4.84 kB
  gzip**, hero WebP **59.20 kB**. This is under the PWA budgets. Package/consumer
  testing does not apply because this artifact is a deployed PWA, not a
  published library.
- Local Playwright covered desktop Chromium, 390 × 844 mobile, 200% text
  reflow, 44 px touch targets, keyboard skip navigation, arrow-key tabs,
  visible file-input focus, reduced motion, privacy request/storage boundaries,
  and axe checks on all app routes. Axe reported zero serious/critical issues.
- `verify-url.sh` passed live in **575 ms**: correct title and `lang=en`, one
  h1, a main landmark, no missing image alts, no unlabelled buttons, and no
  console errors.
- Live Playwright: **9/9 passed**. It covers five routes plus axe, same-origin
  demo isolation and exit cleanup, service-worker `update()` with an activated
  worker, offline `/demo` reload, corrupt direct transfer followed by a clean
  retry, and the real dual-consent durable relay.
- Mobile Lighthouse: Performance **96**, Accessibility **100**, Best Practices
  **100**, SEO **100**; FCP **1.0 s**, LCP **1.3 s**, TBT **230 ms**, CLS **0**.
  Report: `/tmp/friend-file-drop-lighthouse-repair-4.json`.
- Live response policy: HTML and `sw.js` return `Cache-Control: no-cache`; the
  fingerprinted JS returns `public, max-age=31536000, immutable`; API health
  returns `no-store`. HSTS, no-referrer, nosniff, Permissions-Policy, and the
  self-only CSP with `frame-ancestors 'none'` are present.
- Live identity: deployed HTML, JS, CSS, and service worker are byte-identical
  to `dist/`. JS SHA-256 is
  `750cc3fbe60e7b58d1ef5cd3e94d3401d7a59126db5713f5c6a55352352ad025`.
  `GET /api/health` reports `friend-file-drop-api` version `1.1.1` and platform
  deployment ID `2e38d8bb-57e2-4590-9332-2f3b60f9dd95`.

## Deployment

The factory static deployment command deployed `dist/` and the existing `api/`
configuration to `sf-friend-file-drop` in Azure Static Web Apps. Deployment ID:
`184d42e3-8a9d-45ed-8ce9-72ce0f350a7e`. The managed API was byte-identical and
was not re-uploaded. The existing durable-storage settings were preserved.

## Run and verify

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
npm audit --prefix api --omit=dev --audit-level=high
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh https://friend-file-drop.sociobot.in /tmp/friend-file-drop-verify-repair-4
```

## Known gaps

Azure still reports `sourceRevision: null` for the unchanged managed Functions
build. Static artifact identity is exact, and all relevant live API behavior is
exercised through the direct and relay browser tests. No release blockers remain.
