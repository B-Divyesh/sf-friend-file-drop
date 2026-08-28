import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

test('demo traffic stays on this origin @claim:no-third-party', async ({ page }) => {
  const foreign: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4173') foreign.push(request.url());
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Send sample files' }).click();
  await expect(page.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  expect(foreign).toEqual([]);
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

test('two browsers transfer and verify a file @claim:direct-transfer', async ({ browser }) => {
  const senderContext = await browser.newContext();
  const receiverContext = await browser.newContext();
  const sender = await senderContext.newPage();
  const receiver = await receiverContext.newPage();
  await Promise.all([sender.goto('/'), receiver.goto('/')]);
  await sender.locator('#file-input').setInputFiles({ name: 'hello-friend.txt', mimeType: 'text/plain', buffer: Buffer.from('A private hello from one browser to another.') });
  await expect(sender.getByText('hello-friend.txt')).toBeVisible();
  await sender.getByRole('button', { name: 'Make a six-word room' }).click();
  const offer = await sender.locator('#offer-note').inputValue();
  await receiver.getByRole('tab', { name: 'Receive files' }).click();
  await receiver.locator('#sender-note').fill(offer);
  await receiver.getByRole('button', { name: 'Make the answer note' }).click();
  const answer = await receiver.locator('#receiver-answer').inputValue();
  await sender.locator('#answer-note').fill(answer);
  await sender.getByRole('button', { name: 'Connect this browser' }).click();
  await expect(sender.getByText('Devices connected. The direct path is ready.')).toBeVisible({ timeout: 12_000 });
  await sender.getByRole('button', { name: 'Send 1 file' }).click();
  await expect(receiver.getByRole('heading', { name: 'Transfer finished' })).toBeVisible({ timeout: 12_000 });
  await expect(receiver.getByRole('link', { name: 'Save file' })).toHaveAttribute('download', 'hello-friend.txt');
  await expect(sender.getByRole('heading', { name: 'Transfer finished' })).toBeVisible();
  await senderContext.close();
  await receiverContext.close();
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

test('mobile first screen keeps the actions visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  expect((await page.locator('body').evaluate((body) => body.scrollWidth)) <= 390).toBeTruthy();
});
