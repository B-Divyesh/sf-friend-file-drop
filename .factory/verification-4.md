# Independent verification 4 — FAIL

**Candidate:** `e49606f060f044ebc30288a3174e81660b2c105f` (`main`)

**Live URL:** <https://friend-file-drop.sociobot.in>

**Verified:** 2026-08-29 from a clean checkout. Product source was not modified.

## Verdict

**FAIL — do not release.** The normal direct and relay flows work, the live
static application is byte-identical to the candidate build, and all declared
claim commands pass after the lockfile install. However, the direct receiver
issues a green verified completion receipt after explicitly detecting that the
received bytes do not match the manifest hash. The receipt is this product's
core trust promise, so a false-positive receipt is release blocking.

## Release blocker

### Critical — a hash mismatch still produces “VERIFIED / Transfer finished” on both browsers

Fresh live two-browser reproduction:

1. Select `integrity-check.txt` on the sender. The app calculates and displays
   its SHA-256 manifest hash.
2. Create a room and join it from a fresh receiver browser.
3. After manifest creation, make the sender's `File.slice()` return different
   same-length bytes. This simulates a payload that does not match the signed
   manifest without changing the manifest itself.
4. Send the file through the real deployed WebRTC path.

Observed in room `maple-pebble-green-cobalt-kite-juniper`:

- Receiver status: `integrity-check.txt did not match its hash. Rejoin to retry it.`
- Receiver offered **zero** “Save file” links.
- Despite that failure, receiver and sender each displayed one receipt row
  under **VERIFIED** and **Transfer finished**.
- The receipt said `Both browsers reported the same 1 file.` and included the
  manifest hash `a1a2dc6c5bb738ae…`.
- There were no browser console or page errors.

The implementation explains the result. The direct `file-end` handler reports
the mismatch and returns, but leaves the manifest in `incoming`. The next
`transfer-end` handler creates a receipt from every `incoming` manifest without
tracking which files passed SHA-256, then sends that receipt back to the sender.

This contradicts the researched job (“clear receipt that it finished”), the
landing copy (“proof that they arrived”), and the listed `direct-transfer`
claim (“both sides get a hash receipt”). The current claim test covers only a
happy-path payload and therefore does not catch the false receipt.

Required repair: track successfully verified file IDs, do not create or send a
receipt until every manifest entry has passed its hash check, keep failed rows
failed, and add a claim/regression test that corrupts one payload and asserts no
receipt appears on either side until a successful retry.

## Other finding

### Medium — “Start for real” does not discard demo state

After completing `/demo`, `sessionStorage` contained `demo:completed`. Choosing
**Start for real** navigated to `/` but left that key intact. Returning to
**Demo** immediately restored the old finished receipt and changed the action
to **Run the sample again**. **Reset demo** did clear the key and receipt.

This preserves namespace isolation, but it does not meet the demo-sandbox
contract that leaving demo mode discards demo data (or explicitly offers to
keep it). Clear all `demo:` keys when **Start for real** is chosen and add a
test covering leave-and-return behavior.

## First-read gate — PASS

Cold desktop and 390 px live loads answer all three questions on the first
screen:

- What: **Send files straight to someone you trust**.
- For whom: **For friends on different devices who need the files and proof
  that they arrived.**
- First action: **Try it with sample data**, followed by “The demo opens a ready
  transfer. Your own files stay untouched.”

The action opens the populated sample transfer in one click. The persistent
banner says **Demo — sample data, nothing is saved** and exposes **Reset demo**
and **Start for real**.

## Required claims — PASS in their declared sandboxes

`.factory/claims.json` exists and declares 20 claims. After `npm ci`, every
listed `test` command was run exactly and returned exit 0:

- Browser claims: `demo-receipt`, `no-account`, `free-use`, `demo-isolation`,
  `offline-reload`, `six-word-room`, `direct-transfer`, `resumable-transfer`,
  `local-receipts`, `opt-in-relay`, `privacy-boundaries`,
  `individual-file-receipts`, `own-files-untouched`, `receipt-export`,
  `receipt-import`, `demo-no-real-files`, and `room-code-storage`.
- Node claims: `room-expiry`, `relay-cap`, and `api-health`.

The full local run also passed: **10/10** Node/API/config tests and **22/22**
app Playwright tests (8 live-only tests skipped without `LIVE_URL`). The
corrupted-payload result above is fresh evidence that the happy-path
`direct-transfer` claim test is incomplete, despite its green exit status.
Landing-page and README claim-like statements map to the declared entries; no
separate unlisted marketing claim was found.

## Build and repository gates — PASS

