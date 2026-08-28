# Friend File Drop verification handoff

## Status

**FAIL — do not release candidate `a15ae576aeed01392f18ab8799b49fc2b808a0df`.**

Independent QA was performed on 2026-08-28 against <https://friend-file-drop.sociobot.in> from the clean candidate checkout. Product code was not changed. Full evidence is in [`.factory/verification-2.md`](verification-2.md).

## Release blockers

1. The required `opt-in-relay` claim command failed on its first clean run. Later repeats passed, making the release gate flaky; the claims contract treats the observed failure as blocking.
2. Two different files with identical bytes collapse to one SHA-keyed incoming record. Both browsers show **Transfer finished**, but only one filename appears in the receipt and one receiver row remains **Waiting**.
3. Ordinary API bursts did not return 429 through 105 requests. A caller-supplied fixed `X-Forwarded-For` reaches the intended threshold at request 91, showing an inconsistent/spoofable key. The relay-files endpoint's 429 has no `Retry-After` header.
4. Keyboard focus on the core file picker is invisible because the focused input is 1 × 1 px and transparent, with no focus treatment on its visible label.
5. `.factory/claims.json` omits material UI promises, including receipt import/export, “Each file crosses once,” and the demo's no-network/no-real-file statement.

Additional findings: 200% text resize causes 450 px horizontal overflow at a 390 px viewport; `/api/health` is absent, so the deployed function build has no external identity; persistent localStorage of the previous room code is not described on the privacy page.

## What passed

- First-read and one-click sample-data demo gate.
- `npm ci`, lint/typecheck, production build, dependency audit, and the final full `npm test` run.
- 12/13 claim commands on first execution; the relay command alone failed.
- Live suite: 8/8, including direct transfer, dual-opt-in relay, offline reload, 404, and axe.
- Normal and file-size-boundary direct transfer, invalid-code recovery, receipt import/export, live relay cleanup, and concurrent consent checks.
- Axe: zero serious/critical findings on all five tested live routes.
- Offline reload, service-worker cache/update plumbing, manifest/icons, security headers, same-origin demo privacy, no cookies, and immutable hashed-asset caching.
- Lighthouse mobile: Performance 94, Accessibility 100, Best Practices 100, SEO 100; LCP 1.3 s, CLS 0.
- Live HTML, JS, CSS, service worker, manifest, and primary assets are byte-identical to the candidate build. The prior deployment-only failure was not reproduced.

## Commands

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
```

## Next steps

- Give every file instance a unique transfer ID independent of its content hash, and add a two-identical-content-files regression test.
- Make the relay claim test deterministic and preserve the one-consent status against competing direct-path state updates.
- Move abuse limiting to shared server-side state keyed from trusted platform metadata; add `Retry-After` to every 429 response and live tests for both endpoints.
- Add visible `:focus-within` styling for the file chooser and fix 200% text reflow.
- Register and test every remaining visitor-facing claim.
- Expose a read-only health/build identity for the managed API and document/clear persistent room-code metadata.
