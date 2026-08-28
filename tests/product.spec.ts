import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import type { Page, Route } from '@playwright/test';

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

test('demo stays isolated from real storage and third parties @claim:demo-isolation', async ({ page }) => {
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4173') foreign.push(request.url());
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Send sample files' }).click();
  await expect(page.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  expect(foreign).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual(['demo:completed']);
  expect(await page.evaluate(() => indexedDB.databases().then((items) => items.map((item) => item.name)))).not.toContain('friend-file-drop');
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

test('six words join two browsers for a direct verified transfer @claim:six-word-room @claim:direct-transfer @claim:local-receipts', async ({ browser }) => {
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
  await sender.getByRole('button', { name: 'Send 1 file' }).click();
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 12_000 });
  await expect(receiver.getByRole('link', { name: 'Save file' })).toHaveAttribute('download', 'hello-friend.txt');
  await expect(sender.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  await expect.poll(() => sender.evaluate(() => indexedDB.databases().then((items) => items.map((item) => item.name)))).toContain('friend-file-drop');
  expect(await sender.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => { const request = indexedDB.open('friend-file-drop', 2); request.onsuccess = () => resolve(request.result); });
    const records = await new Promise<unknown[]>((resolve) => { const request = db.transaction('receipts').objectStore('receipts').getAll(); request.onsuccess = () => resolve(request.result); });
    db.close();
    return records.length;
  })).toBe(1);
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
  const hash = createHash('sha256').update(data).digest('hex');
  await sender.locator('#file-input').setInputFiles({ name: 'resume.bin', mimeType: 'application/octet-stream', buffer: data });
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
  }, { code, id: hash, bytes: [...data.subarray(0, 32 * 1024)] });
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
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const receiver = await receiverContext.newPage();
  const rooms = new Map<string, MockRoom>();
  await Promise.all([installRoomApi(sender, rooms), installRoomApi(receiver, rooms)]);
  await Promise.all([sender.goto('/'), receiver.goto('/')]);
  await sender.locator('#file-input').setInputFiles({ name: 'relay.txt', mimeType: 'text/plain', buffer: Buffer.from('relay with explicit consent') });
  await sender.getByRole('button', { name: 'Make a six-word room' }).click();
  const code = (await sender.locator('.room-label strong').textContent())!;
  await receiver.getByRole('tab', { name: 'Receive files' }).click();
  await receiver.locator('#room-code').fill(code);
  await receiver.getByRole('button', { name: 'Join this room' }).click();
  await sender.locator('.relay-choice').getByText('Direct path not working?').click();
  await receiver.locator('.relay-choice').getByText('Direct path not working?').click();
  await sender.getByRole('button', { name: 'Use the private relay' }).click();
  await expect(sender.getByText('Waiting for the other person')).toBeVisible();
  await receiver.getByRole('button', { name: 'Use the private relay' }).click();
  await expect(sender.getByText('Relay ready.')).toBeVisible({ timeout: 5_000 });
  await sender.getByRole('button', { name: 'Send 1 file' }).click();
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => rooms.get(code)?.files.size).toBe(0);
  await receiverContext.close();
  await senderContext.close();
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

test('mobile interactive targets remain at least 44 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const undersized = await page.locator('a:visible, button:visible, input:visible:not([type="file"]), summary:visible').evaluateAll((nodes) => nodes
    .map((node) => ({ label: (node.textContent || (node as HTMLInputElement).ariaLabel || '').trim(), rect: node.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width < 44 || rect.height < 44));
  expect(undersized).toEqual([]);
});
