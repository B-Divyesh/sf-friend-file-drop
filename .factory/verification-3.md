# Independent verification 3 — FAIL

**Candidate:** `74a466c8d40899109c3b8cbe52fdfd403de7782d` (`main`)

**Live URL:** <https://friend-file-drop.sociobot.in>

**Verified:** 2026-08-28 from a clean checkout. Product source was not modified.

## Verdict

**FAIL — release blocking.** The live static application is byte-identical to the candidate build and the local claim suite passes, but the deployed opt-in relay does not complete reliably. This is the specified direct-transfer failure fallback, so its live failure means the smallest useful product is not end-to-end dependable.

## Release blocker

### High — live relay room state disappears during a two-browser fallback transfer

The direct-failure fallback is not reliable in production. I ran this exact deployed check twice:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in \
  npx playwright test tests/live.spec.ts --grep 'relay transfers only'
```

Both runs failed:

- In the complete live suite, test 8/8 could not observe the sender's required **“Waiting for the other person”** state after its consent, despite a `200` relay-consent response.
- The isolated rerun reached the waiting state but failed after the receiver consent: the receiver displayed **“That room expired or does not exist.”**, the consent request returned `400` with that body, and all following sender room polls returned `404` within seconds of room creation. The test then timed out waiting for **“Relay ready.”**

This is not rate limiting: the failing request was `400`, while the deployed limiter uses `429` and `Retry-After: 60`. It also occurred roughly one second after successful room creation and joining, not after the documented 15-minute expiry. The local `@claim:opt-in-relay` test intercepts `/api/rooms/**` with an in-memory fixture, so it cannot establish that the deployed Azure room persistence survives the two-browser flow.

The repair must make room reads/writes consistent across deployed function instances (including consent updates), then add a live/integration test that exercises the actual persistence service rather than only the mocked room route.

## First-read gate — PASS

Cold live desktop and 390 px mobile loads answer the required questions in plain words:

- **What:** “Send files straight to someone you trust.”
- **For whom:** “For friends on different devices who need the files and proof that they arrived.”
- **First click:** **Try it with sample data**; it says the ready transfer will open and it does so in one click.

The `/demo` page has the persistent “Demo — sample data, nothing is saved” banner, **Reset demo**, and **Start for real**. A fresh demo run completed its three-file receipt with only same-origin static requests, `sessionStorage` key `demo:completed`, no file input, and no console/page errors.

## Required claims — PASS locally

`.factory/claims.json` exists and declares 20 claims. After `npm ci`, I executed every listed `test` command exactly (the Playwright entries use the local `/demo` entry point); all passed. The all-claim product run also passed: **22/22** in `npx playwright test tests/product.spec.ts`.

| Claims covered | Exact command form | Result |
| --- | --- | --- |
| `demo-receipt`, `no-account`, `free-use`, `demo-isolation`, `offline-reload`, `six-word-room`, `direct-transfer`, `resumable-transfer`, `local-receipts`, `opt-in-relay`, `privacy-boundaries`, `individual-file-receipts`, `own-files-untouched`, `receipt-export`, `receipt-import`, `demo-no-real-files`, `room-code-storage` | `npm test -- --grep @claim:<id>` | PASS |
| `room-expiry` | `node --test --test-name-pattern=@claim:room-expiry api/lib/store.test.js` | PASS |
| `relay-cap` | `node --test --test-name-pattern=@claim:relay-cap api/lib/store.test.js` | PASS |
| `api-health` | `node --test --test-name-pattern=@claim:api-health api/integration.test.js` | PASS |

The failed live relay behavior contradicts the observed production meaning of `opt-in-relay` despite its sandbox test passing.

## Other evidence that passed

- Clean install: `npm ci` passed; both root and API audits reported zero vulnerabilities.
- Local checks: `npm test` completed its 8 Node/API/config tests, build, and local Playwright suite; `npm run lint`, `npm run build`, and `npm audit --omit=dev --audit-level=high` passed. Build output: JS 35.83 kB / **11.73 kB gzip** and CSS 17.17 kB / **4.84 kB gzip**, within budget.
- Deployment identity: the live HTML references `/assets/index-4DN9-Wor.js`; its SHA-256 was exactly the locally built candidate asset: `529e90aa627811dd896dd461c8288c0c6792eba7b2be8b77a3817f8bbcb824bc`. `GET /api/health` returned `friend-file-drop-api`, `1.1.1`, deployment id `b13b9658-fc0a-4959-a834-dedd0464faae`, and `Cache-Control: no-store`.
- Live routes `/`, `/demo`, `/privacy`, `/terms`, and `/missing-page` returned the expected 200/404 responses. Fingerprinted JS returned `Cache-Control: public, max-age=31536000, immutable`.
- Accessibility: `VERIFY_NODE_MODULES="$PWD/node_modules" /opt/fleet/lib/verify-url.sh https://friend-file-drop.sociobot.in /tmp/friend-verify-3` passed (one title, `lang=en`, one h1, main landmark, zero missing image alts/unlabelled buttons, no console errors). The Playwright axe checks on the five live routes passed with zero serious/critical findings. Keyboard skip-link, arrow-key tabs, visible file-picker focus, invalid-code recovery, 390 px layout, 200% text reflow, and reduced-motion behavior are covered by the passing local suite and spot checked live.
- Privacy/network: cold landing, privacy, and demo request captures stayed same-origin; no analytics, third-party runtime scripts, sign-in, or payment flow appeared.
- PWA: deployed `/demo` was service-worker controlled and reloaded offline after one online load in the live suite before the relay failure.
- Rate limiting: a clean 110-request `GET /api/rooms/amber-apple-atlas-birch-blue-brisk` burst first returned **429 on request 91**, with `Retry-After: 60`.

## Minor finding

- The static 404 page footer says `v1.1.0`, while the package, live API, and primary app footer identify `v1.1.1`. Correct the stale 404 build label when repairing the blocker.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
```

The last command currently fails only the relay fallback test; the first seven deployed checks pass.
