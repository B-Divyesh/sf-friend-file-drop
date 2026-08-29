# Adversarial first-read review 4 — PASS

**Reviewed:** 2026-08-29 UTC  
**Live URL:** <https://friend-file-drop.sociobot.in>  
**Repository revision:** `6d0185f28ec7a08c67fae04a02b349afdf45cf1e`  
**Deployed product revision:** `c594cf8ad79ca24ffb2650583d067f551c7a5f0d`  
**Method:** fresh Chromium contexts at 390 × 844 and 1440 × 900; a separate clean clone; every declared claim command; aggregate local and deployed suites; request and storage inspection; route/link crawl; code and full review history inspection. Product code was not changed.

## Cold first read

Before scrolling, both viewports answered all three required questions.

- **What it does:** sends files from one browser to another and gives both people a receipt.
- **For whom:** friends using different devices.
- **What to click first:** **Try it with sample data**.

The exact first-screen text was “Send files straight to someone you trust”, “For friends on different devices who need the files and proof that they arrived.”, and “Try it with sample data”. The adjacent note says “The demo opens a ready transfer.” All three facts were also visible: “No account or app”, “Files go direct when browsers connect”, and “Free to use”.

At 390 px, the primary action ended at 580 px and the last fact ended at 775 px in the 844 px viewport. At 1440 × 900, the last fact ended at 741 px. Neither viewport overflowed horizontally. There is no blocking first-read finding.

## Findings

None. No blocking or minor finding remains.

## Copy audit

