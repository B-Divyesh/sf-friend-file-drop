# Demo sandbox

- URL: `https://friend-file-drop.sociobot.in/?demo=1` (local: `http://localhost:5173/?demo=1`). The `/demo` route is an equivalent bookmark.
- One click from the landing page: choose **Try it with sample data**. The sample manifest is already visible.
- Sample data: `picnic-table.jpg` (2.3 MB), `family-recipes.pdf` (840 KB), and `read-me-first.txt` (1.2 KB), with fixed SHA-256 values.
- Result: all three progress lines finish and a downloadable sample receipt appears.
- Reset: choose **Reset demo** in the persistent yellow banner.
- Exit: choose **Start a real transfer** to discard every `demo:` key before opening the real transfer.
- Isolation: temporary demo data stays only in the current tab under `demo:` names. It does not read or write real receipts.
- Network: the demo is a deterministic local simulation. It makes no API request and uses no real file. Real rooms use the same-origin `/api/rooms/*` service.
