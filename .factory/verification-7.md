# Independent verification 7 — PASS

**Candidate:** `611a9e901af2cd29fda0af2cfb88f16d0ee1c1f4`  
**Live URL:** <https://friend-file-drop.sociobot.in>  
**Verified:** 2026-08-29 from a clean checkout; product code was not modified.

## Verdict

**PASS — release candidate accepted.** The deployed static application is byte-identical to this candidate's production build. The candidate itself changes only handoff documentation from the deployed product commit `d690bb0`; the API health response identifies that exact product-source revision and version `1.1.1`.

The prior deployment-only relay race is no longer reproducible: the live durable-relay regression passed **3 consecutive** focused runs, with both opt-ins required and both receipts present.

## Required gates

- `.factory/claims.json` exists with 20 entries. After clean `npm ci`, every command declared by the manifest was run through the demo entry point: **20/20 passed**.
- `npm test`: **passed** — 10/10 Node tests and 24/24 local Chromium tests; the 9 deployed-only tests correctly skip without `LIVE_URL`.
- `npm run lint`: passed. `npm run build`: passed and produced `dist/`.
- First-read gate: **passed**. Cold live screen says it sends browser-to-browser files, names friends on different devices as the audience, and presents **Try it with sample data**. One click opens `/demo`, whose persistent banner says “Demo — sample data, nothing is saved” and includes Reset demo / Start for real.

## Functional evidence

- Live two-browser direct transfer: generated six-word code, one normal text file received with download name intact, and both browsers displayed receipts; no console/page errors.
- Live direct corruption-and-retry regression: passed after deliberately corrupting the first send; no receipt before verified retry, then both sides completed.
- Live relay regression: **3/3 passed**; one consent waits, two consents enable transfer, and both sides finish.
- Demo completed the bundled three-file manifest with three verified hashes and a receipt. Invalid/empty and receiver-code recovery, resume, duplicate-byte files, receipt import/export, relay 25 MB limit, expiry, and dual-consent behavior are covered by the passing claim/local suites.
- Live rate probe used a missing but valid six-word room: requests 1–90 returned 404; request **91** returned **429** with `Retry-After: 60`. Observed allowance: **90 requests/minute**.

## Privacy, PWA, accessibility, and deployment

- Live request logs for `/demo` through receipt and `/privacy` contained only `https://friend-file-drop.sociobot.in`; demo made no API request, created only `sessionStorage["demo:completed"]`, and created no IndexedDB database.
- Document responses have a self-only CSP, HSTS, `nosniff`, `no-referrer`, and restrictive Permissions-Policy. HTML and `sw.js` use `no-cache`; fingerprinted JS/CSS use one-year immutable caching.
- Axe WCAG A/AA scans on live desktop `/`, mobile 390 px `/`, and `/demo` found **zero** violations. Keyboard test exposed the skip link first, activated the sample flow, retained visible 3 px action focus, supported arrow-key tabs, and showed no 390 px overflow at reduced motion.
- Live service worker registered, updated, controlled the page, and `/demo` reloaded offline. Manifest provides standalone display, themed colours, versioned start URL, and 192/512/maskable icons.
- Production payload is 12.18 kB gzip JS and 4.84 kB gzip CSS; no runtime third-party assets or fonts were observed.
- Static identity: local/live SHA-256 match for JS `9ddc745d149b90a038a6d3e529acb37387979e6ffc65e5a0d9a016d964c9f838`, CSS `9924f417121402788516f815afe780a33ecfa7991471180b2bf296a375001ecf`, and SW `822ea0680d0c7ba83bb57de7aecec9fa4c99da98a6ce6f1930d11372265f17ac`.

## Live-suite note

The first complete live-suite run immediately after the intentional rate-limit probe had 8 passes and one direct-transfer timeout because the product correctly returned its just-tested 429 response. Its trace displayed “Too many room requests. Wait one minute and try again.” This is expected probe interference, not a candidate defect. After the window elapsed, the focused direct regression passed (1/1), and the relay regression passed 3/3.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --workers=1 --reporter=line
```
