# Friend File Drop v1 handoff

## Independent verification update — 2026-08-28 — FAIL

**Candidate:** `ac70e079e4b5bd73a9583e58ac3de1bd7360a625`
**Live URL:** <https://friend-file-drop.sociobot.in>

The candidate is deployed successfully and its live JS, CSS, and hero asset are byte-identical to a fresh local production build. All six required claim commands and the full 12-test suite passed; direct two-browser transfer, demo isolation, offline reload, live axe, mobile/keyboard, and Lighthouse checks also passed.

It is nevertheless **not accepted**. See [`.factory/verification.md`](verification.md) for exact evidence and reproduction. Release blockers are: (1) the product has no real six-word room handoff, resumable same-LAN transfer, or direct-failure opt-in relay path required by the brief; (2) material privacy/storage/network claims are absent from `claims.json` and have no claim test; and (3) live hashed assets use only `max-age=30`, not immutable long-lived caching. A styled unknown-route screen also returns HTTP 200 instead of a real 404 status.

No product code was changed during independent verification; only this handoff and the verification report were added.

## What was built

- A responsive, notebook-style landing page and working transfer bench.
- Direct WebRTC file transfer between two browsers, using two copyable pairing notes and a six-word room code.
- File manifests with names, sizes, MIME types, and SHA-256 hashes before sending.
- Chunked, ordered data-channel transfer with progress, receiver-side hash verification, file downloads, and matching sender/receiver receipts.
- Local IndexedDB receipt history with JSON export and import.
- A one-click `/demo` sandbox with three realistic sample files, progress, a receipt, reset, and isolated `demo:` session storage.
- PWA manifest, install icons, versioned service worker cache, offline fallback, and update notice.
- Home, demo, privacy, terms, styled 404, sitemap, robots, social metadata, and Azure Static Web Apps headers/fallback config.
- An original generated notebook illustration and derived WebP/social assets. Source, prompt, and provenance are in `assets/src/` and `.factory/design.md`.

## How to run

```sh
npm install
npm run dev
npm test
npm run build
```

The deploy output is `dist/`. Its root contains `index.html`.

## Verification on 2026-08-28

- `npm test`: 12/12 Playwright tests passed in Chromium.
- Claim coverage: demo receipt, no account step, free use, no third-party demo traffic, offline reload, and a real two-browser WebRTC file transfer.
- Accessibility: axe found no serious or critical issues on `/`, `/demo`, `/privacy`, or `/terms`.
- Mobile: 390 × 844 layout passed without horizontal overflow; the headline and demo action remained visible.
- Route check: every main route has one `h1`, one `main`, a route title, and working keyboard navigation. The styled 404 route passed.
- Production bundle: 9.75 KB initial JavaScript gzip and 4.70 KB CSS gzip. Hero WebP: 58 KB.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse timings: FCP 0.9 s, LCP 1.7 s, TBT 0 ms, CLS 0, Speed Index 0.9 s.
- Factory URL verification: HTTP 200, `lang=en`, one `h1`, one `main`, no missing image alt text, and no page or console errors.
- `npm audit`: no known vulnerabilities.

## Known limits

- A static site cannot run a shared six-word signaling service. The room code identifies the session, but users must exchange two longer pairing notes through an existing conversation.
- This v1 intentionally has no STUN or TURN service. It sends no metadata to a relay, but direct pairing can fail across restrictive routers. Same-LAN transfer is the dependable path.
- The reliable WebRTC channel retries short interruptions while both pages remain open. A closed or reloaded page cannot resume a partial file.
- Incoming files are assembled in browser memory before download. This v1 targets a few personal files, not multi-gigabyte archives.

These limits are stated in the product and README. The next backend iteration should add a short-lived, rate-limited signaling service keyed by the six-word code, followed by an explicit opt-in relay with a metadata disclosure. Durable partial-file resume should use OPFS and verified chunk offsets.
