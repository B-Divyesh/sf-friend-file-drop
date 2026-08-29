# Adversarial first-read review 1 — FAIL

**Reviewed:** 2026-08-29
**Live URL:** <https://friend-file-drop.sociobot.in>
**Method:** fresh Chromium contexts at 390 × 844 and 1440 × 900; clean `npm ci`; all declared claim commands; local and live Playwright suites. Product code was not changed.

## Cold first read

Before scrolling, on both viewports, this reviewer understood:

- **What it does:** it sends a file directly from one browser to another and gives both people a receipt.
- **For whom:** friends using different devices.
- **First click:** **Try it with sample data**; it opens a ready transfer.

The exact first-screen text that made this clear is: “Send files straight to someone you trust”, “For friends on different devices who need the files and proof that they arrived.”, and “Try it with sample data”. This gate passes. The 390 px page had no horizontal overflow and its first action remained fully visible.

## Findings

### F-1-1 — BLOCKING — landing promises are not all registered as claims

**Locations/quotes:**

- Landing hero caption: “Each file crosses once. Both sides get the same record.”
- Transfer sheet: “The list shows file sizes and hashes before anything moves.”
- How it works, step 1: “The sender sees every name, size, and SHA-256 hash before sending.”

**Why this fails:** These are observable promises a visitor can rely on. None has a corresponding entry in `.factory/claims.json`; the closest entries test final direct transfer and distinct receipt rows, not exactly-once delivery or the pre-send manifest. The claims contract requires an entry and sandbox test for each such promise, or removal of the promise. A first-time sender is being asked to trust integrity information that is not covered by the declared release contract.

**Concrete fix:** Delete the undefined “Each file crosses once” claim and change its caption to “Each selected file has a receipt. Both sides get the same receipt.” That uses the defined term and is covered by `individual-file-receipts` / `direct-transfer`. Add a `manifest-before-transfer` claim and test: select a fixture, assert its name, size, and full or labelled SHA-256 value are visible before room creation or sending becomes possible. Register both remaining manifest statements under that claim.

### F-1-2 — MINOR — the real 404 route omits required metadata and header item

**Location:** `https://friend-file-drop.sociobot.in/missing-page`, served as HTTP 404 from `public/404.html`.

**Evidence:** It has a correct title, description, favicon, `lang`, one `h1`, and a usable return link. It does not provide a canonical URL, Open Graph title/description/image, Twitter card metadata, or the apple-touch icon. Its header has only **Demo** and **Privacy**, whereas the other routes also expose **How it works**. The site-structure contract requires route metadata and a consistent header/footer on every route.

**Why this matters:** A shared or bookmarked missing URL does not carry the product's identity, and navigation differs unexpectedly on the recovery page.

**Concrete fix:** Add canonical, OG, Twitter, and apple-touch metadata to `public/404.html` (with the existing product social image), and add the `/#how` link to its header.

### F-1-3 — MINOR — landing copy changes the defined term and uses unexplained technical language

**Locations/quotes:**

- Hero caption: “Both sides get the same **record**.” The audited product term for this is **receipt**.
- How-it-works heading: “How the files **cross**”.
- How-it-works introduction: “The two browsers agree on one private path.”
- Step 2: “Short-lived **signaling** opens a direct browser path.”
- Limits eyebrow: “Margin note”.
- Demo banner action: “Start for real”.

**Why this matters:** “Record” conflicts with the visible receipt name. “Cross”, “agree on a path”, and “margin note” are metaphorical or decorative, not self-explanatory section information. “Signaling” is implementation jargon without a user outcome. “Start for real” does not name its result; it actually returns to the real-transfer start screen. These terms make a user pause at the moment they should be deciding whether to send or receive.

**Concrete fix:** Use “receipt” consistently; rename the section **How browser-to-browser transfer works**; replace the introduction with “The room code connects the two browsers.”; replace the step sentence with “The room code works for 15 minutes.”; delete “Margin note”; and rename the demo exit link **Start a real transfer**.