Counts treat hyphenated terms, paths, and inline code spans as one word. The inventory includes headings, actions, labels, empty states, and the standard sender/receiver states because those words are part of the landing experience. No line exceeds 22 words, uses a banned marketing adjective, changes a defined term, relies on a mood/metaphor heading, or uses a non-result action.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | pass |
| F→F | 1 | pass — compact wordmark |
| Friend File Drop | 3 | pass |
| Demo | 1 | pass |
| How it works | 3 | pass |
| Privacy | 1 | pass |
| Browser-to-browser file transfer | 3 | pass |
| Send files straight to someone you trust | 7 | pass |
| For friends on different devices who need the files and proof that they arrived. | 14 | pass |
| Try it with sample data | 5 | pass |
| Choose your files | 3 | pass |
| The demo opens a ready transfer. | 6 | pass — `demo-ready-in-one-click` |
| Your own files stay untouched. | 5 | pass — `own-files-untouched` |
| No account or app | 4 | pass — `no-account` |
| Files go direct when browsers connect | 6 | pass — `direct-transfer` |
| Free to use | 3 | pass — `free-use` |
| A paper bridge carries three file cards from a phone to a laptop. | 13 | pass — image alt text |
| Each selected file has a receipt. | 6 | pass — `individual-file-receipts` |
| Both sides get the same receipt. | 6 | pass — `direct-transfer` |
| Prepare a private transfer | 4 | pass |
| Choose whether this device sends or receives. | 7 | pass |
| The receiver joins with the six-word room code. | 8 | pass — `six-word-room` |
| This device will | 3 | pass |
| Send files | 2 | pass |
| Receive files | 2 | pass |
| Choose files to send | 4 | pass |
| or drop them on this sheet | 6 | pass |
| The file list shows each file's name, size, and digital fingerprint before anything moves. | 14 | pass — `manifest-before-transfer` |
| A fingerprint uses SHA-256. | 4 | pass — defines the technical term |
| Files to send | 3 | pass |
| Your chosen files will appear here. | 6 | pass |
| 0 saved receipts on this device | 6 | pass |
| Finished real transfers will appear here. | 6 | pass |
| Export saved receipts | 3 | pass |
| Import receipts | 2 | pass |
| Pair the receiving browser | 4 | pass |
| Make a six-word room | 4 | pass |
| Resume a previous room | 4 | pass |
| Previous room code | 3 | pass |
| Reopen this room | 3 | pass |
| Clear saved room code | 4 | pass |
| Tell the receiver the six words. | 6 | pass |
| This room expires after 15 minutes. | 6 | pass — `room-expiry` |
| Direct path not working? | 4 | pass |
| The relay receives file names, digital fingerprints, contents, IP addresses, and byte counts. | 13 | pass — concrete privacy disclosure |
| It holds up to 25 MB until the receipt or room expiry. | 12 | pass — `relay-cap`, `opt-in-relay` |
| Use the private relay | 4 | pass |
| Make a room to start pairing. | 6 | pass |
| Join the sender's room | 4 | pass |
| Six-word room code | 3 | pass |
| Ask the sender for the six words shown on their screen. | 11 | pass |
| Join this room | 3 | pass |
| Enter the sender's six-word room code. | 6 | pass |
| Incoming files | 2 | pass |
| File names and sizes appear after the browsers connect. | 9 | pass |
| How browser-to-browser transfer works | 4 | pass |
| The room code connects the two browsers. | 7 | pass — `six-word-room` |
| Choose the files | 3 | pass |
| The sender sees every name, size, and digital fingerprint before sending. | 11 | pass — `manifest-before-transfer` |
| Each fingerprint uses SHA-256. | 4 | pass — definition |
| Share six words | 3 | pass |
| The receiver enters the room code. | 6 | pass — `six-word-room` |
| The room code works for 15 minutes. | 7 | pass — `room-expiry` |
| Check the receipt | 3 | pass |
| Both browsers record the names, fingerprints, and finish time. | 9 | pass — `direct-transfer` |
| What leaves your browser | 4 | pass |
| The room service gets the six-word code and connection details for 15 minutes. | 13 | pass — `connection-metadata-boundary`, `room-expiry` |
| The app never asks for your contacts. | 7 | pass — `privacy-boundaries` |
| Files go direct unless both people choose the relay. | 9 | pass — `direct-transfer`, `opt-in-relay` |
| The relay accepts up to 25 MB and removes file bytes after the receipt. | 14 | pass — `relay-cap`, `opt-in-relay` |
| Send private files and keep a finished receipt. | 8 | pass |
| Terms | 1 | pass |
| Built by Param Factory · v1.1.5 · Original generated art | 8 | pass — provenance is recorded in `.factory/design.md` |

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Friend File Drop | 3 | pass |
| Send private files between mixed devices and get a clear receipt. | 11 | pass |
| Friend File Drop is a free, account-free browser tool for friends and families. | 13 | pass |
| It sends files directly between two browsers. | 7 | pass — `direct-transfer` |
| Both people see the file list, matching digital fingerprints (SHA-256), and the finish time. | 14 | pass — `direct-transfer` |
| The sender shares one six-word room code. | 7 | pass — `six-word-room` |
| The code connects the browsers for 15 minutes. | 8 | pass — `room-expiry` |
| If the direct path fails, both people can choose a temporary 25 MB relay. | 14 | pass — `opt-in-relay`, `relay-cap` |
| Saved parts of an interrupted transfer stay in this browser so it can continue when you rejoin. | 17 | pass — `resumable-transfer` |
| Try the demo | 3 | pass |
| Open `/?demo=1` or `http://localhost:5173/?demo=1`. | 4 | pass |
| The page starts with three sample files ready. | 8 | pass — `demo-ready-in-one-click` |
| Choose **Send sample files** to see their receipt. | 8 | pass — `demo-receipt` |
| The demo keeps temporary data only in this tab, under names starting with `demo:`. | 14 | pass — `demo-isolation` |
| It never reads real receipts. | 5 | pass — `demo-isolation` |
| Run locally | 2 | pass |
| Requires Node.js 20 or newer. | 5 | pass — environment requirement |
| Open `http://localhost:5173`. | 2 | pass |
| For a real transfer, start the API in `api/`. | 9 | pass |
| Then open two browsers and share the six-word code. | 9 | pass |
| Test and build | 3 | pass |
| `npm test` runs API unit tests, builds the app, and runs Playwright claim, accessibility, offline, transfer, relay, resume, and mobile checks. | 20 | pass — confirmed in the clean clone |
| The production output is `dist/`, with `dist/index.html` at its root. | 10 | pass — confirmed by the build |
| Privacy and offline use | 4 | pass |
| The app has no analytics, advertising, third-party runtime scripts, or contact access. | 12 | pass — `privacy-boundaries` |
| Files normally travel directly between the two browsers. | 8 | pass — `direct-transfer` |
| Both people must choose the relay before it accepts file bytes. | 11 | pass — `opt-in-relay` |
| Finished receipts and saved transfer parts stay only in this browser. | 11 | pass — `local-receipts`, `resumable-transfer` |
| The latest room code and details needed to continue also stay in this browser. | 14 | pass — `room-code-storage` |
| This lets a sender choose the same files after a reload and continue from where the transfer stopped. | 18 | pass — `resumable-transfer` |
| Another room replaces this data. | 5 | pass — `room-code-storage` |
| You can also clear it from the transfer sheet or by clearing site data. | 14 | pass — `room-code-storage` |
| The installed app opens offline after the first visit. | 9 | pass — `offline-reload` |
| Sending files requires a network and another browser. | 8 | pass |
| See `/privacy` and `/terms` for the plain-language policies. | 8 | pass |
| Deploy | 1 | pass |
| After committing and pushing `main`, run `scripts/deploy-static.sh`. | 7 | pass — developer instruction |
| It builds `dist/` and deploys the site and managed API. | 10 | pass — developer instruction |
| It sets `FRIEND_FILE_DROP_SOURCE_REVISION` to the full deployed commit SHA. | 9 | pass — developer instruction |
| The deployment fails unless live `/api/health` reports that exact SHA. | 10 | pass — deployment identity tests |
| `public/staticwebapp.config.json` defines the SPA routes, styled 404, security headers, and immutable asset caching. | 13 | pass — release configuration tests |
| Health also reports the managed deployment identity. | 7 | pass — `api-health` |
| It reports unavailable when either identity value is missing. | 9 | pass — `api-health` |
| DNS and billing stay outside this repository. | 7 | pass |
| Project notes | 2 | pass |
| Visual system | 2 | pass |
| Testable claims | 2 | pass |
| Demo contract | 2 | pass |
| Build handoff | 2 | pass |
| Licensed under the MIT License. | 5 | pass |

