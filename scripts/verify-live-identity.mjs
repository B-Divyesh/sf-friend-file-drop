#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const fullSha = /^[0-9a-f]{40}$/;

export async function verifyLiveIdentity(liveUrl, expectedRevision, fetchImpl = fetch) {
  if (!fullSha.test(expectedRevision)) {
    throw new Error(`Expected revision must be a full lowercase commit SHA; received ${expectedRevision || '<empty>'}.`);
  }

  const endpoint = new URL('/api/health', liveUrl).href;
  const response = await fetchImpl(endpoint, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' }
  });
  const cacheControl = response.headers.get('cache-control');
  const rawBody = await response.text();
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    throw new Error(`${endpoint} returned non-JSON health data with HTTP ${response.status}.`);
  }

  if (response.status !== 200) throw new Error(`${endpoint} returned HTTP ${response.status}.`);
  if (cacheControl !== 'no-store') throw new Error(`${endpoint} returned Cache-Control ${cacheControl || '<missing>'}, not no-store.`);
  if (body.service !== 'friend-file-drop-api') throw new Error(`${endpoint} reported an unexpected service identity.`);
  if (body.status !== 'ready') throw new Error(`${endpoint} reported status ${body.status || '<missing>'}, not ready.`);
  if (body.sourceRevision !== expectedRevision) {
    throw new Error(`${endpoint} sourceRevision ${body.sourceRevision || '<missing>'} does not match candidate ${expectedRevision}.`);
  }
  if (typeof body.deploymentId !== 'string' || body.deploymentId.trim() === '') {
    throw new Error(`${endpoint} did not report a deploymentId.`);
  }

  return body;
}

async function run() {
  const [, , liveUrl, expectedRevision] = process.argv;
  if (!liveUrl || !expectedRevision) {
    throw new Error('Usage: verify-live-identity.mjs <live-url> <full-candidate-sha>');
  }

  const attempts = Number.parseInt(process.env.DEPLOY_HEALTH_ATTEMPTS || '40', 10);
  const delayMs = Number.parseInt(process.env.DEPLOY_HEALTH_DELAY_MS || '3000', 10);
  if (!Number.isInteger(attempts) || attempts < 1 || !Number.isInteger(delayMs) || delayMs < 0) {
    throw new Error('DEPLOY_HEALTH_ATTEMPTS and DEPLOY_HEALTH_DELAY_MS must be valid non-negative integers.');
  }

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const body = await verifyLiveIdentity(liveUrl, expectedRevision);
      process.stdout.write(`Managed API identity verified: ${body.sourceRevision} (${body.deploymentId}).\n`);
      return;
    } catch (error) {
      lastError = error;
      process.stderr.write(`Managed API identity check ${attempt}/${attempts} failed: ${error.message}\n`);
      if (attempt < attempts) await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
    }
  }

  throw lastError;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  run().catch((error) => {
    process.stderr.write(`Deployment identity gate failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
