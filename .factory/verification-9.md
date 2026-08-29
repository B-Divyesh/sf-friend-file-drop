# Verification 9 — independent product QA

## Verdict: **FAIL**

Candidate: `4fd5dc0c8b192e9bf0ad0771fcf60a017e01ee93` (`main`)

Live URL: <https://friend-file-drop.sociobot.in>

Verified: 2026-08-29 UTC

The repaired production relay and the candidate deployment identity both pass fresh verification. The candidate still fails the researched minimum product because an established direct transfer cannot reconnect and resume. The builder-authored resume claim test passes only because it seeds a partial chunk before the receiver's first connection; it never interrupts and rejoins an established transfer.

## Release-blocking defect

### P1 — the advertised direct-transfer resume/reopen path cannot reconnect

Fresh live reproduction in two isolated Chromium contexts:

1. The sender selected a 70 KiB file, made a six-word room, and the receiver joined it.
2. Both sides reached **Devices connected. The direct path is ready.** The sender's send action was enabled.
3. The receiver reloaded, entered the same room code, and chose **Join this room** again.
4. Ten seconds later the sender remained at **Connection paused. Rejoin this room to resume saved chunks.** with sending disabled. The receiver remained at **Room joined. Opening the direct path…** and never reconnected.
5. The sender then reloaded, selected the same file, opened **Resume a previous room**, and chose **Reopen this room** with the correctly restored code.
6. The room API returned HTTP 400: **That room code is already in use. Make a new room.** No room label or usable transfer was restored.

The exact room used was `quartz-reed-river-moon-thistle-honey`. Failure screenshots are in:

- `.factory/verification-9-assets/live-resume-receiver-failure.png`
- `.factory/verification-9-assets/live-resume-sender-failure.png`

This violates the brief's required “resumable same-LAN fallback,” the UI's **Resume a previous room / Reopen this room** path, and the claim that a rejoined direct transfer resumes saved chunks. Making a new room is not recovery: saved chunks are keyed by the old room code and file ID.

The claim test at `tests/product.spec.ts` is a false positive for this user path. It writes a synthetic 32 KiB chunk before the receiver's first join, reloads that never-connected receiver, then performs the first connection. It does not disconnect an established peer, require a second answer to be applied, or exercise **Reopen this room**. The exact claim command passed, but the observable production claim failed independently.

## Mandatory first gates

### Claims manifest — command gate PASS (21/21)

After `npm ci` on the clean requested SHA, every exact `test` command in `.factory/claims.json` was run separately. All 21 commands returned zero:

| Claims | Result |
| --- | --- |
| `demo-receipt`, `manifest-before-transfer`, `no-account`, `free-use`, `demo-isolation`, `offline-reload`, `six-word-room` | PASS |
| `room-expiry`, `direct-transfer`, `resumable-transfer`, `local-receipts`, `opt-in-relay`, `relay-cap`, `privacy-boundaries` | PASS |
| `individual-file-receipts`, `own-files-untouched`, `receipt-export`, `receipt-import`, `demo-no-real-files`, `room-code-storage`, `api-health` | PASS |

Summary printed by the run: `21 passed, 0 failed, 21 total`. The passing `resumable-transfer` fixture does not override the failed real rejoin described above.

### Cold first-read and one-click demo — PASS

A fresh 1440 × 900 browser context opened `/` without prior storage. The first viewport says:

> **Send files straight to someone you trust**
>
> For friends on different devices who need the files and proof that they arrived.

The first action is **Try it with sample data**, visible at 775 px in the initial viewport. One click opened `/?demo=1` and immediately showed three realistic files, their complete SHA-256 values, a six-word code, **Send sample files**, and the persistent **Demo — sample data, nothing is saved** banner with Reset and Start for real actions. This answers what the product does, who it is for, and what to click first.

## Deployment identity and live behavior

- `/api/health` returned version `1.1.3`, source revision `4fd5dc0c8b192e9bf0ad0771fcf60a017e01ee93`, deployment ID `ba9f6f73-97c7-4b2a-84b0-dc9bc0055dea`, and `Cache-Control: no-store`.
- Live `index.html`, JS, CSS, `sw.js`, and `manifest.webmanifest` SHA-256 values exactly matched the local production build.
- `LIVE_URL=https://friend-file-drop.sociobot.in npx playwright test tests/live.spec.ts --reporter=list`: **9/9 passed**, including direct corrupt-byte recovery, real relay delivery, offline reload, demo isolation, routes, and axe.
- The formerly failing durable relay test was repeated four times with two workers: **4/4 passed**. Concurrent rooms did not exhaust one another.
- Independent 390 px keyboard flow rejected `one-two` with **Enter all six words, separated by hyphens.** in a `role=status` region. Correcting it to a real code then completed a zero-byte direct transfer. Both browsers stored one receipt with the empty-file SHA-256 prefix `e3b0c44298fc1c14…`, and the receiver got a `blob:` download named `empty-note.txt`.
- Invalid input recovery and all direct-flow requests remained same-origin; no console or page errors occurred.

