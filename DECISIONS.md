# Decisions

Why things are the way they are. Newest at the bottom. Runtime dependencies list gzipped size (hard rule 12).

## 2026-11-01

- **Keyword map built from estimates.** No keyword exports exist in `research/raw/`. Volume and difficulty are marked `estimate` and `priority_score` is computed from those estimates. Replacement is a LAUNCH.md item.
- **Extra `data_source` column in the keyword map.** The brief's columns are kept as specified; `data_source` (`estimate` or the tool name) marks estimated rows without putting text in the numeric `volume`/`difficulty` columns, so `priority_score` stays computable.
- **Keyword map scope.** 25 calculators, 10 mortgage state pages and 10 paycheck state pages (top 10 states by population/search demand: CA, TX, FL, NY, PA, IL, OH, GA, NC, MI), 5 pillar guides, 4 category hubs and the homepage.
- **Guide vs calculator intent split.** "how much house can i afford" (learn intent) belongs to the pillar guide; the calculator owns "mortgage affordability calculator". Same split for retirement ("how much do i need to retire" guide vs "retirement calculator").
- **TypeScript 6.0.3, not 7.x.** TypeScript 7 is the latest, but `typescript-eslint` (<6.1) and `@astrojs/check` (5 or 6) don't support it yet.
- **No `eslint-plugin-jsx-a11y`.** It doesn't support ESLint 10 (and is only an optional peer of `eslint-plugin-astro`). Accessibility is enforced at runtime by axe on every page in both themes.
- **Hand-written sitemaps instead of `@astrojs/sitemap`.** Endpoints in `src/pages/sitemap-*.xml.ts` read the same page inventory (`src/lib/pages.ts`) as llms.txt. That gives per-type sitemaps, `lastmod` from `lastReviewed` or live-data `asOf`, and draft exclusion driven by content status, with zero dependencies.
- **FRED public CSV fallback.** Without `FRED_API_KEY`, `data:refresh` uses `fred.stlouisfed.org/graph/fredgraph.csv` (no key needed). The snapshot was seeded on 2026-11-01 with real values (30-yr 7.24% as of 2026-10-29). The API key is still preferred for reliability.
- **Savings and auto-loan defaults.** "Savings rate" defaults use the 3-month Treasury bill (DTB3) as a published, citable proxy for high-yield savings. Auto loans use the Fed's 60-month new-car rate at commercial banks (RIFLPBCIANM60NM).
- **CSP: header plus Astro meta.** `.htaccess` sends a broad CSP header that allows inline scripts and styles, because Astro inlines them. Astro's `security.csp` adds a `<meta>` CSP with exact SHA-256 hashes. Browsers enforce both, so the effective policy is hash-based. `/embed/*` gets `frame-ancestors *` and no `X-Frame-Options`.
- **LiteSpeed-safe `.htaccess`.** Uses `SetEnvIf` + `Header ... env=` instead of `<If>` blocks, because Hostinger runs LiteSpeed, which doesn't fully support `<If>`.
- **Custom island hydration for calculator widgets.** Widgets are server-rendered from the registry and hydrated by a tiny loader that lazy-imports `src/calculators/<slug>/Widget.tsx` via `import.meta.glob`. This keeps hard rule 4 (adding a calculator = one folder) because no page needs a static import per calculator. A lint rule stops client code from importing the registry, so each page ships only its own calculator.
- **System font stack.** No web font on the site: zero font bytes, no FOUT, best LCP. Inter (`@fontsource/inter`, dev dependency) is used only at build time for OG images.
- **Category hubs always build.** A hub with no calculators yet renders as `noindex`, which avoids both broken nav links and thin indexed pages.
- **Review fields.** `status`, `reviewedBy` and `lastReviewed` live in each page's MDX frontmatter, where the owner edits them. The config's `lastReviewed` records the last math or data review; the page shows the later of the two.
- **State pages inherit review status** from their parent calculator's MDX, since they have no MDX of their own.
- **Input defaults live in `defaults` only.** The brief lists `default` on each InputDef, but keeping a single `defaults: I` object (typed against the inputs) avoids two sources of truth. The registry checks that every input has a default.
- **Config contract extensions.** Beyond section 9: `intro`, `subtopic`, `synonyms`, `summarize` (headline + secondary results), `steps` (ShowTheMath), `ogValue` and `validate`. All are display or wiring helpers; formulas stay in `math.ts`.

### Runtime dependencies (gzipped, as shipped)

| Package | Size (gz) | Why |
|---|---|---|
| preact + preact/hooks | ~4.5 KB | Island runtime (required by the brief) |
| @preact/signals | ~2.5 KB | Fine-grained calculator state (required by the brief) |
| decimal.js-light | ~5 KB | Exact decimal money math (required by the brief) |
| minisearch | ~7 KB | Search, loaded only when the search dialog opens |
| web-vitals | ~2 KB | Real-user monitoring, loaded only for sampled visits |