- Candidate identity before work: exactly
  `e49606f060f044ebc30288a3174e81660b2c105f`; worktree clean.
- `npm ci`: passed; root and API installs reported zero vulnerabilities.
- `npm test`: passed.
- `npm run lint` / TypeScript check: passed.
- `npm run build`: passed and produced `dist/index.html`.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilities.
- `npm audit --prefix api --omit=dev --audit-level=high`: zero vulnerabilities.
- Production output: JS 35.83 kB / 11.73 kB gzip; CSS 17.17 kB / 4.84 kB
  gzip; hero WebP 59.20 kB. All are below the contract budgets.

## Live normal, boundary, and recovery checks

- `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test
  tests/live.spec.ts`: **8/8 passed**. This covers all public routes plus axe,
  live offline reload, a real two-browser direct transfer, and the real
  dual-consent relay fallback.
- A zero-byte `empty.txt` completed via live direct WebRTC; both sides received
  a receipt and the receiver got a correctly named Save file link.
- Concurrent live sender/receiver relay-consent POSTs retained both values;
  the final room response was `{sender:true, receiver:true, ready:true}`.
- A 21-entry relay manifest returned 400 with `The manifest must contain 1 to
  20 files.`
- The local relay store accepted exactly 26,214,400 bytes (25 MiB), then
  rejected the next byte with the documented 25 MB message.
- A keyboard-only receiver entry of `one two` produced `Enter all six words,
  separated by hyphens.` The user could correct the input without a reload.
- An invalid receipt JSON produced the specific recovery instruction `That
  file is not a receipt export. Choose a Friend File Drop JSON file.` A valid
  import immediately afterward restored one receipt.

## Accessibility and responsive behavior — PASS

- `verify-url.sh` (with its output directory created) reported title `Friend
  File Drop — send files browser to browser`, `lang=en`, one h1, a main
  landmark, zero missing image alts, zero unlabeled buttons, and zero console
  errors.
- Axe found zero serious/critical findings on the four app routes locally and
  on `/`, `/demo`, `/privacy`, `/terms`, and the real 404 route live.
- At 390 × 844, the h1 and sample action are visible, document width is exactly
  390 px, all visible interactive targets are at least 44 CSS px, and the 200%
  text test has no horizontal overflow.
- Keyboard checks passed for the skip link, transfer tabs with arrow keys,
  room input, join action, and visible 3 px coral focus ring. Activating the
  skip link makes the next Tab land on the first main action.
- With `prefers-reduced-motion: reduce`, smooth scrolling is disabled and
  progress/receipt motion durations reduce to effectively zero (`0.00001s`).
- Mobile Lighthouse: Performance **96**, Accessibility **100**, Best Practices
  **100**, SEO **100**; FCP 1.0 s, LCP 1.3 s, TBT 230 ms, CLS 0.

## Privacy, deployment, headers, and PWA — PASS with one identity limitation

- A complete cold landing → demo → three-file receipt request log contained
  only `https://friend-file-drop.sociobot.in`; there were no API requests in
  demo mode and no console/page errors. Demo wrote only `demo:completed` in
  session storage.
- Live root headers include HSTS, `Referrer-Policy: no-referrer`, nosniff,
  restrictive Permissions-Policy, and a self-only CSP with
  `frame-ancestors 'none'`. HTML and `sw.js` are `no-cache`; the fingerprinted
  JS is `public, max-age=31536000, immutable`; API health is `no-store`.
- The live HTML, JS, CSS, and service-worker SHA-256 hashes exactly match the
  candidate's `dist/` files. The API reports service
  `friend-file-drop-api`, version `1.1.1`, and deployment ID
  `2e38d8bb-57e2-4590-9332-2f3b60f9dd95`.
- The backend's `sourceRevision` is `null`, so exact API commit identity cannot
  be cryptographically confirmed; static deployment identity is exact and
  live API behavior was exercised directly.
- Every internal link crawled returned its expected 200; `/missing-page`
  returned a styled HTTP 404 with the correct title, h1, and route home.
- Service worker control is active at `/sw.js`, cache
  `friend-file-drop-v2` is populated, `registration.update()` completes with
  the current worker activated, and `/demo` reloads successfully offline.
- Fresh rate-limit evidence: requests 1–90 to one room endpoint returned 404;
  request **91** returned **429**. The 429 response included
  `Retry-After: 60`; the remaining requests in the 100-request burst were 429.

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
npm audit --prefix api --omit=dev --audit-level=high
LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts
```

The release-blocking corruption case needs a permanent Playwright regression:
alter sender bytes after manifest hashing, send through the direct path, and
assert that neither browser receives a completion receipt.