### F-1-4 — MINOR — README breaks the plain-language and sentence-length rules

**Locations/quotes:**

- “It sends files over a direct WebRTC data channel.”
- “Both people get the file manifest, SHA-256 hashes, and finish time.”
- “A 15-minute signaling room connects the browsers.”
- “Direct-transfer chunks are checkpointed in IndexedDB, so rejoining the same room resumes at the saved offset.”
- “The most recent room code stays in local storage until another room replaces it, you clear it in the transfer sheet, or you clear site data.” (**26 words**, over the 22-word cap.)
- “The installed shell works offline after the first visit; starting a transfer requires a network and another browser.”
- “To test a real transfer, run an Azure Functions-compatible API from `api/`, then open the page in two current browsers and share the six-word code.” (**25 words**, over the 22-word cap.)

**Why this matters:** The README is part of the first-use path, but it expects the reader to understand WebRTC, manifest, SHA-256, signaling, IndexedDB, offset, local storage, and shell before explaining the outcome. Two sentences also exceed the stated maximum.

**Concrete fix:** Prefer outcome-first wording. For example: “It sends files directly between the two browsers.” “Both people see the file list, a matching check value, and the finish time.” “The room code connects the browsers for 15 minutes.” “Verified pieces stay in this browser so a rejoined transfer can continue.” Split the room-code sentence into two. Replace the last setup sentence with: “For a real transfer, start the API in `api/`. Then open two browsers and share the six-word code.”

## Copy audit

Word counts treat hyphenated terms and numbers as one word. The landing table lists every reader-facing sentence, heading, fact, action, and state present on the initial send view; dynamic room instructions are included because they appear on that same landing route. `*` marks a finding above. No landing line exceeds 22 words.

| Landing copy | Words | Check |
| --- | ---: | --- |
| Browser-to-browser file transfer | 3 | pass |
| Send files straight to someone you trust | 7 | pass |
| For friends on different devices who need the files and proof that they arrived. | 14 | pass |
| Try it with sample data | 5 | pass |
| Choose your files | 3 | pass |
| The demo opens a ready transfer. | 6 | pass |
| Your own files stay untouched. | 5 | pass |
| No account or app | 4 | pass |
| Files go direct when browsers connect | 6 | pass |
| Free to use | 3 | pass |
| Each file crosses once. | 4 | * F-1-1/F-1-3 |
| Both sides get the same record. | 6 | * F-1-1/F-1-3 |
| Prepare a private transfer | 4 | pass |
| Choose whether this device sends or receives. | 7 | pass |
| The receiver joins with the six-word room code. | 8 | pass |
| Send files | 2 | pass |
| Receive files | 2 | pass |
| Choose files to send | 4 | pass |
| Or drop them on this sheet. | 6 | pass |
| The list shows file sizes and hashes before anything moves. | 10 | * F-1-1 |
| File manifest | 2 | pass |
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
| The relay receives file names, hashes, contents, IP addresses, and byte counts. | 12 | pass |
| It holds up to 25 MB until the receipt or room expiry. | 12 | pass |
| Use the private relay | 4 | pass |
| Join the sender's room | 4 | pass |
| Six-word room code | 3 | pass |
| Ask the sender for the six words shown on their screen. | 11 | pass |
| Join this room | 3 | pass |
| How the files cross | 4 | * F-1-3 |
| The two browsers agree on one private path. | 8 | * F-1-3 |
| Choose the files | 3 | pass |
| The sender sees every name, size, and SHA-256 hash before sending. | 11 | * F-1-1 |
| Share six words | 3 | pass |
| The receiver enters the room code. | 6 | pass |
| Short-lived signaling opens a direct browser path. | 7 | * F-1-3 |
| Check the receipt | 3 | pass |
| Both browsers record the names, hashes, and finish time. | 9 | pass |
| Margin note | 2 | * F-1-3 |
| What the room service handles | 5 | pass |
| Room connection details expire after 15 minutes. | 7 | pass |
| The app never asks for your contacts. | 7 | pass |
| Files go direct unless both people choose the relay. | 9 | pass |
| The relay accepts up to 25 MB and removes file bytes after the receipt. | 14 | pass |
| Send private files and keep a finished receipt. | 8 | pass |
| Built by Param Factory · v1.1.1 · Original generated art | 8 | pass |

