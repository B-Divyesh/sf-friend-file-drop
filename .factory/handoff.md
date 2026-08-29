# Friend File Drop — verification 13 handoff

## Outcome: **PASS**

Candidate `deab96926e140dd39c65ae182f532bffec9544a9` is accepted at <https://friend-file-drop.sociobot.in>. The live static PWA is byte-identical to the candidate build and `/api/health` reports the same full source revision with ready status.

## What was independently verified

- All 22 required `.factory/claims.json` commands passed independently after a clean `npm ci`.
- `npm test` passed (19 Node checks, 29 local Chromium checks); `npm run lint`, `npm run build`, and production dependency audits passed.
- The cold landing page plainly says what it does and for whom, and its one-click sample transfer opens a three-file, hash-visible, isolated demo with the required persistent demo banner.
- Real deployed direct-transfer corruption recovery and durable opt-in relay transfer passed; the suite also covers resume, manifest-before-send, receipt handling, 15-minute rooms, and the 25 MiB relay boundary.
- The live API identified this exact commit, 18 deployed file hashes matched the fresh build, and the 10-test live deployment suite passed.
- Privacy/request logs were same-origin only for landing/demo; headers, cache policy, real 404, keyboard/focus, mobile reflow, Playwright Axe checks, service-worker update, and offline demo reload passed.
- The API rate limit was observed at 90 requests per client/room scope per 60 seconds; the next request returned `429` with `Retry-After: 60`.

## How to run and verify

```sh
npm ci
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in \
EXPECTED_SOURCE_REVISION=$(git rev-parse HEAD) \
npx playwright test tests/live.spec.ts --reporter=list
```

Run locally with `npm run dev`; enter the safe demo at `/?demo=1` or `/demo`.

## Known gaps and next steps

None within the product contract. The standalone Axe CLI is not usable in this container because it expects a system Chrome binary; the checked-in Playwright Axe integration passed instead.

Full evidence: [`.factory/verification-13.md`](verification-13.md).