Terminology is consistent: **demo** for the practice mode, **file list** for selected or incoming files, **digital fingerprint** for SHA-256, **receipt** for proof of completion, **room** for a browser session, and **relay** for the optional server path.

## Demo and sandbox

**PASS.** One click from the cold landing page opened `/?demo=1`. At 390 × 844, the sample action ended at 535 px and the first realistic row (`picnic-table.jpg`, 2.3 MB, full SHA-256 fingerprint) ended at 775 px. All three sample rows were already populated. The persistent banner said “Demo — sample data, nothing is saved” and exposed **Reset demo** and **Start a real transfer**.

Running the sample produced three verified rows and a receipt. Reset removed `demo:completed` and the receipt. Leaving returned to `/` with no `demo:` key. A seeded real receipt, latest-room code, latest-transfer details, and unrelated local value were unchanged after run, reset, and exit.

The complete request log contained only same-origin static requests. It contained no `/api/` request, third-party request, or visitor file input. The banner remained fully visible after scrolling. Direct `/demo` use stays outside the production receipt database. Offline reload passed after service-worker control.

## Claims

All **23/23** commands from `.factory/claims.json` passed independently in the clean clone at `/tmp/friend-file-drop-review4.IdnGWq/clean`.

| Claim | Declared command | Result |
| --- | --- | --- |
| `demo-ready-in-one-click` | `npm test -- --grep @claim:demo-ready-in-one-click` | PASS |
| `demo-receipt` | `npm test -- --grep @claim:demo-receipt` | PASS |
| `manifest-before-transfer` | `npm test -- --grep @claim:manifest-before-transfer` | PASS |
| `no-account` | `npm test -- --grep @claim:no-account` | PASS |
| `free-use` | `npm test -- --grep @claim:free-use` | PASS |
| `demo-isolation` | `npm test -- --grep @claim:demo-isolation` | PASS |
| `offline-reload` | `npm test -- --grep @claim:offline-reload` | PASS |
| `six-word-room` | `npm test -- --grep @claim:six-word-room` | PASS |
| `room-expiry` | `node --test --test-name-pattern=@claim:room-expiry api/lib/store.test.js` | PASS |
| `direct-transfer` | `npm test -- --grep @claim:direct-transfer` | PASS |
| `connection-metadata-boundary` | `npm test -- --grep @claim:connection-metadata-boundary` | PASS |
| `resumable-transfer` | `npm test -- --grep @claim:resumable-transfer` | PASS |
| `local-receipts` | `npm test -- --grep @claim:local-receipts` | PASS |
| `opt-in-relay` | `npm test -- --grep @claim:opt-in-relay` | PASS |
| `relay-cap` | `node --test --test-name-pattern=@claim:relay-cap api/lib/store.test.js` | PASS |
| `privacy-boundaries` | `npm test -- --grep @claim:privacy-boundaries` | PASS |
| `individual-file-receipts` | `npm test -- --grep @claim:individual-file-receipts` | PASS |
| `own-files-untouched` | `npm test -- --grep @claim:own-files-untouched` | PASS |
| `receipt-export` | `npm test -- --grep @claim:receipt-export` | PASS |
| `receipt-import` | `npm test -- --grep @claim:receipt-import` | PASS |
| `demo-no-real-files` | `npm test -- --grep @claim:demo-no-real-files` | PASS |
| `room-code-storage` | `npm test -- --grep @claim:room-code-storage` | PASS |
| `api-health` | `node --test --test-name-pattern=@claim:api-health api/integration.test.js` | PASS |

