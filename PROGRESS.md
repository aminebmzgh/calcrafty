Current phase: 7
Status: done
Blocker: none

## Phases

| Phase | Name | Status |
|---|---|---|
| 0 | Setup and keyword plan | done |
| 1 | Foundation | done |
| 2 | Gold standard: Mortgage Calculator + live data | done |
| 3 | Remaining finance calculators | done |
| 4 | Health, math and everyday calculators | done |
| 5 | Site architecture and trust | done |
| 6 | State pages | done |
| 7 | Launch hardening | done |

## Log

- 2026-11-01: Phase 0 started. Git initialized, folder structure created, brief moved to docs/BUILD-BRIEF.md.
- 2026-11-01: Phase 0 done. Keyword map: 55 rows (estimates).
- 2026-11-01: Phase 1 done. Astro 7 static site, design tokens + dark theme, header/footer/logo, registry, SEO head, JSON-LD, sitemaps, robots, llms.txt, .htaccess, OG images, search, trust pages, validators (SEO, links, keyword map, uniqueness, budgets), Playwright + axe, LHCI configs, CI and deploy workflows. FRED snapshot seeded with real data.
- 2026-11-01: GitHub repo created (private) and pushed after owner approval. Placeholder deploy triggered.
- 2026-11-01: Phase 2 done. Mortgage calculator: decimal/integer-cent math with 29 unit tests (4 references, PMI at 78% LTV, extra payments, edge cases, 300-loan cross-check), live FRED rate default, all shared components (inputs, unit toggles, readout, explain, show-the-math, compare, share, history, favorites, charts, CSV tables), full MDX, FAQ/HowTo/WebApplication schema, OG image, embed page. Lighthouse mobile: Performance 1.0, LCP 1.3 s, TBT 10 ms, CLS 0. JS 31.7 KB gz.
- 2026-11-01: Phase 3 done. 11 finance calculators (paycheck with verified 2026 IRS data, auto loan, compound interest, loan, retirement, mortgage affordability, investment, credit card payoff, debt payoff snowball vs avalanche, savings goal, rent vs buy). Shared math modules (money, growth, tax). 210 unit tests incl. config contract and content gates (800–1,500 words, 5–8 FAQs, ≥3 internal links). Lighthouse 1.0 on all sampled pages. Fixed: Vitest fsModuleCache hid new calculators from the registry in tests.
- 2026-11-01: Phase 4 done. 13 more calculators (BMI, calorie/TDEE, body fat, macro, ideal weight, running pace, percentage, scientific, fraction, standard deviation, age, days between dates, GPA). All 25 built. 414 unit tests; 446+ e2e checks incl. axe on every page in both themes; Lighthouse 1.0 on sampled page types. Content gate now uses strict YAML (caught two frontmatter errors); all FAQ/HowTo values JSON-quoted.
- 2026-11-01: Phase 5 done. New homepage (search, popular, categories, guides, recently reviewed, local favorites/recent), hub intro text, 5 pillar guides (draft) with Article/FAQ schema, guide route. Trust pages, Organization/WebSite schema, AnswerBox on every calculator, no orphans (link check: every page ≤3 clicks), ≥3 contextual links per article (content gate), llms.txt lists reviewed pages only.
- 2026-11-01: CI and Deploy passed for the first time (Phase 5 push); the deploy branch now holds the built site.
- 2026-11-01: Phase 6 done. 20 state pages (mortgage + paycheck × CA, TX, FL, NY, PA, IL, OH, GA, NC, MI) and 2 state index pages, from sourced data in src/data/static/states.ts. Paycheck calculator gained a State selector (2026 brackets, deductions, exemption credits, SDI/PFL/DBL caps, PA 401(k) rule) and a local tax rate. Uniqueness check: highest pair 66%. axe clean on all state pages.
- 2026-11-01: Phase 7 done. Service worker + offline page, real-user vitals (20% sample, loads only with analytics), Speculation Rules prefetch, ads/affiliate components behind ADS_ENABLED, IndexNow, feature e2e tests (favorites, history, compare, CSV, reset, print, static files). LAUNCH.md completed with every owner step, the draft pages to review and the state data items to verify. All gates green locally: 422 unit tests, typecheck, lint, SEO (91 pages), links, keyword map, uniqueness (max 66%), budgets (≤2.9 KB JS at load, 6.2 KB CSS gzipped).
- 2026-11-01: CI fixes after Phase 7: chips kept their 44px target inside prose lists, mobile result bar hidden until hydrated, a11y test renders content-visibility blocks before axe. CI and Deploy green; deploy branch at Deploy 7a5d50e.
- 2026-11-01: Live at https://calcrafty.com (Hostinger, Import from GitHub on the `deploy` branch). SSL, redirects, CDN and security headers verified.
- 2026-11-01: Umami analytics live; Search Console and Bing set up; About page names the owner. State data re-checked against official sources: Georgia 4.99% and - 2026-11-01: Live at https://calcrafty.com (Hostinger, Import from GitHub on the `deploy` branch). SSL, redirects, CDN and security headers verified.
- 2026-11-01: Owner reviewed all content; 25 calculators, 5 guides and 20 state pages set to reviewed (indexable, 63 URLs in the sitemap).
- 2026-11-01: Growth batch 1 (research/next-batch-plan.md): APR (Reg Z actuarial method), debt-to-income ratio, salary to hourly, pay raise and car affordability calculators, plus the "Is refinancing worth it?" guide. Reviewed by the owner the same day and indexable. 518 unit tests, all checks green.
- 2026-11-02: Content depth: owner set calculator pages and guides to 1,500–2,500 words. All 30 calculator pages and 6 guides expanded with new, computed sections (worked examples from math.ts, tables, mistakes, follow-ups) and the rule enforced in content.test.ts. Corrected two retirement figures that were off by a cent. Re-read and approved by the owner the same day.
- 2026-11-02: Growth batch 2: refinance (classic and true break-even, term-reset effect), CD (APY, after-tax and real return, early withdrawal penalty) and HELOC (CLTV limit, payment shock) calculators, plus guides "What is a good debt-to-income ratio?" and "How is APR calculated?". All 1,500+ words, reviewed by the owner the same day and indexable. 596 unit tests, all checks green.
- 2026-11-02: Growth batch 3: simple interest (solve for any variable, actual/365 and actual/360), inflation (official CPI-U history since 1913), emergency fund and final grade calculators, plus the guide "How long to pay off a credit card at minimum payments". All 1,500+ words, reviewed by the owner the same day and indexable. 662 unit tests, all checks green.
- 2026-11-02: Growth batch 4: 401(k) (IRS 2026 limits with age-based catch-up, employer match, raises), net worth (with Federal Reserve SCF 2022 medians by age), overtime (federal 40-hour rule and California daily overtime and double time), time card (parses clock-in and clock-out lines, overnight shifts, breaks) and mean/median/mode calculators, plus five guides: how much to contribute to a 401(k), Roth vs traditional 401(k), how to read a pay stub, a good net worth by age, and how mortgage amortization works. All 1,500+ words, reviewed by the owner the same day and indexable. 755 unit tests, all checks green.
- 2026-11-02: Categories expanded to 14 (sports, statistics, physics, chemistry, biology, ecology, construction, conversion, food and other added). Empty categories are hidden until their first calculator. Running pace moved from Health to the new Sports category, and standard deviation and mean/median/mode from Math to the new Statistics category, all with 301 redirects. 771 unit tests, all checks green.
- 2026-11-02: Growth batch 5 (Construction category): concrete (slab, footing, round column; cubic yards, ready-mix order, 40/60/80 lb bags), paint (walls, openings, ceiling, coats; gallons plus quarts to buy), flooring (waste allowance, boxes, cost), gravel (cubic yards, tons, bags) and roofing (pitch factor, squares, bundles) calculators. All 1,500+ words, reviewed by the owner the same day and indexable, with the Construction hub. 835 unit tests, all checks green.
- 2026-11-03: Growth batch 6: one calculator and one guide for each previously empty category (Ohm’s law, molarity, Punnett square, car CO2, length converter, recipe scaler, tip calculator; guides on Ohm’s law, molarity, Punnett squares, car CO2, metric conversions, scaling recipes and tipping). All 14 categories now have content; the header shows six categories plus a "More" menu. All 1,500+ words, reviewed by the owner the same day and indexable. 969 unit tests, all checks green.
5,000/$30,000 (HB 463), Ohio exemption income tiers, California 2025 standard deduction, Philadelphia 3.735%/3.425%. Deploy workflow: snapshot commit rebases and never blocks a deploy.

## Known issues

- A stray empty folder `C:\c` was created outside the project by a screenshot path mistake; it contains no files and can be deleted.
