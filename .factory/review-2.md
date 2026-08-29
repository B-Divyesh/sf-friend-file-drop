# Adversarial first-read review 2 — FAIL

**Reviewed:** 2026-08-29 UTC  
**Live URL:** <https://friend-file-drop.sociobot.in>  
**Method:** fresh Chromium contexts at 390 × 844 and 1440 × 900, clean `npm ci`, every declared claim command, local suite, live suite, request capture, link crawl, and source inspection. Product code was not changed.

## Cold first read

Before scrolling, on both viewports, the product was understandable.

- **What it does:** sends files directly between two browsers and gives both people a receipt.
- **For whom:** friends on different devices.
- **What to click first:** **Try it with sample data**; it opens a ready sample transfer.

The exact first-screen text was “Send files straight to someone you trust”, “For friends on different devices who need the files and proof that they arrived.”, and “Try it with sample data”. At 390 px the first action was visible without horizontal overflow (`scrollWidth = clientWidth = 390`). The desktop and mobile notebook treatment is distinct, readable, and consistent with `.factory/design.md`; it does not present as a generic SaaS template.

## Findings

### F-2-1 — BLOCKING — the one-click ready-demo promise is not registered as a claim

**Location/quote:** Landing hero action note, after the primary action: “The demo opens a ready transfer.” README, **Try the sandbox**: “The page starts with three sample files ready.”

**Why this fails:** These are reliance claims: a visitor is told that one click produces an already-populated product, rather than a setup screen. `.factory/claims.json` has no entry for that promise. The existing untagged test, `the first-screen sample action enters the isolated query route in one click`, checks the route and banner only; it does not assert the three ready rows. `demo-receipt` starts at the direct demo URL, so it does not prove the primary action reaches an immediately populated manifest. The live behavior did satisfy the promise, but the claims contract requires the promise and its sandbox test to be declared.

**Concrete fix:** Add a `demo-ready-in-one-click` claim with the landing and README locations. Tag a test that starts at `/`, clicks **Try it with sample data**, and asserts `/?demo=1`, the persistent banner, the three named sample rows with sizes and hashes, and no file input or API request. Alternatively remove both sentences.

### F-2-2 — BLOCKING — README plain-language regression leaves an earlier finding open

**Location/quote:** `README.md`, **Privacy and offline use**: “This lets a sender reselect the same files after a reload and reopen the room at the saved offset.”

**Why this fails:** “saved offset” is implementation jargon; a first-time sender cannot tell that it means the transfer continues where it stopped. This reopens prior `F-1-4`, whose required fix explicitly removed “offset” from visitor guidance. `polish-1.md` says that term was removed, but the current README contains it. Under the regression rule, the earlier finding is blocking again.

**Concrete fix:** Replace it with: “This lets a sender choose the same files after a reload and continue from where the transfer stopped.”

### F-2-3 — MINOR — README uses undefined storage terms in its reader-facing privacy explanation

**Location/quotes:**

- `README.md`, **Try the sandbox**: “Demo state uses only session-storage keys starting with `demo:`.”
- `README.md`, opening description: “Verified pieces stay in this browser so a rejoined transfer can continue.”
- `README.md`, **Privacy and offline use**: “Finished receipts and verified pieces stay in this browser's database.”

**Why this matters:** “session-storage keys” describes an implementation mechanism, and “pieces” has no defined meaning; the rest of the README calls them files. The privacy outcome is useful, but these terms make a reader translate the wording before understanding it.

**Concrete fix:** Use one defined noun and describe the outcome: “The demo keeps temporary data only in this tab, under names starting with `demo:`.” “Saved parts of an interrupted transfer stay in this browser so it can continue when you rejoin.” “Finished receipts and saved transfer parts stay only in this browser.”

## Copy audit

Word counts treat hyphenated words and numbers as one word. This inventory covers every visible text line on the initial landing route, including navigation, actions, empty states, headings, and footer, plus every sentence and heading in `README.md`. No entry exceeds 22 words. `*` marks a finding; all other entries have no banned marketing adjective, unexplained metaphor, inconsistent term, or non-result action.

