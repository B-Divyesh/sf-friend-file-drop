# Friend File Drop polish 2 handoff

## Outcome: PASS

Friend File Drop 1.1.4 closes all findings from adversarial reviews 1 and 2. The released PWA remains a static, offline-capable browser transfer tool with its original lab-notebook visual identity.

## What changed

- Registered the one-click ready-demo promise as `demo-ready-in-one-click`.
- Added an exact claim test for the query route, banner, three sample names, sizes, full hashes, and zero visitor-file/API use.
- Rewrote the remaining README and privacy storage text in plain outcome language.
- Added release gates for unique one-to-one claim tags, catalog copy, and rejected review wording.
- Updated the catalog line to: “Send files between devices and keep a matching receipt.”
- Bumped the product/API/footer/service-worker release to 1.1.4.

The full finding-to-change-to-evidence map is in [`.factory/polish-2.md`](polish-2.md).

## Verification

- Fresh clone: `npm ci` passed; all 22 `.factory/claims.json` commands passed independently.
- `npm test`: 19 Node tests and 29 local Chromium tests passed.
- `npm run lint`: passed.
- `npm run build`: passed and produced `dist/index.html`.
- Bundle: 13.09 KB JavaScript gzip and 4.87 KB CSS gzip.
- Local and live URL verifier: correct title, `lang`, one `h1`, main landmark, image alt text, labelled controls, and zero console errors.
- Axe: no serious or critical violations on all product routes and the deployed 404.
- Mobile Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.3 s; CLS 0; TBT 0 ms.
- Live suite: 10/10 passed for exact API identity, metadata/routes/404, accessibility, ready-demo isolation, offline reload, direct transfer recovery, and durable dual-consent relay.
- Cold live check: no horizontal overflow at 390 px; demo reset and exit clear the isolated namespace; no demo API or third-party requests.

Run locally with `npm ci && npm run dev`. Verify with `npm test`, `npm run lint`, and `npm run build`. Run the deployment-only suite with `LIVE_URL=https://friend-file-drop.sociobot.in EXPECTED_SOURCE_REVISION=$(git rev-parse HEAD) npx playwright test tests/live.spec.ts`.

## Deployment

- Live URL: <https://friend-file-drop.sociobot.in>
- Verified repair revision: `f722d71a152c20fd49eaf578d4fca697b40c7355`
- Static deployment: `e1409975-775c-4ab4-9e50-40596f6ee6f7`
- Managed API identity: `b0be2e90-7d4f-42f7-993b-c65e09fa07d0`
- Deployment command: `scripts/deploy-static.sh`

## Known gaps and next steps

None within the product contract or cumulative review scope. No finding of any severity remains unresolved.
