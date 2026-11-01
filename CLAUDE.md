# Calcrafty

Calcrafty (https://calcrafty.com) is a static calculator website built to outrank calculator.net.
Astro (static output) + Preact islands + Tailwind + MDX content collections, TypeScript strict.
Every calculator is one folder in `src/calculators/<slug>/` (config, math, tests, widget, content).
The built site is pushed to the `deploy` branch by GitHub Actions; Hostinger pulls it into `public_html`.
Priorities: correct math, then speed and search visibility, then a UX that makes calculator.net feel outdated.

Full specification: docs/BUILD-BRIEF.md. Current status: PROGRESS.md. Always read both before working.

## Hard rules

1. **Static first.** Every page is pre-rendered HTML. Full content, labels and the default result are visible with JavaScript disabled.
2. **Math lives in `math.ts` only**, as pure functions with unit tests checked against authoritative reference values. UI files contain no formulas.
3. **One definition per calculator.** Pages, sitemap, schema, search index and internal links are generated from `src/calculators/<slug>/config.ts`.
4. **Adding a calculator = adding one folder** (`config.ts`, `math.ts`, `math.test.ts`, `Widget.tsx`, `content.mdx`). No edits elsewhere.
5. **One page per search intent.** Check `research/keyword-map.csv` before creating any page. No two pages share a primary keyword.
6. **Content status gates indexing.** MDX frontmatter has `status: draft | reviewed`. Draft pages are `noindex` and excluded from the sitemap. Only a human sets `reviewed`. Never set it yourself.
7. **Live data never breaks the build.** External data is fetched at build time with a committed fallback snapshot and an "as of" date shown on the page.
8. **No thin pages.** Programmatic pages (e.g. state pages) are generated only if they have meaningfully unique data.
9. **Accessibility: WCAG 2.2 AA**, zero axe violations.
10. **No dark patterns:** no forced sign-up, interstitials or popups. Never place ads between inputs and results.
11. **Secrets never enter the repo.** Use GitHub Actions secrets and a git-ignored `.env`.
12. **No new runtime dependency** without a `DECISIONS.md` entry stating its gzipped size and why.

## Performance budgets (mobile, enforced in CI)

| Metric | Ads OFF | Ads ON |
|---|---|---|
| Lighthouse Performance | >= 98 | >= 90 |
| Lighthouse SEO / Accessibility / Best Practices | 100 / >= 98 / 100 | 100 / >= 98 / >= 95 |
| LCP | < 1.5 s | < 2.0 s |
| CLS | < 0.02 | < 0.05 |
| INP | < 100 ms | < 150 ms |
| First-party JS per page (gzipped) | < 35 KB | < 35 KB |
| CSS (gzipped) | < 20 KB | < 20 KB |
