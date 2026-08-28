# Friend File Drop

Send private files between mixed devices and get a clear receipt.

Friend File Drop is a free, account-free browser tool for friends and families. It sends files over a direct WebRTC data channel. Both people get the file manifest, SHA-256 hashes, and finish time.

The static v1 uses two pairing notes for WebRTC signaling. Send those notes through a conversation you already share. The notes are connection details, not file links. Both browsers must stay open. Transfers work on a reachable direct path, including the same local network; this version has no relay.

## Try the sandbox

Open `/demo` or `http://localhost:5173/demo`, then choose **Send sample files**. It transfers three local sample records and shows a receipt. Demo state uses only `demo:` session-storage keys and never reads real receipts.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. To test a real transfer, open the page in two current browsers, choose opposite roles, and exchange the two pairing notes.

## Test and build

```sh
npm test
npm run build
```

`npm test` builds the app and runs the Playwright claim, accessibility, offline, transfer, and mobile checks. The production output is `dist/`, with `dist/index.html` at its root.

## Privacy and offline use

The app loads no third-party runtime scripts, fonts, or analytics. Files travel only through the paired WebRTC connection. Receipts stay in local IndexedDB. The service worker makes the installed app available offline after the first visit; starting a transfer still requires two reachable browsers.

See [`/privacy`](https://friend-file-drop.sociobot.in/privacy) and [`/terms`](https://friend-file-drop.sociobot.in/terms) for the plain-language policies.

## Deploy

Deploy the contents of `dist/` as a static site. `public/staticwebapp.config.json` provides SPA fallback, the styled 404 response, security headers, and asset handling for Azure Static Web Apps. Deployment, DNS, and billing are outside this repository.

## Project notes

- Visual system: [`.factory/design.md`](.factory/design.md)
- Testable claims: [`.factory/claims.json`](.factory/claims.json)
- Demo contract: [`.factory/demo.md`](.factory/demo.md)
- Build handoff: [`.factory/handoff.md`](.factory/handoff.md)

Licensed under the MIT License.
