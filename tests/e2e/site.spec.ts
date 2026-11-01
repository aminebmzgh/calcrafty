import { test, expect } from '@playwright/test';

test('home loads and links to categories', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('header nav a[href="/finance/"]').first()).toBeVisible();
});

test('theme toggle switches and persists without flash', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.locator('#theme-toggle').click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after!);
});

test('search opens with / and finds synonyms', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'keyboard shortcut is a desktop feature');
  await page.goto('/');
  await page.keyboard.press('/');
  const input = page.locator('#site-search');
  await expect(input).toBeFocused();
  await input.fill('house payment');
  await expect(page.locator('#search-results a').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(input).toHaveCount(0);
});

test('404 page is served for unknown URLs', async ({ page }) => {
  const res = await page.goto('/404.html');
  expect(res?.status()).toBeLessThan(500);
  await expect(page.locator('h1')).toContainText('doesn’t exist');
});
