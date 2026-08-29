import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const liveUrl = process.env.LIVE_URL;
test.skip(!liveUrl, 'Set LIVE_URL to run deployed identity checks.');

for (const route of ['/', '/demo', '/privacy', '/terms', '/missing-page']) {
  test(`deployed ${route} has correct identity and no serious accessibility violations`, async ({ page }) => {
    const response = await page.goto(`${liveUrl}${route}`);
    expect(response?.status()).toBe(route === '/missing-page' ? 404 : 200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page: page as never }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  });
}

test('deployed demo stays same-origin and Start for real discards its state @regression:live-demo-exit-clears', async ({ page }) => {
  const foreignRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(liveUrl!).origin) foreignRequests.push(request.url());
  });
  await page.goto(`${liveUrl}/demo`);
  await page.getByRole('button', { name: 'Send sample files' }).click();
  await expect(page.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('demo:')))).toEqual(['demo:completed']);
  await page.getByRole('link', { name: 'Start for real' }).click();
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('demo:')))).toEqual([]);
  await page.getByRole('link', { name: 'Demo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Send sample files' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Transfer finished' })).toHaveCount(0);
  expect(foreignRequests).toEqual([]);
});

test('deployed demo reloads offline after service-worker control', async ({ page, context }) => {
  await page.goto(`${liveUrl}/demo`);
  const workerState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    return registration.active?.state;
  });
  expect(workerState).toBe('activated');
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('Demo — Friend File Drop');
  await expect(page.getByRole('heading', { name: 'Send sample files and check the receipt' })).toBeVisible();
});

test('deployed direct transfer withholds receipts for corrupt bytes until a verified retry @regression:live-corrupt-direct-receipt', async ({ browser }) => {
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const receiver = await receiverContext.newPage();
  await Promise.all([sender.goto(liveUrl!), receiver.goto(liveUrl!)]);
  await sender.locator('#file-input').setInputFiles({ name: 'live-direct.txt', mimeType: 'text/plain', buffer: Buffer.from('live direct identity check') });
  await sender.getByRole('button', { name: 'Make a six-word room' }).click();
  const code = (await sender.locator('.room-label strong').textContent())!;
  await receiver.getByRole('tab', { name: 'Receive files' }).click();
  await receiver.locator('#room-code').fill(code);
  await receiver.getByRole('button', { name: 'Join this room' }).click();
  await expect(sender.getByText('Devices connected. The direct path is ready.')).toBeVisible({ timeout: 15_000 });
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
  await expect(receiver.getByText('live-direct.txt did not match its hash. Rejoin to retry it.')).toBeVisible({ timeout: 15_000 });
  await expect(receiver.locator('#real-files .file-status')).toHaveText('Failed');
  await expect(receiver.getByRole('link', { name: 'Save file' })).toHaveCount(0);
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toHaveCount(0);
  await expect(sender.getByRole('heading', { name: 'Transfer finished' })).toHaveCount(0);
  await sender.waitForTimeout(250);
  await sender.evaluate(() => (window as typeof window & { __restoreFileSlice: () => void }).__restoreFileSlice());
  await sender.getByRole('button', { name: 'Send 1 file' }).click();
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 15_000 });
  await expect(sender.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  await senderContext.close();
  await receiverContext.close();
});

test('deployed relay keeps a room across instances and transfers only after both browsers opt in @regression:live-durable-relay', async ({ browser }) => {
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const receiver = await receiverContext.newPage();
  await Promise.all([sender.goto(liveUrl!), receiver.goto(liveUrl!)]);
  await sender.locator('#file-input').setInputFiles({ name: 'live-relay.txt', mimeType: 'text/plain', buffer: Buffer.from('live relay identity check') });
  await sender.getByRole('button', { name: 'Make a six-word room' }).click();
  const code = (await sender.locator('.room-label strong').textContent())!;
  await receiver.getByRole('tab', { name: 'Receive files' }).click();
  await receiver.locator('#room-code').fill(code);
  await receiver.getByRole('button', { name: 'Join this room' }).click();
  await sender.locator('.relay-choice summary').click();
  await receiver.locator('.relay-choice summary').click();
  await sender.getByRole('button', { name: 'Use the private relay' }).click();
  await expect(sender.getByText('Waiting for the other person')).toBeVisible();
  await receiver.getByRole('button', { name: 'Use the private relay' }).click();
  await expect(sender.getByText('Relay ready.')).toBeVisible({ timeout: 10_000 });
  await sender.getByRole('button', { name: 'Send 1 file' }).click();
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 15_000 });
  await expect(sender.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 15_000 });
  await senderContext.close();
  await receiverContext.close();
});
