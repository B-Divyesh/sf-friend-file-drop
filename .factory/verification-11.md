# Verification 11 — independent product QA

## Verdict: **FAIL**

- Candidate: `bf1ef63eff848252719268eeb16fc31bbc98f52f` (`main`)
- Live URL: <https://friend-file-drop.sociobot.in>
- Verified: 2026-08-29 UTC from the supplied clean checkout
- Product code changed by verifier: no

The candidate works locally, and the live static PWA is byte-identical to its production build. The release still fails because the managed API does not identify the requested candidate: live health reports source revision `dec081988bd5618f24e555fe9174aa63c8e59fce`. The repository's exact live identity test therefore fails for `bf1ef63eff848252719268eeb16fc31bbc98f52f`.

## Defects

### High — live API does not identify the candidate

`GET /api/health` returned HTTP 200 with `Cache-Control: no-store` and:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.3",
  "sourceRevision": "dec081988bd5618f24e555fe9174aa63c8e59fce",
  "deploymentId": "6603c09e-a810-4a60-aa0e-f2342ff813a1",
  "status": "ready"
}
```

The candidate required `sourceRevision` `bf1ef63eff848252719268eeb16fc31bbc98f52f`. The exact deployed suite command was:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in \
EXPECTED_SOURCE_REVISION=bf1ef63eff848252719268eeb16fc31bbc98f52f \
npx playwright test tests/live.spec.ts --reporter=list
```

Result: **1 failed, 9 passed**. The only failure was `@regression:live-build-identity`, with the exact expected/received revisions above. Static files match the candidate, but the backend's required build identity does not. This is release-blocking even though `bf1ef63` changes only `.factory/handoff.md` relative to `dec0819`.

### Low — the real 404 page shows an old product version

The candidate and live `/missing-page` footer say `v1.1.2`; the package, SPA footer, and API say `v1.1.3`. The 404 correctly returns HTTP 404 and otherwise has the expected styling, navigation, metadata, and accessibility.

## Mandatory first gates

### Claims manifest — PASS, 21/21

`.factory/claims.json` exists. After `npm ci`, every listed `test` command was run separately from the clean candidate checkout through the product's configured preview/demo entry point. All 21 returned zero:

- `demo-receipt`, `manifest-before-transfer`, `no-account`, `free-use`, `demo-isolation`, `offline-reload`, `six-word-room`
- `room-expiry`, `direct-transfer`, `resumable-transfer`, `local-receipts`, `opt-in-relay`, `relay-cap`, `privacy-boundaries`
- `individual-file-receipts`, `own-files-untouched`, `receipt-export`, `receipt-import`, `demo-no-real-files`, `room-code-storage`, `api-health`

Observed summary: `CLAIMS_TOTAL 21 CLAIMS_FAILED 0`. Landing, legal, demo, and README promises were cross-checked against the manifest; no material unlisted product claim was found.

### Cold first-read and one-click demo — PASS

A fresh 1440 × 900 context with service workers blocked opened the live home page. Its first screen says:

> **Send files straight to someone you trust**
>
> For friends on different devices who need the files and proof that they arrived.

The primary action **Try it with sample data** is above the fold. It opens the ready three-file transfer in one click. The persistent banner says **Demo — sample data, nothing is saved** and includes **Reset demo** and **Start a real transfer**. This plainly states what the product does, who it is for, and what to click first.

## Clean checkout quality gates

- `npm ci`: PASS; root and API lockfiles installed, zero audit findings.
- `npm test`: PASS; 14 Node unit/integration/config tests and 29 local Playwright tests passed; 10 live-only tests skipped as designed.
- `npm run lint`: PASS (`tsc --noEmit`).
- `npm run build`: PASS; `dist/index.html` produced.
- `npm audit --omit=dev`: PASS, zero vulnerabilities.
- `npm audit --prefix api --omit=dev`: PASS, zero vulnerabilities.
- Production bundle: JS 41.19 kB / 13.09 kB gzip; CSS 17.31 kB / 4.88 kB gzip; hero WebP 59.20 kB.

## End-to-end product evidence

