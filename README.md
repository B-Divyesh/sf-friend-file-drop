# Friend File Drop

Send private files between mixed devices and get a clear receipt.

Friend File Drop is a free, account-free browser tool for friends and families. It sends files over a direct WebRTC data channel. Both people get the file manifest, SHA-256 hashes, and finish time.

The sender shares one six-word room code. A 15-minute signaling room connects the browsers. If the direct path fails, both people can choose a temporary 25 MB relay. Direct-transfer chunks are checkpointed in IndexedDB, so rejoining the same room resumes at the saved offset.

## Try the sandbox

Open `/demo` or `http://localhost:5173/demo`, then choose **Send sample files**. It transfers three local sample records and shows a receipt. Demo state uses only `demo:` session-storage keys and never reads real receipts.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. To test a real transfer, run an Azure Functions-compatible API from `api/`, then open the page in two current browsers and share the six-word code.

## Test and build

```sh
npm test
npm run lint
npm run build
```

`npm test` runs API unit tests, builds the app, and runs Playwright claim, accessibility, offline, transfer, relay, resume, and mobile checks. The production output is `dist/`, with `dist/index.html` at its root.

## Privacy and offline use

The app has no analytics, advertising, third-party runtime scripts, or contact access. Direct files use WebRTC. Both people must opt in before relay bytes are accepted. Receipts and resumable direct-transfer chunks use local IndexedDB. The most recent room code stays in local storage until another room replaces it, you clear it in the transfer sheet, or you clear site data. The installed shell works offline after the first visit; starting a transfer requires a network and another browser.

See [`/privacy`](https://friend-file-drop.sociobot.in/privacy) and [`/terms`](https://friend-file-drop.sociobot.in/terms) for the plain-language policies.

## Deploy

Deploy `dist/` with the managed functions in `api/` to Azure Static Web Apps. `public/staticwebapp.config.json` provides explicit SPA routes, a real styled 404 response, security headers, and immutable caching for fingerprinted assets. The API exposes `GET /api/health` with its service, version, and deployment identity. Deployment, DNS, and billing stay outside this repository.

## Project notes

- Visual system: [`.factory/design.md`](.factory/design.md)
- Testable claims: [`.factory/claims.json`](.factory/claims.json)
- Demo contract: [`.factory/demo.md`](.factory/demo.md)
- Build handoff: [`.factory/handoff.md`](.factory/handoff.md)

Licensed under the MIT License.
