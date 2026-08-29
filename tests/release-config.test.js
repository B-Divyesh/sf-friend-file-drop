import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import packageJson from '../package.json' with { type: 'json' };

test('hashed assets receive immutable caching and unknown paths remain 404', async () => {
  const config = JSON.parse(await readFile(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'));
  assert.equal(config.navigationFallback, undefined);
  assert.deepEqual(config.responseOverrides['404'], { rewrite: '/404.html' });
  assert.equal(config.routes.find((route) => route.route === '/assets/*').headers['Cache-Control'], 'public, max-age=31536000, immutable');
  for (const route of ['/demo', '/privacy', '/terms']) assert.equal(config.routes.find((item) => item.route === route).rewrite, '/index.html');
});

test('static 404 has full identity metadata and the standard navigation', async () => {
  const html = await readFile(new URL('../public/404.html', import.meta.url), 'utf8');
  for (const required of [
    'rel="canonical"', 'property="og:title"', 'property="og:description"',
    'property="og:image"', 'name="twitter:card"', 'name="twitter:title"',
    'name="twitter:description"', 'name="twitter:image"', 'rel="apple-touch-icon"',
    'href="/#how"', 'href="/privacy"', 'href="/terms"'
  ]) assert.match(html, new RegExp(required));
  assert.match(html, new RegExp(`Built by Param Factory · v${packageJson.version.replaceAll('.', '\\.')}`));
});

test('release deploy wires the clean full candidate SHA into API settings and verifies it live', async () => {
  const script = await readFile(new URL('../scripts/deploy-static.sh', import.meta.url), 'utf8');
  assert.match(script, /git status --porcelain/);
  assert.match(script, /git ls-remote --exit-code origin/);
  assert.match(script, /FRIEND_FILE_DROP_SOURCE_REVISION=\$\{candidate_revision\}/);
  assert.match(script, /verify-live-identity\.mjs" "\$\{live_url\}" "\$\{candidate_revision\}"/);
});

test('every declared claim has one tagged test and the catalog line meets its copy contract', async () => {
  const claims = JSON.parse(await readFile(new URL('../.factory/claims.json', import.meta.url), 'utf8'));
  const testSources = await Promise.all([
    '../tests/product.spec.ts',
    '../api/lib/store.test.js',
    '../api/integration.test.js'
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')));
  const allTests = testSources.join('\n');
  assert.equal(new Set(claims.map(({ id }) => id)).size, claims.length);
  for (const claim of claims) {
    assert.equal(allTests.split(`@claim:${claim.id}`).length - 1, 1, `${claim.id} must tag exactly one test`);
    assert.match(claim.test, new RegExp(`@claim:${claim.id}(?:\\s|$)`));
  }

  const catalog = (await readFile(new URL('../.factory/catalog-description.txt', import.meta.url), 'utf8')).trim();
  assert.ok(catalog.length <= 120);
  assert.match(catalog, /^(Send|Receive|Share|Transfer|Keep)\b/);
});

test('reader copy does not regress to the rejected review wording', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const product = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
  for (const rejected of ['saved offset', 'verified pieces', 'session-storage', 'Each file crosses once', 'same record', 'How the files cross', 'Margin note', 'Start for real', 'Try the sandbox', 'File manifest', 'Sample manifest', 'Incoming file manifest', 'What the room service handles', 'FIELD NOTE 01', 'This notebook page is missing', 'No network or real files are used', 'through an encrypted web connection']) {
    assert.doesNotMatch(`${readme}\n${product}`, new RegExp(rejected, 'i'));
  }
  assert.match(product, /digital fingerprint before anything moves\. A fingerprint uses SHA-256\./);
  assert.match(product, /<h2 id="limits-title">What leaves your browser<\/h2>/);
});