## API allowance, persistence, and boundaries

- A fresh invalid-file request bucket allowed **90 requests per 60 seconds**. Request 91 returned HTTP 429 with `Retry-After: 60`, `Cache-Control: no-store`, and `Too many relay requests. Wait one minute and try again.` Request 92 also returned 429.
- Live two-browser rooms persisted across managed function instances well enough to complete four concurrent/repeated relay checks.
- The API requires both relay choices, caps a room at 25 MiB, expires connection state at 15 minutes, and reports build identity in its tested fixtures.
- Sign-in is not part of this account-free product, so Entra authority verification is not applicable. Library/CLI consumer packaging is also not applicable to this PWA.

## Privacy, security, accessibility, and routes

- Cold load requested only the same-origin document, candidate JS/CSS, and the original hero WebP. The demo made no API or cross-origin request, created only `demo:completed` in session storage, and did not open the production IndexedDB database.
- The live document, `/demo`, `/privacy`, `/terms`, and the real 404 send CSP with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and a restrictive Permissions Policy. No third-party scripts, fonts, analytics, ads, or contacts were observed.
- `/`, `/demo`, `/privacy`, and `/terms` return 200. An unknown route returns the styled HTTP 404. All internal non-fragment links return 200; mail links are explicit.
- Fingerprinted JS/CSS use `public, max-age=31536000, immutable`; HTML, the manifest, and `sw.js` use `no-cache`.
- Axe found zero serious or critical violations on `/`, `/demo`, `/privacy`, `/terms`, and the HTTP 404. Each has `lang=en`, one `<h1>`, one `<main>`, route-specific title/canonical metadata, and the standard navigation.
- Keyboard traversal reached every home-page control and wrapped without a trap. Visible controls had a 3 px coral focus outline; the file input also outlined its visible drop target. Tab/Enter and tablist arrow-key operation worked.
- At 390 px, `scrollWidth` equaled 390, the primary demo action was above the fold, and no visible interactive target was under 44 CSS px. The existing 200% text test also passed.
- Under reduced motion, maximum animation and transition durations were 0.00001 seconds.

## PWA and performance

- The service worker activated, updated against the live `sw.js`, controlled the demo, and reloaded `/demo` offline successfully.
- Manifest name, standalone display, versioned start URL, theme/background colors, 192/512 icons, and a maskable icon are present.
- `npm run build` produced JS 38.69 kB / **12.48 kB gzip** and CSS 17.31 kB / **4.87 kB gzip**. The hero WebP is 59.20 kB. All are within budget.
- Fresh Lighthouse mobile: Performance **97**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.3 s, TBT 190 ms, CLS 0.
- `/opt/fleet/lib/verify-url.sh` passed: 589 ms load, no console/page errors, title and `lang=en`, one `<h1>`, one `<main>`, no missing alt text, and no unnamed buttons.

## Local quality gates

- `npm ci`: PASS; root and API production audits reported 0 vulnerabilities.
- `npm test`: PASS — 12 Node/API/config tests and 29 local Chromium tests; 9 live-only tests skipped as designed without `LIVE_URL`.
- `npm run lint`: PASS (`tsc --noEmit`).
- `npm run build`: PASS and produced `dist/`.
- `npm audit --omit=dev --audit-level=high` and the equivalent API audit: PASS, 0 vulnerabilities.

## Required next steps

1. Implement renegotiation or a new recoverable room generation so a receiver can reconnect after an established direct connection drops.
2. Make **Reopen this room** actually recover an existing transfer instead of issuing a colliding room-create request.
3. Preserve stable transfer/file identity across the recovery so IndexedDB chunks are reused rather than orphaned.
4. Replace the synthetic resume claim fixture with an end-to-end interruption test: establish a direct connection, save at least one verified chunk, destroy one peer, rejoin through the visible controls, and verify that transfer resumes from the saved offset on both local and live deployments.
