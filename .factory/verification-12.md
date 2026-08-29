# Verification 12 — independent product QA

## Verdict: **PASS**

- Candidate: `48e2f5585085a14242224553e90179c0ff80d962` (`main`)
- Live URL: <https://friend-file-drop.sociobot.in>
- Verified: 2026-08-29 UTC from the supplied clean checkout
- Product code changed by verifier: no
- Defects: no critical, high, medium, or low defects found

The live static PWA is byte-identical to the candidate build, and the managed API reports the exact candidate revision. The smallest useful product works end to end: two account-free browsers join with a six-word code, see the manifest and hashes, transfer files directly, and receive matching receipts. The opt-in relay, resume path, offline shell, privacy boundaries, and API limits also passed.

## Mandatory first gates

### Claims manifest — PASS, 21/21

`.factory/claims.json` exists. After the clean dependency install, every listed `test` command was run separately through the configured preview/demo entry point. Every command exited zero:

- `demo-receipt`, `manifest-before-transfer`, `no-account`, `free-use`, `demo-isolation`
- `offline-reload`, `six-word-room`, `room-expiry`, `direct-transfer`, `resumable-transfer`
- `local-receipts`, `opt-in-relay`, `relay-cap`, `privacy-boundaries`
- `individual-file-receipts`, `own-files-untouched`, `receipt-export`, `receipt-import`
- `demo-no-real-files`, `room-code-storage`, `api-health`

Landing, demo, privacy, terms, and README copy were cross-checked against the manifest. No material unlisted product claim was found.

### Cold first-read and one-click demo — PASS

A fresh 1440 × 900 browser context with service workers blocked loaded the live home page. Above the fold it says:

> **Send files straight to someone you trust**
>
> For friends on different devices who need the files and proof that they arrived.

The primary action is **Try it with sample data**. One click opens the ready three-file sample. The persistent banner says **Demo — sample data, nothing is saved** and provides **Reset demo** and **Start a real transfer**. The first screen therefore states what the product does, who it serves, and what to click first.

## Clean checkout quality gates

- `git rev-parse HEAD`: exact candidate `48e2f5585085a14242224553e90179c0ff80d962`.
- `npm ci`: PASS for root and `api/`; both audits reported zero vulnerabilities.
- `npm test`: PASS — 17 Node unit/integration/config tests and 29 local Chromium tests; 10 live-only tests skipped as designed.
- `npm run lint`: PASS (`tsc --noEmit`).
- `npm run build`: PASS; `dist/index.html` produced.
- `npm audit --omit=dev`: PASS, zero vulnerabilities.
- `npm audit --prefix api --omit=dev`: PASS, zero vulnerabilities.
- `bash -n scripts/deploy-static.sh`, `node --check scripts/verify-live-identity.mjs`, and `git diff --check`: PASS.
- Production output: JS 41.19 kB / 13.11 kB gzip; CSS 17.31 kB / 4.87 kB gzip; hero WebP 59.20 kB. These are below the 200 kB JS, 50 kB CSS, and 300 kB hero budgets.

## Live deployment identity — PASS

The exact deployment suite ran with:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in \
EXPECTED_SOURCE_REVISION=48e2f5585085a14242224553e90179c0ff80d962 \
npx playwright test tests/live.spec.ts --reporter=list
```

Result: **10 passed**. Live health returned HTTP 200, `Cache-Control: no-store`, and:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.3",
  "sourceRevision": "48e2f5585085a14242224553e90179c0ff80d962",
  "deploymentId": "6603c09e-a810-4a60-aa0e-f2342ff813a1",
  "status": "ready"
}
```

Eighteen deployable files were independently hashed from `dist/` and fetched live. All matched, including index HTML, the real 404 body, JS and source map, CSS, service worker, manifest, hero/social images, icons, offline page, robots, and sitemap.

## End-to-end product evidence

