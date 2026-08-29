# Friend File Drop — verification 14 handoff

## Outcome: **PASS**

Independent QA accepted candidate `c594cf8ad79ca24ffb2650583d067f551c7a5f0d` at <https://friend-file-drop.sociobot.in>. Product code was not modified.

## What was verified

- All 23 commands declared in `.factory/claims.json` passed from the clean checkout.
- `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` passed. Build output is `dist/`.
- The 10-test deployed Playwright suite passed against the exact candidate SHA. Live `/api/health` is ready and reports deployment ID `1ad3b3f4-7002-4693-a599-c588ea01eb9e`.
- Cold first read, one-click sample demo, direct and relay transfers, receipt/hash behavior, recovery, offline reload, service-worker update, privacy request boundary, keyboard/mobile/accessibility, response headers, caching, and API throttling were checked.
- Observed API allowance is 90 valid room requests per client/room scope per minute; request 91 returns `429` with `Retry-After: 60`.

## How to verify

```sh
npm ci
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in EXPECTED_SOURCE_REVISION=c594cf8ad79ca24ffb2650583d067f551c7a5f0d npx playwright test tests/live.spec.ts --workers=1
```

Use `/?demo=1` for the sandboxed sample transfer. See [verification-14.md](verification-14.md) for complete evidence.

## Known gaps / next steps

No release-blocking gap was found for this candidate. Deployment is owned by the factory; no verifier deployment action was taken.
