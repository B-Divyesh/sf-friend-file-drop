# Friend File Drop — adversarial review 3 handoff

## Outcome: **FAIL**

Review 3 is recorded in [`.factory/review-3.md`](review-3.md). Product code was not modified.

## What was done

- Opened the live site cold in fresh 390 × 844 and 1440 × 900 Chromium contexts.
- Audited all landing and README copy with word counts and plain-language checks.
- Ran the one-click demo, receipt, Reset, exit, storage-isolation, request-log, and offline checks.
- Ran all 22 declared claim commands from a separate clean clone at `562021dd045aa60cb7ad81431f32210ec49a2d7e`.
- Ran `npm test` and the isolated 10-test live suite.
- Checked route metadata, 404 behavior, links, history/focus, accessibility, security headers, asset identity, and earlier findings.

## Verification results

- Declared claims: 22/22 commands passed.
- Local suite: 19 Node tests and 29 Chromium tests passed; 10 live-only tests skipped as designed.
- Live suite: 10/10 passed against deployed revision `deab96926e140dd39c65ae182f532bffec9544a9`.
- URL verifier: passed with no console errors.
- Live JS/CSS: byte-identical to the current build.
- Demo isolation: same-origin only, no API call, no IndexedDB open on direct demo entry, and seeded real data survived run/reset/exit unchanged.

## Gaps and next steps

Two blockers remain: the 390 px demo hides every sample row and the sample action below the first viewport while its banner scrolls away; three live network/privacy statements are not registered claims. Six minor copy and first-screen findings also remain. Resolve every `F-3-*` item, add the specified viewport and claim coverage, then rerun the complete review.

Evidence is under `.factory/evidence/review-3/`.
