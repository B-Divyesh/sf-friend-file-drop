import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Browser, Page, Route } from '@playwright/test';

type MockRoom = {
  offer?: unknown;
  answer?: unknown;
  relay: { sender: boolean; receiver: boolean };
  manifest?: Array<{ id: string; name: string; type: string; size: number; hash: string }>;
  files: Map<string, Buffer>;
  receipt?: unknown;
};

function installRoomApi(page: Page, rooms: Map<string, MockRoom>): Promise<void> {
  return page.route('**/api/rooms/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const parts = url.pathname.split('/').filter(Boolean);
    const code = decodeURIComponent(parts[2] || '');
    const room = rooms.get(code);
    const json = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (parts[3] === 'files') {
      if (!room) return json(404, { error: 'That room expired or does not exist.' });
      const id = decodeURIComponent(parts[4]);
      if (request.method() === 'PUT') {
        const offset = Number(url.searchParams.get('offset') || 0);
        const existing = room.files.get(id) || Buffer.alloc(0);
        if (existing.length === offset) room.files.set(id, Buffer.concat([existing, request.postDataBuffer() || Buffer.alloc(0)]));
        return json(200, { accepted: room.files.get(id)?.length || 0 });
      }
      const file = room.files.get(id);
      if (!file) return json(404, { error: 'That file is not complete yet.' });
      return route.fulfill({ status: 200, contentType: room.manifest?.find((item) => item.id === id)?.type, body: file });
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      if (body.action === 'create') rooms.set(code, { offer: body.offer, relay: { sender: false, receiver: false }, files: new Map() });
      const current = rooms.get(code);
      if (!current) return json(404, { error: 'That room expired or does not exist.' });
      if (body.action === 'answer') current.answer = body.answer;
      if (body.action === 'relay-consent') current.relay[body.role as 'sender' | 'receiver'] = true;
      if (body.action === 'manifest') current.manifest = body.manifest as MockRoom['manifest'];
      if (body.action === 'receipt') { current.receipt = body.receipt; current.files.clear(); }
      return json(200, { ...current, files: undefined, relay: { ...current.relay, ready: current.relay.sender && current.relay.receiver } });
    }
    if (!room) return json(404, { error: 'That room expired or does not exist.' });
    return json(200, { ...room, files: undefined, relay: { ...room.relay, ready: room.relay.sender && room.relay.receiver } });
  });
}

async function receiptCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('friend-file-drop', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const records = await new Promise<unknown[]>((resolve, reject) => {
      const request = db.transaction('receipts').objectStore('receipts').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return records.length;
  });
}

type RelayPair = {
  senderContext: Awaited<ReturnType<Browser['newContext']>>;
  receiverContext: Awaited<ReturnType<Browser['newContext']>>;
  sender: Page;
  receiver: Page;
  rooms: Map<string, MockRoom>;
  code: string;
};

async function openIsolatedRelayPair(browser: Browser, fileName: string): Promise<RelayPair> {
  // Each invocation owns its browser storage, route handler, room map, and
  // generated room code. That makes this safe when Playwright schedules relay
  // coverage beside unrelated WebRTC tests on its second worker.
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const receiver = await receiverContext.newPage();
  const rooms = new Map<string, MockRoom>();
  await Promise.all([installRoomApi(sender, rooms), installRoomApi(receiver, rooms)]);
  await Promise.all([sender.goto('/'), receiver.goto('/')]);
  await sender.locator('#file-input').setInputFiles({ name: fileName, mimeType: 'text/plain', buffer: Buffer.from(`isolated relay payload for ${fileName}`) });
  await sender.getByRole('button', { name: 'Make a six-word room' }).click();
  const code = await sender.locator('.room-label strong').innerText();
  await expect.poll(() => rooms.get(code)?.offer).toBeTruthy();

  await receiver.getByRole('tab', { name: 'Receive files' }).click();
  await receiver.locator('#room-code').fill(code);
  await receiver.getByRole('button', { name: 'Join this room' }).click();
  await expect.poll(() => rooms.get(code)?.answer).toBeTruthy();
  return { senderContext, receiverContext, sender, receiver, rooms, code };
}

