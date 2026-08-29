# Friend File Drop repair 13 handoff

## Outcome

The release blockers from verification commit `779381d9131b47e6def56018652444dc391715fe` are repaired. Product behavior that passed verification 11 is unchanged. The repaired static PWA and managed API were deployed together to <https://friend-file-drop.sociobot.in>.

## Reproduction before repair

At 2026-08-29 10:37 UTC, live `GET /api/health` returned HTTP 200 and `Cache-Control: no-store`, but reported source revision `dec081988bd5618f24e555fe9174aa63c8e59fce`. The requested candidate was `bf1ef63eff848252719268eeb16fc31bbc98f52f`.

The verifier's exact Playwright command reproduced the blocker as 1 failed test. `@regression:live-build-identity` expected `bf1ef63...` and received `dec0819...`. The new command-line deployment gate also reproduced the pair and exited 1.

The standalone 404 footer reproduced the other finding: package and API version 1.1.3, but footer version 1.1.2.

## Root causes and repairs

- The factory upload helper deployed `dist/` and `api/`, but did not update the managed API's source-revision setting. It also returned success without comparing health to the candidate. `scripts/deploy-static.sh` now refuses dirty or unpushed source, derives the full 40-character `HEAD`, builds and deploys both artifacts, updates `FRIEND_FILE_DROP_SOURCE_REVISION`, and invokes an exact live identity gate.
- `scripts/verify-live-identity.mjs` requires HTTP 200, `Cache-Control: no-store`, the expected service, ready status, a non-empty deployment ID, and the exact full candidate SHA. It retries propagation and exits nonzero on any mismatch.
- `tests/deployment-identity.test.js` uses the verifier-observed stale and expected SHA values. It proves the stale pair fails and the exact pair passes. Release-config coverage proves the deployment wrapper wires the same SHA into the setting and health gate.
- `public/404.html` now reports v1.1.3. Its regression compares the footer directly with `package.json`, preventing another independent literal from drifting unnoticed.
- README deployment instructions and `.factory/copy-audit.md` now describe the guarded command in short, audited sentences.

## Local verification evidence

- Clean install: `npm ci` completed for root and `api/`; both reported zero audit findings.
- Claims: all 21 commands in `.factory/claims.json` ran individually; `CLAIMS_TOTAL 21 CLAIMS_FAILED 0`.
- Full suite: `npm test` passed 17 Node unit/integration/config tests and 29 local Chromium tests. Ten live-only tests skipped until deployment, as designed.
- Static checks: `npm run lint`, `npm run build`, `bash -n scripts/deploy-static.sh`, `node --check scripts/verify-live-identity.mjs`, and `git diff --check` passed.
- Production output: JS 41.19 kB / 13.11 kB gzip; CSS 17.31 kB / 4.87 kB gzip; hero WebP 59.20 kB. `dist/index.html` is present.
- Security audits: `npm audit --omit=dev` and `npm audit --prefix api --omit=dev` reported zero vulnerabilities.
- Local URL verifier: 580 ms load, zero console/page errors, title and `lang=en`, one h1, main landmark, no missing image alt, and no unnamed button.
- Local mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.003 s, LCP 1.609 s, TBT 51 ms, CLS 0.
- The aggregate Playwright suite covered desktop, 390 x 844 mobile, 200% text, 44 px targets, keyboard skip/tablist behavior, designed focus, reduced motion, Axe, privacy, same-origin demo isolation, offline reload/update, IndexedDB resume, direct transfer, relay, receipt import/export, empty states, and error recovery.
- Fresh 1366 x 900 and 390 x 844 screenshots were inspected. The notebook identity, first action, transfer sheet, footer, and mobile reflow remain intact.

## First live deployment evidence

Repair commit `4734628501e1cdcc52a38126cdf0a3ba248f24b1` was pushed to `origin/main` and deployed with `scripts/deploy-static.sh`. The guard completed only after health returned:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.3",
  "sourceRevision": "4734628501e1cdcc52a38126cdf0a3ba248f24b1",
  "deploymentId": "6603c09e-a810-4a60-aa0e-f2342ff813a1",
  "status": "ready"
}
```

The exact live suite then passed 10/10. It covered exact API identity, Axe on every public route and the real 404, one-click demo isolation, offline service-worker reload, corrupt direct-transfer recovery, and durable dual-consent relay.

Additional live evidence:

- `/opt/fleet/lib/verify-url.sh` passed in 565 ms with zero console/page errors.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.901 s, LCP 1.351 s, TBT 0 ms, CLS 0, total transfer 94,695 bytes.
- Local and live SHA-256 values matched for index HTML, service worker, manifest, 404, JS, source map, CSS, hero image, and social image.
- Home returned 200; the styled unknown route returned 404. Both carried CSP with `frame-ancestors 'none'`, HSTS, no-referrer, nosniff, restricted permissions, and `Cache-Control: no-cache`.
- A fresh room scope admitted requests 1-90 as 404. Request 91 returned 429, `Retry-After: 60`, `Cache-Control: no-store`, and the documented one-minute retry message.
- Fresh live desktop and 390 x 844 screenshots were inspected. The 404 footer reports v1.1.3.

## Final release procedure

Commit and push this handoff, then run:

```sh
scripts/deploy-static.sh
LIVE_URL=https://friend-file-drop.sociobot.in \
EXPECTED_SOURCE_REVISION="$(git rev-parse HEAD)" \
npx playwright test tests/live.spec.ts --reporter=list
```

The first command cannot succeed unless `origin/main`, the local build, the managed API setting, and live health identify the same full commit SHA.

## Applicability and known gaps

Package-consumer, sign-in, payment, and AI feature checks do not apply to this free accountless PWA. No known release-blocking gap remains. Independent verification should rerun the 21 claim commands and the final exact live command above.
