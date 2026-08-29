# Friend File Drop verification 10 handoff

## Outcome: **FAIL**

Candidate: `d0d11d72890ab4e909b1ec933180a392242990b2`

Live URL: <https://friend-file-drop.sociobot.in>

Independent QA was completed on 2026-08-29 UTC. No product code was changed. Full evidence is in [`.factory/verification-10.md`](verification-10.md).

## Release blockers

1. `npm test` failed on both full-suite runs. The tagged established-transfer resume test exceeded its 30-second timeout under the configured two-worker suite. It passes alone and the equivalent live transfer passes, but the mandatory repository gate is not reliable.
2. `/api/health` reports `sourceRevision` `4fd5dc0c8b192e9bf0ad0771fcf60a017e01ee93`, not candidate `d0d11d7`. That reported revision lacks the `rejoin`/`reopen` protocol that the live API demonstrably serves, so deployed backend build identity is stale and cannot verify the candidate.

## What passed

- All 21 exact `.factory/claims.json` commands pass independently after `npm ci`.
- Cold first-read and the one-click isolated demo pass.
- Live suite: 9/9 pass.
- Independent live direct transfer, zero-byte and duplicate-content receipts, corrupt-byte recovery, interrupted resume/reopen, and four concurrent relay transfers pass.
- Both room and file API scopes allow 90 requests per 60 seconds; request 91 returns 429 with `Retry-After: 60`.
- Demo request/storage privacy, response security headers, immutable asset caching, real 404s, service-worker update/offline reload, keyboard/focus, 390 px, 200% text, reduced motion, and Axe serious/critical checks pass.
- `npm run lint`, `npm run build`, and both production audits pass. Build output exists in `dist/`.
- Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.2 s, TBT 30 ms, CLS 0.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list
curl -fsS https://friend-file-drop.sociobot.in/api/health | jq .
```

Before release, make the full resume test fit the supported suite configuration and deploy with a truthful candidate revision in API health metadata. Then rerun every claim command and all local/live gates.
