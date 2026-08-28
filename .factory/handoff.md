# Friend File Drop v1 handoff

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