| Landing copy | Words | Check |
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
| The demo opens a ready transfer. | 6 | * F-2-1 |
| Your own files stay untouched. | 5 | pass (`own-files-untouched`) |
| No account or app | 4 | pass (`no-account`) |
| Files go direct when browsers connect | 6 | pass (`direct-transfer`) |
| Free to use | 3 | pass (`free-use`) |
| Each selected file has a receipt. | 6 | pass (`individual-file-receipts`) |
| Both sides get the same receipt. | 6 | pass (`direct-transfer`) |
| Prepare a private transfer | 4 | pass |
| Choose whether this device sends or receives. | 7 | pass |
| The receiver joins with the six-word room code. | 8 | pass (`six-word-room`) |
| Send files | 2 | pass |
| Receive files | 2 | pass |
| Choose files to send | 4 | pass |
| or drop them on this sheet | 6 | pass |
| The list shows file sizes and hashes before anything moves. | 10 | pass (`manifest-before-transfer`) |
| File manifest | 2 | pass |
| Your chosen files will appear here. | 6 | pass |
| 0 saved receipts on this device | 6 | pass |
| How browser-to-browser transfer works | 4 | pass |
| The room code connects the two browsers. | 7 | pass (`six-word-room`) |
| Choose the files | 3 | pass |
| The sender sees every name, size, and SHA-256 hash before sending. | 11 | pass (`manifest-before-transfer`) |
| Share six words | 3 | pass |
| The receiver enters the room code. | 6 | pass (`six-word-room`) |
| The room code works for 15 minutes. | 7 | pass (`room-expiry`) |
| Check the receipt | 3 | pass |
| Both browsers record the names, hashes, and finish time. | 9 | pass (`direct-transfer`) |
| What the room service handles | 5 | pass |
| Room connection details expire after 15 minutes. | 7 | pass (`room-expiry`) |
| The app never asks for your contacts. | 7 | pass (`privacy-boundaries`) |
| Files go direct unless both people choose the relay. | 9 | pass (`direct-transfer`, `opt-in-relay`) |
| The relay accepts up to 25 MB and removes file bytes after the receipt. | 14 | pass (`relay-cap`, `opt-in-relay`) |
| Send private files and keep a finished receipt. | 8 | pass |
| Terms | 1 | pass |
| Built by Param Factory · v1.1.3 · Original generated art | 8 | pass |

| README copy | Words | Check |
| --- | ---: | --- |
| Send private files between mixed devices and get a clear receipt. | 11 | pass |
| Friend File Drop is a free, account-free browser tool for friends and families. | 13 | pass (`free-use`, `no-account`) |
| It sends files directly between two browsers. | 7 | pass (`direct-transfer`) |
| Both people see the file list, a matching file hash, and the finish time. | 14 | pass (`direct-transfer`) |
| The sender shares one six-word room code. | 7 | pass (`six-word-room`) |
| The code connects the browsers for 15 minutes. | 8 | pass (`room-expiry`) |
| If the direct path fails, both people can choose a temporary 25 MB relay. | 14 | pass (`opt-in-relay`, `relay-cap`) |
| Verified pieces stay in this browser so a rejoined transfer can continue. | 12 | * F-2-3 |
| Try the sandbox | 3 | pass (section label) |
| Open `/?demo=1` or `http://localhost:5173/?demo=1`. | 8 | pass |
| The page starts with three sample files ready. | 8 | * F-2-1 |
| Choose **Send sample files** to see their receipt. | 8 | pass (`demo-receipt`) |
| Demo state uses only session-storage keys starting with `demo:`. | 9 | * F-2-3 |
| It never reads real receipts. | 5 | pass (`demo-isolation`) |
| Run locally | 2 | pass |
| Requires Node.js 20 or newer. | 5 | pass |
| For a real transfer, start the API in `api/`. | 9 | pass (developer instruction) |
| Then open two browsers and share the six-word code. | 9 | pass |
| Test and build | 3 | pass |
| `npm test` runs API unit tests, builds the app, and runs Playwright claim, accessibility, offline, transfer, relay, resume, and mobile checks. | 20 | pass (developer instruction) |
| The production output is `dist/`, with `dist/index.html` at its root. | 12 | pass (developer instruction) |
| Privacy and offline use | 4 | pass |
| The app has no analytics, advertising, third-party runtime scripts, or contact access. | 12 | pass (`privacy-boundaries`) |
| Files normally travel directly between the two browsers. | 8 | pass (`direct-transfer`) |
| Both people must choose the relay before it accepts file bytes. | 11 | pass (`opt-in-relay`) |
| Finished receipts and verified pieces stay in this browser's database. | 11 | * F-2-3 |
| The most recent room code and its file names, sizes, hashes, and transfer IDs also stay in this browser. | 19 | pass (`room-code-storage`) |
| This lets a sender reselect the same files after a reload and reopen the room at the saved offset. | 19 | * F-2-2 / prior F-1-4 |
| Another room replaces this data. | 5 | pass (`room-code-storage`) |
| You can also clear it from the transfer sheet or by clearing site data. | 14 | pass (`room-code-storage`) |
| The installed app opens offline after the first visit. | 9 | pass (`offline-reload`) |
| Sending files requires a network and another browser. | 8 | pass |
| Deploy | 1 | pass |
| After committing and pushing `main`, run `scripts/deploy-static.sh`. | 7 | pass (developer instruction) |
| It builds `dist/` and deploys the site and managed API. | 10 | pass (developer instruction) |
| It sets `FRIEND_FILE_DROP_SOURCE_REVISION` to the full deployed commit SHA. | 9 | pass (developer instruction) |
| The deployment fails unless live `/api/health` reports that exact SHA. | 10 | pass (`api-health`) |
| `public/staticwebapp.config.json` defines the SPA routes, styled 404, security headers, and immutable asset caching. | 13 | pass (developer instruction) |
| Health also reports the managed deployment identity. | 7 | pass (`api-health`) |
| It reports unavailable when either identity value is missing. | 9 | pass (`api-health`) |
| DNS and billing stay outside this repository. | 7 | pass |
| Project notes | 2 | pass |
| Visual system | 2 | pass |
| Testable claims | 2 | pass |
| Demo contract | 2 | pass |
| Build handoff | 2 | pass |
| Licensed under the MIT License. | 5 | pass |

