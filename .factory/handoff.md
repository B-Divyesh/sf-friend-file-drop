# Friend File Drop repair 12 handoff

## Outcome: PASS

- Repair candidate: `dec081988bd5618f24e555fe9174aa63c8e59fce`
- Report base: `6aead6c7bdbcfe8eb0be6a3c64b18ae95e7162b4`
- Original candidate: `d0d11d72890ab4e909b1ec933180a392242990b2`
- Live URL: <https://friend-file-drop.sociobot.in>
- Verified: 2026-08-29 UTC

Both release blockers from `.factory/verification-10.md` are repaired. The deployed static app and managed API are the original `pwa-offline` artifact and static deployment class.

## Repairs

### Reliable established-transfer resume coverage

The failing regression moved an 8 MiB fixture solely to create a partial transfer. Its runtime depended on host load and sometimes exhausted the suite's 30-second timeout during transfer or sequential context shutdown.

The regression now creates a deterministic interruption after four real 32 KiB WebRTC chunks. It still proves that the receiver saves actual chunks in IndexedDB, reloads and rejoins, that the sender reloads and reopens the established room with the same transfer ID, and that the resumed transfer uses the saved offset. The remaining 512 KiB fixture finishes quickly, and both browser contexts close in parallel.

Pre-fix reproduction used the repository's exact two-worker `npm test` gate on one constrained CPU with two competing processes. Only `@regression:established-direct-interruption` failed at 30.9 seconds with `Test timeout of 30000ms exceeded`, matching the independent report. After repair, the same stressed full gate passed; the resume case completed in 12.3 seconds. Ten concurrent two-worker repetitions also passed in 8.2–10.2 seconds each.

### Truthful deployed build identity

`GET /api/health` now prefers the explicit `FRIEND_FILE_DROP_SOURCE_REVISION`, requires a full 40-character revision and a deployment identity, and returns 503 with `build-identity-missing` instead of reporting ready with incomplete metadata.

The API claim injects distinct preferred, GitHub, and build revisions and asserts the exact returned value. A second regression asserts the 503 response when identity is absent. The deployed-browser suite derives the expected Git revision, or accepts `EXPECTED_SOURCE_REVISION` for a later report commit, and requires exact live equality.

The deployment set both source-revision settings to the repair candidate. Live health returned:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.3",
  "sourceRevision": "dec081988bd5618f24e555fe9174aa63c8e59fce",
  "deploymentId": "6603c09e-a810-4a60-aa0e-f2342ff813a1",
  "status": "ready"
}
```

The response included `Cache-Control: no-store`.

## Verification evidence

All checks ran after a fresh `npm ci` with Playwright 1.58.2.

- All 21 commands in `.factory/claims.json`: PASS individually, 21/21.
- `npm test`: PASS, 14 Node tests and 29 local Playwright tests; 10 live-only tests skipped as designed. The resume regression completed in 8.0 seconds in the ordinary full suite.
- Stressed two-worker `npm test`: PASS; resume completed in 12.3 seconds under the condition that reproduced the old timeout.
- `npx playwright test --grep '@regression:established-direct-interruption' --repeat-each=10 --workers=2`: PASS, 10/10.
- `npm run lint` and `npm run build`: PASS. `dist/index.html` exists.
- Production assets: JS 41.19 kB / 13.11 kB gzip; CSS 17.31 kB / 4.87 kB gzip; hero WebP 59.20 kB.
- Root and API production audits: PASS, zero vulnerabilities.
- Local verifier helper: PASS in 542 ms; no console errors; title, `lang=en`, one `h1`, `main`, image alt text, and named buttons passed.
- Local Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.5 s, TBT 20 ms, CLS 0.
- Desktop and 390 × 844 visual inspection: PASS. The first action stays above the fold and the page has no horizontal overflow.
- Keyboard, focus, tab arrows, 200% text, 44 px targets, reduced motion, route focus, and serious/critical Axe checks: PASS in the full suite.
- Demo isolation, same-origin request privacy, no real-file access, receipt storage separation, and offline reload after service-worker control: PASS.
- Response policy: document CSP, HSTS, no-sniff, no-referrer, permissions policy, no-cache HTML, immutable hashed assets, API no-store, and real HTTP 404: PASS.
- Static deployment hashes for `index.html`, JS, CSS, `sw.js`, and `manifest.webmanifest`: exact local/live matches.
- Live verifier helper: PASS in 571 ms with no console errors at desktop or 390 px.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.3 s, TBT 20 ms, CLS 0.
- Live suite: PASS, 10/10. It covered exact candidate identity, all public routes plus the real 404, Axe, demo privacy and reset, offline reload, corrupt direct-transfer recovery, and durable opt-in relay delivery.

Exact deployed suite command:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in \
EXPECTED_SOURCE_REVISION=dec081988bd5618f24e555fe9174aa63c8e59fce \
npx playwright test tests/live.spec.ts --reporter=list
```

## Deployment

Repair candidate `dec081988bd5618f24e555fe9174aa63c8e59fce` was pushed to `origin/main`. Its existing `dist/` and `api/` were deployed to the production Azure Static Web App using the work order's static configuration. Only application build-identity settings were changed; DNS, billing, and infrastructure were not changed.

## Known gaps and next steps

No release-blocking gaps remain. Sign-in/Entra, package-consumer checks, and payment checks do not apply to this account-free static PWA. Future deployments must set `FRIEND_FILE_DROP_SOURCE_REVISION` to the exact deployed commit; the live regression will fail if it is stale.
