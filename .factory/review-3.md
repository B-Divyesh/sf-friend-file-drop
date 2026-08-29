# Adversarial first-read review 3 — FAIL

**Reviewed:** 2026-08-29 UTC  
**Live URL:** <https://friend-file-drop.sociobot.in>  
**Repository revision:** `562021dd045aa60cb7ad81431f32210ec49a2d7e`  
**Method:** fresh Chromium contexts at 390 × 844 and 1440 × 900; separate clean clone; every declared claim command; full local and live suites; request/storage inspection; route and link crawl; source/history review. Product code was not changed.

## Cold first read

Before scrolling, both viewports answered the three required questions:

- **What it does:** sends files from one browser to another and provides a receipt.
- **For whom:** friends using different devices.
- **What to click first:** **Try it with sample data**.

The exact text was “Send files straight to someone you trust”, “For friends on different devices who need the files and proof that they arrived.”, and “Try it with sample data”. The action was fully visible at 390 px and desktop, and neither viewport overflowed horizontally. No blocking first-read finding applies.

Evidence: `evidence/review-3/cold-mobile.png`, `cold-desktop.png`, and `cold-first-read.json`.

## Findings

### F-3-1 — BLOCKING — the phone demo does not show the sample files on its first screen, and its banner is not persistent

**Location/quotes:** live `/?demo=1` at 390 × 844. The first viewport shows “Send sample files and check the receipt”, “Three sample files are ready”, the room code, and the start of “Sample manifest”. The first actual file row starts at `y = 905.75`, below the 844 px viewport. **Send sample files** starts at `y = 1376.56`. After scrolling, `.demo-banner` is at `y = -962` through `-874.66`, fully outside the viewport.

**Why this fails:** the demo contract requires the first screen after one click to show the product already being used with realistic sample data, plus a persistent banner with Reset and Start-for-real controls. A phone visitor sees neither a sample file nor the action that demonstrates the transfer without scrolling. Once they scroll, the mode warning and escape/reset controls disappear. The existing `demo-ready-in-one-click` test checks that rows exist in the DOM; it never checks whether a row is in the first viewport.

**Concrete fix:** compact or reorder the mobile demo header so at least one named sample-file row and the sample action appear in the initial 390 × 844 viewport. Keep `.demo-banner` sticky at the top while demo mode is active. Extend the claim test to assert the first sample row and action have viewport-intersecting bounding boxes and that the banner remains visible after scrolling.

### F-3-2 — BLOCKING — three live reliance claims are absent from `.factory/claims.json`

**Locations/quotes:**

- Demo status: “Ready. No network or real files are used.”
- `/privacy`, **Direct transfers**: “The room service receives the six-word code, network address, and connection details.”
- `/privacy`, **Relay transfers**: “It then receives the file list and contents through an encrypted web connection.”

**Why this fails:** `demo-no-real-files` tests no API request and no visitor file, not the broader “no network” promise. No declared claim verifies the exact metadata sent to the room service. No declared claim verifies the relay transport statement. These are network and privacy facts a visitor can rely on, so passing unrelated or narrower tests does not register them.

**Concrete fix:** change the demo status to “Ready. The sample makes no API request and uses no files from your device,” which matches the existing claim. Add a `connection-metadata-boundary` claim whose test captures direct-transfer request bodies and proves file names, hashes, bytes, and receipts are excluded. Either add a declared HTTPS relay-transport test or remove “through an encrypted web connection” and use wording already covered by `opt-in-relay`.

### F-3-3 — MINOR — the desktop first screen omits all three required plain facts

**Location:** live `/` at 1440 × 900. “No account or app” starts at `y = 913.56`; the other two facts start at `y = 944.33`. All are below the viewport.

**Why this matters:** the plain-words first-screen shape requires the privacy/access/price facts on the first screen. The oversized five-line desktop headline and vertical spacing push all three below the fold, even though the main action remains visible.

**Concrete fix:** reduce the desktop hero type or top padding, or move the facts above the action note. Add a 1440 × 900 assertion that every `.plain-facts li` ends within the viewport.

