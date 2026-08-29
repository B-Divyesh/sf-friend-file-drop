# Verification 10 — independent product QA

## Verdict: **FAIL**

Candidate: `d0d11d72890ab4e909b1ec933180a392242990b2` (`main`)

Live URL: <https://friend-file-drop.sociobot.in>

Verified: 2026-08-29 UTC from the supplied clean checkout. Product code was not changed.

The repaired transfer, relay, receipt, demo, privacy, accessibility, and PWA flows work in fresh live tests. The candidate is still not releasable for two independent reasons:

1. The required `npm test` gate failed on both full-suite runs.
2. The deployed API health response does not identify the candidate build. It reports an older revision whose source does not contain the protocol the live API is serving.

## Release-blocking defects

### High — `npm test` fails reproducibly at the tagged resume test

The exact full quality gate was run twice after `npm ci`. Both runs failed:

```text
1 failed
[chromium] tests/product.spec.ts:329:1
an established direct transfer survives receiver rejoin and sender reopen
@claim:resumable-transfer @regression:established-direct-interruption
Test timeout of 30000ms exceeded.
```

Run 1 reached all functional assertions and timed out while closing the sender browser context. Run 2 timed out while the resumed 8 MiB transfer was still progressing; its failure screenshot shows `Resuming resume.bin at 576 KB.` The configured full suite runs two workers, and the test does not reliably fit its 30-second test timeout under that supported configuration.

Evidence:

- `/tmp/friend-file-drop-gates/npm-test.log`
- `/tmp/friend-file-drop-gates/npm-test-rerun.log`
- `test-results/product-an-established-dir-ac680-blished-direct-interruption-chromium/trace.zip`
- `test-results/product-an-established-dir-ac680-blished-direct-interruption-chromium/test-failed-1.png`
- `test-results/product-an-established-dir-ac680-blished-direct-interruption-chromium/test-failed-2.png`

The isolated claim command passed, and a separate live 8 MiB interrupted transfer also passed. This is a release-gate reliability defect rather than evidence that the live resume feature is broken. The product contract nevertheless requires `npm test` to pass locally.

### High — live API build identity is stale and contradicts observed code

