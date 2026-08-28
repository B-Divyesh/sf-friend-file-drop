# Independent verification 2 — FAIL

**Candidate:** `a15ae576aeed01392f18ab8799b49fc2b808a0df` (`main`)

**Live URL:** <https://friend-file-drop.sociobot.in>

**Verified:** 2026-08-28 from the supplied clean checkout after `npm ci`. Product code was not changed.

## Verdict

**FAIL.** The first screen passes, the live static files match the candidate byte for byte, the ordinary direct and relay flows work, and the final full local and live suites pass. The release still fails because one mandatory claim command failed on its first clean execution; same-content files collapse into one receipt entry; deployed rate limiting is unreliable and incomplete; the core file picker has invisible keyboard focus; and visitor-facing promises remain outside `.factory/claims.json`.

The earlier deployment-only concern was not reproduced. The deployed HTML, JS, CSS, service worker, manifest, and main assets match this candidate.

## First-read and one-click demo gate

**PASS.** On a cold live load at 1440 × 900, with service workers blocked, the first screen says:

- what it does: “Send files straight to someone you trust” and “Files go direct when browsers connect”;
- who it is for: “For friends on different devices”;
- what to click first: **Try it with sample data**, followed by “The demo opens a ready transfer.”

The one click opens `/demo`, already populated with three named sample files, sizes, hashes, a six-word code, and **Send sample files**. The persistent banner provides **Reset demo** and **Start for real**.

Evidence: `/tmp/friend-file-drop-first-read.png` and `/tmp/friend-file-drop-demo-mobile.png`.

## Release-blocking findings

### High — a required claim command failed on its first clean run

The exact command declared for `opt-in-relay` failed:

```text
npm test -- --grep @claim:opt-in-relay
Expected getByText('Waiting for the other person') to be visible
tests/product.spec.ts:193
1 failed
```

The other 12 declared commands passed. Three later direct repeats and the live relay test passed, so this is timing-sensitive rather than a consistently broken relay. The acceptance contract explicitly states that any failing claim test blocks release; a later pass cannot erase the fresh failure.

### High — same-content files produce a false/incomplete receipt

A live direct transfer selected two different filenames with identical bytes: `copy-one.txt` and `copy-two.txt`. The sender showed two manifest rows and **Send 2 files**. After completion:

- receiver manifest: two rows;
- statuses: `Verified`, `Waiting`;
- receiver and sender receipts: only `copy-two.txt`;
- both pages nevertheless displayed **Transfer finished**.

The transfer uses SHA-256 as the sole file identifier and stores incoming files in a `Map` keyed by that hash, so equal-content files overwrite one another. This violates the brief's explicit manifest and matching completion-receipt job.

Evidence: `/tmp/friend-file-drop-duplicate-content.png`.

### High — deployed API rate limiting does not meet the contract

Fresh live burst evidence:

- 105 ordinary sequential requests to `GET /api/rooms/<valid-six-word-code>` all returned 404; no 429 threshold was observed.
- Supplying a fixed client-controlled `X-Forwarded-For` value caused request 91 to return 429 with `Retry-After: 60` on the room endpoint.
- Supplying another fixed value to `/api/rooms/<code>/files/<id>` caused request 91 to return 429 **without** `Retry-After`.

The implementation keys an in-memory map from the first `X-Forwarded-For` value. The live results show that ordinary requests do not share a reliable key, while a caller can choose and rotate the trusted header. Required repair: use a server-controlled identity and shared/atomic limiter; return `Retry-After` from every 429 path.

### High — keyboard focus disappears on the core file picker

Keyboard traversal reaches `#file-input` after the send tab. The active element is 1 × 1 CSS px with `opacity: 0`; the surrounding drop-zone label has no `:focus-within` treatment. The computed 3 px outline is invisible, so a keyboard-only sender cannot see where focus moved before the file-picker action.

The skip link, navigation, hero actions, tabs, and later controls have visible coral focus rings. The failure is specific to the product's core first step and is not reported by axe.

