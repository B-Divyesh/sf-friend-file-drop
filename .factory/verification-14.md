# Verification 14 — independent product QA

## Verdict: **PASS**

- Candidate: `c594cf8ad79ca24ffb2650583d067f551c7a5f0d`
- Live URL: <https://friend-file-drop.sociobot.in>
- Verified: 2026-08-29 UTC from a clean detached checkout
- Product code changed by verifier: no
- Defects: none found (critical: 0, high: 0, medium: 0, low: 0)

The live PWA and managed API match the candidate. The previous deployment-only concern is resolved by fresh evidence: live health reports this exact full source revision and a nonempty deployment identity.

## Required claims gate

`.factory/claims.json` exists and declares 23 claims. After `npm ci`, I executed every command listed there separately, using the configured preview/demo entry point for every Playwright claim. All passed, including the Node-isolated `room-expiry`, `relay-cap`, and `api-health` checks.

The claims cover one-click demo readiness/isolation, demo receipt, pre-transfer file manifest/hash, account-free/free use, offline reload, six-word rooms, expiry, direct transfer privacy/receipt, resumability, local receipts, opt-in relay and 25 MiB cap, privacy boundaries, separate receipts for identical bytes, source-file preservation, receipt export/import, local room-code storage, and API build identity. `npm test` then independently passed the whole configured local suite.

## Cold first read — PASS

In a fresh live 1440 × 900 Chromium context, the first screen says:

> **Send files straight to someone you trust**
>
> For friends on different devices who need the files and proof that they arrived.

It answers what it does, who it is for, and what to do first in plain words. The first action is **Try it with sample data**; one click opens `/?demo=1` with three realistic sample files, full SHA-256 fingerprints, a persistent **Demo — sample data, nothing is saved** banner, Reset demo, and Start a real transfer. The demo has no file input and makes no API request.

## Local quality gates

- `npm ci`: PASS; root and API production installs completed with zero reported vulnerabilities.
- Every one of the 23 declared claim commands: PASS.
- `npm test`: PASS (19 Node checks plus the complete configured Chromium suite; deployment-only checks correctly skip when `LIVE_URL` is unset).
- `npm run lint`, `npm run typecheck`, `npm run build`: PASS. `dist/` was produced.
- `npm audit --omit=dev` and `npm audit --prefix api --omit=dev`: PASS, zero vulnerabilities.
- Production output: JS 41.31 kB / 13.09 kB gzip; CSS 17.80 kB / 4.96 kB gzip. Both are within the static-PWA budget.

## Live deployment and real-job evidence

Fresh `GET /api/health` returned HTTP 200, `Cache-Control: no-store`, and:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.5",
  "sourceRevision": "c594cf8ad79ca24ffb2650583d067f551c7a5f0d",
  "deploymentId": "1ad3b3f4-7002-4693-a599-c588ea01eb9e",
  "status": "ready"
}
```

The local built JS and CSS are byte-identical to their live hashed assets (SHA-256 `62b27f…829f91` and `8a1f5a…78cfa`, respectively). `LIVE_URL=https://friend-file-drop.sociobot.in EXPECTED_SOURCE_REVISION=c594cf8ad79ca24ffb2650583d067f551c7a5f0d npx playwright test tests/live.spec.ts --workers=1 --reporter=line` passed 10/10. It exercised build identity, landing/demo/legal/404 routes and Axe, demo isolation/exit, service-worker offline reload, corrupt-byte recovery before receipt issuance, real direct transfer, and real durable two-party relay transfer.

The full local suite additionally exercised file selection and manifest/hash before room creation, empty/invalid recovery, two files with identical bytes, receipt export/import, rejoin/resume from saved chunks, and relay dual-consent and byte removal after receipt.

## Privacy, accessibility, HTTP, mobile, and PWA

- Cold live request logging recorded only same-origin HTML, JS, CSS, and original product image requests. The live demo request log asserted no third-party or `/api` request, no visitor file, and cleared its `demo:` session state when leaving. No console or page error was observed.
- `/opt/fleet/lib/verify-url.sh` passed: 611 ms load, correct title and `lang`, one `h1`, main landmark, zero missing image alts/unlabelled buttons, and no console errors. The repository's Playwright Axe integration passed with zero serious/critical violations on live `/`, `/demo`, `/privacy`, `/terms`, and the HTTP-404 page.
- The local suite passed keyboard skip-link/arrow-tab operation, designed visible focus, route focus restoration, 390 px first-screen action visibility, 200% text reflow without horizontal overflow, hash wrapping, and 44 px target checks.
- Response headers are appropriate: self-only CSP including response-header `frame-ancestors 'none'`, HSTS, `nosniff`, `no-referrer`, and restrictive Permissions-Policy. Hashed assets are `public, max-age=31536000, immutable`; the service worker and manifest are `no-cache`; unknown routes return the styled HTTP 404.
- PWA manifest/icons/start URL are present. The live worker activated, `registration.update()` completed, and `/demo` reloaded successfully while the browser context was offline.
- Live allowance observed: 90 valid room GETs from one client/room scope returned 404; requests 91 and 92 returned HTTP 429 with `Retry-After: 60`. This confirms the documented 90 requests per client/room scope per minute boundary.

## Applicability

This free, accountless PWA has no sign-in, payment, AI, library, or CLI surface. Entra and consumer-install checks do not apply. No known gap remains within the supplied acceptance contract.
