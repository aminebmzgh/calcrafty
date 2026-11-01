import { test, expect } from '@playwright/test';
import { builtUrls, calculatorUrls } from './pages.ts';

test.use({ javaScriptEnabled: false });

// Full content renders with JavaScript disabled (hard rule 1).
for (const url of builtUrls().filter((u) => !u.startsWith('/embed/'))) {
  test(`no-JS renders: ${url}`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).not.toBeEmpty();
    const text = (await page.locator('main').innerText()).trim();
    expect(text.length, 'main content length').toBeGreaterThan(200);
    // Articles may mention "NaN" in prose; only the calculator's own output must never show it.
    const widget = page.locator('.calc');
    if (await widget.count()) expect(await widget.first().innerText()).not.toMatch(/\bNaN\b|\bInfinity\b|undefined/);
  });
}

for (const url of calculatorUrls()) {
  test(`no-JS default result: ${url}`, async ({ page }) => {
    await page.goto(url);
    const value = page.locator('[data-testid="headline-value"]').first();
    await expect(value).toBeVisible();
    await expect(value).not.toHaveText(/^\s*(—)?\s*$/);
    await expect(page.locator('[data-testid="answer-box"]')).not.toBeEmpty();
    await expect(page.locator('.prose h2').first()).toBeVisible();
  });
}
