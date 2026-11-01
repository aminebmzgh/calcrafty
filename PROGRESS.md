Current phase: 3
Status: in-progress
Blocker: none

## Phases

| Phase | Name | Status |
|---|---|---|
| 0 | Setup and keyword plan | done (repo push pending, see LAUNCH.md 1) |
| 1 | Foundation | done (placeholder deploy pending the repo) |
| 2 | Gold standard: Mortgage Calculator + live data | done |
| 3 | Remaining finance calculators | in-progress |
| 4 | Health, math and everyday calculators | pending |
| 5 | Site architecture and trust | pending |
| 6 | State pages | pending |
| 7 | Launch hardening | pending |

## Log

- 2026-11-01: Phase 0 started. Git initialized, folder structure created, brief moved to docs/BUILD-BRIEF.md.
- 2026-11-01: Phase 0 done. Keyword map: 55 rows (estimates).
- 2026-11-01: Phase 1 done. Astro 7 static site, design tokens + dark theme, header/footer/logo, registry, SEO head, JSON-LD, sitemaps, robots, llms.txt, .htaccess, OG images, search, trust pages, validators (SEO, links, keyword map, uniqueness, budgets), Playwright + axe, LHCI configs, CI and deploy workflows. FRED snapshot seeded with real data.
- 2026-11-01: GitHub repo created (private) and pushed after owner approval. Placeholder deploy triggered.
- 2026-11-01: Phase 2 done. Mortgage calculator: decimal/integer-cent math with 29 unit tests (4 references, PMI at 78% LTV, extra payments, edge cases, 300-loan cross-check), live FRED rate default, all shared components (inputs, unit toggles, readout, explain, show-the-math, compare, share, history, favorites, charts, CSV tables), full MDX, FAQ/HowTo/WebApplication schema, OG image, embed page. Lighthouse mobile: Performance 1.0, LCP 1.3 s, TBT 10 ms, CLS 0. JS 31.7 KB gz.

## Known issues

- Link check fails until Phase 3 builds the calculators linked from the mortgage page (loan, affordability, rent vs buy, savings goal, paycheck).
- Math and Everyday hubs are empty (noindex) until Phase 4, so their no-JS content-length test fails.
- A stray empty folder `C:\c\Users\...` was created outside the project by a screenshot script path mistake; the owner can delete `C:\c` (it contains no files).
