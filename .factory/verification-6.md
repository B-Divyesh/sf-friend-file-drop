# Independent verification 6 — FAIL

**Candidate:** `082609b67112d64611f2146672222671ec35ec86` (`main`)  
**Live URL:** <https://friend-file-drop.sociobot.in>  
**Verified:** 2026-08-29 from a clean checkout. Product code was not modified.

## Verdict

**FAIL — do not release.** The product, all 20 declared claims, three ordinary
local test runs, the production build, and an independently driven real relay
transfer mostly work. However, the checked-in deployed relay regression fails
nondeterministically on the live product. A real UI state race makes the
sender's successful relay choice disappear behind a late direct-connection
message while the sender is waiting for the receiver. This is a core fallback
flow, and the fresh live test failure is release-blocking.

## Release blocker

### High — relay choice feedback is overwritten by a late direct-path update

Command:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in \
  npx playwright test tests/live.spec.ts --workers=1 --reporter=line
```

Fresh result: **exit 1; 8 passed, 1 failed**. The failing assertion is
`tests/live.spec.ts:104` in `@regression:live-durable-relay`: after the sender
chooses **Use the private relay**, “Waiting for the other person” is absent.
The sender instead shows “Receiver joined. Opening the direct path…”.

This was not a one-off service outage:

- The same focused live test passed once and failed on the next run. The loop
  stopped on the failure.
- The failure trace records the sender's `relay-consent` POST returning 200.
  Its body shows `relay: { sender: true, receiver: false, ready: false }`.
- The screenshot and accessibility snapshot at timeout show the stale direct
  state, not the required pending-relay state.
- Source inspection explains the race. `DirectTransfer.enableRelay()` sets the
  pending-relay message, but an already-running `waitForAnswer()` later writes
  “Receiver joined. Opening the direct path…” without checking `relayRole`.
  Other connection callbacks already have that guard.

An independently instrumented attempt happened to avoid the timing window and
completed the dual-consent relay transfer. It also transferred a zero-byte
file, produced matching sender/receiver receipts, and logged no console errors.
That proves the managed API and relay data path are operational; it does not
remove the visible state race or make the checked-in live gate deterministic.

Required repair: make relay/direct status a single guarded state machine (at
minimum, prevent `waitForAnswer()` from writing direct-path status after relay
selection), preserve pending-relay feedback until both consents arrive, and
repeat both the full live suite and focused live regression several times.

## Required claims

`.factory/claims.json` exists with 20 entries. Before any install, I invoked
every listed command exactly; the three dependency-free Node commands passed,
while 17 browser commands stopped at `tsc: not found`, as expected in the
pristine clone. After the documented clean setup (`npm ci`), I reran every
listed command exactly. Final authoritative result: **20/20 passed**.

Each declared tag appears exactly once in the test sources:

- `demo-receipt`, `no-account`, `free-use`, `demo-isolation`
- `offline-reload`, `six-word-room`, `room-expiry`, `direct-transfer`
- `resumable-transfer`, `local-receipts`, `opt-in-relay`, `relay-cap`
- `privacy-boundaries`, `individual-file-receipts`, `own-files-untouched`
- `receipt-export`, `receipt-import`, `demo-no-real-files`
- `room-code-storage`, `api-health`

The failed deployed test is a `@regression` check, not one of the 20 declared
claim commands. The claim gate itself is green; the product still fails the
separate live quality gate described above.

## First-read and demo gate

**PASS.** A fresh 1440×900 browser profile showed, on the first screen:

- What: “Send files straight to someone you trust” under
  “Browser-to-browser file transfer”.
- For whom: “For friends on different devices who need the files and proof
  that they arrived.”
- First click: one visible **Try it with sample data** action, with “The demo
  opens a ready transfer” directly below it.

The one-click action opens `/demo`. The persistent banner says “Demo — sample
data, nothing is saved” and provides **Reset demo** and **Start for real**.
Keyboard-only activation completed all three sample files and displayed three
verified receipt rows.

## Clean install, tests, and build

- `npm ci`: passed; Playwright is pinned to `1.58.2`; root and API production
  dependency installs reported zero vulnerabilities.
- All 20 exact claim commands after install: passed.
- `npm test`: passed **three consecutive times** under the ordinary two-worker
  configuration. Each run had 10/10 Node tests and 23/23 local Chromium tests;
  9 live-only tests were intentionally skipped without `LIVE_URL`.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run build`: passed and produced `dist/index.html`.
- `npm audit --omit=dev --audit-level=high` and the API equivalent: zero
  vulnerabilities.

## End-to-end and boundary evidence

- Bundled demo: three files finish with matching hashes and a downloadable
  receipt.
- Real direct path: the deployed test joins two fresh browser contexts with a
  six-word code, rejects corrupt bytes without a receipt, then succeeds after
  retry.
