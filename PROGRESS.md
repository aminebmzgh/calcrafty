Current phase: 2
Status: in-progress
Blocker: none

## Phases

| Phase | Name | Status |
|---|---|---|
| 0 | Setup and keyword plan | done (repo push pending, see LAUNCH.md 1) |
| 1 | Foundation | done (placeholder deploy pending the repo) |
| 2 | Gold standard: Mortgage Calculator + live data | in-progress |
| 3 | Remaining finance calculators | pending |
| 4 | Health, math and everyday calculators | pending |
| 5 | Site architecture and trust | pending |
| 6 | State pages | pending |
| 7 | Launch hardening | pending |

## Log

- 2026-11-01: Phase 0 started. Git initialized, folder structure created, brief moved to docs/BUILD-BRIEF.md.
- 2026-11-01: Phase 0 done. Keyword map: 55 rows (estimates).
- 2026-11-01: Phase 1 done. Astro 7 static site, design tokens + dark theme, header/footer/logo, registry, SEO head, JSON-LD, sitemaps, robots, llms.txt, .htaccess, OG images, search, trust pages, validators (SEO, links, keyword map, uniqueness, budgets), Playwright + axe, LHCI configs, CI and deploy workflows. FRED snapshot seeded with real data.

## Known issues

- GitHub repo not created yet: `gh repo create` was blocked by Claude Code's permission settings. All work is committed locally. See LAUNCH.md item 1.
- Until calculators exist, the no-JS content-length test and the search synonym test fail on empty pages. Resolved in Phase 2.