### F-3-4 — MINOR — the same feature is called a demo, sandbox, file list, and manifest

**Locations/quotes:** README heading “Try the sandbox”; landing heading “File manifest”; demo heading “Sample manifest”; README “Both people see the file list”.

**Why this matters:** “sandbox” and “manifest” are technical terms, and the product already has the plainer words “demo” and “file list”. A first-time family user should not have to infer that each pair means the same thing.

**Concrete fix:** use **Try the demo**, **Files to send**, **Sample files**, and **Incoming files**. Use “file list” in explanatory sentences.

### F-3-5 — MINOR — the product relies on unexplained hash terminology

**Locations/quotes:** landing “The list shows file sizes and hashes before anything moves”; “The sender sees every name, size, and SHA-256 hash before sending”; “Both browsers record the names, hashes, and finish time.” README: “Both people see the file list, a matching file hash, and the finish time”; “file names, sizes, hashes, and transfer IDs”.

**Why this matters:** the audience is friends and families, but neither “hash” nor “SHA-256” is defined. This is the proof mechanism promised by the headline, so unexplained implementation language obscures the product’s main value.

**Concrete fix:** define it on first use: “The list shows each file’s name, size, and digital fingerprint before sending.” Follow with “The fingerprint uses SHA-256.” In the README, use “matching digital fingerprints” and replace the storage inventory with “the details needed to resume the latest room”.

### F-3-6 — MINOR — “What the room service handles” is ambiguous out of context

**Location/quote:** landing `h2`: “What the room service handles”.

**Why this matters:** in a heading list, “room service” can mean hotel service and does not state the privacy topic. The reader must inspect the bullets to learn what the section is for.

**Concrete fix:** rename the heading **What leaves your browser**.

### F-3-7 — MINOR — “FIELD NOTE 01” is a decorative label with no information

**Location/quote:** landing hero CSS-generated text: “FIELD NOTE 01”.

**Why this matters:** it is brand-lore copy that could sit on any notebook-themed page. Chromium also exposes it in the accessibility tree, where it adds noise without naming a section or action.

**Concrete fix:** remove the generated label. The notebook styling already provides the visual identity.

### F-3-8 — MINOR — the 404 headline uses a metaphor instead of naming the error

**Location/quote:** live unknown route `h1`: “This notebook page is missing”.

**Why this matters:** the title correctly says “Page not found”, but the main heading replaces that plain result with the product’s notebook metaphor. A heading must make sense without the surrounding visual theme.

**Concrete fix:** use **Page not found** as the `h1`; keep the ruled-paper 404 design and “The address does not point to a page here.”

## Copy audit

Counts use whitespace-delimited words; hyphenated compounds, paths, version strings, and inline code spans count as one word. The landing inventory includes navigation, visible initial content, the standard sender/receiver controls, accessible image copy, and the footer. No line exceeds 22 words and no banned marketing adjective appears. `FLAG` rows map to findings above. All actions use result-naming verbs.

### Landing page