async function chooseRelay(pair: RelayPair): Promise<void> {
  const { sender, receiver, rooms, code } = pair;
  await sender.locator('.relay-choice > summary').click();
  await receiver.locator('.relay-choice > summary').click();
  await expect(sender.getByRole('button', { name: 'Use the private relay' })).toBeEnabled();
  await expect(receiver.getByRole('button', { name: 'Use the private relay' })).toBeEnabled();

  const senderConsent = sender.waitForResponse((response) => response.url().endsWith(`/api/rooms/${encodeURIComponent(code)}`)
    && response.request().method() === 'POST' && !!response.request().postData()?.includes('relay-consent'));
  await Promise.all([senderConsent, sender.getByRole('button', { name: 'Use the private relay' }).click()]);
  await expect.poll(() => rooms.get(code)?.relay).toEqual({ sender: true, receiver: false });
  await expect(sender.locator('#real-state')).toContainText('Waiting for the other person');

  const receiverConsent = receiver.waitForResponse((response) => response.url().endsWith(`/api/rooms/${encodeURIComponent(code)}`)
    && response.request().method() === 'POST' && !!response.request().postData()?.includes('relay-consent'));
  await Promise.all([receiverConsent, receiver.getByRole('button', { name: 'Use the private relay' }).click()]);
  await expect.poll(() => rooms.get(code)?.relay).toEqual({ sender: true, receiver: true });
  await expect(sender.getByText('Relay ready.')).toBeVisible({ timeout: 5_000 });
  await expect(sender.getByRole('button', { name: 'Send 1 file' })).toBeEnabled();
}

async function closeRelayPair(pair: RelayPair): Promise<void> {
  await Promise.all([pair.senderContext.close(), pair.receiverContext.close()]);
}

test('sample transfer produces a three-file receipt @claim:demo-receipt', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('button', { name: 'Send sample files' }).click();
  await expect(page.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  await expect(page.locator('.receipt li')).toHaveCount(3);
  await expect(page.locator('.file-status')).toHaveText(['Verified', 'Verified', 'Verified']);
  await expect(page.getByText('Finished. The hashes match.')).toBeVisible();
});

test('demo opens without an account step @claim:no-account', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('input[type="password"], input[type="email"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send sample files' })).toBeEnabled();
});

test('the free version has no payment action @claim:free-use', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Free to use')).toBeVisible();
  await expect(page.getByRole('link', { name: /buy|pay|subscribe/i })).toHaveCount(0);
});

test('demo stays isolated and leaving clears its session @claim:demo-isolation @claim:demo-no-real-files @regression:demo-exit-clears', async ({ page }) => {
  const foreign: string[] = [];
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4173') foreign.push(request.url());
    if (url.pathname.startsWith('/api/')) apiRequests.push(request.url());
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Send sample files' }).click();
  await expect(page.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  expect(foreign).toEqual([]);
  expect(apiRequests).toEqual([]);
  expect(await page.locator('input[type="file"]').count()).toBe(0);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual(['demo:completed']);
  expect(await page.evaluate(() => indexedDB.databases().then((items) => items.map((item) => item.name)))).not.toContain('friend-file-drop');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('demo:')))).toEqual([]);
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Send sample files' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transfer finished' })).toHaveCount(0);
});

test('demo reloads after the network is turned off @claim:offline-reload', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('Demo — Friend File Drop');
  await expect(page.getByRole('heading', { level: 1, name: 'Send sample files and check the receipt' })).toBeVisible();
});

