import './styles.css';
import { getReceipts, saveReceipt, type SavedReceipt } from './db';
import { buildManifest, DirectTransfer, makeRoomCode, validRoomCode, type FileManifest } from './transfer';

type Route = 'home' | 'demo' | 'privacy' | 'terms' | 'not-found';

const app = document.querySelector<HTMLDivElement>('#app')!;
const titles: Record<Route, string> = {
  home: 'Friend File Drop — send files browser to browser',
  demo: 'Demo — Friend File Drop',
  privacy: 'Privacy — Friend File Drop',
  terms: 'Terms — Friend File Drop',
  'not-found': 'Page not found — Friend File Drop'
};

const descriptions: Record<Route, string> = {
  home: 'Send private files between phones and computers, with no account and a clear receipt when the transfer finishes.',
  demo: 'Run a sample browser transfer and see its file manifest, hashes, progress, and finished receipt.',
  privacy: 'Read how Friend File Drop handles files, connection details, local receipts, and demo data.',
  terms: 'Read the plain-language terms for using Friend File Drop.',
  'not-found': 'This Friend File Drop page could not be found.'
};

function routeFromPath(path: string): Route {
  if (path === '/') return 'home';
  if (path === '/demo') return 'demo';
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  return 'not-found';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeText(value: string): string {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

function header(): string {
  return `<header class="site-header">
    <a class="wordmark" href="/" data-link aria-label="Friend File Drop home"><span class="wordmark-mark" aria-hidden="true">F→F</span><span>Friend File Drop</span></a>
    <nav aria-label="Main navigation">
      <a href="/demo" data-link>Demo</a>
      <a href="/#how">How it works</a>
      <a href="/privacy" data-link>Privacy</a>
    </nav>
  </header>`;
}

function footer(): string {
  return `<footer class="site-footer">
    <p>Send private files and keep a finished receipt.</p>
    <nav aria-label="Footer navigation"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a></nav>
    <p>Built by Param Factory · v1.1.1 · <span title="Generated with the factory image model">Original generated art</span></p>
  </footer>`;
}

function shell(content: string, demo = false): string {
  return `${demo ? demoBanner() : ''}${header()}${content}${footer()}<div class="route-status sr-only" aria-live="polite"></div><div id="toast-region" class="toast-region" aria-live="polite"></div>`;
}

function demoBanner(): string {
  return `<aside class="demo-banner" aria-label="Demo mode">
    <strong>Demo — sample data, nothing is saved</strong>
    <span class="demo-actions"><button class="text-button" id="reset-demo" type="button">Reset demo</button><a href="/" data-link data-leave-demo>Start for real</a></span>
  </aside>`;
}

function clearDemoStorage(): void {
  Object.keys(sessionStorage).filter((key) => key.startsWith('demo:')).forEach((key) => sessionStorage.removeItem(key));
}

function homePage(): string {
  return shell(`<main id="main">
    <section class="hero notebook-grid" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="eyebrow">Browser-to-browser file transfer</p>
        <h1 id="home-title" tabindex="-1">Send files straight to someone you trust</h1>
        <p class="lead">For friends on different devices who need the files and proof that they arrived.</p>
        <div class="hero-actions">
          <a class="button primary" href="/demo" data-link>Try it with sample data</a>
          <a class="button secondary" href="#drop">Choose your files</a>
        </div>
        <p class="action-note">The demo opens a ready transfer. Your own files stay untouched.</p>
        <ul class="plain-facts" aria-label="Product facts">
          <li>No account or app</li>
          <li>Files go direct when browsers connect</li>
          <li>Free to use</li>
        </ul>
      </div>
      <figure class="hero-art">
        <picture><img src="/assets/notebook-transfer.webp" width="768" height="512" fetchpriority="high" decoding="async" alt="A paper bridge carries three file cards from a phone to a laptop." /></picture>
        <figcaption>Each file crosses once. Both sides get the same record.</figcaption>
      </figure>
    </section>
    <section class="workbench ruled" id="drop" aria-labelledby="workbench-title">
      <div class="section-intro"><p class="margin-number">01</p><div><h2 id="workbench-title">Prepare a private transfer</h2><p>Choose whether this device sends or receives. The receiver joins with the six-word room code.</p></div></div>
      <div id="transfer-app" class="transfer-app"></div>
      <div id="receipt-history"></div>
    </section>
    <section class="how-section" id="how" aria-labelledby="how-title">
      <div class="section-intro"><p class="margin-number">02</p><div><h2 id="how-title">How the files cross</h2><p>The two browsers agree on one private path.</p></div></div>
      <ol class="lab-steps">
        <li><span>1</span><div><h3>Choose the files</h3><p>The sender sees every name, size, and SHA-256 hash before sending.</p></div></li>
        <li><span>2</span><div><h3>Share six words</h3><p>The receiver enters the room code. Short-lived signaling opens a direct browser path.</p></div></li>
        <li><span>3</span><div><h3>Check the receipt</h3><p>Both browsers record the names, hashes, and finish time.</p></div></li>
      </ol>
    </section>
    <section class="limits-section" aria-labelledby="limits-title">
      <div class="torn-note"><p class="eyebrow">Margin note</p><h2 id="limits-title">What the room service handles</h2><ul><li>Room connection details expire after 15 minutes.</li><li>The app never asks for your contacts.</li><li>Files go direct unless both people choose the relay.</li><li>The relay accepts up to 25 MB and removes file bytes after the receipt.</li></ul></div>
    </section>
  </main>`);
}

function demoPage(): string {
  return shell(`<main id="main" class="demo-main">
    <section class="demo-heading notebook-grid">
      <div><p class="eyebrow">One-click practice transfer</p><h1 id="demo-title" tabindex="-1">Send sample files and check the receipt</h1><p class="lead">Three sample files are ready. Run the transfer without using your files.</p></div>
      <div class="demo-code"><span>Room code</span><strong>maple-river-coral-finch-paper-moon</strong></div>
    </section>
    <section class="demo-sheet" aria-labelledby="sample-title">
      <div class="sheet-heading"><div><h2 id="sample-title">Sample manifest</h2><p>From Mina's phone · Saturday picnic</p></div><span class="paperclip" aria-hidden="true"></span></div>
      <ul class="file-list" id="demo-files"></ul>
      <div class="transfer-controls"><button class="button primary" type="button" id="run-demo">Send sample files</button><p id="demo-state" class="state-note" role="status">Ready. No network or real files are used.</p></div>
      <div id="demo-receipt"></div>
    </section>
  </main>`, true);
}

function legalPage(kind: 'privacy' | 'terms'): string {
  const privacy = `<article class="legal-sheet"><p class="eyebrow">Plain-language policy · 28 August 2026</p><h1 tabindex="-1">Know what each transfer shares</h1><p class="lead">Friend File Drop uses a short-lived room service to connect two browsers.</p><h2>Direct transfers</h2><p>The room service receives the six-word code, network address, and WebRTC connection details. File names, hashes, contents, and receipts travel through the paired WebRTC connection.</p><h2>Relay transfers</h2><p>The relay is used only after both people choose it. It then receives the file manifest and contents over HTTPS. It limits each room to 25 MB and removes file bytes after the receipt or room expiry.</p><h2>What stays on this device</h2><p>Finished receipts use this browser's IndexedDB. Incomplete direct-transfer chunks stay there for resume. Demo receipts use a separate session-only key. The most recent room code stays in this browser's local storage so you can reopen it. It is replaced by the next room code, and you can clear it from the transfer sheet or by clearing site data.</p><h2>Tracking and contacts</h2><p>The app has no analytics, advertising, third-party runtime scripts, or contact access.</p><h2>Contact</h2><p>Privacy questions can be sent to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p></article>`;
  const terms = `<article class="legal-sheet"><p class="eyebrow">Terms · 28 August 2026</p><h1 tabindex="-1">Use Friend File Drop with care</h1><p class="lead">You may use this free tool to send files you have the right to share.</p><h2>Your responsibility</h2><p>Do not send illegal, harmful, or unwanted material. Confirm the six words with your intended recipient.</p><h2>Availability</h2><p>The tool is provided as-is. Browser, device, and network limits can interrupt a transfer. Keep the original file until the receipt appears.</p><h2>Temporary relay custody</h2><p>If both people choose the relay, it temporarily holds file bytes. A local receipt is not a backup of file contents.</p><h2>Contact</h2><p>Terms questions can be sent to <a href="mailto:hello@sociobot.in">hello@sociobot.in</a>.</p></article>`;
  return shell(`<main id="main" class="legal-main">${kind === 'privacy' ? privacy : terms}</main>`);
}

function notFoundPage(): string {
  return shell(`<main id="main" class="not-found"><div class="lost-sheet"><p class="error-code">404</p><h1 tabindex="-1">This notebook page is missing</h1><p>The address does not point to a page here.</p><a class="button primary" href="/" data-link>Return to the file drop</a></div></main>`);
}

const sampleFiles: FileManifest[] = [
  { id: 'picnic-photo', name: 'picnic-table.jpg', type: 'image/jpeg', size: 2457600, hash: '7d6937b9d57b343a82c930f195567f9eb64e16ef52fe32d926e5130fb37376c1' },
  { id: 'recipe-book', name: 'family-recipes.pdf', type: 'application/pdf', size: 860160, hash: '62fdfe29e7c9fba645a4a943c8e6d7fca73f43c1f228288d0c844991afa88497' },
  { id: 'note', name: 'read-me-first.txt', type: 'text/plain', size: 1228, hash: 'b47b67ef28ed857e3aee9f8c43c129e95d1a956f53cb696637d290f0dc554ee2' }
];

function fileRow(file: FileManifest, withRemove = false): string {
  return `<li class="file-row" data-file-id="${file.id}"><div class="file-name"><span class="file-dot" aria-hidden="true"></span><div><strong>${escapeText(file.name)}</strong><span>${formatBytes(file.size)} · SHA-256 <code>${file.hash.slice(0, 12)}…</code></span></div></div><progress value="0" max="${file.size}" aria-label="Progress for ${escapeText(file.name)}"></progress><span class="file-status">Waiting</span>${withRemove ? `<button class="remove-file" type="button" data-remove="${file.id}" aria-label="Remove ${escapeText(file.name)}">Remove</button>` : ''}</li>`;
}

function receiptMarkup(receipt: SavedReceipt): string {
  return `<section class="receipt" aria-labelledby="receipt-title"><div class="verified-stamp">Verified</div><h2 id="receipt-title">Transfer finished</h2><p>Both browsers reported the same ${receipt.files.length} file${receipt.files.length === 1 ? '' : 's'}.</p><dl><div><dt>Room</dt><dd>${escapeText(receipt.roomCode)}</dd></div><div><dt>Finished</dt><dd><time datetime="${receipt.completedAt}">${new Date(receipt.completedAt).toLocaleString()}</time></dd></div></dl><ul>${receipt.files.map((file) => `<li><span>${escapeText(file.name)}</span><code>${file.hash.slice(0, 16)}…</code></li>`).join('')}</ul><button class="button secondary download-receipt" type="button">Download receipt</button></section>`;
}

function attachReceiptDownload(container: ParentNode, receipt: SavedReceipt): void {
  container.querySelector<HTMLButtonElement>('.download-receipt')?.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `friend-file-drop-receipt-${receipt.id.slice(0, 8)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

function setupDemo(): void {
  const list = document.querySelector<HTMLUListElement>('#demo-files');
  const button = document.querySelector<HTMLButtonElement>('#run-demo');
  const state = document.querySelector<HTMLElement>('#demo-state');
  const receiptBox = document.querySelector<HTMLDivElement>('#demo-receipt');
  if (!list || !button || !state || !receiptBox) return;
  list.innerHTML = sampleFiles.map((file) => fileRow(file)).join('');
  const completed = sessionStorage.getItem('demo:completed');
  if (completed) {
    const receipt = JSON.parse(completed) as SavedReceipt;
    list.querySelectorAll<HTMLProgressElement>('progress').forEach((progress) => (progress.value = progress.max));
    list.querySelectorAll<HTMLElement>('.file-status').forEach((status) => (status.textContent = 'Verified'));
    receiptBox.innerHTML = receiptMarkup(receipt);
    state.textContent = 'Finished. The hashes match.';
    button.textContent = 'Run the sample again';
    attachReceiptDownload(receiptBox, receipt);
  }
  button.addEventListener('click', () => {
    button.disabled = true;
    receiptBox.innerHTML = '';
    state.textContent = 'Sending the three sample files…';
    let percent = 0;
    const timer = window.setInterval(() => {
      percent += 10;
      sampleFiles.forEach((file) => {
        const row = list.querySelector<HTMLElement>(`[data-file-id="${file.id}"]`)!;
        row.querySelector<HTMLProgressElement>('progress')!.value = file.size * (percent / 100);
        row.querySelector<HTMLElement>('.file-status')!.textContent = percent < 100 ? `${percent}%` : 'Verified';
      });
      if (percent >= 100) {
        window.clearInterval(timer);
        const receipt: SavedReceipt = { id: 'demo-receipt-001', roomCode: 'maple-river-coral-finch-paper-moon', completedAt: new Date().toISOString(), direction: 'sent', files: sampleFiles.map(({ name, size, hash }) => ({ name, size, hash })) };
        sessionStorage.setItem('demo:completed', JSON.stringify(receipt));
        receiptBox.innerHTML = receiptMarkup(receipt);
        attachReceiptDownload(receiptBox, receipt);
        state.textContent = 'Finished. The hashes match.';
        button.disabled = false;
        button.textContent = 'Run the sample again';
      }
    }, 70);
  });
  document.querySelector('#reset-demo')?.addEventListener('click', () => {
    clearDemoStorage();
    render('demo', false);
  });
}

function setupTransferApp(): void {
  const root = document.querySelector<HTMLDivElement>('#transfer-app');
  if (!root) return;
  let files: File[] = [];
  let manifests: FileManifest[] = [];
  let transfer: DirectTransfer | undefined;
  let roomCode = '';
  let mode: 'send' | 'receive' = 'send';

  const start = () => {
    root.innerHTML = `<div class="mode-tabs" role="tablist" aria-label="This device will"><button id="send-tab" role="tab" aria-controls="mode-panel" aria-selected="${mode === 'send'}" tabindex="${mode === 'send' ? '0' : '-1'}" type="button">Send files</button><button id="receive-tab" role="tab" aria-controls="mode-panel" aria-selected="${mode === 'receive'}" tabindex="${mode === 'receive' ? '0' : '-1'}" type="button">Receive files</button></div><div id="mode-panel" role="tabpanel" aria-labelledby="${mode}-tab"></div>`;
    const chooseMode = (next: 'send' | 'receive') => { mode = next; start(); root.querySelector<HTMLButtonElement>(`#${next}-tab`)?.focus(); };
    root.querySelector('#send-tab')?.addEventListener('click', () => chooseMode('send'));
    root.querySelector('#receive-tab')?.addEventListener('click', () => chooseMode('receive'));
    root.querySelector('.mode-tabs')?.addEventListener('keydown', (event) => {
      if (event instanceof KeyboardEvent && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        chooseMode(mode === 'send' ? 'receive' : 'send');
      }
    });
    mode === 'send' ? renderSender() : renderReceiver();
  };

  const hooks = () => ({
    onState: (message: string, tone: 'note' | 'error' | 'success' = 'note') => {
      const state = root.querySelector<HTMLElement>('#real-state');
      if (state) { state.textContent = message; state.dataset.tone = tone; }
      root.querySelector<HTMLButtonElement>('#send-now')?.toggleAttribute('disabled', !transfer?.isReady);
    },
    onProgress: (id: string, done: number) => {
      const progress = root.querySelector<HTMLProgressElement>(`[data-file-id="${id}"] progress`);
      if (progress) progress.value = done;
    },
    onManifest: (received: FileManifest[]) => {
      manifests = received;
      const list = root.querySelector<HTMLUListElement>('#real-files');
      if (list) list.innerHTML = manifests.map((file) => fileRow(file)).join('');
    },
    onFile: (manifest: FileManifest, blob: Blob) => {
      const row = root.querySelector<HTMLElement>(`[data-file-id="${manifest.id}"]`);
      if (row) {
        row.querySelector<HTMLElement>('.file-status')!.textContent = 'Verified';
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = manifest.name;
        link.textContent = 'Save file';
        link.className = 'save-file';
        row.append(link);
      }
    },
    onFileError: (manifest: FileManifest) => {
      const row = root.querySelector<HTMLElement>(`[data-file-id="${manifest.id}"]`);
      if (row) row.querySelector<HTMLElement>('.file-status')!.textContent = 'Failed';
    },
    onReceipt: async (receipt: SavedReceipt) => {
      await saveReceipt(receipt);
      const box = root.querySelector<HTMLDivElement>('#real-receipt');
      if (box) { box.innerHTML = receiptMarkup(receipt); attachReceiptDownload(box, receipt); }
    }
  });

  function renderSender(): void {
    const panel = root!.querySelector<HTMLDivElement>('#mode-panel')!;
    panel.innerHTML = `<div class="sender-layout"><div><label class="drop-zone" id="file-drop"><input id="file-input" type="file" multiple /><span class="drop-title">Choose files to send</span><span>or drop them on this sheet</span></label><p class="field-help">The list shows file sizes and hashes before anything moves.</p></div><div class="manifest-panel"><h3>File manifest</h3><ul class="file-list compact" id="real-files"><li class="empty-state">Your chosen files will appear here.</li></ul></div></div><div id="pairing-area"></div><div id="real-receipt"></div>`;
    const input = panel.querySelector<HTMLInputElement>('#file-input')!;
    const zone = panel.querySelector<HTMLElement>('#file-drop')!;
    const choose = async (selected: File[]) => {
      files = selected;
      const list = panel.querySelector<HTMLUListElement>('#real-files')!;
      list.innerHTML = '<li class="empty-state">Calculating SHA-256 hashes…</li>';
      try {
        manifests = await buildManifest(files);
        list.innerHTML = manifests.map((file) => fileRow(file, true)).join('');
        list.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((button) => button.addEventListener('click', () => {
          const index = manifests.findIndex((item) => item.id === button.dataset.remove);
          files.splice(index, 1); manifests.splice(index, 1); void choose([...files]);
        }));
        renderPairing();
      } catch {
        list.innerHTML = '<li class="error-note">The browser could not read a file. Remove it and choose the files again.</li>';
      }
    };
    input.addEventListener('change', () => void choose([...input.files ?? []]));
    zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('is-dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-dragging'));
    zone.addEventListener('drop', (event) => { event.preventDefault(); zone.classList.remove('is-dragging'); void choose([...event.dataTransfer!.files]); });
  }

  function renderPairing(): void {
    const area = root!.querySelector<HTMLDivElement>('#pairing-area')!;
    if (!files.length) { area.innerHTML = ''; return; }
    const previousRoom = localStorage.getItem('friend-file-drop:last-room') || '';
    area.innerHTML = `<section class="pair-sheet" aria-labelledby="pair-title"><h3 id="pair-title">Pair the receiving browser</h3><ol class="pair-steps"><li><button class="button primary" type="button" id="make-room">Make a six-word room</button><details class="resume-room"><summary>Resume a previous room</summary><label for="resume-code">Previous room code</label><input id="resume-code" class="room-input" value="${escapeText(previousRoom)}" autocomplete="off" spellcheck="false" /><button class="text-button" id="resume-room" type="button">Reopen this room</button><button class="text-button" id="forget-room" type="button">Clear saved room code</button></details><div id="offer-box"></div></li><li><p>Tell the receiver the six words. This room expires after 15 minutes.</p><details class="relay-choice"><summary>Direct path not working?</summary><p>The relay receives file names, hashes, contents, IP addresses, and byte counts. It holds up to 25 MB until the receipt or room expiry.</p><button class="button secondary" type="button" id="sender-relay" disabled>Use the private relay</button></details></li><li><button class="button primary" type="button" id="send-now" disabled>Send ${files.length} file${files.length === 1 ? '' : 's'}</button><p id="real-state" class="state-note" role="status">Make a room to start pairing.</p></li></ol></section>`;
    const openRoom = async (code: string) => {
      roomCode = code;
      transfer = new DirectTransfer(roomCode, hooks());
      const state = area.querySelector<HTMLElement>('#real-state')!;
      state.textContent = 'Opening the short-lived room…';
      try {
        await transfer.createRoom();
        localStorage.setItem('friend-file-drop:last-room', roomCode);
        area.querySelector<HTMLDivElement>('#offer-box')!.innerHTML = `<div class="room-label"><span>Room code</span><strong>${roomCode}</strong></div><button class="text-button copy-code" type="button">Copy room code</button>`;
        area.querySelector('.copy-code')?.addEventListener('click', async () => { await navigator.clipboard.writeText(roomCode); state.textContent = 'Room code copied. Send the six words to the receiver.'; });
        area.querySelector<HTMLButtonElement>('#sender-relay')!.disabled = false;
      } catch (error) {
        state.textContent = error instanceof Error ? error.message : 'The room service did not open. Check the network and try again.';
        state.dataset.tone = 'error';
      }
    };
    area.querySelector('#make-room')?.addEventListener('click', () => void openRoom(makeRoomCode()));
    area.querySelector('#resume-room')?.addEventListener('click', () => {
      const input = area.querySelector<HTMLInputElement>('#resume-code')!;
      const code = input.value.trim().toLowerCase();
      if (!validRoomCode(code)) {
        hooks().onState('Enter all six words from the previous room.', 'error');
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      input.removeAttribute('aria-invalid');
      void openRoom(code);
    });
    area.querySelector('#forget-room')?.addEventListener('click', () => {
      localStorage.removeItem('friend-file-drop:last-room');
      const input = area.querySelector<HTMLInputElement>('#resume-code');
      if (input) input.value = '';
      hooks().onState('Saved room code cleared from this browser.', 'success');
    });
    area.querySelector('#sender-relay')?.addEventListener('click', async () => {
      try {
        if (!transfer) throw new Error('Make the room first.');
        await transfer.enableRelay('sender');
      } catch (error) { hooks().onState(error instanceof Error ? error.message : 'The relay did not open.', 'error'); }
    });
    area.querySelector('#send-now')?.addEventListener('click', async () => {
      try { await transfer?.send(files, manifests); }
      catch (error) { hooks().onState(error instanceof Error ? error.message : 'The transfer stopped. Try a new room.', 'error'); }
    });
  }

  function renderReceiver(): void {
    const panel = root!.querySelector<HTMLDivElement>('#mode-panel')!;
    panel.innerHTML = `<section class="pair-sheet receive-sheet" aria-labelledby="receive-title"><h3 id="receive-title">Join the sender's room</h3><label for="room-code">Six-word room code</label><input id="room-code" class="room-input" type="text" autocomplete="off" spellcheck="false" placeholder="amber-apple-atlas-birch-blue-brisk" aria-describedby="room-help" /><p id="room-help" class="field-help">Ask the sender for the six words shown on their screen.</p><button class="button primary" id="join-room" type="button">Join this room</button><details class="relay-choice"><summary>Direct path not working?</summary><p>The relay receives file names, hashes, contents, IP addresses, and byte counts. It holds up to 25 MB until the receipt or room expiry.</p><button class="button secondary" id="receiver-relay" type="button" disabled>Use the private relay</button></details><p id="real-state" class="state-note" role="status">Enter the sender's six-word room code.</p></section><section class="manifest-panel received-panel"><h3>Incoming file manifest</h3><ul class="file-list compact" id="real-files"><li class="empty-state">File names and sizes appear after the browsers connect.</li></ul></section><div id="real-receipt"></div>`;
    panel.querySelector('#join-room')?.addEventListener('click', async () => {
      const input = panel.querySelector<HTMLInputElement>('#room-code')!;
      const code = input.value.trim().toLowerCase();
      const state = panel.querySelector<HTMLElement>('#real-state')!;
      if (!validRoomCode(code)) {
        state.textContent = 'Enter all six words, separated by hyphens.';
        state.dataset.tone = 'error';
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      roomCode = code;
      transfer = new DirectTransfer(roomCode, hooks());
      try {
        await transfer.joinRoom();
        input.removeAttribute('aria-invalid');
        panel.querySelector<HTMLButtonElement>('#receiver-relay')!.disabled = false;
      } catch (error) {
        state.textContent = error instanceof Error ? error.message : 'The room could not be joined. Check the code and try again.';
        state.dataset.tone = 'error';
      }
    });
    panel.querySelector('#receiver-relay')?.addEventListener('click', async () => {
      try {
        if (!transfer) throw new Error('Join the room first.');
        await transfer.enableRelay('receiver');
      } catch (error) { hooks().onState(error instanceof Error ? error.message : 'The relay did not open.', 'error'); }
    });
  }

  start();
  void renderReceiptHistory();
}

async function renderReceiptHistory(): Promise<void> {
  const root = document.querySelector<HTMLDivElement>('#receipt-history');
  if (!root) return;
  const receipts = await getReceipts();
  root.innerHTML = `<details class="receipt-history"><summary>${receipts.length} saved receipt${receipts.length === 1 ? '' : 's'} on this device</summary>${receipts.length ? `<ul>${receipts.map((receipt) => `<li><strong>${receipt.direction === 'sent' ? 'Sent' : 'Received'} ${receipt.files.length} file${receipt.files.length === 1 ? '' : 's'}</strong><span>${new Date(receipt.completedAt).toLocaleString()} · ${escapeText(receipt.roomCode)}</span></li>`).join('')}</ul>` : '<p>Finished real transfers will appear here.</p>'}<div class="history-actions"><button class="text-button" type="button" id="export-history" aria-label="Export saved receipts" ${receipts.length ? '' : 'disabled'}>Export saved receipts</button><label class="import-label">Import receipts<input type="file" id="import-history" accept="application/json,.json" /></label></div><p class="state-note" id="history-state" role="status"></p></details>`;
  root.querySelector('#export-history')?.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipts, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'friend-file-drop-receipts.json';
    link.click();
    URL.revokeObjectURL(url);
  });
  root.querySelector<HTMLInputElement>('#import-history')?.addEventListener('change', async (event) => {
    const state = root.querySelector<HTMLElement>('#history-state')!;
    try {
      const file = (event.currentTarget as HTMLInputElement).files?.[0];
      if (!file) return;
      const imported = JSON.parse(await file.text()) as SavedReceipt[];
      if (!Array.isArray(imported) || imported.some((item) => !item.id || !item.completedAt || !Array.isArray(item.files))) throw new Error();
      await Promise.all(imported.map((receipt) => saveReceipt(receipt)));
      await renderReceiptHistory();
    } catch {
      state.textContent = 'That file is not a receipt export. Choose a Friend File Drop JSON file.';
      state.dataset.tone = 'error';
    }
  });
}

