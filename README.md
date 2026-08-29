# Friend File Drop

Send private files between mixed devices and get a clear receipt.

Friend File Drop is a free, account-free browser tool for friends and families. It sends files directly between two browsers. Both people see the file list, a matching file hash, and the finish time.

The sender shares one six-word room code. The code connects the browsers for 15 minutes. If the direct path fails, both people can choose a temporary 25 MB relay. Verified pieces stay in this browser so a rejoined transfer can continue.

## Try the sandbox

Open `/?demo=1` or `http://localhost:5173/?demo=1`. The page starts with three sample files ready. Choose **Send sample files** to see their receipt.

Demo state uses only session-storage keys starting with `demo:`. It never reads real receipts.

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. For a real transfer, start the API in `api/`. Then open two browsers and share the six-word code.

## Test and build

```sh
npm test
npm run lint
npm run build
```

`npm test` runs API unit tests, builds the app, and runs Playwright claim, accessibility, offline, transfer, relay, resume, and mobile checks. The production output is `dist/`, with `dist/index.html` at its root.

## Privacy and offline use

The app has no analytics, advertising, third-party runtime scripts, or contact access. Files normally travel directly between the two browsers. Both people must choose the relay before it accepts file bytes.

Finished receipts and verified pieces stay in this browser's database. The most recent room code and its file names, sizes, hashes, and transfer IDs also stay in this browser. This lets a sender reselect the same files after a reload and reopen the room at the saved offset. Another room replaces this data. You can also clear it from the transfer sheet or by clearing site data.

The installed app opens offline after the first visit. Sending files requires a network and another browser.

See [`/privacy`](https://friend-file-drop.sociobot.in/privacy) and [`/terms`](https://friend-file-drop.sociobot.in/terms) for the plain-language policies.

## Deploy

Deploy `dist/` with the managed functions in `api/` to Azure Static Web Apps. Set `FRIEND_FILE_DROP_SOURCE_REVISION` to the full deployed commit SHA. `public/staticwebapp.config.json` provides explicit SPA routes, a real styled 404 response, security headers, and immutable caching for fingerprinted assets. The API exposes `GET /api/health` with its service, version, exact source revision, and deployment identity. It reports unavailable when either identity value is missing. Deployment, DNS, and billing stay outside this repository.

## Project notes

- Visual system: [`.factory/design.md`](.factory/design.md)
- Testable claims: [`.factory/claims.json`](.factory/claims.json)
- Demo contract: [`.factory/demo.md`](.factory/demo.md)
- Build handoff: [`.factory/handoff.md`](.factory/handoff.md)

Licensed under the MIT License.
