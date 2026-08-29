# Friend File Drop

Send private files between mixed devices and get a clear receipt.

Friend File Drop is a free, account-free browser tool for friends and families. It sends files directly between two browsers. Both people see the file list, matching digital fingerprints (SHA-256), and the finish time.

The sender shares one six-word room code. The code connects the browsers for 15 minutes. If the direct path fails, both people can choose a temporary 25 MB relay. Saved parts of an interrupted transfer stay in this browser so it can continue when you rejoin.

## Try the demo

Open `/?demo=1` or `http://localhost:5173/?demo=1`. The page starts with three sample files ready. Choose **Send sample files** to see their receipt.

The demo keeps temporary data only in this tab, under names starting with `demo:`. It never reads real receipts.

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

Finished receipts and saved transfer parts stay only in this browser. The latest room code and details needed to continue also stay in this browser. This lets a sender choose the same files after a reload and continue from where the transfer stopped. Another room replaces this data. You can also clear it from the transfer sheet or by clearing site data.

The installed app opens offline after the first visit. Sending files requires a network and another browser.

See [`/privacy`](https://friend-file-drop.sociobot.in/privacy) and [`/terms`](https://friend-file-drop.sociobot.in/terms) for the plain-language policies.

## Deploy

After committing and pushing `main`, run `scripts/deploy-static.sh`. It builds `dist/` and deploys the site and managed API. It sets `FRIEND_FILE_DROP_SOURCE_REVISION` to the full deployed commit SHA. The deployment fails unless live `/api/health` reports that exact SHA.

`public/staticwebapp.config.json` defines the SPA routes, styled 404, security headers, and immutable asset caching. Health also reports the managed deployment identity. It reports unavailable when either identity value is missing. DNS and billing stay outside this repository.

## Project notes

- Visual system: [`.factory/design.md`](.factory/design.md)
- Testable claims: [`.factory/claims.json`](.factory/claims.json)
- Demo contract: [`.factory/demo.md`](.factory/demo.md)
- Build handoff: [`.factory/handoff.md`](.factory/handoff.md)

Licensed under the MIT License.
