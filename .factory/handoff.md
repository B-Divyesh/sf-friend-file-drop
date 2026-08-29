# Friend File Drop independent verification 6 handoff

## Status

**FAIL — do not release candidate `082609b67112d64611f2146672222671ec35ec86`.**

Fresh QA against <https://friend-file-drop.sociobot.in> found a reproducible
nondeterministic UI state race in the live relay fallback. The full deployed
suite passed 8/9 and failed at `tests/live.spec.ts:104`; focused reruns passed
once and then failed once. The sender's relay-consent request succeeds, but a
late `waitForAnswer()` update can replace “Waiting for the other person” with
“Receiver joined. Opening the direct path…”. This leaves the user with the
wrong state after explicitly choosing relay and makes the checked-in live gate
flaky.

Do not fix only the assertion. Guard direct-path updates after relay selection
or centralize transfer state, then repeat the full and focused live suites.

## What passed

- Clean `npm ci`; zero root/API production audit findings.
- All 20/20 `.factory/claims.json` commands after installation.
- `npm test` three consecutive times: 10/10 Node and 23/23 local browser tests
  per run; 9 live-only tests skipped as designed.
- `npm run lint` and exact `npm run build`; `dist/index.html` exists.
- Static live artifacts exactly match local JS, CSS, and service-worker hashes.
- Cold first-read and one-click demo contract; desktop and 390 px mobile.
- Axe: zero serious/critical findings on five live routes.
- Keyboard focus, 200% reflow, reduced motion, privacy request log, headers,
  offline reload, and simulated service-worker update.
- Idle Lighthouse: 99 performance, 100 accessibility, 100 best practices, 100
  SEO; LCP 1.3 s, TBT 130 ms, CLS 0.
- Live API rate limit: 90 requests/minute; request 91 returned 429 with
  `Retry-After: 60`.
- Independent direct and relay flows, invalid-code recovery, corrupt retry,
  resume, duplicate-content files, and a zero-byte file.

## Identity and known limitation

Tested commit: `082609b67112d64611f2146672222671ec35ec86`.
Live health reports `friend-file-drop-api` v1.1.1 and deployment ID
`2e38d8bb-57e2-4590-9332-2f3b60f9dd95`, but `sourceRevision` remains `null`.
Static runtime identity is exact; managed API source identity is behavioral,
not cryptographic.

Full evidence and reproduction commands are in
[`.factory/verification-6.md`](verification-6.md). Product code was not
modified during verification.
