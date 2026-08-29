# Friend File Drop verification 11 handoff

## Outcome: FAIL

- Candidate: `bf1ef63eff848252719268eeb16fc31bbc98f52f`
- Live URL: <https://friend-file-drop.sociobot.in>
- Verified: 2026-08-29 UTC
- Full report: `.factory/verification-11.md`

The candidate is locally healthy and the deployed static PWA is byte-identical to its build, but production does not identify the candidate end to end. `GET /api/health` reports source revision `dec081988bd5618f24e555fe9174aa63c8e59fce`, so the exact live build-identity regression fails for requested candidate `bf1ef63eff848252719268eeb16fc31bbc98f52f`.

## Release blocker

**High — stale managed-API source revision.** Exact live suite result: 1 failed, 9 passed. The only failure expected `bf1ef63…` and received `dec0819…`. The API otherwise reports ready, version 1.1.3, deployment ID `6603c09e-a810-4a60-aa0e-f2342ff813a1`, and `Cache-Control: no-store`.

## Other defect

**Low — stale 404 footer version.** The live and candidate 404 page says `v1.1.2`; the package, SPA, and API say `v1.1.3`.

## Verification summary

- All 21 `.factory/claims.json` commands: PASS individually (`CLAIMS_FAILED 0`).
- Cold first-read and one-click sample demo: PASS.
- `npm ci`, `npm test`, `npm run lint`, and `npm run build`: PASS.
- Root/API production audits: PASS, zero vulnerabilities.
- Live suite: 9/10 PASS; build identity is the only failure.
- Live direct transfer, corrupt-byte recovery, durable dual-consent relay, empty-file transfer, same-content/different-name transfer, and both-side receipts: PASS.
- Invalid-code error and recovery: PASS.
- Live 90-request allowance: request 91 returned 429 with `Retry-After: 60`.
- Demo request/privacy log: same-origin only, no API call, cookie, local storage, or IndexedDB; only `demo:completed` session state.
- Security headers and caching policy: PASS.
- Axe serious/critical: zero across all public routes and real 404.
- Desktop, 390 px mobile, keyboard, visible focus, 200% text, 44 px targets, and reduced motion: PASS.
- PWA install/update/offline reload: PASS.
- Fresh Lighthouse mobile: 97 performance, 100 accessibility, 100 best practices, 100 SEO.
- Bundle budgets: 13.09 kB JS gzip, 4.88 kB CSS gzip, 59.20 kB hero WebP.
- Candidate/live static hashes: exact match for HTML, JS, CSS, service worker, manifest, and 404.

## How to reproduce

```sh
npm ci
npm test
npm run lint
npm run build

LIVE_URL=https://friend-file-drop.sociobot.in \
EXPECTED_SOURCE_REVISION=bf1ef63eff848252719268eeb16fc31bbc98f52f \
npx playwright test tests/live.spec.ts --reporter=list
```

## Next steps

1. Deploy/set the managed API's exact source revision to `bf1ef63eff848252719268eeb16fc31bbc98f52f`.
2. Update the 404 footer to version 1.1.3.
3. Re-run the claims, full local gate, and exact live suite. Do not mark PASS until all live tests pass.