- Real relay: an independent two-context flow required both choices, accepted
  a zero-byte boundary file, and gave both sides the same receipt. The separate
  checked-in live regression remains flaky for the state-race reason above.
- Resume: a verified 32 KB IndexedDB checkpoint resumes a 70 KB transfer.
- Duplicate bytes under different names remain two verified receipt rows.
- Invalid input: `only-two` is rejected with `aria-invalid="true"` and “Enter
  all six words, separated by hyphens.” The same receiver then recovered by
  entering a valid room code.
- Relay boundaries: exact 25 MB cap passes; the next byte is rejected. Rooms
  exist at 14:59.999 and expire at 15:00.
- Concurrent storage checks pass: simultaneous sender/receiver consents retain
  both values, parallel relay rooms do not cross state or bytes, and configured
  production refuses per-instance memory fallback.

## Privacy, headers, and API limits

- A fresh keyboard-driven landing → demo → receipt flow made only same-origin
  requests, no API request, and no third-party request. Demo completion used
  only `sessionStorage["demo:completed"]`.
- Direct `/demo` claim coverage confirms it neither creates nor reads the real
  IndexedDB namespace. **Start for real** and **Reset demo** clear demo state.
- No analytics, advertising, CDN font/script, contact field, Azure OpenAI
  endpoint, or external runtime request was observed.
- The browser's document response includes HSTS, `nosniff`,
  `Referrer-Policy: no-referrer`, restrictive Permissions-Policy, and a
  self-only CSP with `frame-ancestors 'none'`.
- HTML and `sw.js` are `no-cache`; fingerprinted JS/CSS are
  `public, max-age=31536000, immutable`; API health is `no-store`.
- Fresh live rate-limit probe: requests 1–90 from one client returned 404 for a
  missing valid room; request **91** returned **429** with `Retry-After: 60`.
  Observed allowance: **90 requests per minute**. Unit coverage applies the
  same limiter to both room and relay-file endpoints.

## Accessibility, mobile, PWA, and performance

- Axe on live `/`, `/demo`, `/privacy`, `/terms`, and the real 404 found zero
  serious or critical violations before the relay test failed.
- The supplied URL verifier passed: HTTPS 200, `lang=en`, title, one `h1`, one
  `main`, complete image alt text, labelled buttons, and no home-page
  console/page errors; measured load was 789 ms.
- A fresh 390×844 run had no horizontal overflow, retained the first action,
  showed 44 px targets in the local gate, and reflowed at 200% text size.
- Keyboard order exposes the skip link first. The skip link and sample action
  both had a visible 3 px coral focus outline. Arrow-key tabs work.
- Under reduced motion, receipt animation/transition duration was `0.00001s`.
- The manifest has standalone display, themed splash colors, 192/512 and
  maskable icons, and a versioned start URL.
- Live offline reload after service-worker control passed. A separate local
  update simulation served a changed worker, observed the in-app “A new page
  version is ready. Reload” toast, activated it, and reloaded `/demo` offline.
- Idle Lighthouse mobile: performance **99**, accessibility **100**, best
  practices **100**, SEO **100**; FCP **1.0 s**, LCP **1.3 s**, TBT **130 ms**,
  CLS **0**, speed index **1.0 s**. An earlier run under simultaneous test load
  crashed its tab and was discarded rather than treated as a valid sample.
- Production payload: JS 36.67 kB / **11.94 kB gzip**, CSS 17.17 kB /
  **4.84 kB gzip**, no downloaded font, hero image 59.20 kB.

## Deployment identity

The live static application is byte-identical to this candidate's production
build:

- JS SHA-256: `750cc3fbe60e7b58d1ef5cd3e94d3401d7a59126db5713f5c6a55352352ad025`
- CSS SHA-256: `9924f417121402788516f815afe780a33ecfa7991471180b2bf296a375001ecf`
- Service-worker SHA-256:
  `822ea0680d0c7ba83bb57de7aecec9fa4c99da98a6ce6f1930d11372265f17ac`

`GET /api/health` returned `friend-file-drop-api`, version `1.1.1`, deployment
ID `2e38d8bb-57e2-4590-9332-2f3b60f9dd95`, and `sourceRevision: null`. The
managed API therefore does not expose a source SHA; its health, limits,
durability, direct signaling, and relay behavior were checked instead.

## Other findings

- **Low — backend identity is incomplete.** `sourceRevision: null` prevents an
  exact source-SHA comparison for the managed API. Static identity is exact,
  and the candidate did not change API source relative to the deployed runtime
  repair, but future deployments should populate this field.
- The expected 404 navigation produces Chromium's normal “Failed to load
  resource: 404” console entry for the document itself. No application script
  or page exception occurred on any route.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in \
  npx playwright test tests/live.spec.ts --workers=1 --reporter=line
LIVE_URL=https://friend-file-drop.sociobot.in \
  npx playwright test tests/live.spec.ts --workers=1 --reporter=line \
  --grep '@regression:live-durable-relay'
```
