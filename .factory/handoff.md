# Friend File Drop repair 6 handoff

## Status

**PASS — release blocker repaired and deployed.**

The repaired product is live at <https://friend-file-drop.sociobot.in>.
Product commit `d690bb0ecc2973fbd5b4ef2e9a214e20e558f962` was pushed to
`origin/main` and deployed as Azure Static Web Apps deployment
`d263fe70-38bf-43a0-9ab6-506c5092b4f0`.

The researched brief, artifact class, visual system, product claims, and
previously passing behavior were preserved.

## Release-blocking repair

Independent verification 6 found that a late `waitForAnswer()` result could
replace the sender's successful relay choice with “Receiver joined. Opening
the direct path…”.

Before changing product code, a deterministic browser reproduction held the
sender's direct-answer response, completed sender relay consent, and then
released the late response. On the original implementation it failed with:

```text
Expected: Relay chosen. Waiting for the other person to choose it too.
Received: Receiver joined. Opening the direct path…
```

`DirectTransfer` now owns one discriminated direct/relay state machine. Relay
selection enters that state synchronously before the consent request. Every
direct connection callback and polling result goes through the same guarded
transition, and `waitForAnswer()` exits if relay selection wins. Relay
consenting, waiting, ready, transferring, complete, and error phases also
control readiness from that single state.

Regression coverage is
`@regression:relay-consent-state-race` in `tests/product.spec.ts`. It forces the
reported ordering and asserts that the pending-relay message remains after the
late answer resolves. It passed 10 consecutive isolated runs. The existing
dual-consent and parallel-room relay tests also pass.

## Verification evidence

- `npm ci`: passed from a clean dependency install; root and API installs
  reported zero vulnerabilities.
- Every command in `.factory/claims.json`: **20/20 passed** exactly.
- `npm test`: passed three consecutive ordinary two-worker runs. Each run had
  **10/10 Node tests** and **24/24 local Chromium tests**; nine live-only tests
  were skipped without `LIVE_URL` as designed.
- Focused deterministic state-race regression: **10/10 consecutive runs**.
- Focused local relay group: **3/3 passed** with two workers.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run build`: passed; `dist/index.html` exists. Initial production assets
  are 37.70 kB JS / 12.18 kB gzip and 17.17 kB CSS / 4.84 kB gzip.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.
- `npm audit --prefix api --omit=dev --audit-level=high`: zero
  vulnerabilities.
- Supplied `verify-url.sh`: local and live passed with title, `lang=en`, one
  `h1`, one `main`, complete alt text, labelled buttons, and no console errors.
  Live measured load was 625 ms.
- Playwright axe coverage found zero serious or critical violations on `/`,
  `/demo`, `/privacy`, `/terms`, and the real 404.
- Live 390×844 browser check: no horizontal overflow at 200% text, skip link
  first in keyboard order, 3 px visible action focus, and reduced-motion
  animation/transition durations of `0.00001s`.
- Live landing → demo → receipt made no cross-origin request and wrote only
  `sessionStorage["demo:completed"]` in the demo namespace.
- Local update simulation: a changed service worker produced the in-app update
  toast, activated after Reload, and reopened `/demo` offline. The ordinary
  local and live suites also passed offline reload after service-worker
  control.
- Live response policy: HTML and `sw.js` are `no-cache`; fingerprinted assets
  are immutable for one year. HSTS, `nosniff`, `Referrer-Policy: no-referrer`,
  restrictive Permissions-Policy, and the self-only CSP with
  `frame-ancestors 'none'` are present.
- Live Lighthouse mobile: performance **100**, accessibility **100**, best
  practices **100**, SEO **100**; FCP 0.9 s, LCP 1.3 s, TBT 10 ms, CLS 0,
  speed index 0.9 s.

## Repeated live transfer evidence

After deployment, the complete live suite passed twice:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in \
  npx playwright test tests/live.spec.ts --workers=1 --reporter=line
# 9 passed (26.5s)
# 9 passed (23.6s)
```

The focused durable relay test then passed three consecutive deployed runs:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in \
  npx playwright test tests/live.spec.ts --workers=1 --reporter=line \
  --grep '@regression:live-durable-relay'
# 1 passed (8.7s)
# 1 passed (11.8s)
# 1 passed (8.7s)
```

Runs that exercise the managed API were separated where needed so the test
client did not intentionally consume the product's 90-request/minute abuse
limit. No assertion was loosened.

## Deployment identity

Live and local artifact SHA-256 values match:

| Artifact | SHA-256 |
| --- | --- |
| JavaScript `index-BrHB8TLe.js` | `9ddc745d149b90a038a6d3e529acb37387979e6ffc65e5a0d9a016d964c9f838` |
| CSS `index-DFjsIFLs.css` | `9924f417121402788516f815afe780a33ecfa7991471180b2bf296a375001ecf` |
| `sw.js` | `822ea0680d0c7ba83bb57de7aecec9fa4c99da98a6ce6f1930d11372265f17ac` |

`GET /api/health` now reports:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.1",
  "sourceRevision": "d690bb0ecc2973fbd5b4ef2e9a214e20e558f962",
  "deploymentId": "2e38d8bb-57e2-4590-9332-2f3b60f9dd95"
}
```

This also closes the verifier's low-severity API identity limitation.

## Known gaps and next steps

No release-blocking gaps remain. Package/consumer verification is not
applicable to this static PWA. The managed API intentionally enforces 90
requests per minute per server-derived client identity, so repeated live test
loops should respect that one-minute window.
