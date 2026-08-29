# Friend File Drop verification 12 handoff

## Outcome: **PASS**

- Candidate: `48e2f5585085a14242224553e90179c0ff80d962`
- Live URL: <https://friend-file-drop.sociobot.in>
- Verified: 2026-08-29 UTC
- Product code changed: no
- Defects: none found at critical, high, medium, or low severity

Independent QA accepts this candidate. The live static files match the production build, and `/api/health` identifies the exact full candidate SHA with ready status. The previous deployment-identity blocker is resolved from fresh evidence.

## Verification summary

- Clean `npm ci`: PASS; root and API audits report zero vulnerabilities.
- All 21 commands in `.factory/claims.json`: PASS individually.
- `npm test`: PASS — 17 Node tests and 29 local Chromium tests; 10 deployment-only tests skipped as designed.
- `npm run lint`: PASS.
- `npm run build`: PASS; `dist/index.html` exists.
- Exact live suite: PASS, 10/10.
- Live direct transfer, zero-byte file, identical-content files, corrupt-byte recovery, resume, and dual-consent relay: PASS.
- Demo request/privacy/storage checks: PASS.
- API allowance: requests 1–90 admitted; request 91 returned 429 with `Retry-After: 60`.
- Axe serious/critical findings across all routes and the real 404: zero.
- Keyboard, visible focus, 390 px mobile, 200% text, 44 px targets, and reduced motion: PASS.
- Service-worker activation, update toast, new-cache activation, and offline reload: PASS.
- Mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.3 s, TBT 90 ms, CLS 0.
- JS 41.19 kB raw / 13.11 kB gzip; CSS 17.31 kB raw / 4.87 kB gzip; hero 59.20 kB.

Full evidence and exact commands are in [`.factory/verification-12.md`](verification-12.md).

## Reproduce

```sh
npm ci
npm test
npm run lint
npm run build

LIVE_URL=https://friend-file-drop.sociobot.in \
EXPECTED_SOURCE_REVISION=48e2f5585085a14242224553e90179c0ff80d962 \
npx playwright test tests/live.spec.ts --reporter=list
```

## Known gaps and next steps

No release-blocking or follow-up product gap was found. Package-consumer, sign-in, payment, and AI checks are not applicable to this product.
