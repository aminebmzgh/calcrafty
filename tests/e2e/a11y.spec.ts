import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { builtUrls, pageTypeSamples } from './pages.ts';

// axe on every built page, in both themes, on the desktop project (mobile covers light only).
// Pages outside the per-type sample are tagged @full: the per-push run (npm run test:e2e:quick)
// skips them, the weekly full CI run covers them.
const urls = builtUrls();
const samples = new Set(pageTypeSamples());

for (const url of urls) {
  for (const theme of ['light', 'dark'] as const) {
    test(`axe: ${url} (${theme})${samples.has(url) ? '' : ' @full'}`, async ({ page }, info) => {
      if (info.project.name === 'mobile' && theme === 'dark') test.skip();
      await page.addInitScript((t) => localStorage.setItem('calcrafty:theme', t), theme);
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      // content-visibility:auto keeps off-screen blocks at their placeholder height, so axe measures the
      // unrendered content overlapping the footer. Users only reach a block once it has rendered at full size.
      await page.addStyleTag({ content: '.defer-render{content-visibility:visible!important}' });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
      expect(summary, `axe violations on ${url}`).toEqual([]);
    });
  }
}