| README sentence | Words | Check |
| --- | ---: | --- |
| Send private files between mixed devices and get a clear receipt. | 11 | pass |
| Friend File Drop is a free, account-free browser tool for friends and families. | 13 | pass |
| It sends files over a direct WebRTC data channel. | 9 | * F-1-4 jargon |
| Both people get the file manifest, SHA-256 hashes, and finish time. | 11 | * F-1-4 jargon |
| The sender shares one six-word room code. | 7 | pass |
| A 15-minute signaling room connects the browsers. | 7 | * F-1-4 jargon |
| If the direct path fails, both people can choose a temporary 25 MB relay. | 14 | pass |
| Direct-transfer chunks are checkpointed in IndexedDB, so rejoining the same room resumes at the saved offset. | 16 | * F-1-4 jargon |
| Open `/demo` or `http://localhost:5173/demo`, then choose **Send sample files**. | 8 | pass |
| It transfers three local sample records and shows a receipt. | 10 | pass |
| Demo state uses only `demo:` session-storage keys and never reads real receipts. | 12 | pass |
| Requires Node.js 20 or newer. | 5 | pass |
| To test a real transfer, run an Azure Functions-compatible API from `api/`, then open the page in two current browsers and share the six-word code. | 25 | * F-1-4 >22 |
| `npm test` runs API unit tests, builds the app, and runs Playwright claim, accessibility, offline, transfer, relay, resume, and mobile checks. | 20 | pass |
| The production output is `dist/`, with `dist/index.html` at its root. | 12 | pass |
| The app has no analytics, advertising, third-party runtime scripts, or contact access. | 12 | pass |
| Direct files use WebRTC. | 4 | * F-1-4 jargon |
| Both people must opt in before relay bytes are accepted. | 10 | pass |
| Receipts and resumable direct-transfer chunks use local IndexedDB. | 8 | * F-1-4 jargon |
| The most recent room code stays in local storage until another room replaces it, you clear it in the transfer sheet, or you clear site data. | 26 | * F-1-4 >22 |
| The installed shell works offline after the first visit; starting a transfer requires a network and another browser. | 18 | * F-1-4 jargon |
| See `/privacy` and `/terms` for the plain-language policies. | 8 | pass |
| Deploy `dist/` with the managed functions in `api/` to Azure Static Web Apps. | 13 | pass |
| `public/staticwebapp.config.json` provides explicit SPA routes, a real styled 404 response, security headers, and immutable caching for fingerprinted assets. | 15 | pass |
| The API exposes `GET /api/health` with its service, version, and deployment identity. | 12 | pass |
| Deployment, DNS, and billing stay outside this repository. | 8 | pass |
| Licensed under the MIT License. | 5 | pass |

## Demo and sandbox

**PASS.** From a fresh context, the first landing action reaches `/demo` in one click. That page immediately shows a believable three-file manifest (`picnic-table.jpg`, `family-recipes.pdf`, and `read-me-first.txt`) and a room code. The persistent banner says exactly “Demo — sample data, nothing is saved” and provides **Reset demo** and **Start for real**. Running **Send sample files** produced three verified rows and a receipt. Reset removed `demo:completed` and removed the receipt. A fresh direct `/demo` run created only `sessionStorage["demo:completed"]`, no `friend-file-drop` IndexedDB database, no API request, and no non-same-origin request.

## Claim results