### High — `.factory/claims.json` does not cover all visitor-facing promises

Material promises with no dedicated claim entry and observable sandbox assertion include:

- “Each file crosses once.”
- **Export saved receipts** and **Import receipts**.
- “Ready. No network or real files are used.” The `demo-isolation` test rejects only foreign origins, so it would allow a same-origin `/api` call.
- “Your own files stay untouched.”

Independent QA confirmed receipt import/export and confirmed that the current live demo makes no API request, but the claims contract requires these promises to be registered and continuously tested or removed.

## Other findings

### Medium — 200% text resize causes horizontal overflow

At 390 px, the normal page has `scrollWidth === clientWidth === 390`. After resizing root text from 17 px to 34 px, `scrollWidth` becomes 450 px and the header extends beyond the viewport. Evidence: `/tmp/friend-file-drop-200pct.png`.

### Medium — deployed backend has no health/build identity

`GET /api/health` returns 404. Static deployment is byte-identical to the candidate and live API behavior is consistent with source, but no endpoint or response field identifies the deployed function build. The backend portion therefore cannot be tied exactly to commit `a15ae57` externally.

### Low — persistent room-code storage is omitted from the privacy explanation

Opening a real room writes `friend-file-drop:last-room` to persistent `localStorage`. The privacy page lists IndexedDB receipts, incomplete chunks, and demo session data, but not this retained room code. The server room expires after 15 minutes; the local code remains until site data is cleared or another room replaces it.

## Mandatory claims results

All commands were run exactly as listed after `npm ci`.

| Claim | Result | Evidence |
| --- | --- | --- |
| `demo-receipt` | PASS | three sample rows verified and receipt shown |
| `no-account` | PASS | demo ready with no identity fields |
| `free-use` | PASS | free copy present; no payment action |
| `demo-isolation` | PASS | session namespace only; no foreign origin |
| `offline-reload` | PASS | controlled `/demo` reloaded offline |
| `six-word-room` | PASS | two contexts joined with six displayed words |
| `room-expiry` | PASS | present at 14:59.999; absent at 15:00 |
| `direct-transfer` | PASS | ordinary one-file direct transfer and receipts |
| `resumable-transfer` | PASS | resumed at the seeded 32 KB verified offset |
| `local-receipts` | PASS | receipt stored in IndexedDB |
| `opt-in-relay` | **FAIL** | first exact run timed out waiting for one-consent feedback; later repeats passed |
| `relay-cap` | PASS | exact cap accepted; next byte rejected |
| `privacy-boundaries` | PASS | tested resources same-origin; no contact input |

Initial result: **12 passed, 1 failed**. Later `--repeat-each=3` passed 3/3; this confirms flakiness, not acceptance.

## Local quality gates

- `npm ci`: PASS; root and API installs reported zero vulnerabilities.
- `npm run lint`: PASS (`tsc --noEmit`).
- `npm run build`: PASS; `dist/` produced.
- final `npm test`: PASS — 5 Node/API/config tests and 17 local Playwright tests passed; 8 live-only tests skipped. This does not override the earlier mandatory claim failure.
- `npm audit --omit=dev --audit-level=high`: PASS; zero vulnerabilities.

Production build: JS 35.23 KB raw / 11.57 KB gzip; CSS 17.02 KB raw / 4.81 KB gzip; hero WebP 59,198 bytes; live Lighthouse total transfer 91 KiB. All are within budget.

## Live functional and backend evidence

- `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts`: **8 passed**.
- Ordinary two-browser direct transfer: PASS.
- Ordinary dual-opt-in relay transfer: PASS.
- Invalid recovery: a two-word code produced “Enter all six words”; a valid-but-missing room produced “That room expired”; replacing it with a live code then transferred 0 B, 32 KB, and 32 KB + 1 B files with three verified downloads and a three-file receipt.
- Receipt import/export: malformed JSON produced a clear recovery message; a valid fixture imported; export downloaded `friend-file-drop-receipts.json`.
- Persistent relay boundary: a 13-byte file returned 200 before receipt and 404 after receipt, confirming live byte removal.
- Concurrent state: 10/10 rooms retained both sender and receiver consent when consent requests were issued concurrently.
- 25 MB exact cap and 15-minute expiry passed injected store tests.
- No authentication, billing/product-unlock, or AI endpoint exists; their specialized checks are not applicable.

