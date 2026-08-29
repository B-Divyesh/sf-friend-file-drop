# Polish 2 clean-clone results

Verified from `/tmp/friend-file-drop-polish-2.osQF9I/repo`, cloned from repair commit `f4ee770` on 2026-08-29 UTC.

## Declared claims: 22/22 passed

- `demo-ready-in-one-click`
- `demo-receipt`
- `manifest-before-transfer`
- `no-account`
- `free-use`
- `demo-isolation`
- `offline-reload`
- `six-word-room`
- `room-expiry`
- `direct-transfer`
- `resumable-transfer`
- `local-receipts`
- `opt-in-relay`
- `relay-cap`
- `privacy-boundaries`
- `individual-file-receipts`
- `own-files-untouched`
- `receipt-export`
- `receipt-import`
- `demo-no-real-files`
- `room-code-storage`
- `api-health`

Each exact `test` command in `.factory/claims.json` ran independently after `npm ci`.

## Full clean-clone gates

- `npm test`: 19 Node tests passed; 29 local Chromium tests passed; 10 live-only tests skipped as designed.
- `npm run lint`: passed.
- `npm run build`: passed; `dist/index.html` exists.
- Bundle: 13.09 KB JavaScript gzip and 4.87 KB CSS gzip.

