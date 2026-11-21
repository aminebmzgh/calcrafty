# Calcrafty: Complete Build Brief

> **For the owner:** open Claude Code in an empty folder, put this file in it, and say:
> **"Read CALCRAFTY-BUILD-BRIEF.md and start building."**
> To continue in a later session, say: **"Continue building."**

---

## 0. Instructions for Claude Code (read first)

You are building **Calcrafty** (`calcrafty.com`) from an empty folder to a live, production website. This file is the complete specification. Follow it from start to finish.

### How to operate

1. **Read this entire file before writing any code.**
2. **First actions (Phase 0 setup):**
   - Initialize git and create the folder structure in section 8.
   - Move this file to `docs/BUILD-BRIEF.md` (the single source of truth from now on).
   - Create `CLAUDE.md` in the root containing: a 5-line project summary, the hard rules from section 4, the performance budgets from section 16, and this line: *"Full specification: docs/BUILD-BRIEF.md. Current status: PROGRESS.md. Always read both before working."*
   - Create `PROGRESS.md` starting with these exact lines, then a table of the phases in section 22:
     ```
     Current phase: 0
     Status: in-progress
     Blocker: none
     ```
   - Create `DECISIONS.md` (why you chose things) and `LAUNCH.md` (the owner's to-do list).
3. **Work through all phases in section 22 in order, without stopping between them.** After each phase: run the quality gates (section 23), commit, push, update `PROGRESS.md` (phase done, short log entry, known issues), then start the next phase.
4. **Never stop to ask the owner questions.** Make senior-level decisions, record them in `DECISIONS.md`, and continue. Anything that needs the owner's accounts, passwords or keys goes into `LAUNCH.md` as a clear step-by-step item, and you continue with everything else.
5. **The only reason to stop** is a hard blocker with no workaround (for example, `gh` is not authenticated so the repo cannot be created). Then set `Status: blocked`, write the exact fix in `Blocker:`, and tell the owner in one short message.
6. **Resuming:** when the owner says "continue" (or in any new session), read `CLAUDE.md`, `PROGRESS.md` and the recent git log, then resume from the first unfinished task. Never redo finished work.
7. **Commit in small logical steps** with clear messages so work is never lost.
8. When every phase is done, set `Status: done` and give the owner a short final report: what is live, what to check by hand, and what is left in `LAUNCH.md`.

### Your role

Senior full-stack engineer and technical SEO specialist with 15+ years of experience. Priorities, in order:
1. **Correct math.** A wrong answer destroys trust permanently.
2. **Speed and search visibility.**
3. **A user experience that makes calculator.net feel outdated.**

---

## 1. Project

| | |
|---|---|
| Name | **Calcrafty** |
| Domain | **calcrafty.com** (canonical: `https://calcrafty.com`, no `www`) |
| Language | English (US audience first) |
| Hosting | **Hostinger** web hosting (Apache/LiteSpeed, `public_html`) |
| Code | **GitHub** private repository `calcrafty` |
| Competitor | calculator.net |
| Priority niche | Personal finance, then health, math, everyday tools |

**Strategy:** don't clone 200+ calculators. Build fewer calculators that are each **the best page on the internet for their keyword**, then expand.

---

## 2. What Only the Owner Can Do

Claude Code: put each of these in `LAUNCH.md` with exact click-by-click steps when you reach the point where it is needed, and keep building. Check whether each is already done before listing it.

| When | Owner action | Needed for |
|---|---|---|
| Before starting | Install GitHub CLI and run `gh auth login` | Creating and pushing the repo |
| Phase 1 | In Hostinger hPanel → Websites → calcrafty.com → **Advanced → Git**: connect GitHub, select repo `calcrafty`, branch **`deploy`**, directory `public_html` (must be empty), enable auto-deployment | Going live |
| Phase 1 | In hPanel: enable **SSL** for calcrafty.com (free Let's Encrypt) | HTTPS |
| Phase 2 | Get a free API key at fred.stlouisfed.org and run `gh secret set FRED_API_KEY` | Live mortgage rates |
| Phase 7 | Create a free **Umami Cloud** (or Plausible) site and give the script ID: `gh secret set ANALYTICS_ID` | Analytics |
| Phase 7 | Verify calcrafty.com in **Google Search Console** and **Bing Webmaster Tools**, submit `https://calcrafty.com/sitemap-index.xml` | Indexing |
| Ongoing | Review draft pages and change `status: draft` → `status: reviewed` | Pages become indexable |

---

## 3. Positioning: Beat calculator.net on Every Weak Point

| calculator.net weakness | Calcrafty |
|---|---|
| "Calculate" button, full page reload | **Live results** as you type |
| Dated, cluttered, weak on phones | **Mobile-first**, clean UI, dark mode |
| Bare numbers | **Plain-English explanation** + step-by-step math |
| Static tables, few visuals | **Interactive charts**, collapsible tables |
| No scenario comparison | **Compare up to 3 scenarios** side by side |
| Inputs lost; awkward sharing | **Shareable URLs**, local history and favorites |
| Generic fixed defaults | **Live defaults** from today's data, with an "as of" date |
| National averages only | **State pages with real local data** |
| Isolated tools | **Calculator chains** ("people usually calculate this next") |
| Ad layout shifts | Reserved ad space, zero layout shift |

---

## 4. Hard Rules

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

---

## 5. Tech Stack

Use the latest **stable** versions; pin exact versions in `package.json`.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro**, `output: 'static'` | Zero-JS by default, islands, best for content + SEO |
| Islands | **Preact** + **@preact/signals** | ~4 KB runtime, fine-grained reactivity |
| Language | **TypeScript** strict | Safety for math and config |
| Styling | **Tailwind CSS** + CSS custom properties for theme tokens | Small CSS, consistent design system |
| Content | **MDX** in Astro Content Collections + **Zod** | Typed, validated content |
| Money math | **decimal.js-light** | No floating-point errors |
| Charts | Hand-written **SVG components** (uPlot only if truly needed) | Tiny bundle |
| Search | **MiniSearch**, index built at build time | Instant, serverless |
| OG images | **Satori + resvg** at build time | Unique social image per page |
| Sitemap | **@astrojs/sitemap** (with custom filter for drafts) | Standard |
| Testing | **Vitest**, **Playwright**, **axe-core**, **Lighthouse CI** | Enforced quality |
| CI/CD | **GitHub Actions** | Build, test, deploy |
| Hosting | **Hostinger** (static files in `public_html`) | Owner's plan |
| Analytics | **Umami Cloud** or **Plausible** (async, cookie-free) | Privacy-friendly, tiny |

Astro config essentials: `site: 'https://calcrafty.com'`, `trailingSlash: 'always'`, `build.format: 'directory'` (every page is `folder/index.html`, which Apache serves natively).

---

## 6. GitHub Repository

1. Check `gh auth status`. If not authenticated, this is a hard blocker: tell the owner to run `gh auth login`.
2. Create the repo: `gh repo create calcrafty --private --source=. --remote=origin`.
3. Branches:
   - **`main`**: source code. All work is committed here.
   - **`deploy`**: built site only, written by GitHub Actions. Never edit by hand. Hostinger pulls this branch.
4. Add `.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.env`, `.env.*`, `.lighthouseci/`, `playwright-report/`, `test-results/`.
5. Push after every phase.
6. `README.md`: what Calcrafty is, how to run it locally, how to add a calculator, how deployment works.

### GitHub Actions workflows

**`ci.yml`** (quick suite on every push via `deploy.yml` and on pull requests; full suite with axe on every page and Lighthouse CI weekly and on demand, see DECISIONS.md 2026-11-06): install → typecheck → lint → unit tests → build → Playwright + axe → Lighthouse CI (full only) → SEO validation → link check. Fails on any gate.

**`deploy.yml`** (on push to `main` after CI passes, on a **weekly schedule** every Monday 06:00 UTC, and on manual `workflow_dispatch`):
1. Install, run `npm run data:refresh` (uses `FRED_API_KEY` secret if present; falls back to the committed snapshot otherwise).
2. `npm run build`.
3. Push the contents of `dist/` to the `deploy` branch (e.g. `peaceiris/actions-gh-pages` with `publish_branch: deploy`, or a plain git force-push of `dist/`). Include `.htaccess` in the output.
4. Hostinger's Git auto-deployment pulls the `deploy` branch into `public_html`.
5. Run `scripts/indexnow.ts` to ping changed URLs.

**Fallback deploy method** (document in `LAUNCH.md`, use only if Hostinger Git auto-deploy is unavailable): rsync over SSH to `public_html` using secrets `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_KEY`. Hostinger SSH details are in hPanel → Advanced → SSH Access.

---

## 7. Hosting on Hostinger

The site is fully static: no Node.js on the server. Create `public/.htaccess` (copied into `dist/`) with:

- **Force HTTPS** and redirect `www.calcrafty.com` → `calcrafty.com` (301).
- **Trailing slash:** redirect `/finance/mortgage-calculator` → `/finance/mortgage-calculator/` (301) for directory paths.
- **Custom 404:** `ErrorDocument 404 /404.html`.
- **Disable directory listing:** `Options -Indexes`.
- **Compression:** gzip/deflate (and Brotli if the server supports it) for HTML, CSS, JS, SVG, JSON, XML.
- **Caching:**
  - Hashed assets (`/_astro/*`): `Cache-Control: public, max-age=31536000, immutable`
  - HTML: `Cache-Control: public, max-age=0, must-revalidate`
  - Fonts, icons: 1 year
  - `sitemap*.xml`, `robots.txt`, `llms.txt`: 1 hour
- **Security headers:** `Strict-Transport-Security` (max-age=31536000; includeSubDomains), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (disable camera, mic, geolocation), `X-Frame-Options: SAMEORIGIN` **except** on `/embed/*` (embeds must be frameable), and a `Content-Security-Policy` that allows only self plus the analytics domain.
- **Redirect map:** generated from `src/data/redirects.ts` at build time.

Add to `LAUNCH.md`: enable Hostinger's CDN in hPanel if the plan includes it (or put Cloudflare's free plan in front), and confirm SSL is active.

---

## 8. Project Structure

```
/
├── CLAUDE.md
├── PROGRESS.md
├── DECISIONS.md
├── LAUNCH.md
├── README.md
├── docs/BUILD-BRIEF.md            # this file
├── research/
│   ├── raw/                       # keyword tool exports (optional)
│   ├── gsc/                       # Search Console exports (after launch)
│   └── keyword-map.csv
├── public/
│   ├── .htaccess
│   ├── favicon.svg, icons, manifest.webmanifest
│   └── fonts/
├── src/
│   ├── calculators/<slug>/        # config.ts, math.ts, math.test.ts, Widget.tsx, content.mdx
│   ├── components/
│   │   ├── calculator/            # NumberInput, Slider, UnitToggle, ResultCard, ExplainPanel,
│   │   │                          # ShowTheMath, AnswerBox, AsOfBadge, CompareTable, ShareButton
│   │   ├── charts/                # LineChart, DonutChart, StackedBar (SVG)
│   │   ├── seo/                   # SeoHead, JsonLd, Breadcrumbs
│   │   ├── monetization/          # AdSlot, AffiliateCTA
│   │   └── layout/                # Header, Footer, SearchDialog, ThemeToggle
│   ├── content/guides/            # pillar guide MDX
│   ├── data/
│   │   ├── static/                # tax-2026.ts, states.ts, redirects.ts (dated, sourced)
│   │   └── live/                  # fetchers + snapshot.json fallback
│   ├── layouts/                   # BaseLayout, CalculatorLayout, StatePageLayout
│   ├── pages/
│   │   ├── index.astro
│   │   ├── [category]/index.astro
│   │   ├── [category]/[slug].astro
│   │   ├── [category]/[slug]/[state].astro
│   │   ├── guides/[slug].astro
│   │   ├── embed/[slug].astro
│   │   ├── llms.txt.ts, robots.txt.ts
│   │   └── about, methodology, privacy, terms, contact, 404
│   ├── lib/                       # registry, url-state, format, storage, schema, vitals
│   └── styles/
├── scripts/                       # data-refresh, indexnow, validate-seo, check-keyword-map, check-uniqueness
├── tests/e2e/
└── .github/workflows/             # ci.yml, deploy.yml
```

### npm scripts (keep working at all times)

```
npm run dev           # local dev server
npm run build         # production build
npm run preview       # serve the built site
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright + axe
npm run lhci          # Lighthouse CI
npm run check         # typecheck + lint + SEO validation + keyword-map check + link check
npm run data:refresh  # fetch live data, update snapshot.json
```

---

## 9. Calculator Definition Contract

```ts
export interface CalculatorConfig<I, O> {
  slug: string;                  // "mortgage-calculator"
  category: 'finance' | 'health' | 'math' | 'everyday';
  name: string;                  // "Mortgage Calculator"
  h1: string;
  metaTitle: string;             // <= 60 chars, unique, ends with " | Calcrafty" if it fits
  metaDescription: string;       // 140–160 chars, unique
  primaryKeyword: string;        // must exist in keyword-map.csv
  secondaryKeywords: string[];
  inputs: InputDef[];            // id, label, type, unit, min, max, step, default, helpText, liveDefault?
  defaults: I;                   // build-time defaults (live values merged in at build)
  compute: (input: I) => O;      // from math.ts
  explain: (input: I, out: O) => string[];      // plain-English sentences
  answerSummary: (input: I, out: O) => string;  // 1–2 sentence direct answer
  related: string[];             // slugs of "next step" calculators
  statePages?: StatePageConfig;  // enables /[slug]/[state]/ pages
  sources: { title: string; url: string }[];
  reviewedBy?: string;
  lastReviewed: string;          // ISO date
}
```

---

## 10. Calculator UX (every calculator)

### Inputs
- Text field **and** slider for ranged numeric inputs.
- Accept friendly formats: `300,000`, `300k`, `$300000`, `6.5%`.
- Unit toggles: lbs/kg, ft-in/cm, monthly/yearly, $/%.
- Inline validation with fix-it messages ("Interest rate must be between 0% and 30%"). Never show `NaN` or `Infinity`.
- Advanced options collapsed under "More options".
- Correct `inputmode` for phone keyboards.
- Live defaults show an **AsOfBadge**: "Today's average: 6.42% (as of Oct 29, 2026 · Freddie Mac)".

### Results
- **Live update** with ~150 ms debounce. Keep a visually hidden submit button for no-JS and screen readers.
- Large headline result; secondary results in a compact grid.
- **ExplainPanel:** 2–4 plain-English sentences. Example: *"You'll pay $382,633 in interest over 30 years, more than the loan itself. Adding $200/month saves $91,240 and finishes 6 years early."*
- **ShowTheMath:** the formula with the user's numbers substituted step by step.
- `aria-live="polite"` on the results region.

### Visuals
- Charts only where they add understanding; each has a text summary for screen readers.
- Large tables collapsed by default; yearly/monthly toggle; CSV export.
- Charts pre-render as static SVG for default inputs (no empty boxes before hydration).

### Power features
- **Compare** up to 3 scenarios, differences highlighted.
- **Share link** with inputs in the query string; canonical always points to the clean URL.
- **Copy result** summary; print stylesheet.
- **History** (last 10) and **favorites** in local storage; site works fully without storage.
- **Reset** to defaults.
- **"People usually calculate this next"** from `related`.

### Layout
- Mobile: H1, one-line intro, widget, all above the fold. Content below.
- Desktop: inputs left, sticky results right.
- Identical server and client markup: no layout shift on hydration.

### Visual design
- Distinctive, modern, trustworthy. Define design tokens (colors, type scale, spacing, radius) once as CSS custom properties, with a carefully tuned dark theme (not a simple inversion).
- System font stack or one self-hosted variable font. Tabular numbers for all results.
- Calcrafty logo: a simple SVG wordmark/icon created in the project.

---

## 11. Calculator Page Template (in order)

1. Breadcrumbs (Home › Finance › Mortgage Calculator)
2. H1 + one-line description
3. **Calculator widget** (pre-rendered with the default result)
4. **AnswerBox:** 1–2 sentence direct answer for the default scenario, e.g. *"On a $300,000 loan at today's average 6.42% rate, the monthly principal and interest payment is about $1,880 over 30 years."*
5. ExplainPanel + ShowTheMath
6. Charts / tables
7. Related calculators
8. **MDX content, 1,500–2,500 words** (raised from 800–1,500 on 2026-11-02, see DECISIONS.md). Each H2 opens with a 2–3 sentence direct answer, then detail:
   - How to use this calculator
   - Worked example with **unique, realistic** numbers
   - The formula in plain English
   - Key terms
   - What to do with your result
   - At least 3 contextual links to related calculators or guides
9. **FAQ** (5–8 real search questions) → FAQPage schema
10. Sources + link to Methodology
11. "Reviewed by [Name, credential] · Last updated [date]"
12. "Embed this calculator" snippet (iframe with "Powered by Calcrafty" backlink)
13. YMYL disclaimer on finance and health pages: educational use, not financial or medical advice.

---

## 12. Live Data

| Data | Source (free) | Refresh |
|---|---|---|
| 30-yr and 15-yr fixed mortgage rates | FRED `MORTGAGE30US`, `MORTGAGE15US` (Freddie Mac PMMS) | Weekly |
| Inflation (CPI-U) | FRED `CPIAUCSL` | Monthly |
| Treasury yields / savings rate examples | FRED | Weekly |
| Tax brackets, contribution limits, standard deduction | IRS (static, dated file) | Yearly |

- `scripts/data-refresh.ts` fetches from the FRED API (`FRED_API_KEY` env var) and writes `src/data/live/snapshot.json` with values, `asOf` dates and source names.
- If a fetch fails or no key exists, use the committed snapshot and log a warning. **Never fail the build.**
- Sanity checks reject implausible values (e.g. mortgage rate outside 1–20%) and keep the previous value.
- The weekly `deploy.yml` schedule refreshes data and redeploys automatically.
- Every page using live data shows the source and as-of date, following each source's attribution terms.
- Without a key at build time, seed `snapshot.json` with recent values you can source and cite, marked with their date.

---

## 13. State Pages (local SEO)

Goal: win searches like "mortgage calculator texas" and "paycheck calculator california" with genuinely local data.

- `/finance/mortgage-calculator/[state]/`: state average effective property tax rate, average homeowners insurance premium.
- `/finance/paycheck-calculator/[state]/`: state income tax brackets, notable local taxes, state payroll deductions.
- Data in `src/data/static/states.ts`, every field with source URL and year (Tax Foundation, US Census ACS, state revenue departments). Flag fields you cannot source reliably; never guess.
- Each page: calculator pre-filled with state values; AnswerBox with that state's numbers; a unique section on what differs in that state; comparison with the national average; state-specific FAQ; links to the main calculator and 3–5 related states.
- `scripts/check-uniqueness.ts` fails if a state page shares more than ~70% of its text with another.
- Generate a page only when its required data exists. Start with the 10 highest-volume states, then all 50 + DC once quality is proven.
- State index page per calculator linking to every state.

---

## 14. SEO

### Technical
- Static HTML for every indexable page.
- Clean lowercase hyphenated URLs with trailing slash: `/finance/mortgage-calculator/`.
- Self-referencing, parameter-free `<link rel="canonical">` on every page, using `https://calcrafty.com`.
- XML sitemap index with per-type sitemaps; `lastmod` from `lastReviewed` or data `asOf`. Draft and embed pages excluded.
- `robots.txt` generated at build; sitemap URL included. `/embed/` is not disallowed, so crawlers can read its `noindex` (see DECISIONS.md 2026-11-21).
- `/embed/*` pages are `noindex`.
- Every page within 3 clicks of the homepage; no orphans.

### On-page
- One H1 with the primary keyword; clean H2/H3 hierarchy.
- Unique `metaTitle` (≤ 60 chars) and `metaDescription` (140–160 chars). **The build fails otherwise.**
- Open Graph + Twitter tags with a generated OG image per page (Calcrafty branding, calculator name, a key number).
- Meaningful alt text; charts have text summaries.

### Structured data (JSON-LD)
- Calculator pages: `WebApplication` (`applicationCategory`: FinanceApplication / HealthApplication / EducationalApplication / UtilitiesApplication; free `offers`), `FAQPage`, `BreadcrumbList`, `HowTo` where it fits.
- Site-wide: `Organization` (name Calcrafty, logo, `sameAs` for official profiles once they exist) and `WebSite` with `SearchAction`.
- Validated in tests.

### Architecture
- Category hubs: `/finance/`, `/health/`, `/math/`, `/everyday/` with intro text and calculators grouped by sub-topic.
- Pillar guides at `/guides/[slug]/` (e.g. "How Much House Can I Afford?") linking to calculators and back.
- State index pages.
- Homepage: search, popular calculators, categories, recently updated.

### AI search (GEO)
- Answer-first writing: AnswerBox on every calculator; direct answers at the top of each section.
- Concrete, citable, sourced facts (rates, limits, formulas, dates).
- Consistent entity info: About page, Organization schema, same description everywhere.
- `/llms.txt` generated at build: site summary + list of reviewed calculators and guides with one-line descriptions and URLs.
- `robots.txt` states the AI crawler policy explicitly (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, etc.). Default: allow. One config value changes it.

### Indexing
- IndexNow: `scripts/indexnow.ts` pings changed URLs after each deploy (key file at the site root). Helps Bing and other participating engines.
- Search Console and Bing Webmaster setup in `LAUNCH.md`.

### Never
- Mass-generated thin pages (e.g. "X% of Y" for every number).
- Two pages targeting the same keyword.
- Keyword stuffing or hidden text.

---

## 15. Content Workflow (E-E-A-T)

1. Claude Code writes each MDX page with `status: draft`: unique worked example, sourced facts, FAQ from real queries, `<!-- TODO: expert review -->` on anything requiring judgment.
2. Draft pages are `noindex` and excluded from the sitemap, but fully visible on the site for review.
3. The owner (ideally with a credentialed reviewer for finance and health) edits, then sets `status: reviewed`, `reviewedBy` and `lastReviewed`.
4. Only reviewed pages are indexed.

Add to `LAUNCH.md`: a list of every draft page with its URL, so the owner can review them one by one.

Writing rules: specific over generic; real numbers; short paragraphs; no filler intros; no keyword stuffing; active voice.

Trust pages: **About** (who runs Calcrafty and why), **Methodology** (how calculations are verified, data sources, review process), **Privacy**, **Terms**, **Contact** (email shown as text).

---

## 16. Performance

### Budgets (mobile, enforced in CI)

| Metric | Ads OFF | Ads ON |
|---|---|---|
| Lighthouse Performance | ≥ 98 | ≥ 90 |
| Lighthouse SEO / Accessibility / Best Practices | 100 / ≥ 98 / 100 | 100 / ≥ 98 / ≥ 95 |
| LCP | < 1.5 s | < 2.0 s |
| CLS | < 0.02 | < 0.05 |
| INP | < 100 ms | < 150 ms |
| First-party JS per page (gzipped) | < 35 KB | < 35 KB |
| CSS (gzipped) | < 20 KB | < 20 KB |

### Techniques
- System fonts or one self-hosted subset WOFF2 variable font, `font-display: swap`, preloaded.
- Inline critical CSS; no render-blocking third-party scripts.
- Islands: `client:load` only above the fold; otherwise `client:visible` / `client:idle`.
- **Instant navigation:** Astro prefetch for internal links, with Speculation Rules prerendering where supported.
- Ads and analytics async/deferred. `AdSlot` reserves exact dimensions and is controlled by `ADS_ENABLED` (off by default).
- No hero images; icons as inline SVG.
- Long-term caching via `.htaccess` (section 7).

### Real-user monitoring
- `src/lib/vitals.ts` uses the `web-vitals` library to send LCP, CLS and INP (with page path) to analytics as custom events, sampled at 10–25% of visits.

---

## 17. Accessibility (WCAG 2.2 AA)

Visible labels; `aria-describedby` for help text; full keyboard operation with visible focus; arrow-key sliders; contrast ≥ 4.5:1 in both themes; charts never rely on color alone; respect `prefers-reduced-motion` and `prefers-color-scheme`; touch targets ≥ 44×44 px; zero axe violations.

---

## 18. Calculation Accuracy

- Pure functions in `math.ts`; decimal arithmetic for money; round only for display.
- At least 4 reference-value tests per calculator from authoritative sources. Example: $300,000 at 6.5% for 30 years → monthly principal & interest **$1,896.20**.
- Edge cases: 0% rate, single period, very small/large values, empty or negative input, extreme rates.
- Year-dependent data in dated files with source links (`src/data/static/tax-2026.ts`), so yearly updates are one-file changes.

---

## 19. Site-Wide Features

- **Instant search** (`/` or Ctrl/Cmd+K) with synonyms ("emi" → loan, "tdee" → calorie, "house payment" → mortgage).
- **Dark mode** following system preference, with a toggle and no flash on load.
- **Favorites and recent** calculators on the homepage (local storage).
- **Embeddable widgets** at `/embed/[slug]/` with a "Powered by Calcrafty" backlink.
- **PWA:** manifest + service worker caching static assets so calculators work offline.
- **Footer:** categories, About, Methodology, Privacy, Terms, Contact.
- **Monetization (built, off by default):** `AdSlot` (reserved space, below the fold, never between inputs and results) and `AffiliateCTA` (`rel="sponsored noopener"`).

---

## 20. Keyword Map

File: `research/keyword-map.csv`, the planning source of truth.

Columns: `primary_keyword`, `secondary_keywords` (pipe-separated), `intent` (calculate / learn / compare / local), `volume`, `difficulty`, `priority_score` (= volume / (difficulty + 10)), `url`, `page_type` (calculator / state-page / hub / guide), `status` (planned / built / reviewed / live).

- If keyword exports exist in `research/raw/`, use them.
- **If not, do not stop:** build the map from your knowledge of search demand, mark volume and difficulty as `estimate`, and add "Replace estimates with real keyword data (Ahrefs, Semrush or Google Keyword Planner export into research/raw/)" to `LAUNCH.md`.
- `scripts/check-keyword-map.ts` fails if a primary keyword is duplicated or a built page has no row.

---

## 21. Calculators (Phase 1 set: 25)

**Finance (12)**
1. Mortgage Calculator (taxes, insurance, PMI with automatic removal at 78% LTV, HOA, extra payments, amortization)
2. Loan Calculator
3. Auto Loan Calculator (trade-in, down payment, sales tax)
4. Compound Interest Calculator
5. Investment Calculator (contributions, growth chart)
6. Retirement Calculator
7. Mortgage Affordability Calculator ("How much house can I afford?")
8. Rent vs Buy Calculator
9. Credit Card Payoff Calculator
10. Debt Payoff Calculator (snowball vs avalanche side by side)
11. Salary / Paycheck Calculator (hourly ↔ annual, federal take-home from `tax-2026.ts`)
12. Savings Goal Calculator

**Health (6)**
13. BMI Calculator
14. Calorie / TDEE Calculator (Mifflin-St Jeor default; Harris-Benedict and Katch-McArdle options)
15. Body Fat Calculator (US Navy method + BMI method)
16. Macro Calculator
17. Ideal Weight Calculator (Robinson, Miller, Devine, Hamwi)
18. Running Pace Calculator

**Math (4)**
19. Percentage Calculator (X% of Y, percent change, X is what % of Y, percent off)
20. Scientific Calculator (keyboard support, history)
21. Fraction Calculator (step-by-step simplification)
22. Standard Deviation Calculator (population and sample, with steps)

**Everyday (3)**
23. Age Calculator (years, months, days, next birthday)
24. Days Between Dates Calculator (business-days option)
25. GPA Calculator (weighted and unweighted)

Health pages cite CDC, NIH, WHO or peer-reviewed sources. Finance pages cite IRS, CFPB, Federal Reserve, Freddie Mac.

---

## 22. Build Phases

Run these in order without stopping between them. Each ends with: quality gates pass → commit → push → `PROGRESS.md` updated.

### Phase 0: Setup and keyword plan
- Everything in section 0 step 2.
- GitHub repo (section 6).
- `research/keyword-map.csv` (section 20) covering the 25 calculators, the top 10 state-page opportunities and 5 pillar guide topics. Build calculators in `priority_score` order within each phase.

### Phase 1: Foundation
- Scaffold Astro (static, `trailingSlash: 'always'`, `build.format: 'directory'`), TypeScript strict, Preact + signals, Tailwind, MDX collections with Zod (including `status`).
- Design tokens (light + dark), theme toggle without flash, base layout, header, footer, Calcrafty logo.
- Calculator registry generating routes, sitemap entries and search index entries.
- `SeoHead`, `JsonLd` helpers, `Breadcrumbs`; `format.ts`, `storage.ts`, `url-state.ts`.
- Sitemap (drafts and embeds excluded), `robots.txt`, `llms.txt`, 404 page, redirect map, `.htaccess` (section 7).
- Test setup: Vitest, Playwright + axe, Lighthouse CI (ads-off and ads-on profiles), `validate-seo.ts`, link checker, no-JS render test.
- `ci.yml` and `deploy.yml` (section 6). Deploy a placeholder page to the `deploy` branch.
- `LAUNCH.md` items: Hostinger Git connection, SSL.

### Phase 2: Gold standard: Mortgage Calculator + live data
- Live data pipeline (section 12).
- Mortgage `math.ts` + full test suite.
- All shared calculator and chart components (section 8).
- Widget with every UX feature in section 10, interest rate defaulting to today's rate.
- Full MDX content, FAQ, schema, OG image, embed page.
- "How to add a calculator" in `README.md` using the mortgage calculator as the example.
- This page sets the standard. Every gate and budget must pass before moving on.

### Phase 3: Remaining finance calculators
Build calculators 2–12 using the shared components. Each: one folder, live defaults where relevant, reference tests, draft content, `related` chains, keyword map updated. Commit after each calculator.

### Phase 4: Health, math and everyday calculators
Build calculators 13–25 the same way. Imperial/metric toggles on health calculators.

### Phase 5: Site architecture and trust
Homepage, category hubs, instant search with synonyms, 5 pillar guides (draft), trust pages (section 15), Organization and WebSite schema, AnswerBox audit on every page, internal linking audit (no orphans, ≥ 3 contextual links per content page), `llms.txt` check.

### Phase 6: State pages
`states.ts` with sourced data, `StatePageLayout`, state routes for mortgage and paycheck calculators, state index pages, uniqueness check. Start with the top 10 states.

### Phase 7: Launch hardening
PWA; prefetch/Speculation Rules; analytics (if `ANALYTICS_ID` is set, otherwise a `LAUNCH.md` item); real-user vitals; `AdSlot` and `AffiliateCTA` finished behind `ADS_ENABLED`; IndexNow; print styles, CSV export, history and favorites verified everywhere; full audit (Lighthouse every page type, axe every page, no-JS, links, schema, headers on the live site). Complete `LAUNCH.md`: Search Console, Bing Webmaster, sitemap submission, analytics, CDN, every draft page awaiting review, keyword data replacement if estimates were used.

---

## 23. Quality Gates (CI fails if any fail)

- [ ] TypeScript strict and ESLint: no errors
- [ ] Unit tests pass, including reference values and edge cases
- [ ] Playwright: every calculator loads, accepts input, updates the result, and its share URL round-trips
- [ ] axe: zero violations on every page type
- [ ] Lighthouse CI meets the budgets in section 16 (both profiles)
- [ ] Every page has a unique title, description, canonical and single H1, and valid JSON-LD
- [ ] Keyword map: unique primary keywords; every built page has a row
- [ ] Sitemap: all indexable pages, no draft or noindex pages
- [ ] State pages pass the uniqueness check
- [ ] No broken internal links
- [ ] Full content renders with JavaScript disabled

---

## 24. Definition of Done

1. All 25 calculators are live on `https://calcrafty.com`, accurate (tested against references) and pass every gate.
2. Every calculator page has full content, FAQ, schema, sources and a review date.
3. Top 10 state pages live for mortgage and paycheck calculators.
4. Pushing to `main` builds, tests and deploys automatically; data refreshes weekly.
5. A new calculator can be added by creating one folder, and `README.md` explains how.
6. `PROGRESS.md`, `DECISIONS.md`, `LAUNCH.md` and `README.md` are current.

---

## 25. After Launch: Monthly Maintenance

When the owner says **"Do the monthly maintenance"**:
1. Confirm live data is current; investigate sanity-check rejections.
2. Check `src/data/static/` for year-dependent values that need updating; update with sources.
3. If Search Console exports are in `research/gsc/` (Queries and Pages, last 3 months, CSV):
   - Pages in positions 5–20 with high impressions: suggest content, title or internal-link improvements.
   - Queries with impressions but no dedicated section or page: suggest additions (check the keyword map first).
   - Pages with falling clicks: suggest causes and fixes.
4. Compare real-user Core Web Vitals with the budgets; fix regressions.
5. Run every quality gate and fix failures.
6. Propose the next calculators to build from keyword data.
7. Update `keyword-map.csv` and add a monthly report to `PROGRESS.md`.

Propose content and structural changes first; implement only what the owner approves. Fix bugs and failing gates directly.
