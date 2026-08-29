# Polish round 2 — cumulative finding closure

**Result: PASS.** Every finding in `review-1.md` and `review-2.md` is resolved in version 1.1.4 and rechecked on the live site.

| Finding | Change made | Test evidence | Screenshot evidence | Live URL check |
| --- | --- | --- | --- | --- |
| `F-1-1` | Kept “receipt” as the single result term, removed the exactly-once wording, and retained the registered pre-transfer manifest promise. | `@claim:manifest-before-transfer`, `@claim:individual-file-receipts`, and `every declared claim has one tagged test…` pass. | `evidence/polish-2/live-home-mobile.png` | `/` shows the receipt wording; a real selected-file manifest remains covered in the full suite. |
| `F-1-2` | Retained complete canonical, Open Graph, Twitter, apple-touch, header, footer, and version metadata on the static 404. | `static 404 has full identity metadata and the standard navigation`; deployed `/missing-page` identity/axe test. | `evidence/polish-2/live-404-desktop.png` | `/missing-page` returns HTTP 404 with the correct title, canonical, How it works, Privacy, and Terms links. |
| `F-1-3` | Retained plain transfer wording, the “receipt” term, “How browser-to-browser transfer works,” and “Start a real transfer.” Added a rejected-wording regression gate. | `reader copy does not regress to the rejected review wording`; history routing test. | `evidence/polish-2/verify-local/screenshot-mobile.png` | `/` and `/?demo=1` use the required terms and result-naming actions. |
| `F-1-4` | Rewrote the remaining README storage and resume explanations in outcome language. Removed “saved offset,” “verified pieces,” and “session-storage.” | `reader copy does not regress to the rejected review wording`; `.factory/copy-audit.md`. | `evidence/polish-2/privacy-mobile.png` | The matching `/privacy` explanation now says what stays in the browser without storage jargon. |
| `F-2-1` | Added `demo-ready-in-one-click` to `.factory/claims.json`. Its sole tagged test starts at `/`, clicks once, and verifies the banner, route, three names, sizes, full hashes, no file input, and no API request. | `one click opens the isolated demo with three ready sample files @claim:demo-ready-in-one-click`; clean claim result 22/22. | `evidence/polish-2/demo-ready-mobile.png`; `evidence/polish-2/live-demo-ready-mobile.png` | Cold live `/?demo=1` contains all three exact ready rows. `live-findings.json` records no API or foreign request. |
| `F-2-2` | Replaced the README regression with: “This lets a sender choose the same files after a reload and continue from where the transfer stopped.” | Rejected-wording regression gate; `@claim:resumable-transfer`. | `evidence/polish-2/privacy-mobile.png` | Live privacy copy uses the same “saved parts” and browser-local outcome language. |
| `F-2-3` | Replaced undefined “verified pieces” with “saved transfer parts.” Replaced the implementation-led session-storage sentence with temporary data kept only in the current tab. | Rejected-wording regression gate; `@claim:demo-isolation`; `@claim:local-receipts`. | `evidence/polish-2/live-demo-ready-mobile.png`; `evidence/polish-2/privacy-mobile.png` | Live demo and privacy routes use consistent file, receipt, and saved-part terms. |

## Cross-cutting acceptance evidence

- Clean clone: every one of the 22 declared claim commands passed independently; see `evidence/polish-2/clean-results.md`.
- Full local suite: 19 Node and 29 browser tests passed. This covers routing, titles, metadata, focus, keyboard, 390 px layout, 200% text, 44 px targets, privacy, offline, direct transfer, relay, receipts, and resume.
- Accessibility: Playwright axe found no serious or critical issue on `/`, `/demo`, `/privacy`, `/terms`, or the live 404. The URL verifier found one `h1`, `lang=en`, a main landmark, complete alt text, labelled buttons, and zero console errors.
- Performance: mobile Lighthouse reports 100 performance, 100 accessibility, 100 best practices, and 100 SEO. Live LCP is 1.3 s, CLS is 0, and total blocking time is 0 ms. Evidence is in `evidence/polish-2/lighthouse-live.json`.
- Privacy/demo: the cold live demo made no API or cross-origin request, exposed no file input, wrote only its `demo:` session key after running, and cleared it on reset and exit.
- Routing: `/`, `/demo`, `/privacy`, and `/terms` return 200. `/missing-page` returns a designed 404. The manifest, robots, sitemap, and social image return 200.
- Visual inspection: the live 390 px home/demo and desktop 404 screenshots preserve the warm ruled-paper lab-notebook identity with no horizontal overflow.

## Deployment and cold re-check

The guarded deployment script built and deployed pushed revision `f722d71a152c20fd49eaf578d4fca697b40c7355`. Static deployment ID: `e1409975-775c-4ab4-9e50-40596f6ee6f7`. Managed API identity: `b0be2e90-7d4f-42f7-993b-c65e09fa07d0`.

After deployment, the live suite passed 10/10. A separate fresh-browser check recorded the ready demo, reset, exit, routes, security headers, mobile fit, HTTP 404, and zero console errors in `evidence/polish-2/live-findings.json`. No finding remains open.

