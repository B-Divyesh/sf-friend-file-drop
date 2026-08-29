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