`GET /api/health` returned:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.3",
  "sourceRevision": "4fd5dc0c8b192e9bf0ad0771fcf60a017e01ee93",
  "deploymentId": "14285389-a56c-4c19-9e7c-e09a826d906b"
}
```

Candidate `d0d11d7` contains the resume repair from `9f0edc3`. Revision `4fd5dc0` has no `rejoin`, `reopen`, `offerVersion`, or `answerVersion` room protocol. Fresh live requests successfully exercised all of those fields and actions. The API is therefore serving post-`4fd5dc0` behavior while claiming that it was built from `4fd5dc0`.

The static deployment is byte-identical to the candidate build, but the backend cannot be tied to the candidate through its required health/build identity. This confirms a fresh deployment-identity failure rather than the earlier repaired product-flow failure.

The registered `api-health` claim test is also insufficient: it checks only that `sourceRevision` and `deploymentId` properties exist. It would pass when either value is null, stale, or unrelated to the candidate, as happened here. It does not prove the claimed build identity.

## Mandatory first gates

### Claims manifest — PASS after clean install

`.factory/claims.json` exists. After `npm ci`, every listed command was run separately and returned zero: **21/21 passed**.

| Claims | Result |
| --- | --- |
| `demo-receipt`, `manifest-before-transfer`, `no-account`, `free-use`, `demo-isolation`, `offline-reload`, `six-word-room` | PASS |
| `room-expiry`, `direct-transfer`, `resumable-transfer`, `local-receipts`, `opt-in-relay`, `relay-cap`, `privacy-boundaries` | PASS |
| `individual-file-receipts`, `own-files-untouched`, `receipt-export`, `receipt-import`, `demo-no-real-files`, `room-code-storage`, `api-health` | PASS |

Each claim ID appears on exactly one test. The isolated `resumable-transfer` command completed in 19.1 seconds. These passing isolated commands do not override the failing required full suite above.

Claim logs: `/tmp/friend-file-drop-claim-results-installed/<claim-id>.log` and `/tmp/friend-file-drop-claim-results-installed/summary.tsv`.

### Cold first-read and one-click demo — PASS

A fresh 1440 × 900 browser with service workers blocked opened the live home page. The first viewport says:

> **Send files straight to someone you trust**
>
> For friends on different devices who need the files and proof that they arrived.

The primary action **Try it with sample data** is above the fold. One click opens `/?demo=1`, shows three realistic files with sizes and hashes, and keeps the banner **Demo — sample data, nothing is saved** with **Reset demo** and **Start a real transfer**.

This plainly answers what it does, who it is for, and what to click first.

## End-to-end product evidence

- `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list`: **9/9 passed**. This covered all routes, Axe, demo isolation, live offline reload, corrupt direct-transfer recovery, and real relay delivery.
- Live interrupted resume passed independently with an 8 MiB file. The receiver was reloaded after 96 KiB had been saved, rejoined with 288 KiB persisted, and the sender was reloaded. Reselecting the file restored the same transfer ID, **Reopen this room** reconnected both browsers, the UI showed the exact resume offset, and both browsers stored one receipt.
- A live three-file direct transfer covered a zero-byte file and two differently named files with identical bytes. Both receipts contained all three rows; the receiver had three verified statuses and downloads named `empty.txt`, `copy-one.txt`, and `copy-two.txt`.
- Invalid `one-two` input produced `Enter all six words, separated by hyphens.` Correcting it to a valid nonexistent six-word code made the request and produced `That room expired or does not exist.`
- Four live relay tests ran with two workers: **4/4 passed**. Rooms, consent, and bytes remained isolated under concurrency.
- The live API accepted `rejoin` and `reopen`, incremented `rejoinVersion` and `offerVersion`, cleared the stale answer, and retained the room.

## Privacy, headers, rate limits, and persistence

- A fresh direct visit to `/?demo=1` and complete sample run requested only the same-origin document, candidate JS, and candidate CSS. It made no `/api` or cross-origin request, created only `sessionStorage['demo:completed']`, created no local-storage key, and opened no IndexedDB database.
- A cold home load requested only same-origin assets. No analytics, ads, third-party scripts/fonts, cookies, console errors, or page errors were observed.
- Document responses include `Content-Security-Policy` with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, restrictive `Permissions-Policy`, and HSTS.
- API responses use `Cache-Control: no-store`.
- The observed allowance is **90 requests per client/scope per 60 seconds**. For both a room-status scope and the invalid-file scope, requests 1–90 were admitted, request 91 returned 429, and requests 91–92 carried `Retry-After: 60`. The relay error was `Too many relay requests. Wait one minute and try again.`
- Local injected-clock coverage confirms room state exists through 14:59.999 and expires at 15:00. Local cap coverage confirms the relay accepts exactly 25 MiB and rejects the next byte.
- Sign-in is not part of this account-free product, so Entra authority checks are not applicable. Library/CLI packaging is not applicable to this PWA.

## Accessibility and responsive behavior

- Playwright Axe found **zero serious or critical findings** on `/`, `/demo`, `/privacy`, `/terms`, and the real HTTP 404.
- `/opt/fleet/lib/verify-url.sh` passed in 901 ms with no console/page errors: title, `lang=en`, one `<h1>`, `<main>`, image alt text, and named buttons were present.
- Keyboard traversal reached every home control and wrapped without a trap. Focused controls showed the designed 3 px coral outline; the visually hidden file input outlined its visible drop sheet. Tablist arrow navigation works.
- At 390 × 844, the primary demo action remains above the fold, page width equals the 390 px viewport, and no visible interactive target is smaller than 44 px.
- At 200% root text size, the 390 px page still has no horizontal overflow.
- Under `prefers-reduced-motion: reduce`, maximum animation and transition duration is 0.00001 seconds.

## PWA, caching, and performance

- The live service worker activates and controls `/demo`; the page reloads offline successfully.
- An update simulation changed the served service-worker cache version. The app displayed `A new page version is ready. Reload`, activated the update, and still reloaded the demo offline.
- The manifest has a versioned start URL, standalone display, matching theme/background colors, 192/512 icons, and a maskable icon.
- Fingerprinted JS, CSS, and images return `public, max-age=31536000, immutable`. HTML, the manifest, and `sw.js` return `no-cache`. Unknown routes return the styled page with HTTP 404.
- Production build: JS 41.19 kB / **13.11 kB gzip**; CSS 17.31 kB / **4.87 kB gzip**; hero WebP 59.20 kB. These are within budget.
- Fresh mobile Lighthouse: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 0.9 s, LCP 1.2 s, TBT 30 ms, CLS 0, total transfer 92 KiB.

## Candidate/deployment comparison

SHA-256 hashes match between the local production build and live deployment for:

- `index.html`
- `assets/index-q37DmQLN.js`
- `assets/index-C_88kP3x.css`
- `sw.js`
- `manifest.webmanifest`
- `assets/notebook-transfer.webp`
- `assets/social-preview.webp`

Static files therefore match candidate `d0d11d7`. Backend behavior includes the candidate protocol, but the required API build identity reports `4fd5dc0`; exact backend identity is not verifiable and is a release blocker.

## Other local gates

- `npm ci`: PASS; root and API dependencies installed from lockfiles.
- `npm run lint`: PASS (`tsc --noEmit`).
- `npm run build`: PASS and created `dist/`.
- `npm audit --omit=dev --audit-level=high`: PASS, 0 vulnerabilities.
- `npm audit --prefix api --omit=dev --audit-level=high`: PASS, 0 vulnerabilities.
- `npm test`: **FAIL twice**, as detailed above.

## Required next steps

1. Make the tagged resume test reliable under the repository's configured full-suite concurrency and 30-second timeout; `npm test` must pass repeatedly.
2. Deploy with a truthful `BUILD_SOURCEVERSION`/`GITHUB_SHA` so `/api/health.sourceRevision` identifies the candidate being served.
3. Re-run all 21 exact claim commands, the full `npm test`, and the live suite before acceptance.