test('direct transfer withholds receipts for corrupt bytes until a verified retry @claim:six-word-room @claim:direct-transfer @claim:local-receipts @regression:corrupt-direct-receipt', async ({ browser }) => {
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const receiver = await receiverContext.newPage();
  const rooms = new Map<string, MockRoom>();
  await Promise.all([installRoomApi(sender, rooms), installRoomApi(receiver, rooms)]);
  await Promise.all([sender.goto('/'), receiver.goto('/')]);
  await sender.locator('#file-input').setInputFiles({ name: 'hello-friend.txt', mimeType: 'text/plain', buffer: Buffer.from('A private hello from one browser to another.') });
  await expect(sender.getByText('hello-friend.txt')).toBeVisible();
  await sender.getByRole('button', { name: 'Make a six-word room' }).click();
  const code = await sender.locator('.room-label strong').textContent();
  expect(code?.split('-')).toHaveLength(6);
  await receiver.getByRole('tab', { name: 'Receive files' }).click();
  await receiver.locator('#room-code').fill(code!);
  await receiver.getByRole('button', { name: 'Join this room' }).click();
  await expect(sender.getByText('Devices connected. The direct path is ready.')).toBeVisible({ timeout: 12_000 });
  await sender.evaluate(() => {
    const nativeSlice = File.prototype.slice;
    Object.defineProperty(window, '__restoreFileSlice', {
      configurable: true,
      value: () => { File.prototype.slice = nativeSlice; }
    });
    File.prototype.slice = function (this: File, start = 0, end = this.size, contentType = this.type): Blob {
      return new Blob([new Uint8Array(Math.max(0, end - start)).fill(120)], { type: contentType });
    };
  });
  await sender.getByRole('button', { name: 'Send 1 file' }).click();
  await expect(receiver.getByText('hello-friend.txt did not match its hash. Rejoin to retry it.')).toBeVisible();
  await expect(receiver.locator('#real-files .file-status')).toHaveText('Failed');
  await expect(receiver.getByRole('link', { name: 'Save file' })).toHaveCount(0);
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toHaveCount(0);
  await expect(sender.getByRole('heading', { name: 'Transfer finished' })).toHaveCount(0);
  expect(await Promise.all([receiptCount(sender), receiptCount(receiver)])).toEqual([0, 0]);
  await sender.waitForTimeout(250);
  await sender.evaluate(() => (window as typeof window & { __restoreFileSlice: () => void }).__restoreFileSlice());
  await sender.getByRole('button', { name: 'Send 1 file' }).click();
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 12_000 });
  await expect(receiver.getByRole('link', { name: 'Save file' })).toHaveAttribute('download', 'hello-friend.txt');
  await expect(sender.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  await expect.poll(() => sender.evaluate(() => indexedDB.databases().then((items) => items.map((item) => item.name)))).toContain('friend-file-drop');
  expect(await Promise.all([receiptCount(sender), receiptCount(receiver)])).toEqual([1, 1]);
  await senderContext.close();
  await receiverContext.close();
});

test('saved direct chunks resume at the verified offset @claim:resumable-transfer', async ({ browser }) => {
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const receiver = await receiverContext.newPage();
  const rooms = new Map<string, MockRoom>();
  await Promise.all([installRoomApi(sender, rooms), installRoomApi(receiver, rooms)]);
  await Promise.all([sender.goto('/'), receiver.goto('/')]);
  const data = Buffer.alloc(70 * 1024, 97);
  await sender.locator('#file-input').setInputFiles({ name: 'resume.bin', mimeType: 'application/octet-stream', buffer: data });
  const transferId = await sender.locator('#real-files .file-row').getAttribute('data-file-id');
  expect(transferId).toMatch(/^[a-f0-9-]{36}$/);
  await sender.getByRole('button', { name: 'Make a six-word room' }).click();
  const code = (await sender.locator('.room-label strong').textContent())!;
  await receiver.evaluate(async ({ code: roomCode, id, bytes }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('friend-file-drop', 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('receipts')) request.result.createObjectStore('receipts', { keyPath: 'id' });
        if (!request.result.objectStoreNames.contains('partial-chunks')) request.result.createObjectStore('partial-chunks', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction('partial-chunks', 'readwrite');
    const data = new Uint8Array(bytes).buffer;
    const digest = await crypto.subtle.digest('SHA-256', data);
    const chunkHash = [...new Uint8Array(digest)].map((part) => part.toString(16).padStart(2, '0')).join('');
    tx.objectStore('partial-chunks').put({ key: `${roomCode}:${id}:0`, roomCode, fileId: id, offset: 0, data, hash: chunkHash });
    await new Promise<void>((resolve) => { tx.oncomplete = () => resolve(); });
    db.close();
  }, { code, id: transferId!, bytes: [...data.subarray(0, 32 * 1024)] });
  await receiver.reload();
  await receiver.getByRole('tab', { name: 'Receive files' }).click();
  await receiver.locator('#room-code').fill(code);
  await receiver.getByRole('button', { name: 'Join this room' }).click();
  await expect(sender.getByText('Devices connected. The direct path is ready.')).toBeVisible({ timeout: 12_000 });
  await sender.getByRole('button', { name: 'Send 1 file' }).click();
  await expect(sender.getByText('Resuming resume.bin at 32 KB.')).toBeVisible();
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  await receiverContext.close();
  await senderContext.close();
});

test('relay needs both choices and removes bytes after receipt @claim:opt-in-relay', async ({ browser }) => {
  const pair = await openIsolatedRelayPair(browser, 'relay.txt');
  try {
    await chooseRelay(pair);
    await pair.sender.getByRole('button', { name: 'Send 1 file' }).click();
    await expect.poll(() => pair.rooms.get(pair.code)?.manifest?.length).toBe(1);
    await expect(pair.receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => pair.rooms.get(pair.code)?.files.size).toBe(0);
  } finally {
    await closeRelayPair(pair);
  }
});

test('isolated relay rooms do not cross consent or bytes when run together @regression:parallel-relay-isolation', async ({ browser }) => {
  const [first, second] = await Promise.all([
    openIsolatedRelayPair(browser, 'first-isolated-relay.txt'),
    openIsolatedRelayPair(browser, 'second-isolated-relay.txt')
  ]);
  try {
    expect(first.code).not.toBe(second.code);
    await Promise.all([chooseRelay(first), chooseRelay(second)]);
    await Promise.all([
      first.sender.getByRole('button', { name: 'Send 1 file' }).click(),
      second.sender.getByRole('button', { name: 'Send 1 file' }).click()
    ]);
    await Promise.all([
      expect(first.receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 10_000 }),
      expect(second.receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 10_000 })
    ]);
    await expect.poll(() => first.rooms.get(first.code)?.files.size).toBe(0);
    await expect.poll(() => second.rooms.get(second.code)?.files.size).toBe(0);
  } finally {
    await Promise.all([closeRelayPair(first), closeRelayPair(second)]);
  }
});