**PASS — 20/20 declared claim commands were run from the clean install.** The aggregate clean `npm test` additionally passed 10 API/config tests and 24 local Chromium tests. The declared IDs exercised were: `demo-receipt`, `no-account`, `free-use`, `demo-isolation`, `offline-reload`, `six-word-room`, `room-expiry`, `direct-transfer`, `resumable-transfer`, `local-receipts`, `opt-in-relay`, `relay-cap`, `privacy-boundaries`, `individual-file-receipts`, `own-files-untouched`, `receipt-export`, `receipt-import`, `demo-no-real-files`, `room-code-storage`, and `api-health`. No declared command failed. F-1-1 remains because the above quoted visitor promises are not registered claims.

## Structure, privacy, and functional checks

- **PASS:** `/`, `/demo`, `/privacy`, and `/terms` use the required title pattern, each has one `h1`, one `main`, a description, canonical URL, OG / Twitter metadata, favicon, and route-specific title after navigation.
- **PASS:** the designed real 404 returns HTTP 404; it has one `h1`, a main landmark, a return action, and no application error. Its metadata/header omissions are F-1-2.
- **PASS:** robots and sitemap exist; header/footer links crawled successfully (with the two mailto links treated as explicit mail actions). Live hashed JS and CSS returned `Cache-Control: public, max-age=31536000, immutable`.
- **PASS:** fresh request capture during demo observed only `https://friend-file-drop.sociobot.in`; no analytics, advertising, contact input, CDN font/script, or provider endpoint appeared.
- **PASS:** `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --workers=1 --reporter=line` passed 9/9. This confirms current live accessibility identities, demo exit/isolation, offline reload, corrupt-direct retry behavior, and dual-consent durable relay behavior.
- **PASS:** no missed leverage was identified. The brief does not imply AI, cloud sync, or importing third-party data; the appropriate receipt import / export capability is already present and tested.

## Earlier-review regression check

Every prior verification and handoff file was read. The prior reports did not use `F-*` IDs, so their source report and finding title are retained below.

| Earlier finding | Current confirmation |
| --- | --- |
| `verification.md`: missing six-word handoff, resume, and opt-in relay | Fixed: current live 9/9 suite performed direct and dual-consent relay flows; local claims cover six-word room, resume, and relay. |
| `verification.md`: incomplete claims | Fixed for the previously named privacy, receipt, demo, export/import, and own-file promises; F-1-1 identifies newly observed remaining unlisted landing promises. |
| `verification.md`: assets not immutable | Fixed: live hashed JS/CSS both return one-year immutable cache control. |
| `verification.md`: unknown URL returns 200 | Fixed: `curl -I /missing-page` returned HTTP 404. |
| `verification-2.md`: fresh `opt-in-relay` claim failure / duplicate bytes / rate limiting / file-picker focus / resize / missing API identity / room-code privacy | Fixed: clean claim and full suite pass; duplicate, rate-limit, focus, resize, room-code, and health tests pass. Live health now returns source revision `d690bb0…`. |
| `verification-3.md`: relay persistence / stale 404 version | Fixed: live durable relay passed; static 404 shows v1.1.1. |
| `verification-4.md`: corrupt bytes got a receipt / Start for real retained demo | Fixed: corrupt-direct retry and live demo-exit regressions pass; fresh storage check confirmed reset/exit isolation. |
| `verification-5.md`: ordinary parallel `npm test` failure | Fixed in this run: 24 local browser tests passed under two workers. |
| `verification-6.md`: late direct status overwrote relay consent / incomplete source revision | Fixed: race regression passed in the full suite and live relay passed; API health now includes `sourceRevision`. |

## What would make this perfect

Register and test every remaining landing promise, use plain and consistent receipt language in the hero and transfer explanation, simplify the README, and make the real 404 match the metadata/navigation contract of the other routes. Then rerun the complete checklist from a clean install and live fresh browser contexts.

## Verdict

**FAIL.** The core product is clear, tryable, and working, but the unlisted claims are a release-blocking contract failure and the three minor findings remain. This cannot be PASS until every finding is resolved.
