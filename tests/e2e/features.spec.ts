import { test, expect } from '@playwright/test';

/** Power features: favorites, history, compare, CSV export, reset, print stylesheet, offline worker. */
test.describe('power features', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('favorite and recent calculators appear on the homepage', async ({ page }) => {
    await page.goto('/health/bmi-calculator/');
    await page.locator('.calc input:visible').first().focus();
    await page.locator('.calc[data-hydrated="true"]').waitFor();
    await page.getByRole('button', { name: /Favorite/ }).click();
    await expect(page.getByRole('button', { name: /Favorite/ })).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/');
    await expect(page.locator('#mine')).toBeVisible();
    await expect(page.locator('#mine-fav a', { hasText: 'BMI Calculator' })).toBeVisible();
    await expect(page.locator('#mine-recent a', { hasText: 'BMI Calculator' })).toBeVisible();
  });

  test('history records a calculation and compare holds scenarios', async ({ page }) => {
    await page.goto('/finance/loan-calculator/');
    const amount = page.locator('#in-amount');
    await amount.focus();
    await page.locator('.calc[data-hydrated="true"]').waitFor();
    await amount.fill('22000');
    await page.getByRole('button', { name: 'Add to compare' }).click();
    await amount.fill('30000');
    await page.getByRole('button', { name: 'Add to compare' }).click();
    await expect(page.locator('#compare-h')).toBeVisible();
    await expect(page.locator('table:has(caption:text("Saved scenarios compared")) thead th')).toHaveCount(3);
    await expect(page.locator('summary', { hasText: 'Your recent calculations' })).toBeVisible({ timeout: 5000 });
  });

  test('CSV export downloads the amortization table', async ({ page }) => {
    await page.goto('/finance/loan-calculator/');
    await page.locator('#in-amount').focus();
    await page.locator('.calc[data-hydrated="true"]').waitFor();
    await page.locator('summary', { hasText: 'Amortization schedule' }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download CSV' }).click()]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('reset restores defaults and clears the URL', async ({ page }) => {
    await page.goto('/math/percentage-calculator/?ofPct=50');
    await page.locator('.calc[data-hydrated="true"]').waitFor();
    await expect(page.locator('[data-testid="headline-value"]')).toHaveText('40');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('[data-testid="headline-value"]')).toHaveText('12');
    await expect(page).not.toHaveURL(/\?/);
  });

  test('print stylesheet hides the toolbar and navigation', async ({ page }) => {
    await page.goto('/finance/mortgage-calculator/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.toolbar').first()).toBeHidden();
    await expect(page.locator('header')).toBeHidden();
    await expect(page.locator('[data-testid="headline-value"]')).toBeVisible();
  });

  test('robots.txt, llms.txt, sitemap and manifest are served', async ({ request }) => {
    for (const url of ['/robots.txt', '/llms.txt', '/sitemap-index.xml', '/manifest.webmanifest', '/sw.js']) {
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
    }
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /embed/');
  });
});