## Demo, privacy, and claim verification

**Demo: PASS behavior; F-2-1 claims registration remains open.** From a fresh 390 px context, the landing primary action opened `/?demo=1` in one click. The first demo screen already contained `picnic-table.jpg` (2.3 MB), `family-recipes.pdf` (840.0 KB), and `read-me-first.txt` (1.2 KB), full SHA-256 values, a realistic six-word room code, and the persistent “Demo — sample data, nothing is saved” banner. **Send sample files** produced three verified rows and a receipt. **Reset demo** removed the receipt and `demo:completed`; **Start a real transfer** cleared the namespace and returned to `/`.

Request capture during the fresh demo flow observed only `https://friend-file-drop.sociobot.in`, with no `/api/` request and no file input. The source isolates demo completion to `sessionStorage` keys prefixed `demo:` and does not call the production IndexedDB receipt store. Live offline reload after service-worker control passed.

**Claims: PASS — 21/21 declared commands.** After clean `npm ci`, every command in `.factory/claims.json` was run individually and completed successfully. All 21 IDs are unique and each occurs in exactly one tagged test. `npm test` then passed its 17 Node tests and 29 local Chromium tests (the 10 live-only tests are skipped without `LIVE_URL`). `npm run lint` and `npm run build` passed.

The live suite passed **10/10** with `LIVE_URL=https://friend-file-drop.sociobot.in` and the reported live source revision `48e2f5585085a14242224553e90179c0ff80d962`. This covered deployed metadata/accessibility, demo isolation and exit, offline reload, corrupt-byte recovery, direct transfer, and durable dual-consent relay transfer.

## Structure, routing, and accessibility

- **PASS:** `/`, `/demo`, `/privacy`, and `/terms` returned 200; an unknown path returned a designed HTTP 404. `robots.txt`, `sitemap.xml`, favicon, apple-touch icon, social image, canonical, description, OG, and Twitter metadata loaded successfully.
- **PASS:** Every checked page had one `h1`, a `main` landmark, title pattern, focus-on-route-change code, route announcement, skip link, and Privacy/Terms navigation. Back/forward use `popstate` and restore the route with heading focus.
- **PASS:** The fresh live axe checks found no serious or critical violations. The mobile page had no horizontal overflow, and the live suite checked 44 px targets, keyboard role selection, visible focus, and 200% text reflow.
- **PASS:** A crawl of every internal link on the five rendered routes returned 200, except `/missing-page`, which correctly returned 404; the two `mailto:` links were explicit mail actions.
- **PASS:** CSP is served as a response header and limits runtime resources to same origin. No console errors appeared on the cold mobile or desktop landing load.

## Earlier-review regression check

Every earlier `.factory/review-*.md`, `.factory/polish-*.md`, and current handoff was read and checked against the live page and source.

| Earlier finding | Current confirmation |
| --- | --- |
| `F-1-1`: unlisted landing manifest/receipt promises | Fixed: `manifest-before-transfer` exists and is tested; “receipt” is used consistently. F-2-1 is a separate unlisted ready-demo promise. |
| `F-1-2`: 404 metadata/header inconsistency | Fixed: live `/missing-page` returned 404 with canonical, OG/Twitter, social image, apple-touch icon, and the standard header links. |
| `F-1-3`: metaphorical/inconsistent landing wording | Fixed: live heading is “How browser-to-browser transfer works”; “receipt”, result-naming demo exit, and plain room-code wording are present. |
| `F-1-4`: README jargon and overlong sentences | **Regressed/unfixed:** “saved offset” remains in the README; this is F-2-2 and blocks acceptance. No current audited line exceeds 22 words. |

No missed leverage was found. The brief does not imply an AI step, remote sync, or third-party import. Receipt import/export is already present and claim-tested; an AI feature would be decorative here.

## What would make this perfect

Register the ready-demo promise with an observable one-click, populated-manifest test. Then replace the remaining README implementation terms with outcome language and rerun the complete fresh-install and live checklist.

## Verdict

**FAIL.** The live product is clear, tryable, private in its demo flow, and technically verified, but it does not meet the zero-findings standard. F-2-1 is a blocking unlisted claim, and F-2-2 is a blocking regression of `F-1-4`; F-2-3 remains a minor plain-language issue.
