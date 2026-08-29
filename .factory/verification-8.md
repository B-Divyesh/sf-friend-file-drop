# Verification 8 — independent release QA

## Verdict: **FAIL**

Candidate: `99a44ae38e85c02b34069b3accc223be1de8be28` (`main`)  
Live URL: <https://friend-file-drop.sociobot.in>  
Verified: 2026-08-29 UTC

The static PWA shipped at the live URL matches the candidate build, but the managed API is not the candidate revision and the real relay fallback fails to complete a transfer. The relay is part of the researched smallest useful product, so this is release-blocking.

## Release-blocking defects

### P0 — opt-in relay transfer does not finish in production

`LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list` ran the real two-browser flow. Both browsers made/joined a six-word room, both explicitly chose the relay, and the sender reached **Relay ready**. After the sender sent `live-relay.txt`, the receiver did not show **Transfer finished** within 15 seconds. The suite result was **8 passed, 1 failed (46.9 s)**.

The failure is `tests/live.spec.ts:100` (`@regression:live-durable-relay`). The captured sender accessibility snapshot shows the send action ended at “Files uploaded. Waiting for the receiver to verify them.” with no receipt. Evidence remains in the generated Playwright failure trace and screenshots at `test-results/live-deployed-relay-keeps--1318d-gression-live-durable-relay-chromium/`.

This violates the brief's required opt-in relay fallback. Do not release until the deployed service completes this two-party relay flow and the live test passes.

### P1 — deployed API build identity is not the candidate

`GET /api/health` returned:

```json
{
  "service": "friend-file-drop-api",
  "version": "1.1.2",
  "sourceRevision": "d690bb0ecc2973fbd5b4ef2e9a214e20e558f962",
  "deploymentId": "62d04671-7360-4f7d-9a51-765eff1fd398"
}
```

`d690bb0` precedes the candidate. The static frontend does match the candidate: the live JS and CSS SHA-256 values equal this candidate's production build (`fc410…c283` and `2f9f…c944`), and the live service worker equals the local candidate (`abcf…c770`). This is therefore a split/incomplete deployment, not a stale browser cache. Deploy the API with build identity `99a44ae…` (or a newer approved commit) together with the static PWA, then re-run live QA.

## First-read and demo gate — PASS

A cold, fresh Chromium context opened `/` with no console or page errors and only same-origin requests. The first screen says:

> “Send files straight to someone you trust” — “For friends on different devices who need the files and proof that they arrived.”

It explains what it does, who it is for, and exposes **Try it with sample data** as the first action. One click enters `/?demo=1`; the demo has the persistent “Demo — sample data, nothing is saved” banner, Reset demo, Start a real transfer, three realistic sample files, and a finished three-file receipt.

## Clean-clone claims gate — PASS (21/21)

After `npm ci` from candidate `99a44ae…`, every exact command in `.factory/claims.json` passed against its declared demo/fixture entry point:

| Claim IDs | Result |
| --- | --- |
| demo-receipt; manifest-before-transfer; no-account; free-use; demo-isolation; offline-reload; six-word-room | PASS |
| room-expiry; direct-transfer; resumable-transfer; local-receipts; opt-in-relay; relay-cap; privacy-boundaries | PASS |
| individual-file-receipts; own-files-untouched; receipt-export; receipt-import; demo-no-real-files; room-code-storage; api-health | PASS |

The two Node claim commands for expiry, relay cap, and health also passed. No claim test was missing or failed. This local fixture coverage does not override the failed real deployed relay above.

## Local quality gates — PASS

- `npm ci`: passed; production dependency audit reported 0 vulnerabilities.
- `npm test`: passed locally: 11 Node/config tests and 28 local Chromium tests; the 9 live-only tests were correctly skipped without `LIVE_URL`.
- `npm run lint`: passed (`tsc --noEmit`).
- `npm run build`: passed and created `dist/`.
- Production bundle: JS 37.99 kB / **12.24 kB gzip**; CSS 17.31 kB / **4.87 kB gzip**. Both are within the static-product budgets.

## Live behavior, privacy, security, and accessibility

- Live suite: 8/9 passed. It passed the five route/metadata/axe checks, demo isolation/exit, service-worker update plus offline reload, and corrupt direct transfer recovery. The only failure is the P0 relay flow above.
- Axe on `/`, `/demo`, `/privacy`, `/terms`, and the real HTTP 404: zero serious or critical violations (part of the 8 passing live checks).
- Fresh cold-page request log: only the same-origin document, JS, CSS, and original hero image. Demo execution requested only same-origin HTML, JS, and CSS; it made no `/api` request, stored only `demo:completed` in session storage, and opened no IndexedDB database. No console or page errors were observed.
- At 390 px: `scrollWidth` was 390 (no horizontal overflow), the invalid room code recovery message was “Enter all six words, separated by hyphens.”, and the focused room input had a visible `rgb(164, 60, 47) solid 3px` outline. Reduced-motion computed animation and transition durations were `0.00001s`.
- Response headers on the document and routes included CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`. Fingerprinted JS is `Cache-Control: public, max-age=31536000, immutable`; `sw.js` is `no-cache`.
- The actual API rate allowance was observed from a clean minute window: the first **429** occurred on request **91** (90 requests allowed), with `Retry-After: 60`, `Cache-Control: no-store`, and the documented error body.

## Required next steps

1. Deploy the API from the candidate (or approved successor) and make its health `sourceRevision` identify that revision.
2. Reproduce and repair the production relay delivery/receiver completion failure.
3. Re-run `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list`; all 9 must pass before accepting the release.
