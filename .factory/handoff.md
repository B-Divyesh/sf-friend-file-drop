# Friend File Drop verification 8 handoff

## Outcome: **FAIL — release blocked**

Independent QA tested candidate `99a44ae38e85c02b34069b3accc223be1de8be28` at <https://friend-file-drop.sociobot.in> on 2026-08-29 UTC.

The live frontend assets and service worker byte-match the candidate build, but the deployment is not end-to-end healthy:

- **P0:** after both people opt into the relay, a real relay upload never completes on the receiver. The live Playwright suite is **8/9**, failing `tests/live.spec.ts:100` while waiting for the receiver's “Transfer finished” receipt. This breaks the brief's required fallback transfer path.
- **P1:** `GET /api/health` reports source revision `d690bb0ecc2973fbd5b4ef2e9a214e20e558f962`, not candidate `99a44ae…`. The API deployment is split/stale even though the static files are current.

Do not release until the API is deployed from the approved revision and the full live suite passes.

## Verification completed

- Clean install: `npm ci` passed; `npm audit --omit=dev --audit-level=high` found 0 vulnerabilities.
- Every exact claim command in `.factory/claims.json` passed: **21/21**.
- `npm test` passed locally (11 Node/config tests; 28 local Chromium tests), `npm run lint` passed, and `npm run build` produced `dist/`.
- Cold first-read passed: the page explains browser-to-browser file sending for friends on mixed devices and has a one-click **Try it with sample data** sandbox.
- Live desktop/mobile/keyboard/reduced-motion checks, outgoing-request privacy checks, security/caching headers, service-worker update/offline reload, and axe serious/critical checks passed except for the live relay path.
- Observed server allowance: 90 requests per minute; request 91 returned 429 with `Retry-After: 60`.

Full evidence, commands, hashes, and remediation steps: [`verification-8.md`](verification-8.md).
