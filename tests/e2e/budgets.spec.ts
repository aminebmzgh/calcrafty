import { test, expect } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { calculatorUrls, pageTypeSamples } from './pages.ts';

/**
 * First-party JS actually loaded by each page (including lazily hydrated widget chunks),
 * gzipped, must stay under 35 KB (docs/BUILD-BRIEF.md section 16).
 */
const BUDGET = 35 * 1024;
const urls = [...new Set([...pageTypeSamples(), ...calculatorUrls()])].filter((u) => !u.endsWith('.html'));

for (const url of urls) {
  test(`JS budget: ${url}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'measured once');
    const bodies: Buffer[] = [];
    page.on('response', async (res) => {
      const u = new URL(res.url());
      if (u.hostname === 'localhost' && res.request().resourceType() === 'script') {
        bodies.push(await res.body().catch(() => Buffer.alloc(0)));
      }
    });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const inline = await page.$$eval('script:not([src]):not([type="application/ld+json"]):not([type="speculationrules"])', (els) => els.map((e) => e.textContent ?? '').join(''));
    const total = bodies.reduce((s, b) => s + gzipSync(b).length, 0) + gzipSync(inline).length;
    console.log(`${url}: ${(total / 1024).toFixed(1)} KB gz`);
    expect(total, `${url} JS gz bytes`).toBeLessThan(BUDGET);
  });
}