| Copy | Words | Result |
| --- | ---: | --- |
| Skip to main content | 4 | pass |
| F→F | 1 | pass |
| Friend File Drop | 3 | pass |
| Demo | 1 | pass |
| How it works | 3 | pass |
| Privacy | 1 | pass |
| Browser-to-browser file transfer | 3 | pass |
| Send files straight to someone you trust | 7 | pass |
| For friends on different devices who need the files and proof that they arrived. | 14 | pass |
| Try it with sample data | 5 | pass |
| Choose your files | 3 | pass |
| The demo opens a ready transfer. | 6 | pass |
| Your own files stay untouched. | 5 | pass |
| Product facts | 2 | pass |
| No account or app | 4 | pass |
| Files go direct when browsers connect | 6 | pass |
| Free to use | 3 | pass |
| A paper bridge carries three file cards from a phone to a laptop. | 13 | pass |
| Each selected file has a receipt. | 6 | pass |
| Both sides get the same receipt. | 6 | pass |
| FIELD NOTE 01 | 3 | **FLAG F-3-7: decorative label** |
| 01 | 1 | pass: sequence marker |
| Prepare a private transfer | 4 | pass |
| Choose whether this device sends or receives. | 7 | pass |
| The receiver joins with the six-word room code. | 8 | pass |
| This device will | 3 | pass |
| Send files | 2 | pass |
| Receive files | 2 | pass |
| Choose files to send | 4 | pass |
| or drop them on this sheet | 6 | pass |
| The list shows file sizes and hashes before anything moves. | 10 | **FLAG F-3-5: unexplained jargon** |
| File manifest | 2 | **FLAG F-3-4: jargon/inconsistent term** |
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
| This room expires after 15 minutes. | 6 | pass |
| Direct path not working? | 4 | pass |
| The relay receives file names, hashes, contents, IP addresses, and byte counts. | 12 | **FLAG F-3-5: unexplained jargon** |
| It holds up to 25 MB until the receipt or room expiry. | 12 | pass |
| Use the private relay | 4 | pass |
| Join the sender's room | 4 | pass |
| Six-word room code | 3 | pass |
| Ask the sender for the six words shown on their screen. | 11 | pass |
| Join this room | 3 | pass |
| Incoming file manifest | 3 | **FLAG F-3-4: jargon/inconsistent term** |
| File names and sizes appear after the browsers connect. | 9 | pass |
| Enter the sender's six-word room code. | 6 | pass |
| 02 | 1 | pass: sequence marker |
| How browser-to-browser transfer works | 4 | pass |
| The room code connects the two browsers. | 7 | pass |
| Choose the files | 3 | pass |
| The sender sees every name, size, and SHA-256 hash before sending. | 11 | **FLAG F-3-5: unexplained jargon** |
| Share six words | 3 | pass |
| The receiver enters the room code. | 6 | pass |
| The room code works for 15 minutes. | 7 | pass |
| Check the receipt | 3 | pass |
| Both browsers record the names, hashes, and finish time. | 9 | **FLAG F-3-5: unexplained jargon** |
| What the room service handles | 5 | **FLAG F-3-6: ambiguous heading** |
| Room connection details expire after 15 minutes. | 7 | pass |
| The app never asks for your contacts. | 7 | pass |
| Files go direct unless both people choose the relay. | 9 | pass |
| The relay accepts up to 25 MB and removes file bytes after the receipt. | 14 | pass |
| Send private files and keep a finished receipt. | 8 | pass |
| Terms | 1 | pass |
| Built by Param Factory · v1.1.4 · Original generated art | 8 | pass: provenance is recorded in `.factory/design.md` and source sidecars |

### README

