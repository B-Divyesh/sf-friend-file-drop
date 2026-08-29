# Friend File Drop independent verification 4 handoff

## Status

**FAIL — do not release candidate
`e49606f060f044ebc30288a3174e81660b2c105f`.**

Verified on 2026-08-29 against
<https://friend-file-drop.sociobot.in>. Product source was not modified. Full
evidence is in [`.factory/verification-4.md`](verification-4.md).

## Release blocker

The live direct-transfer path produces a false verified receipt after a file
fails its SHA-256 check. In a fresh two-browser run, the receiver said
`integrity-check.txt did not match its hash. Rejoin to retry it.` and exposed no
download, but both browsers still displayed **VERIFIED**, **Transfer finished**,
and one receipt row for that failed file.

`src/transfer.ts` builds the final direct receipt from every incoming manifest
entry. It does not restrict the receipt to files that passed `file-end` hash
verification. Track verified IDs and refuse `transfer-end` completion while
any file is failed or missing. Add a corrupted-payload regression to the
`direct-transfer` claim.

## Additional defect

**Start for real** leaves `demo:completed` in session storage. Returning to
Demo restores the prior finished sample instead of starting clean. Clear all
`demo:` keys when leaving demo mode and test the leave-and-return path. **Reset
demo** already clears the sample correctly.

## What passed

- All 20 exact commands in `.factory/claims.json` after `npm ci`.
- `npm test`: 10 Node/API/config tests and 22 local Chromium tests passed.
- `npm run lint`, `npm run build`, and both production dependency audits.
- Live suite: 8/8, including normal direct transfer, opt-in durable relay,
  offline reload, routes, and live axe checks.
- Live zero-byte direct transfer, concurrent relay consent persistence, 25 MiB
  exact boundary/rejection, invalid room-code recovery, and invalid receipt
  import recovery.
- Cold first-read, one-click demo, 390 px layout, keyboard operation, visible
  focus, 200% text reflow, reduced motion, same-origin-only demo request log,
  security/caching headers, route/link crawl, and service-worker update check.
- Mobile Lighthouse: 96 Performance, 100 Accessibility, 100 Best Practices,
  100 SEO; LCP 1.3 s and CLS 0.
- Rate allowance: 90 room/file API requests per client per 60 seconds; request
  91 returned 429 with `Retry-After: 60`.
- Live HTML, JS, CSS, and service worker are byte-identical to `dist/`.

The API reports version 1.1.1 and deployment ID
`2e38d8bb-57e2-4590-9332-2f3b60f9dd95`, but `sourceRevision` is null, so exact
backend commit identity cannot be independently proven.

## Verify

```sh
npm ci
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
```

After repairing the receipt integrity path, add and run the corruption
regression before requesting another independent verification.
