import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('hashed assets receive immutable caching and unknown paths remain 404', async () => {
  const config = JSON.parse(await readFile(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'));
  assert.equal(config.navigationFallback, undefined);
  assert.deepEqual(config.responseOverrides['404'], { rewrite: '/404.html' });
  assert.equal(config.routes.find((route) => route.route === '/assets/*').headers['Cache-Control'], 'public, max-age=31536000, immutable');
  for (const route of ['/demo', '/privacy', '/terms']) assert.equal(config.routes.find((item) => item.route === route).rewrite, '/index.html');
});
