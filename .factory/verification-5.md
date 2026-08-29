# Independent verification 5 — FAIL

**Candidate:** 5a761321f56d8e69df6f2ea3f6b5a1f3c4c5a285 (main)  
**Live URL:** <https://friend-file-drop.sociobot.in>  
**Verified:** 2026-08-29 from a clean checkout. Product source was not modified.

## Verdict

**FAIL — do not release.** The live deployment passes real WebRTC direct and dual-consent relay checks, all 20 declared claim commands pass when run exactly as declared, and the static deployment is byte-identical to this candidate. However, the required normal quality-gate command npm test fails from this clean checkout. The failed test is itself the declared @claim:opt-in-relay test, so the product test suite is nondeterministic under its standard two-worker configuration.

The factory definition of done requires npm test to pass locally; a green single-claim rerun does not satisfy that gate.

## Release blocker

### High — npm test fails in the ordinary parallel test run

Command: npm test

Result: **exit 1; 21 passed, 1 failed, 9 intentionally live-only tests skipped**.

The failure was:

    tests/product.spec.ts:217
    relay needs both choices and removes bytes after receipt @claim:opt-in-relay
    Expected: "Waiting for the other person" visible
    Actual: element not found after 8 seconds

This occurred after the sender selected **Use the private relay**, before the receiver consented. The exact claim command specified in .factory/claims.json passed in a fresh single-claim run. That discrepancy makes the normal suite flaky/racy; it is not an accepted release state.

Required repair: make relay-consent coordination deterministic under the configured two Playwright workers, then prove it with repeated ordinary npm test runs. Do not paper over this by only running claims serially.

## Required claims — PASS individually

.factory/claims.json exists and contains 20 claims. After npm ci, I ran every listed command exactly through the product demo/test entry point. Each returned exit 0:

- Browser: demo-receipt, no-account, free-use, demo-isolation, offline-reload, six-word-room, direct-transfer, resumable-transfer, local-receipts, opt-in-relay, privacy-boundaries, individual-file-receipts, own-files-untouched, receipt-export, receipt-import, demo-no-real-files, and room-code-storage.
- Node: room-expiry, relay-cap, and api-health.

The first aggregate attempt left a local Vite process after its tool timeout and caused a port collision; I terminated only that identified local process and reran all affected claims cleanly. The final clean claim log ended exit 0.

## First-read and demo gate — PASS

A cold live desktop page says:

- **What:** “Send files straight to someone you trust.”
- **For whom:** “For friends on different devices who need the files and proof that they arrived.”
- **First action:** “Try it with sample data,” followed by “The demo opens a ready transfer. Your own files stay untouched.”

The one-click action opens the sample transfer. The demo has the persistent “Demo — sample data, nothing is saved” banner with **Reset demo** and **Start for real**. At 390 px the heading and sample action remain visible.

## Local build, security, and budget evidence

- Clean candidate identity before verification: 5a761321f56d8e69df6f2ea3f6b5a1f3c4c5a285.
- npm ci passed; root and API production installs reported zero vulnerabilities.
- npm run lint / TypeScript passed.
- npm run build passed and produced dist/index.html.
- Both production dependency audits reported zero vulnerabilities.
- Build output: JS **36.67 kB / 11.94 kB gzip** and CSS **17.17 kB / 4.84 kB gzip**, under the static/PWA budgets.

## Live behavior, accessibility, privacy, PWA, and deployment — PASS

LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --workers=1 passed **9/9**. It exercises live /, /demo, /privacy, /terms, and the HTTP 404 route; runs axe with zero serious/critical findings on each; proves demo exit clears sample state; confirms offline /demo reload after service-worker control and update; runs a corrupt-then-retry direct transfer; and runs the deployed durable relay transfer after both people opt in.

Additional fresh evidence:

- Cold live page: status 200, no console/page errors, title Friend File Drop — send files browser to browser, lang=en, one h1, one main landmark, and only same-origin initial requests.
- In a fresh live /demo run, sending all samples made **no API request**, no third-party request, no IndexedDB database, no page/console error, and wrote only sessionStorage["demo:completed"].
- Root has HSTS, nosniff, Referrer-Policy: no-referrer, restrictive Permissions-Policy, and a self-only CSP including frame-ancestors 'none'. HTML and sw.js are no-cache; fingerprinted JS is public, max-age=31536000, immutable; API health is no-store.
- The deployed JS SHA-256 is 750cc3fbe60e7b58d1ef5cd3e94d3401d7a59126db5713f5c6a55352352ad025, exactly matching dist/assets/index-CnVH3YIj.js. The live service worker SHA-256 is 822ea0680d0c7ba83bb57de7aecec9fa4c99da98a6ce6f1930d11372265f17ac, exactly matching public/sw.js.
- GET /api/health returned service friend-file-drop-api, version 1.1.1, deployment ID 2e38d8bb-57e2-4590-9332-2f3b60f9dd95, and no-store. sourceRevision is null, so the exact managed API source SHA cannot be independently proven; static candidate identity is exact and real API behavior was exercised.
- After allowing the 60-second window to reset, requests 1–90 from this single client to one valid room URL returned 404; request **91** returned **429** with Retry-After: 60. Observed allowance: **90 requests per minute**.
- The manifest has standalone display, expected colors, 192/512/maskable icons, and an installed start URL. Offline reload and service-worker registration.update() are covered by the passing live test.
- Local tests cover skip navigation, arrow-key tabs, a visible 3px coral focus state, 390px layout, 200% reflow, 44px targets, and reduced motion.

## Reproduce

    npm ci
    npm test
    npm run lint
    npm run build
    LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --workers=1

