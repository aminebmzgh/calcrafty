Current phase: 5
Status: in-progress
Blocker: none

## Phases

| Phase | Name | Status |
|---|---|---|
| 0 | Setup and keyword plan | done (repo push pending, see LAUNCH.md 1) |
| 1 | Foundation | done (placeholder deploy pending the repo) |
| 2 | Gold standard: Mortgage Calculator + live data | done |
| 3 | Remaining finance calculators | done |
| 4 | Health, math and everyday calculators | done |
| 5 | Site architecture and trust | in-progress |
| 6 | State pages | pending |
| 7 | Launch hardening | pending |

## Log

- 2026-11-01: Phase 0 started. Git initialized, folder structure created, brief moved to docs/BUILD-BRIEF.md.
- 2026-11-01: Phase 0 done. Keyword map: 55 rows (estimates).
- 2026-11-01: Phase 1 done. Astro 7 static site, design tokens + dark theme, header/footer/logo, registry, SEO head, JSON-LD, sitemaps, robots, llms.txt, .htaccess, OG images, search, trust pages, validators (SEO, links, keyword map, uniqueness, budgets), Playwright + axe, LHCI configs, CI and deploy workflows. FRED snapshot seeded with real data.
- 2026-11-01: GitHub repo created (private) and pushed after owner approval. Placeholder deploy triggered.
- 2026-11-01: Phase 2 done. Mortgage calculator: decimal/integer-cent math with 29 unit tests (4 references, PMI at 78% LTV, extra payments, edge cases, 300-loan cross-check), live FRED rate default, all shared components (inputs, unit toggles, readout, explain, show-the-math, compare, share, history, favorites, charts, CSV tables), full MDX, FAQ/HowTo/WebApplication schema, OG image, embed page. Lighthouse mobile: Performance 1.0, LCP 1.3 s, TBT 10 ms, CLS 0. JS 31.7 KB gz.
- 2026-11-01: Phase 3 done. 11 finance calculators (paycheck with verified 2026 IRS data, auto loan, compound interest, loan, retirement, mortgage affordability, investment, credit card payoff, debt payoff snowball vs avalanche, savings goal, rent vs buy). Shared math modules (money, growth, tax). 210 unit tests incl. config contract and content gates (800–1,500 words, 5–8 FAQs, ≥3 internal links). Lighthouse 1.0 on all sampled pages. Fixed: Vitest fsModuleCache hid new calculators from the registry in tests.
- 2026-11-01: Phase 4 done. 13 more calculators (BMI, calorie/TDEE, body fat, macro, ideal weight, running pace, percentage, scientific, fraction, standard deviation, age, days between dates, GPA). All 25 built. 414 unit tests; 446+ e2e checks incl. axe on every page in both themes; Lighthouse 1.0 on sampled page types. Content gate now uses strict YAML (caught two frontmatter errors); all FAQ/HowTo values JSON-quoted.

## Known issues

- A stray empty folder `C:\c\Users\...` was created outside the project by a screenshot script path mistake; the owner can delete `C:\c` (it contains no files).
