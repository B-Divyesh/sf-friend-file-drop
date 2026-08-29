# Polish round 1 — finding closure

**Result:** PASS. All four findings in `.factory/review-1.md` and every earlier regression named there are resolved in the deployed 1.1.2 product.

## Review 1 findings

| Finding | Change made | Automated evidence | Screenshot evidence | Live URL check |
| --- | --- | --- | --- | --- |
| `F-1-1` | Removed “Each file crosses once.” Replaced “record” with the defined term “receipt.” Added `manifest-before-transfer` to `.factory/claims.json`. File rows now show each full SHA-256 hash before room creation. | `selected file details appear before a room exists @claim:manifest-before-transfer`; `same-content files keep separate verified rows and receipts @claim:individual-file-receipts`; clean claim result 21/21 in `evidence/polish-1/clean-claims.txt`. | `evidence/polish-1/live-home-cold.png`; `evidence/polish-1/live-manifest-mobile.png`. | `live-findings.txt` asserts the new receipt copy, exact fixture hash, disabled send action, zero room requests, and 390 px fit on the live site. |
| `F-1-2` | Added canonical, Open Graph, Twitter, social image, and apple-touch metadata to `public/404.html`. Added How it works and restored full footer identity parity. | `static 404 has full identity metadata and the standard navigation`; every live route identity test checks metadata, navigation, axe, and HTTP status. | `evidence/polish-1/live-404.png`. | `/missing-page` returned HTTP 404; `live-findings.txt` asserts every required metadata element and How it works link. |
| `F-1-3` | Standardized on “receipt.” Renamed the explanation to “How browser-to-browser transfer works.” Replaced path/signaling metaphors with room-code outcomes, removed “Margin note,” and renamed the exit “Start a real transfer.” | `the first-screen sample action enters the isolated query route in one click`; `history routes update titles, metadata, focus, and legal links`; full copy inventory in `.factory/copy-audit.md`. | `evidence/polish-1/live-home-cold.png`; `evidence/polish-1/live-demo-cold.png`. | `live-findings.txt` asserts every rejected phrase is absent and every required replacement is present. |
| `F-1-4` | Rewrote README setup, transfer, resume, storage, and offline explanations in outcome-first language. Split both overlong sentences. Removed WebRTC, signaling, IndexedDB, offset, and shell jargon from visitor guidance. | `.factory/copy-audit.md` records every README sentence; none exceeds 22 words and none uses a banned word. `git diff --check` passes. | `evidence/polish-1/home-mobile.png` shows the same plain product vocabulary used by the revised README. | Live first-screen wording was cold-checked at `/`; the repository README was checked at commit `703430b`. |

## Required cross-cutting acceptance work

- `/?demo=1`: the primary action reaches it in one click. Direct entry is isolated from production IndexedDB and uses only `sessionStorage["demo:completed"]` after the sample runs. Reset clears it. Start a real transfer clears it and returns to `/`.
- Claims: `.factory/claims.json` contains 21 unique IDs, and each ID occurs in exactly one test. Every declared command passed from the fresh clone.
- Routing and focus: `/`, `/demo`, `/privacy`, and `/terms` have route titles and metadata. `pushState`, back navigation, route announcements, and `h1` focus are covered by `history routes update titles, metadata, focus, and legal links`.
- Mobile: 390 px first-screen, 200% text, 44 px targets, and a selected full-hash manifest all pass without horizontal overflow.
- Accessibility: local and live axe checks report zero serious or critical issues. The URL verifier reports complete title, language, landmark, alt, label, and console checks.
- Privacy/offline: the live demo made no cross-origin request, touched no production database, reset cleanly, and reloaded offline after service-worker control.

## Earlier-review regression audit

| Earlier source | Closure evidence |
| --- | --- |
| `verification.md`: six-word handoff, resume, opt-in relay | `@claim:six-word-room`, `@claim:resumable-transfer`, and `@claim:opt-in-relay` passed in the clean clone; live direct and relay tests passed. |
| `verification.md`: incomplete claims | 21/21 registered claim commands passed; `manifest-before-transfer` closes the final unlisted promise. |
| `verification.md`: immutable assets | Live hashed JS and CSS return one-year immutable caching. |
| `verification.md`: unknown path returned 200 | Live `/missing-page` returned 404 and passed the full identity/axe check. |
| `verification-2.md`: relay flake, duplicate files, rate limiting, picker focus, resizing, API identity, room-code privacy | Aggregate local suite passed under two workers; corresponding claim/regression tests passed; live API reports version 1.1.2 and a new deployment ID. |
| `verification-3.md`: deployed relay persistence and stale 404 version | Live durable relay passed; 404 footer displays v1.1.2. |
| `verification-4.md`: corrupt receipt and demo exit | Live corruption retry withheld receipts until verified; live query-demo exit cleared state. |
| `verification-5.md`: parallel `npm test` failure | Fresh-clone ordinary two-worker `npm test` passed 28/28 local browser tests. |
| `verification-6.md`: late direct answer overwrote relay consent | `@regression:relay-consent-state-race` passed in the full suite; live durable relay passed. |

## Deployment and cold re-check

Deployment `fb3fbe63-ddc9-4182-917c-ba2128c55330` completed successfully. After deployment, a fresh 390 × 844 context opened the landing page, entered `/?demo=1`, selected a real fixture on `/`, and opened the real 404. All screenshots were inspected; the notebook identity is intact, actions and hashes fit, the demo banner is persistent, and the 404 header matches the site.

The live suite passed 9/9. The direct finding script passed F-1-1, F-1-2, F-1-3, and demo isolation/reset. F-1-4 is repository documentation and passed the copy audit. Nothing remains open.