- One-click demo completed three realistic sample files with three verified receipt rows and matching hashes.
- The real live direct path created a six-word room, connected two fresh browser contexts, rejected corrupt bytes without issuing a receipt, then recovered on retry and gave both sides receipts.
- A separate fresh live boundary transfer sent `empty.txt` plus `copy-one.txt` and `copy-two.txt` containing identical bytes. Both sides received three receipt rows; all receiver statuses were `Verified`; download names were preserved; the sender's input still contained all three source files; no console/page errors occurred.
- The local real-WebRTC regression interrupted an established transfer after real chunks were saved, reloaded and rejoined the receiver, reloaded and reopened the sender, resumed at the saved IndexedDB offset, and completed.
- The live durable relay waited after one person's consent, became ready only after the second person's consent, delivered the file, and issued both receipts.
- Exact local boundaries passed: room present at 14:59.999 and expired at 15:00; relay accepted exactly 25 MiB and rejected the next byte.
- Invalid `only-three-words` input set `aria-invalid=true` and announced `Enter all six words, separated by hyphens.` Correcting it to a valid nonexistent code produced `That room expired or does not exist.` in a status region. Chromium records the handled 404 as one network-console entry; no page exception occurs.
- Receipt export/import, identical-content file identity, local receipt persistence, saved-room clearing, demo reset, and corrupt-data recovery passed.

## Privacy, headers, caching, and rate limiting

A fresh live sample run requested only:

- `/?demo=1`
- same-origin candidate JS
- same-origin candidate CSS

It made no `/api` or cross-origin request, set no cookie, wrote no `localStorage`, opened no IndexedDB database, and wrote only `sessionStorage['demo:completed']`. Cold home loading was also entirely same-origin and had no console/page errors.

Live document responses include CSP with `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and restrictive camera/microphone/geolocation/payment permissions. HTML, `sw.js`, and the manifest use `no-cache`; hashed JS/CSS use `public, max-age=31536000, immutable`; API health uses `no-store`. Unknown routes return the styled page with HTTP 404.

The observed live request allowance is **90 requests per client/room scope per 60 seconds**. Requests 1–90 to a fresh absent room were admitted for processing and returned 404. Request 91 returned HTTP 429 with `Retry-After: 60` and `Too many room requests. Wait one minute and try again.`

## Accessibility, mobile, and performance

- `/opt/fleet/lib/verify-url.sh`: PASS in 819 ms; zero load errors; title, `lang=en`, one `h1`, `main`, alt text, and named buttons passed.
- Playwright Axe: zero serious/critical findings on `/`, `/demo`, `/privacy`, `/terms`, and the real 404.
- Keyboard: skip link is first, tablist arrow switching works, no trap was found, and focused controls use a visible 3 px coral ring.
- 390 × 844: the primary demo action is fully above the fold, page width is exactly 390 px, and no visible target is below 44 px.
- 200% root text: no horizontal overflow at 390 px.
- Reduced motion: animation and transition durations collapse to 0.01 ms.
- Fresh live mobile Lighthouse: Performance 97, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.3 s, TBT 190 ms, CLS 0, total transfer 92 KiB.
- Internal links and all public assets were crawled. Expected routes/assets returned 200; `/missing-page` returned 404; mail links were the only non-HTTP links.

## PWA and deployment comparison

- The live service worker activated, controlled `/demo`, updated, and reloaded the route offline.
- A fresh local update simulation changed the served service-worker cache version. The app displayed `A new page version is ready. Reload`; choosing Reload activated the update, and the demo then reloaded offline with no errors.
- Manifest checks passed: versioned start URL, standalone display, matching theme/background colors, 192/512 icons, and a maskable icon.
- SHA-256 matches between the candidate build and live deployment for `index.html`, JS, CSS, `sw.js`, `manifest.webmanifest`, and the real 404 page.

## Applicability

Sign-in/Entra, payment, and library/CLI consumer-install checks do not apply to this free accountless PWA. Backend concurrency and persistence were covered by the concurrent-consent unit/integration test, established-room reopen test, isolated parallel relay test, and live durable relay flow.

## Required next steps

1. Deploy the managed API with `FRIEND_FILE_DROP_SOURCE_REVISION=bf1ef63eff848252719268eeb16fc31bbc98f52f` (or build directly from that candidate) and confirm `/api/health` returns that exact value.
2. Change the 404 footer from `v1.1.2` to `v1.1.3`.
3. Re-run all 21 claim commands, `npm test`, and the exact live suite before changing the verdict to PASS.