function bindLinks(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || link.target) return;
    event.preventDefault();
    if (link.hasAttribute('data-leave-demo')) clearDemoStorage();
    history.pushState({}, '', link.href);
    render(routeFromPath(location.pathname), true);
  }));
}

function render(route = routeFromPath(location.pathname), focus = false): void {
  document.title = titles[route];
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = descriptions[route];
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `https://friend-file-drop.sociobot.in${route === 'not-found' ? '/404' : location.pathname}`;
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = titles[route];
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content = descriptions[route];
  app.innerHTML = route === 'home' ? homePage() : route === 'demo' ? demoPage() : route === 'privacy' || route === 'terms' ? legalPage(route) : notFoundPage();
  document.body.dataset.route = route;
  bindLinks();
  if (route === 'home') setupTransferApp();
  if (route === 'demo') setupDemo();
  if (focus) {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    const heading = document.querySelector<HTMLHeadingElement>('h1');
    heading?.focus();
    document.querySelector('.route-status')!.textContent = heading?.textContent ?? '';
  }
}

window.addEventListener('popstate', () => render(routeFromPath(location.pathname), true));
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          document.querySelector('#toast-region')!.innerHTML = '<div class="update-toast">A new page version is ready. <button type="button" id="reload-update">Reload</button></div>';
          document.querySelector('#reload-update')?.addEventListener('click', () => location.reload());
        }
      });
    });
  }).catch(() => undefined));
}
