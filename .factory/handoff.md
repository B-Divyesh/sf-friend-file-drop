# Friend File Drop repair handoff

## Status

**PASS — repair deployed to production.**

The release repair is commit `cd041999f64c420ebc57bf7a0c091e2877aa09fb` (`v1.1.1`), pushed to `main` and deployed to <https://friend-file-drop.sociobot.in> on 2026-08-28. It repairs every release blocker in the independent report for candidate `a15ae576aeed01392f18ab8799b49fc2b808a0df` while preserving the Vite TypeScript PWA and Azure Static Web Apps deployment class.

## Repaired findings

1. Relay consent is now the authoritative visible state once either person selects it. Late WebRTC connection events cannot overwrite “Waiting for the other person,” making the `opt-in-relay` claim deterministic.
2. Every selected file receives a UUID transfer ID separate from its SHA-256 content hash. Two different names with identical bytes now receive two verified rows and two receipt entries in direct and relay paths.
3. API limiting ignores caller-controlled `X-Forwarded-For`. It derives an identity from trusted Azure client-IP metadata or the server connection, and uses a leased Azure Blob counter for atomic cross-instance buckets. Both 429 paths send `Retry-After: 60`.
4. The visible file drop sheet has a 3 px coral `:focus-within` ring when the hidden native file input receives keyboard focus.
5. Added claim registrations and observable tests for individual-file receipts, source-file preservation, receipt export/import, demo API/file isolation, local room-code retention/removal, and API health identity.
6. The 390 px header wraps its navigation at 200% text size; the 450 px overflow regression is covered.
7. `GET /api/health` returns `service`, `version`, `sourceRevision`, and `deploymentId` with `Cache-Control: no-store`. Production returned `friend-file-drop-api`, version `1.1.1`, and deployment ID `b13b9658-fc0a-4959-a834-dedd0464faae`.
8. The privacy page and README disclose the one retained local-storage item (`friend-file-drop:last-room`) and the transfer sheet provides **Clear saved room code**.

## Verification evidence

- Clean install: `npm ci` passed; root and API dependency audits reported zero vulnerabilities.
- Full local suite: `npm test` passed (8 Node/API/config tests; 22 local Playwright tests; 8 live-only tests correctly skipped without `LIVE_URL`).
- Type/lint: `npm run lint` passed. Production build: `npm run build` passed and produced `dist/index.html`.
- Production bundle: 35.83 KB JavaScript / 11.73 KB gzip; 17.17 KB CSS / 4.84 KB gzip; both are within budget.
- Claims: all 20 final commands declared in [`.factory/claims.json`](claims.json) passed from the clean install. The original flaky `npm test -- --grep @claim:opt-in-relay` passed, as did the new duplicate-content, import/export, demo-isolation, room-code, and health claims.
- Desktop, 390 px mobile, keyboard file chooser, arrow-key tabs, 44 px controls, reduced motion, and 200% text reflow are covered by Playwright. The exact 200% regression test asserts `scrollWidth === clientWidth === 390`.
- Accessibility: local and live Playwright axe checks found zero serious/critical violations on `/`, `/demo`, `/privacy`, `/terms`, and the 404 page. `/opt/fleet/lib/verify-url.sh` passed live: title, `lang=en`, one h1, main, alt text, labels, and no console errors (561 ms load).
- Privacy: demo tests assert no `/api` request, no file input, only `demo:` session storage, no production IndexedDB, and no third-party request. Privacy resource checks remain same-origin only.
- PWA: the deployed demo offline reload passed in the live suite; service-worker update behavior remains covered by the existing app test.
- Response policy: a deployed fingerprinted JS asset returned `Cache-Control: public, max-age=31536000, immutable`; `/api/health` returned `no-store`.
- Live deployment: `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts` passed **8/8** (five route/axe checks, offline reload, direct transfer, relay transfer). A fresh ordinary room-request burst reached a live 429 at request 67 because the shared current-minute bucket already included verification traffic; the relay-files 429 also returned `Retry-After: 60`.
- Lighthouse (production mobile): Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP **1.4 s**, CLS **0**. Report: `/tmp/friend-file-drop-lighthouse-repair.json`.

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
```

Deploy `dist/` and `api/` to the existing `sf-friend-file-drop` Azure Static Web App with Node 20 Functions. The successful repair deployment used the Static Web Apps CLI with `--app-location dist --api-location api --api-language node --api-version 20 --env production` and the managed deployment token.

## Known gaps

None. Azure does not supply a source revision environment variable to this deployment, so `sourceRevision` is `null`; the health response instead exposes the deployed API version and platform deployment ID, which identify this running build externally.