The aggregate clean-clone `npm test` passed 19 Node tests and 30 local Chromium tests; 10 deployed-only tests skipped as configured. `npm run build` produced `dist/`, with 13.09 kB gzip initial JavaScript. The deployed suite passed 10/10 against live API source revision `c594cf8ad79ca24ffb2650583d067f551c7a5f0d`. Every live product reliance statement maps to the registry; no unlisted or untested claim remains.

## Structure, accessibility, privacy, and identity

- `/`, `/demo`, `/privacy`, and `/terms` return 200. An unknown address returns the designed notebook 404 with HTTP 404.
- Every route has the required title pattern, one `h1`, one `main`, a description, canonical URL, Open Graph/Twitter data, favicon, and apple-touch icon.
- Every internal link crawled successfully. The two `mailto:` links are explicit mail actions. Header/footer navigation is consistent.
- `pushState`, deep links, Back, route title changes, route announcements, and focus on the new `h1` all passed locally and live.
- The deployed Axe integration found no serious or critical violation on all five checked pages. The URL verifier found `lang=en`, one `h1`, a main landmark, complete alt text, labelled buttons, and zero console errors.
- Keyboard tabs, arrow-key role switching, visible focus, 44 px targets, 200% text reflow, reduced motion, and 390 px containment pass the browser suite.
- CSP and frame protection are response headers. Demo requests stay same-origin. There are no analytics, CDN scripts/fonts, advertising requests, or contact inputs.
- The warm ruled-paper lab notebook, clipped sheets, ink/coral/teal palette, original still-life art, receipt stamps, and restrained motion match `.factory/design.md` and are visually distinct from a generic SaaS template.

## Earlier-finding regression check

Every earlier review, polish report, and handoff was read. Each finding was checked in the deployed UI and current source.

| Earlier finding | Current confirmation |
| --- | --- |
| `F-1-1` — unlisted manifest/receipt promises | Fixed. Exactly-once wording is absent; receipt wording is consistent; `manifest-before-transfer`, `individual-file-receipts`, and `direct-transfer` pass. |
| `F-1-2` — incomplete 404 metadata/header | Fixed. Live 404 has full metadata, standard navigation/footer, and HTTP 404. |
| `F-1-3` — metaphorical/inconsistent landing terms | Fixed. The rejected record/cross/path/signaling/margin-note wording remains absent. |
| `F-1-4` — README jargon and overlong sentences | Fixed. No README line exceeds 22 words; WebRTC, signaling, IndexedDB, offset, and shell jargon remain absent from reader guidance. |
| `F-2-1` — ready-demo promise not registered | Fixed. `demo-ready-in-one-click` is registered and asserts the route, populated rows, action, banner, geometry, and request boundary. |
| `F-2-2` — saved-offset README regression | Fixed. README says “continue from where the transfer stopped.” |
| `F-2-3` — undefined storage terms | Fixed. The demo uses “temporary data only in this tab”; interrupted data is “saved transfer parts.” |
| `F-3-1` — mobile demo content below fold / banner not persistent | Fixed. The action and first row fit at 390 × 844; the banner remains sticky after scrolling. |
| `F-3-2` — unlisted network/privacy claims | Fixed. Demo status names the tested API/file boundary; `connection-metadata-boundary` is registered; the untested encrypted-transport wording is absent. |
| `F-3-3` — desktop facts below fold | Fixed. All three facts end above 742 px in the 900 px viewport. |
| `F-3-4` — demo/sandbox and file-list/manifest inconsistency | Fixed. Reader copy consistently uses “demo” and “file list/files.” |
| `F-3-5` — unexplained hash terminology | Fixed. Reader copy defines “digital fingerprint” and labels SHA-256. |
| `F-3-6` — ambiguous room-service heading | Fixed. The heading is “What leaves your browser.” |
| `F-3-7` — decorative FIELD NOTE label | Fixed. The label is absent from source, rendered text, and accessibility output. |
| `F-3-8` — metaphorical 404 heading | Fixed. Both SPA and static 404 use “Page not found.” |

The older verification issues summarized by review 1 also remain closed: six-word handoff, direct resume, dual-consent relay, immutable assets, true 404 handling, rate limiting, API identity, corrupt-byte receipt prevention, demo exit isolation, parallel execution, and relay race coverage all pass.

## Missed leverage

No missed feature is implied by the brief. Receipt import/export already supplies the useful portability step. Cloud sync would conflict with the local privacy boundary, and file-transfer AI would be decorative rather than useful. No AI feature or provider key is present.

## What would make this perfect

Nothing within the researched brief, product contract, or review checklist remains to change. Future additions would expand scope rather than close a verified gap.

## Verdict

**PASS.** There are zero findings, no failed or untested claim, no reopened earlier finding, and no remaining first-read, demo, privacy, structure, accessibility, or product-scope defect found in this round.