test('same-content files keep separate verified rows and receipts @claim:individual-file-receipts @claim:own-files-untouched', async ({ browser }) => {
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const receiver = await receiverContext.newPage();
  const rooms = new Map<string, MockRoom>();
  await Promise.all([installRoomApi(sender, rooms), installRoomApi(receiver, rooms)]);
  await Promise.all([sender.goto('/'), receiver.goto('/')]);
  const identical = Buffer.from('same bytes, two intentional filenames');
  await sender.locator('#file-input').setInputFiles([
    { name: 'copy-one.txt', mimeType: 'text/plain', buffer: identical },
    { name: 'copy-two.txt', mimeType: 'text/plain', buffer: identical }
  ]);
  await expect(sender.locator('#real-files .file-row')).toHaveCount(2);
  expect(await sender.locator('#file-input').evaluate(async (input: HTMLInputElement) => Promise.all([...input.files!].map(async (file) => ({ name: file.name, text: await file.text() }))))).toEqual([
    { name: 'copy-one.txt', text: identical.toString() },
    { name: 'copy-two.txt', text: identical.toString() }
  ]);
  await sender.getByRole('button', { name: 'Make a six-word room' }).click();
  const code = (await sender.locator('.room-label strong').textContent())!;
  await receiver.getByRole('tab', { name: 'Receive files' }).click();
  await receiver.locator('#room-code').fill(code);
  await receiver.getByRole('button', { name: 'Join this room' }).click();
  await expect(sender.getByText('Devices connected. The direct path is ready.')).toBeVisible({ timeout: 12_000 });
  await sender.getByRole('button', { name: 'Send 2 files' }).click();
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 12_000 });
  await expect(receiver.locator('.file-status')).toHaveText(['Verified', 'Verified']);
  await expect(receiver.locator('.receipt li')).toHaveText([/copy-one\.txt/, /copy-two\.txt/]);
  await expect(sender.locator('.receipt li')).toHaveText([/copy-one\.txt/, /copy-two\.txt/]);
  await senderContext.close();
  await receiverContext.close();
});