| Copy | Words | Result |
| --- | ---: | --- |
| Friend File Drop | 3 | pass |
| Send private files between mixed devices and get a clear receipt. | 11 | pass |
| Friend File Drop is a free, account-free browser tool for friends and families. | 13 | pass |
| It sends files directly between two browsers. | 7 | pass |
| Both people see the file list, a matching file hash, and the finish time. | 14 | **FLAG F-3-5: unexplained jargon** |
| The sender shares one six-word room code. | 7 | pass |
| The code connects the browsers for 15 minutes. | 8 | pass |
| If the direct path fails, both people can choose a temporary 25 MB relay. | 14 | pass |
| Saved parts of an interrupted transfer stay in this browser so it can continue when you rejoin. | 17 | pass |
| Try the sandbox | 3 | **FLAG F-3-4: jargon/inconsistent term** |
| Open `/?demo=1` or `http://localhost:5173/?demo=1`. | 4 | pass |
| The page starts with three sample files ready. | 8 | pass |
| Choose Send sample files to see their receipt. | 8 | pass |
| The demo keeps temporary data only in this tab, under names starting with `demo:`. | 14 | pass |
| It never reads real receipts. | 5 | pass |
| Run locally | 2 | pass |
| Requires Node.js 20 or newer. | 5 | pass |
| Open `http://localhost:5173`. | 2 | pass |
| For a real transfer, start the API in `api/`. | 9 | pass: developer context |
| Then open two browsers and share the six-word code. | 9 | pass |
| Test and build | 3 | pass |
| `npm test` runs API unit tests, builds the app, and runs Playwright claim, accessibility, offline, transfer, relay, resume, and mobile checks. | 20 | pass: developer context |
| The production output is `dist/`, with `dist/index.html` at its root. | 12 | pass: developer context |
| Privacy and offline use | 4 | pass |
| The app has no analytics, advertising, third-party runtime scripts, or contact access. | 12 | pass |
| Files normally travel directly between the two browsers. | 8 | pass |
| Both people must choose the relay before it accepts file bytes. | 11 | pass |
| Finished receipts and saved transfer parts stay only in this browser. | 11 | pass |
| The most recent room code and its file names, sizes, hashes, and transfer IDs also stay in this browser. | 19 | **FLAG F-3-5: unexplained jargon** |
| This lets a sender choose the same files after a reload and continue from where the transfer stopped. | 18 | pass |
| Another room replaces this data. | 5 | pass |
| You can also clear it from the transfer sheet or by clearing site data. | 14 | pass |
| The installed app opens offline after the first visit. | 9 | pass |
| Sending files requires a network and another browser. | 8 | pass |
| See `/privacy` and `/terms` for the plain-language policies. | 8 | pass |
| Deploy | 1 | pass |
| After committing and pushing `main`, run `scripts/deploy-static.sh`. | 7 | pass: developer context |
| It builds `dist/` and deploys the site and managed API. | 10 | pass: developer context |
| It sets `FRIEND_FILE_DROP_SOURCE_REVISION` to the full deployed commit SHA. | 9 | pass: developer context |
| The deployment fails unless live `/api/health` reports that exact SHA. | 10 | pass: developer context |
| `public/staticwebapp.config.json` defines the SPA routes, styled 404, security headers, and immutable asset caching. | 13 | pass: developer context |
| Health also reports the managed deployment identity. | 7 | pass: developer context |
| It reports unavailable when either identity value is missing. | 9 | pass: developer context |
| DNS and billing stay outside this repository. | 7 | pass |
| Project notes | 2 | pass |
| Visual system | 2 | pass |
| Testable claims | 2 | pass |
| Demo contract | 2 | pass |
| Build handoff | 2 | pass |
| Licensed under the MIT License. | 5 | pass |

## Demo and sandbox verification

Behavior apart from F-3-1 passes. One click from `/` opened `/?demo=1`; all three named files, exact sizes, and full hashes were already in the DOM. The transfer produced three verified rows and a receipt. Reset removed `demo:completed` and the receipt. Start a real transfer cleared the demo namespace.

A seeded real local-storage room code, an unrelated sentinel, and a real IndexedDB receipt remained byte-for-byte intact after running, resetting, and leaving the demo. Direct `/demo` entry opened IndexedDB zero times. The complete request log contained only same-origin static assets and no `/api/` request. Evidence: `evidence/review-3/demo-sandbox.json`, `demo-immediate-mobile.png`, and `viewport-measurements.json`.

## Claims

All **22/22 declared commands passed** from a separate clean clone at revision `562021dd045aa60cb7ad81431f32210ec49a2d7e`. F-3-2 remains because passing declared tests cannot cover claims that were never declared.

| Claim ID | Declared command | Result |
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

The aggregate `npm test` also passed: 19 Node tests and 29 local Chromium tests, with 10 live-only tests skipped as designed. The isolated live suite passed 10/10 against the deployed revision recorded in the prior handoff, `deab96926e140dd39c65ae182f532bffec9544a9`. The only changes from that deployment revision to this review base are `.factory/handoff.md` and `.factory/verification-13.md`; the live JS and CSS SHA-256 values exactly match the current local build.

## Structure, routing, accessibility, and visual identity

