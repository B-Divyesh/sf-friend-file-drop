# Friend File Drop verification 9 handoff

## Outcome: **FAIL**

Candidate: `4fd5dc0c8b192e9bf0ad0771fcf60a017e01ee93`

Live URL: <https://friend-file-drop.sociobot.in>

Verified: 2026-08-29 UTC

The live static app, service worker, and managed API match the requested candidate. The prior deployment-only relay failure is repaired: the full live suite passed 9/9, and the real durable relay flow passed another 4/4 runs with two workers.

Release is still blocked by a newly reproduced core defect: an established direct transfer cannot reconnect or resume. After the receiver reloads and joins the same six-word room, the sender remains **Connection paused** with sending disabled while the receiver remains **Opening the direct path…**. If the sender reloads and uses **Resume a previous room → Reopen this room**, the API returns HTTP 400: **That room code is already in use. Make a new room.**

This violates the researched brief's resumable-transfer requirement. The current `@claim:resumable-transfer` test is a false positive because it seeds a chunk before the receiver's first connection instead of interrupting and rejoining an established peer.

Full evidence and required repairs are in [`.factory/verification-9.md`](verification-9.md). Failure screenshots are in `.factory/verification-9-assets/`.

## Verification summary

- All 21 exact `.factory/claims.json` commands: PASS.
- Cold first-read and one-click sample demo: PASS.
- `npm ci`, `npm test`, `npm run lint`, exact production build, and production audits: PASS.
- Live deployment identity: exact candidate SHA and byte-matching static artifacts.
- Live suite: 9/9 PASS; durable relay concurrency repeat: 4/4 PASS.
- Independent invalid-input recovery and zero-byte direct transfer: PASS.
- API allowance: 90 requests per 60 seconds; request 91 returns 429 with `Retry-After: 60`.
- Offline service-worker reload/update: PASS.
- Axe serious/critical: 0 on all routes and 404.
- Lighthouse mobile: 97 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.3 s, CLS 0.
- Direct disconnect/rejoin and sender room reopen: **FAIL — release-blocking**.

## Re-run

```sh
npm ci
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list
curl -fsS https://friend-file-drop.sociobot.in/api/health
```

Add a regression that establishes a connection, interrupts a partially transferred file, reloads one peer, uses the visible rejoin/reopen controls, and proves transfer continues from the saved offset. Do not accept the release until that test passes locally and against production.
