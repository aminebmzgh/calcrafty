import { test, expect, type Page } from '@playwright/test';
import { calculatorUrls } from './pages.ts';

/**
 * Every calculator: loads without console errors, accepts input, updates the result,
 * and its share URL round-trips the inputs.
 */
/** Widgets hydrate on first interaction: focus the first field, then wait. */
async function interact(page: Page) {
  await page.locator('.calc input:visible').first().focus();
  await page.locator('.calc[data-hydrated="true"]').waitFor();
}

/** A new value ~37% above the current one; whole numbers for integer fields (inputmode="numeric"). */
async function bump(field: import('@playwright/test').Locator) {
  const n = Number((await field.inputValue()).replace(/[^0-9.-]/g, '')) || 1;
  const integer = (await field.getAttribute('inputmode')) === 'numeric';
  const next = n * 1.37;
  await field.fill(String(integer ? Math.max(Math.round(next), Math.round(n) + 1) : Math.round(next * 100) / 100));
}

async function firstEditableNumber(page: Page) {
  const fields = page.locator('.calc input[inputmode="decimal"]:visible, .calc input[inputmode="numeric"]:visible');
  await expect(fields.first()).toBeVisible();
  return fields.first();
}

for (const url of calculatorUrls()) {
  test.describe(url, () => {
    test('loads without errors and updates live', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      await page.goto(url);
      await interact(page);
      const headline = page.locator('[data-testid="headline-value"]').first();
      const before = await headline.innerText();

      const custom = page.locator('[data-testid="e2e-input"]');
      if (await custom.count()) {
        await custom.first().fill(await custom.first().getAttribute('data-e2e-value') ?? '1');
      } else {
        await bump(await firstEditableNumber(page));
      }
      await expect(headline).not.toHaveText(before, { timeout: 3000 });
      await expect(headline).not.toHaveText(/NaN|Infinity|undefined/);
      expect(errors).toEqual([]);
    });

    test('share URL round-trips inputs', async ({ page }) => {
      await page.goto(url);
      await interact(page);
      const custom = page.locator('[data-testid="e2e-input"]');
      if (await custom.count()) {
        await custom.first().fill(await custom.first().getAttribute('data-e2e-value') ?? '1');
      } else {
        await bump(await firstEditableNumber(page));
      }
      const headline = page.locator('[data-testid="headline-value"]').first();
      await expect(page).toHaveURL(/\?/, { timeout: 3000 });
      const expected = await headline.innerText();
      const shared = page.url();

      const fresh = await page.context().newPage();
      await fresh.goto(shared);
      // Share links hydrate immediately (inputs in the query string).
      await fresh.locator('.calc[data-hydrated="true"]').waitFor();
      await expect(fresh.locator('[data-testid="headline-value"]').first()).toHaveText(expected);
      // Canonical never carries parameters.
      const canonical = await fresh.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).not.toContain('?');
    });
  });
}