test('receipt history exports and imports complete receipt records @claim:receipt-export @claim:receipt-import', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('friend-file-drop', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction('receipts', 'readwrite');
    tx.objectStore('receipts').put({ id: 'exported', roomCode: 'amber-apple-atlas-birch-blue-brisk', completedAt: '2026-08-28T00:00:00.000Z', direction: 'sent', files: [{ name: 'kept.txt', size: 4, hash: 'a'.repeat(64) }] });
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); });
    db.close();
  });
  await page.reload();
  await page.locator('.receipt-history summary').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export saved receipts' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('friend-file-drop-receipts.json');
  let exported = '';
  for await (const chunk of (await download.createReadStream())!) exported += chunk.toString();
  expect(JSON.parse(exported)[0].id).toBe('exported');
  await page.locator('#import-history').setInputFiles({
    name: 'friend-file-drop-receipts.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify([{ id: 'imported', roomCode: 'cedar-chime-cobalt-comet-coral-daisy', completedAt: '2026-08-28T01:00:00.000Z', direction: 'received', files: [{ name: 'restored.txt', size: 8, hash: 'b'.repeat(64) }] }]))
  });
  await expect(page.locator('.receipt-history summary')).toContainText('2 saved receipts');
});

test('the saved room code is visible, documented, and removable @claim:room-code-storage', async ({ page }) => {
  const rooms = new Map<string, MockRoom>();
  await installRoomApi(page, rooms);
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: 'room-note.txt', mimeType: 'text/plain', buffer: Buffer.from('keep only the code') });
  await page.getByRole('button', { name: 'Make a six-word room' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('friend-file-drop:last-room'))).toMatch(/^[a-z]+(?:-[a-z]+){5}$/);
  await page.locator('.resume-room summary').click();
  await page.getByRole('button', { name: 'Clear saved room code' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('friend-file-drop:last-room'))).toBeNull();
  await page.goto('/privacy');
  await expect(page.getByText('The most recent room code stays in this browser\'s local storage')).toBeVisible();
});

test('privacy boundaries match storage and loaded resources @claim:privacy-boundaries', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/privacy');
  await expect(page.getByText('The app has no analytics, advertising, third-party runtime scripts, or contact access.')).toBeVisible();
  expect(requests.every((item) => new URL(item).origin === 'http://127.0.0.1:4173')).toBeTruthy();
  expect(await page.locator('script[src], link[rel="stylesheet"]').evaluateAll((nodes) => nodes.every((node) => new URL((node as HTMLScriptElement).src || (node as HTMLLinkElement).href).origin === location.origin))).toBeTruthy();
  expect(await page.locator('input[type="email"], input[name*="contact" i]').count()).toBe(0);
});

for (const route of ['/', '/demo', '/privacy', '/terms']) {
  test(`page ${route} has one clear heading and no serious accessibility errors`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  });
}

test('unknown addresses show the notebook 404 page', async ({ page }) => {
  await page.goto('/missing-page');
  await expect(page).toHaveTitle('Page not found — Friend File Drop');
  await expect(page.getByRole('heading', { level: 1, name: 'This notebook page is missing' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the file drop' })).toBeVisible();
});

test('mobile first screen keeps the actions visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  expect((await page.locator('body').evaluate((body) => body.scrollWidth)) <= 390).toBeTruthy();
});

test('keyboard users can reveal skip navigation and switch transfer roles with arrows', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.getByRole('tab', { name: 'Send files' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Receive files' })).toBeFocused();
  await expect(page.getByRole('heading', { name: "Join the sender's room" })).toBeVisible();
});

test('the visible file chooser shows the focused input state', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').focus();
  await expect(page.locator('#file-drop')).toHaveCSS('outline-width', '3px');
  await expect(page.locator('#file-drop')).toHaveCSS('outline-color', 'rgb(164, 60, 47)');
});

test('390px layout reflows at 200 percent text size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.fontSize = '34px'; });
  expect(await page.locator('body').evaluate((body) => ({ width: body.scrollWidth, viewport: document.documentElement.clientWidth }))).toEqual({ width: 390, viewport: 390 });
});

test('mobile interactive targets remain at least 44 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const undersized = await page.locator('a:visible, button:visible, input:visible:not([type="file"]), summary:visible').evaluateAll((nodes) => nodes
    .map((node) => ({ label: (node.textContent || (node as HTMLInputElement).ariaLabel || '').trim(), rect: node.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width < 44 || rect.height < 44));
  expect(undersized).toEqual([]);
});
