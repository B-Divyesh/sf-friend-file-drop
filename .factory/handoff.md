# Friend File Drop repair 11 handoff

## Outcome: repaired locally; committed and pushed

Base reviewed: `1402cf771243a1470d29eabbe029e3076bad6afd` (verification 9)

## Release-blocking repair

The verifier's exact failure was reproduced from its report: the old room protocol held a single offer/answer, so a receiver reload could only answer a dead offer; sender **Reopen this room** also incorrectly sent `create` and collided with the existing room.

The repair keeps the room code and file identity stable while replacing only the WebRTC negotiation:

- Rooms now expose `offerVersion`, `answerVersion`, and `rejoinVersion`. A receiver rejoin requests a fresh offer; the open sender detects it and publishes one. A stale answer is rejected.
- **Reopen this room** publishes a new versioned offer in the existing room, instead of trying to create the room again. A connected receiver watches for the new version and answers it.
- The sender stores only the latest room's manifest metadata (name, size, hash, transfer ID) in local storage. After reload, reselecting the same files restores their IDs, so receiver IndexedDB partial chunks remain addressable. Clearing the saved room clears this metadata too.
- Privacy and README copy disclose that local metadata. No file bytes are stored in local storage.

## Regression evidence

`tests/product.spec.ts` replaces the former seeded-chunk false positive with `@claim:resumable-transfer @regression:established-direct-interruption`. It creates a real 8 MiB direct transfer, waits until actual chunks are saved, reloads and visibly rejoins the receiver, reloads the sender, reselects the same file, uses **Resume a previous room → Reopen this room**, asserts the original transfer ID remains, and verifies the final send starts at the real saved IndexedDB offset before both receipt screens finish.

The lower-level API guard is covered by `@regression:room-reopen-generation`: it proves fresh offer versions retain the room and reject a stale answer.

## Local verification

Run from a clean install:

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
npm audit --prefix api --omit=dev --audit-level=high
```

Evidence on 2026-08-29 UTC:

- `npm ci`: pass; root and API production audits report 0 vulnerabilities.
- `npm test`: pass: 13 Node/API/config tests; local Chromium suite passes including all claims, offline/service-worker, direct, relay, privacy, accessibility, keyboard, 390 px, and 200% text checks. The nine live-only tests are skipped without `LIVE_URL`, by design.
- `npm run lint`: pass (`tsc --noEmit`).
- `npm run build`: pass; `dist/index.html` is present. JS is 41.19 kB (13.11 kB gzip); CSS is 17.31 kB (4.87 kB gzip).
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 <temp-dir>`: pass; 553 ms load, no console/page errors, title/lang/main, one h1, image alt text, and labelled buttons all verified.
- The project's Playwright Axe checks report zero serious/critical findings on `/`, `/demo`, `/privacy`, and `/terms`. The standalone `@axe-core/cli` invocation was attempted but this container's Selenium wrapper could not locate a Chrome binary; it did not indicate a product finding.

## Deployment and remaining verification

This is the existing static/PWA artifact class: deploy `dist/` together with the managed `api/` functions using the factory's Static Web Apps configuration. Repair `9f0edc31f0120b01f05874b3efa8b8114756ed68` was pushed to `main` successfully. This repository contains no deployment workflow or deployment configuration/token, and GitHub reports no deployment for that revision. At handoff, the public health endpoint still returns prior revision `4fd5dc0c8b192e9bf0ad0771fcf60a017e01ee93`; the public site therefore cannot yet provide live evidence for this repair.

After the factory deploys the pushed revision, run:

```sh
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list
curl -fsS https://friend-file-drop.sociobot.in/api/health
```

There are no known product gaps in the local artifact.