- The one-click sample completed `picnic-table.jpg`, `family-recipes.pdf`, and `read-me-first.txt`; all three rows became `Verified`, and the receipt contained the three expected hashes.
- A fresh live direct transfer used `empty.txt` (0 bytes), `copy-one.txt`, and `copy-two.txt`. The latter two had identical 24-byte contents and the same hash. Both browsers produced three distinct matching receipt rows; the receiver exposed all three original download names; the sender's file input remained unchanged.
- The same direct run produced zero console errors and zero page errors in both contexts.
- The deployed recovery test deliberately corrupted transmitted bytes. The receiver refused the file and withheld both receipts; a clean retry then completed and issued matching receipts.
- The local real-WebRTC test interrupted a transfer after actual chunks reached IndexedDB, reloaded/rejoined the receiver, reopened the sender with the same file, resumed from the stored offset, and completed.
- The live relay waited after one person's consent, became ready only after the second person's consent, transferred the file, and produced both receipts. Unit/integration coverage also passed for concurrent consent and room isolation.
- Exact boundaries passed: a room exists at 14:59.999 and expires at 15:00; the relay accepts exactly 25 MiB and rejects the next byte.
- `only-three-words` set `aria-invalid=true` and announced `Enter all six words, separated by hyphens.` Correcting it to a valid nonexistent six-word code announced `That room expired or does not exist.` without a page exception.
- Receipt import/export, saved-room clearing, demo reset/exit, separate same-content receipts, and corrupt-data recovery passed.

## Privacy, requests, headers, and rate limiting

A fresh live one-click sample run requested only same-origin HTML, candidate JS, candidate CSS, and the candidate hero image. It made no `/api` or cross-origin request, set no cookie, and wrote only `sessionStorage['demo:completed']` for demo data. The empty production IndexedDB created while the home page reads receipt history retained zero `receipts` and zero `partial-chunks`; opening `/demo` directly creates no production database.

The live document response has:

- CSP restricted to self with `frame-ancestors 'none'`
- HSTS
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- camera, microphone, geolocation, and payment disabled by `Permissions-Policy`
- `Cache-Control: no-cache`

`sw.js` and the manifest use `no-cache`; hashed JS, CSS, and image assets use `public, max-age=31536000, immutable`; API responses use `no-store`. An unknown path returns the styled 404 body with HTTP 404.

The observed API allowance is **90 requests per client/room scope per 60 seconds**. Requests 1–90 against a fresh missing room were admitted and returned 404. Request 91 returned HTTP 429 with `Retry-After: 60`, `Cache-Control: no-store`, and `Too many room requests. Wait one minute and try again.`

## Accessibility, mobile, and performance

- `/opt/fleet/lib/verify-url.sh`: PASS in 591 ms with no console/page errors; title, `lang=en`, one `h1`, main landmark, alt text, and named buttons passed.
- Axe: zero serious/critical findings on `/`, `/demo`, `/privacy`, `/terms`, and the real 404.
- Keyboard: the skip link is first and becomes visibly exposed; after activation the next Tab lands on **Try it with sample data**. Transfer tabs switch with arrow keys. No trap was found.
- Focus: the file chooser receives the designed 3 px coral focus ring.
- 390 × 844: the primary demo action is fully above the fold; body width equals the 390 px viewport; no visible interactive target is below 44 px.
- At 200% root text size, the 390 px layout has no horizontal overflow.
- Reduced motion: computed animation and transition durations collapse to 0.01 ms.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.3 s, TBT 90 ms, CLS 0, Speed Index 0.9 s, total transfer 79 KiB.
- Fresh desktop and mobile screenshots were visually inspected. The notebook identity, readable hierarchy, primary action, transfer sheet, receipt, footer, and responsive stacking were intact.

## PWA and offline behavior

- The live service worker activated, controlled `/demo`, updated, and reloaded that route offline.
- A fresh local update simulation changed the served cache version without changing product code. The app showed `A new page version is ready. Reload`; Reload activated the new cache, removed the old cache, and `/demo` then reloaded offline with its title and heading intact.
- The manifest has a versioned start URL, standalone display, matching theme/background colors, 192/512 icons, and a maskable icon.

## Applicability and final assessment

Sign-in/Entra, payment, AI, and library/CLI consumer-install checks do not apply to this free, accountless PWA. Backend concurrency, durable room boundaries, health/build identity, and live rate limiting were tested.

No defect was found at any severity. Candidate `48e2f5585085a14242224553e90179c0ff80d962` is accepted.