The malformed-room 404 creates the browser's expected “Failed to load resource” entry during deliberate recovery. Normal route loads, demo, direct transfer, and relay transfer had no console/page errors.

## Accessibility and responsive evidence

- Playwright axe on `/`, `/demo`, `/privacy`, `/terms`, and `/missing-page`: **0 serious/critical findings**.
- `/opt/fleet/lib/verify-url.sh`: PASS after creating its required output directory; load 638 ms, title, `lang=en`, one h1, main, alt text, button labels, and zero errors.
- Desktop and 390 × 844 mobile: no normal horizontal overflow; first action visible.
- Visible 3 px coral focus: PASS except for the hidden file-input defect.
- Skip link, arrow-key tabs, and 44 px visible targets: PASS.
- Reduced motion: transition durations measured as `0.01ms`; no loop or flash.
- 200% text resize: FAIL as documented above.

## Privacy, policies, and PWA

- Full live demo: 3 requests, all same-origin, no `/api`, no cookies, no localStorage, no IndexedDB, and only `sessionStorage['demo:completed']`.
- Real browser flows made only same-origin HTTP requests; no analytics, advertising, CDN fonts/scripts, contacts, sign-in, or third-party runtime request was observed.
- HTML has HSTS, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, restrictive Permissions Policy, and same-origin CSP.
- API JSON uses `Cache-Control: no-store`; rate-limit defects are above.
- Hashed assets return one-year immutable caching; HTML, manifest, and `sw.js` revalidate.
- Manifest has 192, 512, and maskable 512 icons plus standalone colors/start URL.
- Service-worker cache `friend-file-drop-v2` controls the demo; offline reload passes. Source includes version cleanup, `skipWaiting`, `clients.claim`, and an update toast listener.
- Unknown URLs return the designed HTTP 404. Main links return 200; contact links are explicit `mailto:` links.

## Performance

Fresh mobile Lighthouse: Performance **94**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 0.9 s, LCP 1.3 s, TBT 280 ms, CLS 0. A small interaction trace measured a maximum event duration of 80 ms. Lighthouse provided no field INP. Evidence: `/tmp/friend-file-drop-lighthouse-2.json`.

## Deployment identity

Live and local SHA-256 values match:

| File | SHA-256 |
| --- | --- |
| `index.html` | `c666d604fa3c6ebe1d2da41a7d8097a7c429fe8e5f281469d52b2411930109d8` |
| JS | `58eff10b537bcc8b9b9c753052f741805ed3f77a5f2ad0a62209fc5dee0aa6cc` |
| CSS | `5f5a1476faae66767c78bee4719065921dfe914d82bc62733b9f9cf7e0600715` |
| hero WebP | `b0886168d66b3142d882bf79566937bedcd63e3d35efeea45eda7c8cf9fcdc76` |
| social preview | `3a54fe6aad3203f5535cc4f5ee39d39e23f40b9bd65f154f6014c746bb54dba0` |
| `sw.js` | `822ea0680d0c7ba83bb57de7aecec9fa4c99da98a6ce6f1930d11372265f17ac` |
| manifest | `dc1619a36be6fcad0f74b09a94875eca9fdd81f154aa804aa3cbf3e4a9bb89e7` |

Static candidate deployment is confirmed; the function build remains externally unidentifiable because `/api/health` is absent.

## Reproduction

```sh
npm ci
npm test -- --grep @claim:opt-in-relay
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
mkdir -p /tmp/friend-file-drop-verify-2
VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh https://friend-file-drop.sociobot.in /tmp/friend-file-drop-verify-2
```

No product code was modified during verification.