- **PASS:** `/`, `/demo`, `/privacy`, and `/terms` return 200. An unknown route returns the designed static 404 with HTTP 404.
- **PASS:** every checked route has one `h1`, one `main`, `lang=en`, route-specific title, description, canonical, Open Graph/Twitter data, favicon, and apple-touch icon.
- **PASS:** internal navigation uses real URLs; local tests confirm `pushState`, Back, route title/metadata updates, heading focus, and route announcement.
- **PASS:** every internal link from all five rendered routes resolves as expected. The two email links are explicit `mailto:` actions. The same-page skip link on the 404 remains on the intentional 404 response.
- **PASS:** the live 10-test suite found no serious or critical Axe violations. Keyboard role switching, visible skip-link focus, 44 px targets, 200% reflow, mobile hash containment, and reduced motion are covered locally.
- **PASS:** `/opt/fleet/lib/verify-url.sh` reports one `h1`, `lang=en`, a main landmark, complete image alt text, labelled buttons, and zero console errors. Evidence is under `evidence/review-3/verify-live/`.
- **PASS:** CSP, frame protection, referrer policy, MIME protection, and same-origin runtime loading are present. Initial JS is 13.09 kB gzip, below the 150 kB limit.
- **PASS:** the warm ruled-paper transfer notebook, clipped sheets, ink/coral/teal palette, original still-life art, and receipt stamps are distinct from a generic SaaS template and match `.factory/design.md`. Source art and prompt sidecars are present under `assets/src/`.
- **FAIL:** F-3-3 violates the desktop first-screen facts requirement. F-3-8 is a plain-language defect on the otherwise complete 404.

## Earlier-finding regression check

Every earlier `review-*.md`, `polish-*.md`, and the prior handoff was read. Each earlier finding was checked in the live product and current source.

| Earlier finding | Current confirmation |
| --- | --- |
| `F-1-1`: unlisted manifest/receipt promises | Fixed. `manifest-before-transfer`, `individual-file-receipts`, and `direct-transfer` remain registered and pass; exactly-once wording is absent. |
| `F-1-2`: incomplete 404 metadata/header | Fixed. The live 404 has the expected metadata, header/footer links, identity, and HTTP 404 status. |
| `F-1-3`: metaphorical/inconsistent landing wording | Fixed for the exact quoted terms: “record”, “How the files cross”, “Margin note”, and “Start for real” remain absent. F-3-6 and F-3-7 are newly identified copy defects, not a return of those strings. |
| `F-1-4`: README jargon and overlong sentences | Fixed for the exact rejected WebRTC, signaling, IndexedDB, offset, local-storage, and shell wording. No current README sentence exceeds 22 words. F-3-4/F-3-5 identify different remaining terms. |
| `F-2-1`: ready-demo promise unregistered | Fixed. `demo-ready-in-one-click` exists and its declared test passes. F-3-1 is a separate viewport/persistence failure that the test does not inspect. |
| `F-2-2`: “saved offset” README regression | Fixed. The README now says “continue from where the transfer stopped.” |
| `F-2-3`: undefined storage terms | Fixed. “session-storage keys” and “verified pieces” are absent; the demo and saved-part wording is outcome-based. |

The closure claims in `polish-1.md` and `polish-2.md` were also confirmed by the clean claim run, current source, live route crawl, request log, and byte-identical assets. The prior handoff’s live API identity, route, privacy, direct-transfer, and relay checks still pass.

## Missed leverage

No additional AI, cloud sync, or third-party import is justified by the brief. The core job is a private browser-to-browser transfer; an AI step would be decorative and would weaken the privacy story. Receipt import/export already covers the obvious portability need and both directions are claim-tested.

## What would make this perfect

Make the mobile demo show a real sample row immediately and keep its banner visible while scrolling. Register or remove every remaining network/privacy claim. Put the three facts inside the desktop first viewport. Replace the remaining sandbox/manifest/hash/room-service jargon and remove the two notebook-lore text labels. Then rerun the 22 declared commands, aggregate suite, live suite, viewport assertions, request log, and route crawl from clean state.

## Verdict

**FAIL.** There are two blocking findings and six minor findings. The transfer implementation and declared tests pass, but the strict zero-finding standard is not met.
