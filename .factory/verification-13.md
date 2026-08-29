# Verification 13 — independent product QA

## Verdict: **PASS**

- Candidate: `deab96926e140dd39c65ae182f532bffec9544a9` (`main`)
- Live URL: <https://friend-file-drop.sociobot.in>
- Verified: 2026-08-29 UTC from the supplied clean checkout
- Product code changed by verifier: no
- Defects: none found (critical: 0, high: 0, medium: 0, low: 0)

The deployed static PWA is byte-identical to this candidate build, and the managed API reports this exact source revision. The browser-to-browser transfer, six-word room, manifest/hash, receipts, resume coverage, dual-consent relay, demo, and offline shell meet the researched brief.

## Required first gates

`.factory/claims.json` exists and declares 22 claims. After `npm ci` from the clean checkout, I ran every listed command separately and each exited 0:

- `demo-ready-in-one-click`, `demo-receipt`, `manifest-before-transfer`, `no-account`, `free-use`, `demo-isolation`, `offline-reload`, `six-word-room`
- `room-expiry`, `direct-transfer`, `resumable-transfer`, `local-receipts`, `opt-in-relay`, `relay-cap`, `privacy-boundaries`, `individual-file-receipts`
- `own-files-untouched`, `receipt-export`, `receipt-import`, `demo-no-real-files`, `room-code-storage`, `api-health`

The Playwright claim commands used the product's configured preview/demo entry point. The two declared Node claim commands (`room-expiry` and `api-health`) also passed in isolation. Landing-page, demo, README, privacy, and terms copy was cross-checked against the manifest; no material unlisted promise was found.

### Cold first-read — PASS

A fresh 1440 × 900 live context with service workers blocked showed, above the fold:

> **Send files straight to someone you trust**
>
> For friends on different devices who need the files and proof that they arrived.

It plainly explains the job and audience. The clear first action is **Try it with sample data**. One click changed the URL to `/?demo=1`, displayed the persistent **Demo — sample data, nothing is saved** banner with **Reset demo** and **Start a real transfer**, and showed three ready sample rows with sizes and full hashes. The demo made no API or third-party request and used no file input.

## Clean-checkout quality gates

- `npm ci`: PASS; root and API installs completed with zero reported vulnerabilities.
- `npm test`: PASS — 19 Node checks and 29 local Chromium checks passed; the 10 deployment-only tests were correctly skipped when `LIVE_URL` was not set.
- `npm run lint`: PASS (`tsc --noEmit`).
- `npm run build`: PASS; produced `dist/index.html`.
- `npm audit --omit=dev` and `npm audit --prefix api --omit=dev`: PASS, zero vulnerabilities.
- Build output: JS 41.17 kB / 13.09 kB gzip; CSS 17.31 kB / 4.87 kB gzip. Both are within the static-PWA budgets.
- `git diff --check`: PASS before verifier documentation changes.

## Deployment identity and end-to-end evidence

`node scripts/verify-live-identity.mjs https://friend-file-drop.sociobot.in deab96926e140dd39c65ae182f532bffec9544a9` passed. Live `/api/health` returned HTTP 200, `Cache-Control: no-store`, and:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.4",
  "sourceRevision": "deab96926e140dd39c65ae182f532bffec9544a9",
  "deploymentId": "b0be2e90-7d4f-42f7-993b-c65e09fa07d0",
  "status": "ready"
}
```

After a fresh production build, SHA-256 checks of all 18 deployable files (HTML, 404, JS/map, CSS, service worker, manifest, images, icons, offline page, robots, and sitemap) matched the live responses exactly. The deployment suite run with `LIVE_URL` and `EXPECTED_SOURCE_REVISION` set to the candidate completed **10/10**: health identity; landing/demo/legal/404 metadata and accessibility; demo isolation/exit; offline reload; corrupt-direct-transfer recovery; and durable dual-consent relay transfer.

The full local product suite independently exercised normal direct transfer, empty and same-content files, corrupt-byte recovery, receipt import/export, resumed direct transfer after reload/rejoin, and the relay's two-party consent and cleanup. It verifies the 15-minute room boundary and exact 25 MiB relay cap. Invalid room-code coverage announces the corrective error and nonexistent rooms announce the recovery path without an exception.

## Privacy, HTTP, accessibility, mobile, and PWA

- Fresh live landing and demo request logs contained only same-origin page, JS, CSS, and product-image requests; the sample flow made no `/api` request, no external request, and no visitor-file request. The cold-page and verifier checks recorded no console or page errors.
- The document CSP is self-only and includes response-header `frame-ancestors 'none'`. HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and restrictive `Permissions-Policy` are present. Hashed JS/CSS are `public, max-age=31536000, immutable`; `sw.js` and manifest are `no-cache`; API health is `no-store`; an unknown address returns the styled page with HTTP 404.
- API rate limiting was independently exercised against a fresh six-word room scope. The first 90-request allowance was consumed; the next request returned HTTP 429 with `Retry-After: 60`, `Cache-Control: no-store`, and the documented wait-one-minute error. Observed allowance: **90 requests per client/room scope per 60 seconds**.
- `/opt/fleet/lib/verify-url.sh` passed: 574 ms cold navigation, no console/page errors, title, `lang=en`, one `h1`, main landmark, zero images missing `alt`, and zero unlabeled buttons. The standalone `@axe-core/cli` could not launch because the container has no system Chrome; the repository's Playwright Axe integration was used instead and passed with zero serious/critical findings locally and on live `/`, `/demo`, `/privacy`, `/terms`, and the real 404.
- The local suite passed keyboard skip-link and arrow-tab operation, designed 3 px focus state, route focus restoration, 390 px action visibility, no 390 px overflow at 200% text, full-hash wrapping, and 44 px interactive targets. The cold live page has the same candidate assets.
- The PWA manifest is valid for standalone use with versioned start URL and matching icons/colors. The live service worker activated, was explicitly updated through `registration.update()`, then controlled `/demo`; that route reloaded while offline with its expected title and heading.

## Applicability

This is a free accountless PWA: sign-in/Entra, payments, AI, and library/CLI consumer-install checks do not apply. API health identity, durable boundaries, relay behavior, and the live request allowance were tested.

No known gap remains within this acceptance contract.
