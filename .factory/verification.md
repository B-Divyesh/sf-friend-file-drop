# Independent verification — FAIL

**Candidate:** `ac70e079e4b5bd73a9583e58ac3de1bd7360a625` (`main`)

**Live URL:** <https://friend-file-drop.sociobot.in>

**Verified:** 2026-08-28 from a clean checkout after `npm ci`. This report is independent of the builder handoff. Product source was not changed.

## Verdict

**FAIL.** The deployed artifact is healthy and matches this commit, and all shipped automated tests pass. It nevertheless does not meet the researched smallest-useful-product contract or the mandatory claims and PWA caching requirements. The release blockers below must be resolved before acceptance.

## First-read result

On a cold live load, the first screen says: “Send files straight to someone you trust,” identifies “friends on different devices,” and makes **Try it with sample data** the first action. That link opens `/demo` in one click. The page therefore passes the plain-words / one-click-demo first-read gate.

## Release blockers

### High — the actual transfer does not provide the required six-word-room handoff, resumable same-LAN fallback, or direct-failure relay path

The brief’s smallest useful product requires a browser WebRTC room with a **six-word code**, a resumable same-LAN fallback, and a completion receipt. The implementation generates a six-word string, but it does not use it to join a room: the two people must manually exchange two long SDP pairing notes through another conversation. `src/transfer.ts` configures `RTCPeerConnection({ iceServers: [] })`; there is no signaling service, STUN/TURN path, opt-in relay, or relay metadata disclosure. Transfer chunks and partial state live only in memory, so a reload/closed tab cannot resume. The existing handoff explicitly confirms this limitation.

This is not the low-friction six-word mixed-device handoff specified by the brief, and it omits the required resumable fallback. A repair needs a short-lived, rate-limited room/signaling service keyed by the six-word code; durable verified chunk state (for example OPFS) for resume; and, if direct connection fails, an explicit opt-in relay with its metadata disclosure and tests.

### High — claim coverage is incomplete despite `claims.json` being present

All six listed claim tests pass, but the page and README make material visitor-facing claims that have no corresponding entry and observable demo-sandbox test in `.factory/claims.json`. The claims contract says this fails review until the copy is removed or a test is added. Examples include:

- “It does not store files in a cloud drive,” “It does not inspect files or contacts,” and “It does not use a relay in this version.”
- “The site sends no file contents, contacts, analytics, or receipt data to us,” “Finished receipts are stored in this browser using IndexedDB,” and “Demo receipts use a separate session-only key.”
- “The app loads no third-party runtime scripts, fonts, or analytics,” “Files travel only through the paired WebRTC connection,” and “Receipts stay in local IndexedDB.”

The existing `no-third-party` test only observes the local **demo** flow; it is not a complete test of these product and privacy claims. Add one claim/test per promise (or remove the promise), with the required observable network/storage assertions from a fresh demo context.

### High — live hashed assets are not immutably cached

The live JavaScript and CSS exactly match the candidate build, but both return `Cache-Control: public, must-revalidate, max-age=30` rather than a long-lived immutable policy. Evidence: `GET /assets/index-BdRPWZ51.js` and `GET /assets/index-SKDJwxXG.css` on 2026-08-28. This violates the PWA performance requirement for hashed static assets and creates needless revalidation. Configure the deployment/static hosting policy for fingerprinted `/assets/*` files as long-lived immutable cache entries.

### Medium — unknown live URLs return HTTP 200, not a real 404 response

`GET /missing-page` returns status 200 and the SPA renders a styled “This notebook page is missing” screen. The screen itself is usable, but the required real 404 route/status is absent because navigation fallback serves `index.html` for unknown paths. Configure the host/fallback so unknown routes preserve a 404 status while serving the designed 404 experience.

## Evidence that passed

### Required claims, run first from the demo entry point

Each command was run after `npm ci`; all passed in Chromium.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-receipt` | `npm test -- --grep @claim:demo-receipt` | PASS — three verified files and receipt |
| `no-account` | `npm test -- --grep @claim:no-account` | PASS |
| `free-use` | `npm test -- --grep @claim:free-use` | PASS |
| `no-third-party` | `npm test -- --grep @claim:no-third-party` | PASS — demo requests stayed same-origin |
| `offline-reload` | `npm test -- --grep @claim:offline-reload` | PASS — `/demo` reloaded offline after SW control |
| `direct-transfer` | `npm test -- --grep @claim:direct-transfer` | PASS — two-browser direct transfer and receipt |

`npm test` then passed all 12 tests (claims, accessibility, 404 UI, and mobile). `npm run build` performed TypeScript checking and produced `dist/`. No separate lint script exists. `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.

### Independent functional and boundary checks on the live deployment

- `/demo` showed the persistent “Demo — sample data, nothing is saved” banner, ran the three-file sample, produced a downloadable receipt, and used only `sessionStorage` key `demo:completed`; no IndexedDB database was created in that fresh demo context.
- A real live two-browser WebRTC test transferred a zero-byte text file and a 1.25 MB text file. The receiver got two downloadable files and a two-file receipt; the sender retained one saved receipt after reload.
- Empty/malformed receiver pairing input displayed “Unexpected end of JSON input Ask for a fresh note.” A subsequent valid pairing and transfer completed without console errors.
- `/demo` was controlled by `friend-file-drop-v1`; after an online first visit, an offline reload returned the demo title and h1. The service-worker cache was present.
- Desktop and 390 × 844 mobile had no horizontal overflow; the demo action remained visible. Keyboard Tab exposed the skip link with a 3 px coral focus outline. Reduced-motion context reduced transitions to `0.01ms`.

### Accessibility, privacy, and response policy

- Live Playwright axe checks found **0 serious/critical** violations on `/`, `/demo`, `/privacy`, `/terms`, and `/missing-page`.
- `/opt/fleet/lib/verify-url.sh` passed against the live URL: 200 response, title, `lang=en`, one h1, main landmark, no missing alt text/buttons without labels, and no console/page errors. Its live load measurement was 824 ms.
- Cold/live browser request capture on each main route and the full demo flow found no third-party requests. No sign-in, payment, analytics, API endpoint, product-unlock call, or server-side endpoint is present; therefore rate-limit testing is not applicable.
- Live responses include HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, restrictive same-origin CSP, and a restrictive Permissions-Policy. No cookies were set in the verified flows.

### Performance and deployment identity

- Live Lighthouse (mobile): Performance **97**, Accessibility **100**, Best Practices **100**, SEO **100**. FCP 1.0 s, LCP 1.3 s, TBT 190 ms, CLS 0, interactive 1.4 s.
- Production build: initial JS 9.75 KB gzip; CSS 4.70 KB gzip; hero WebP 58 KB. These are within the stated budgets.
- The live HTML references `index-BdRPWZ51.js` and `index-SKDJwxXG.css`. SHA-256 comparison found both live files and the locally built candidate byte-identical; the 58 KB hero WebP was byte-identical too. The earlier deployment-only concern is therefore not reproduced: the candidate is live at the stated URL.
- `/`, `/demo`, `/privacy`, and `/terms` return 200 and have correct route titles after SPA render. Main crawl links and the two `mailto:` links are valid.

## How to reproduce

```sh
npm ci
npm test
npm run build
npm test -- --grep @claim:offline-reload
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh https://friend-file-drop.sociobot.in /tmp/friend-verify
```

The verification artifacts used during this run were written outside the repository under `/tmp/friend-verify`, `/tmp/friend-lighthouse.json`, and `/tmp/friend-*.png`.
