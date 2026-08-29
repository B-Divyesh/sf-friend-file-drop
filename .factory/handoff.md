# Friend File Drop — polish round 3 handoff

## Outcome: PASS

Friend File Drop is deployed at <https://friend-file-drop.sociobot.in>. The deployed source revision is `c594cf8ad79ca24ffb2650583d067f551c7a5f0d`; `/api/health` reports version `1.1.5`, status `ready`, and deployment identity `1ad3b3f4-7002-4693-a599-c588ea01eb9e`.

## What changed

- Closed every `F-1-*`, `F-2-*`, and `F-3-*` finding. The full ID-by-ID mapping is in [`.factory/polish-3.md`](polish-3.md).
- Made the one-click `?demo=1` path compact on a 390 × 844 phone: it immediately shows a real sample row and sample-transfer action. The demo banner remains sticky while scrolling, uses only `demo:` session data, and can reset or leave without touching real data.
- Added the `connection-metadata-boundary` claim and a request-body test. The public privacy copy now states exactly what the direct room service gets and does not get. The sample status makes only the tested no-API/no-device-file statement. Relay wording no longer makes an untested transport assertion.
- Put all three product facts inside the desktop first viewport; standardized on demo, file list, and digital fingerprint; defined SHA-256 at first use; removed decorative notebook copy; and made both 404 headings plain.
- Advanced the PWA cache to `friend-file-drop-v6` and installed-app start URL to `v=3`, so existing installations receive the repaired shell.
- Updated the claims registry, copy audit, demo documentation, catalog sentence, tests, and version to 1.1.5.

## Verification

- Fresh clone of `170ee28d204beca0757caf0457f22233004fdc89`: `npm ci`, then every one of the 23 declared claim commands in `.factory/claims.json`, passed independently.
- Final local: `npm test` passed 19 Node tests and 30 local Chromium tests; 10 live-only tests were skipped without `LIVE_URL`. `npm run lint` passed. The production bundle is `dist/`, with 13.09 kB gzip initial JavaScript and 4.96 kB gzip CSS.
- Final live: `LIVE_URL=https://friend-file-drop.sociobot.in EXPECTED_SOURCE_REVISION=c594cf8ad79ca24ffb2650583d067f551c7a5f0d npx playwright test tests/live.spec.ts --workers=1 --reporter=line` passed 10/10.
- Accessibility: local and live Playwright Axe checks found no serious or critical violations. `verify-url.sh` found `lang=en`, one `h1`, a main landmark, complete alt text, labelled buttons, and zero console errors; see [live verification](evidence/polish-3/verify-live/verify.json).
- Cold live re-check: `?demo=1` had a visible sample row, action, and sticky banner; no foreign or API request; desktop facts were visible; privacy wording matched claims; and `/missing-page` returned 404 with `Page not found`. Evidence: [demo](evidence/polish-3/live-demo-mobile.png), [home](evidence/polish-3/live-home-desktop.png), [404](evidence/polish-3/live-404-desktop.png), and [finding data](evidence/polish-3/live-findings.json).
- Live Lighthouse: 100 performance, 100 accessibility, 100 best practices, and 100 SEO; LCP 1.249 s, CLS 0, TBT 47 ms. See [report](evidence/polish-3/lighthouse-live.json).

## Run and deploy

```sh
npm ci
npm test
npm run lint
npm run build
scripts/deploy-static.sh
```

`scripts/deploy-static.sh` refuses dirty or unpushed source, deploys `dist/` plus the managed API, sets the exact source revision, and verifies live health.

## Known gaps

None. The brief’s browser-to-browser transfer, six-word pairing, receipts, resume behavior, opt-in relay, isolated demo, offline shell, privacy boundaries, and product-specific notebook identity are verified.
