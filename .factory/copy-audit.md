# Copy audit

Audited 2026-08-29 after polish round 3. Counts use whitespace-delimited words; hyphenated terms and numbers count as one word. Every reader-facing sentence is at or below 22 words. No banned marketing language remains.

## Landing page

| Copy | Words | Check |
| --- | ---: | --- |
| Skip to main content | 4 | pass |
| Friend File Drop | 3 | pass |
| Demo | 1 | pass |
| How it works | 3 | pass |
| Privacy | 1 | pass |
| Browser-to-browser file transfer | 3 | pass |
| Send files straight to someone you trust | 7 | pass |
| For friends on different devices who need the files and proof that they arrived. | 14 | pass |
| Try it with sample data | 5 | pass |
| Choose your files | 3 | pass |
| The demo opens a ready transfer. | 6 | pass — `demo-ready-in-one-click` |
| Your own files stay untouched. | 5 | pass — `own-files-untouched` |
| No account or app | 4 | pass — `no-account` |
| Files go direct when browsers connect | 6 | pass — `direct-transfer` |
| Free to use | 3 | pass — `free-use` |
| A paper bridge carries three file cards from a phone to a laptop. | 13 | pass — image alt |
| Each selected file has a receipt. | 6 | pass — `individual-file-receipts` |
| Both sides get the same receipt. | 6 | pass — `direct-transfer` |
| Prepare a private transfer | 4 | pass |
| Choose whether this device sends or receives. | 7 | pass |
| The receiver joins with the six-word room code. | 8 | pass — `six-word-room` |
| Send files | 2 | pass |
| Receive files | 2 | pass |
| Choose files to send | 4 | pass |
| or drop them on this sheet | 6 | pass |
| The file list shows each file's name, size, and digital fingerprint before anything moves. | 14 | pass — `manifest-before-transfer` |
| A fingerprint uses SHA-256. | 4 | pass — definition |
| Files to send | 3 | pass |
| Your chosen files will appear here. | 6 | pass |
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
| This room expires after 15 minutes. | 6 | pass — `room-expiry` |
| Direct path not working? | 4 | pass |
| The relay receives file names, digital fingerprints, contents, IP addresses, and byte counts. | 12 | pass — `opt-in-relay` |
| It holds up to 25 MB until the receipt or room expiry. | 12 | pass — `relay-cap` |
| Use the private relay | 4 | pass |
| Join the sender's room | 4 | pass |
| Six-word room code | 3 | pass |
| Ask the sender for the six words shown on their screen. | 11 | pass |
| Join this room | 3 | pass |
| Incoming files | 2 | pass |
| File names and sizes appear after the browsers connect. | 9 | pass |
| How browser-to-browser transfer works | 4 | pass |
| The room code connects the two browsers. | 7 | pass — `six-word-room` |
| Choose the files | 3 | pass |
| The sender sees every name, size, and digital fingerprint before sending. | 11 | pass — `manifest-before-transfer` |
| Each fingerprint uses SHA-256. | 4 | pass — definition |
| Share six words | 3 | pass |
| The receiver enters the room code. | 6 | pass — `six-word-room` |
| The room code works for 15 minutes. | 7 | pass — `room-expiry` |
| Check the receipt | 3 | pass |
| Both browsers record the names, fingerprints, and finish time. | 9 | pass — `direct-transfer` |
| What leaves your browser | 4 | pass |
| The room service gets the six-word code and connection details for 15 minutes. | 12 | pass — `connection-metadata-boundary`, `room-expiry` |
| The app never asks for your contacts. | 7 | pass — `privacy-boundaries` |
| Files go direct unless both people choose the relay. | 9 | pass — `direct-transfer`, `opt-in-relay` |
| The relay accepts up to 25 MB and removes file bytes after the receipt. | 14 | pass — `relay-cap`, `opt-in-relay` |
| Send private files and keep a finished receipt. | 8 | pass |
| Terms | 1 | pass |

## Demo and legal routes

| Copy | Words | Check |
| --- | ---: | --- |
| Demo — sample data, nothing is saved | 7 | pass — `demo-isolation` |
| Reset demo | 2 | pass |
| Start a real transfer | 4 | pass |
| Sample files ready | 3 | pass |
| Run the transfer without using files from your device. | 9 | pass — `demo-no-real-files` |
| Sample files | 2 | pass |
| Send sample files | 3 | pass |
| Ready. The sample makes no API request and uses no files from your device. | 14 | pass — `demo-no-real-files` |
| The room service gets the six-word code and connection details. | 10 | pass — `connection-metadata-boundary` |
| It does not get file names, digital fingerprints, file contents, or receipts from a direct transfer. | 16 | pass — `connection-metadata-boundary` |
| The relay is used only after both people choose it. | 10 | pass — `opt-in-relay` |
| It then receives the file list and contents. | 9 | pass — `opt-in-relay` |
| Page not found | 3 | pass |
| The address does not point to a page here. | 9 | pass |

## README

| Sentence | Words | Check |
| --- | ---: | --- |
| Send private files between mixed devices and get a clear receipt. | 11 | pass |
| Friend File Drop is a free, account-free browser tool for friends and families. | 13 | pass |
| It sends files directly between two browsers. | 7 | pass |
| Both people see the file list, matching digital fingerprints (SHA-256), and the finish time. | 13 | pass |
| The sender shares one six-word room code. | 7 | pass |
| The code connects the browsers for 15 minutes. | 8 | pass |
| If the direct path fails, both people can choose a temporary 25 MB relay. | 14 | pass |
| Saved parts of an interrupted transfer stay in this browser so it can continue when you rejoin. | 17 | pass |
| The page starts with three sample files ready. | 8 | pass — `demo-ready-in-one-click` |
| Choose Send sample files to see their receipt. | 8 | pass — `demo-receipt` |
| The demo keeps temporary data only in this tab, under names starting with demo. | 14 | pass — `demo-isolation` |
| It never reads real receipts. | 5 | pass — `demo-isolation` |
| Finished receipts and saved transfer parts stay only in this browser. | 11 | pass — `local-receipts` |
| The latest room code and details needed to continue also stay in this browser. | 13 | pass — `room-code-storage` |
| This lets a sender choose the same files after a reload and continue from where the transfer stopped. | 18 | pass — `resumable-transfer` |
| Another room replaces this data. | 5 | pass — `room-code-storage` |
| You can also clear it from the transfer sheet or by clearing site data. | 14 | pass — `room-code-storage` |
| The installed app opens offline after the first visit. | 9 | pass — `offline-reload` |
| Sending files requires a network and another browser. | 8 | pass |

## Terminology

| Concept | One term |
| --- | --- |
| a practice session with shipped data | demo |
| selected or incoming file collection | file list |
| byte-level integrity value | digital fingerprint |
| proof of completion | receipt |
| browser-to-browser session | room |
| optional server path for file bytes | relay |

## First-screen read-aloud check

“Send files straight to someone you trust. For friends on different devices who need the files and proof that they arrived. Try it with sample data.”

This states the job, audience, result, and first action in one breath. At 1440 × 900, the three facts also remain visible with the action.
