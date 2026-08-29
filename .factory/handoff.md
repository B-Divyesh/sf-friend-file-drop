# Friend File Drop polish 1 handoff

## Outcome

**PASS — every finding in adversarial review 1 is resolved and the repair is live.**

- Live product: <https://friend-file-drop.sociobot.in>
- One-click isolated demo: <https://friend-file-drop.sociobot.in/?demo=1>
- Product repair commit: `703430b44f429bd8f34f9a47212cbb6979589783`
- Azure Static Web Apps deployment: `fb3fbe63-ddc9-4182-917c-ba2128c55330`
- Live API version: `1.1.2`; deployment ID: `62d04671-7360-4f7d-9a51-765eff1fd398`

## What changed

- Replaced the undefined exactly-once wording with the tested receipt wording.
- Added the `manifest-before-transfer` claim and a real browser test. Selected files now show name, formatted size, and full SHA-256 hash before any room request.
- Made the first-screen action open `/?demo=1`. The direct URL creates only `demo:` session state, makes no API or third-party request, and never opens the production receipt database.
- Kept the persistent demo banner, Reset demo action, and explicit Start a real transfer exit. Reset and exit clear demo state.
- Rewrote the reviewed landing and README jargon. The updated copy audit has no banned terms or sentence over 22 words.
- Added route-aware canonical, Open Graph, and Twitter metadata updates. History navigation restores the route title and focuses its `h1`.
- Brought the real HTTP 404 page to metadata, header, footer, generated-art disclosure, and legal-link parity.
- Preserved the warm ruled-notebook design, responsive hierarchy, focus treatment, reduced-motion behavior, and PWA deployment class.
- Updated the catalog description to a 60-character verb-first sentence.

## Exact verification

All commands below passed against commit `703430b` unless marked live.

- Fresh clone: `npm ci` passed with zero reported vulnerabilities.
- Fresh clone: every command in `.factory/claims.json` passed, **21/21**. Full output: `.factory/evidence/polish-1/clean-claims.txt`.
- Fresh clone: `npm test` passed **11/11 Node/config tests** and **28/28 local Chromium tests**; 9 live-only tests skipped as intended.
- Fresh clone: `npm run lint`, `npm run build`, both production dependency audits passed. Full output: `.factory/evidence/polish-1/clean-full-suite.txt`.
- Build output exists at `dist/index.html`: JavaScript 37.99 kB / 12.24 kB gzip; CSS 17.31 kB / 4.87 kB gzip.
- Local URL verifier: 560 ms load, no console errors, `lang=en`, one `h1`, one `main`, no missing image alt text, and no unlabelled buttons.
- Live URL verifier: 802 ms load with the same clean structure and console result.
- Axe through Playwright: zero serious or critical violations on `/`, `/demo`, `/privacy`, `/terms`, and the HTTP 404.
- Live Playwright suite: **9/9 passed**, including direct transfer corruption retry, durable dual-consent relay, query-demo isolation/exit, offline reload, metadata, legal links, and 404 status.
- Live Lighthouse mobile: performance **100**, accessibility **100**, best practices **100**, SEO **100**; FCP 1.0 s, LCP 1.3 s, TBT 30 ms, CLS 0.
- Live route crawl: `/`, `/?demo=1`, `/demo`, `/privacy`, and `/terms` returned 200; `/missing-page` returned 404.
- Live immutable asset policy: hashed assets return `Cache-Control: public, max-age=31536000, immutable` with CSP, `nosniff`, and `Referrer-Policy: no-referrer`.
- Live/local SHA-256 matches: JS `fc410ae86c0d83545c94bb9a407643d3246cea4e65dc2f5572f5765d5308c283`; CSS `2f9f5776d8cf14a9ca14ef374e75bf7c99cdb7273499ad460776eb862364c944`; service worker `abcf05068faf8aa1de28bd7a88c9f9e2b2c8c5065ff3bfe28aa7bba28407c770`.

## Evidence index

- Finding-by-finding mapping: `.factory/polish-1.md`
- Clean claims: `.factory/evidence/polish-1/clean-claims.txt`
- Clean full suite: `.factory/evidence/polish-1/clean-full-suite.txt`
- Live suite: `.factory/evidence/polish-1/live-suite.txt`
- Live finding assertions: `.factory/evidence/polish-1/live-findings.txt`
- Live cold screenshots: `.factory/evidence/polish-1/live-home-cold.png`, `live-demo-cold.png`, `live-manifest-mobile.png`, and `live-404.png`
- Local and live verifier reports: `.factory/evidence/polish-1/verify-local/verify.json` and `.factory/evidence/polish-1/verify-live/verify.json`
- Local and live Lighthouse reports: `.factory/evidence/polish-1/lighthouse-local.json` and `.factory/evidence/polish-1/lighthouse-live.json`

## Known gaps and next steps

No product, claim, accessibility, privacy, offline, mobile, routing, metadata, or deployment gap remains from this review round. No follow-up work is required.
