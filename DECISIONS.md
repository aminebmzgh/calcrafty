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

## 2026-11-01 (Phase 2)

- **Shared money math in `src/lib/math/money.ts`.** Annuity payment and amortization are used by the mortgage, loan, auto loan and debt calculators, so they live in one tested module that each calculator's `math.ts` builds on. It's still "math lives in math modules only"; UI files have no formulas.
- **Amortization loop in exact integer cents (BigInt).** The rate is held as an exact fraction and each month's interest is rounded half-up to the cent, which gives exactly what the Decimal version gives (a test cross-checks 300 random loans against a plain Decimal reference). It's about 10× faster, which matters for hydration on slow phones. Payments are still computed with decimal.js-light.
- **PMI removal.** PMI stops at the earliest of: the balance first scheduled to reach 78% of the original value (Homeowners Protection Act automatic termination), the actual balance reaching 78% (earlier with extra payments), or the midpoint of the term. Borrower-requested cancellation at 80% isn't modelled.
- **Interaction-driven hydration.** Calculator widgets are fully server-rendered with the default result. A ~1 KB dependency-free bootstrap (`src/scripts/islands-boot.ts`) hydrates on the first focus, pointer, key or click inside the widget, immediately for share links, and otherwise preloads the widget code 2 s after load. A button click that arrives before hydration is held and replayed. Lighthouse on the mortgage page went from Performance 0.83 / TBT 670 ms / LCP 2.0 s to 1.0 / 10 ms / 1.3 s.
- **Speculation Rules instead of Astro prefetch.** Astro's prefetch script plus `selector_matches` rules cost about 400 ms of main-thread time. A static `<script type="speculationrules">` with `href_matches` and `moderate` eagerness gives native prerender on hover with zero JS. Browsers without Speculation Rules simply navigate normally.
- **`content-visibility: auto` below the fold** (charts, article, FAQ, sources, footer) with `contain-intrinsic-block-size` only. The two-axis shorthand caused CLS 0.68 by reserving 900 px of width.
- **CSP `style-src` allows `'unsafe-inline'`.** Hashes can't cover `style="…"` attributes, which SSR markup and charts use. `script-src` stays hash-only, which is where CSP protection matters.
- **Mobile sticky result bar.** On phones the inputs push the readout below the fold, so a slim fixed bar shows the headline result and hides itself when the full readout is visible. It's `aria-hidden` because the readout itself is the live region.
- **Expert-review TODOs in MDX use `{/* TODO: expert review */}`.** MDX doesn't support HTML comments.
- **Related links may point at calculators built later.** The registry warns (instead of failing) for related slugs that don't exist yet and renders only the existing ones; the link checker still fails on any broken link in content.

## 2026-11-01 (Phase 3)

- **Two more FRED series.** `personalLoan24` (TERMCBPER24NS) for the loan calculator and `creditCard` (TERMCBCCALLNS) for the card calculator, so their default rates are real, cited averages.
- **2026 tax data verified against the primary source.** Head-of-household thresholds were checked in the IRS Rev. Proc. 2025-32 PDF itself because a secondary site had them wrong ($201,775 / $256,225 vs the correct $201,750 / $256,200). Tests use the Rev. Proc.'s own "tax at threshold" amounts as references.
- **Paycheck federal tax = annual liability.** It equals what Pub. 15-T percentage-method withholding targets for a W-4 with no adjustments. OBBBA's new tip and overtime deductions aren't modelled (most workers don't qualify; noted for expert review).
- **Required payments round up to the cent** (savings goal, retirement), so following the plan always reaches the target.
- **Vitest `fsModuleCache: false`.** Vitest 5's on-disk transform cache doesn't invalidate `import.meta.glob` results when new folders appear, so cached tests silently checked only the first 6 calculators. It's disabled in `vitest.config.ts`.
- **Content gate counts the article body only** (FAQ excluded) toward the 800–1,500 words, matching the brief's page template, where the FAQ is a separate item.
- **Rent vs buy ignores tax effects** (mortgage interest deduction, home sale exclusion) and says so on the page; most buyers take the standard deduction.

## 2026-11-01 (Phase 4)

- **Health formulas.** BMR: Mifflin-St Jeor (default), revised Harris-Benedict (Roza & Shizgal 1984), Katch-McArdle. Body fat: US Navy (Hodgdon & Beckett 1984, inch form) plus Deurenberg BMI method; ACE categories. Ideal weight: Robinson, Miller, Devine, Hamwi plus the BMI 18.5–24.9 range. Unit conversions use the exact definitions (1 lb = 0.45359237 kg, 1 in = 2.54 cm).
- **Calorie goals use 3,500 kcal per pound per week** as a planning approximation (stated on the page), with a warning below 1,200 (women) / 1,500 (men) kcal.
- **Macro calculator reuses the calorie calculator's math** by importing `../calorie-calculator/math.ts`, so the two can never disagree.
- **Scientific calculator: a hand-written Pratt parser over IEEE-754 doubles**, with no `eval`. Results show 12 significant digits (like handheld calculators), and degree-mode trig snaps values within 1e-12 of zero to exact 0. Decimal arithmetic isn't used here because decimal.js-light has no trigonometry.
- **Exact arithmetic elsewhere.** Fractions use BigInt; percentages, statistics and GPA use decimal.js-light; the dates library works in UTC calendar days, so time zones never shift a date.
- **Calendar months clamp to month end** (Jan 31 + 1 month = Feb 28/29). Feb 29 birthdays age on Feb 28 in common years (convention stated on the page).
- **Business days** exclude US federal holidays per 5 U.S.C. 6103 with the observed-day rule; state and company holidays are out of scope.
- **GPA weighting** is +0.5 Honors / +1.0 AP-IB (common convention, school policies vary; stated on the page).
- **e2e hook `e2eValue`** on an input marks the field the generic e2e test should edit, for calculators where the first field doesn't move the headline (body fat) or isn't numeric (dates, text, keypad).
- **FAQ and HowTo values are always JSON-quoted in frontmatter**, after two unquoted values containing ": " broke Astro's YAML parser. The content test now parses with the same strictness.
- **Lighthouse assertions use the median of 3 runs** for LCP, CLS and TBT; single runs on this machine vary by about ±0.2 s.

## 2026-11-01 (Phase 6)

- **State data sources.** Income tax: Tax Foundation's 2026 state table (one consistent, dated source). California's 2026 bracket widths weren't indexed yet, so its 2025 widths are used and flagged. Georgia is 5.19% per the Tax Foundation; further HB 111 cuts are conditional, so it's flagged. Payroll: CA SDI 1.3% uncapped (EDD 2026), NY PFL 0.432% capped at $411.91 (NY DFS 2026), NY DBL 0.5% capped at $0.60/week.
- **Property tax uses each state's most populous county** (Tax Foundation county table, 2024 ACS 5-year), not a statewide average. No authoritative 2024 statewide table was retrievable, and the Census API now requires a key. Pages say which county is used, and its median home value becomes the default price.
- **Insurance: NAIC 2022 average HO-3 premiums** via the Insurance Information Institute; US average $1,569.
- **Fields that couldn't be fully confirmed** are listed in each state's `verify` array and in LAUNCH.md; the pages stay noindex drafts until a person reviews them.
- **State pages inherit the parent calculator's review status**, use the shared calculator layout with state defaults, and add unique sections (state rules, a median-home or salary table, a national comparison, state FAQ, links to 4 other states and the state index). Local income taxes are explained in text and can be entered as a rate; they're too varied to hard-code per city.
- **Server-side comparisons on state pages** (insurance vs the US average, take-home pay vs a no-income-tax state) are computed in the page from the math module outputs; no formulas are duplicated.

## 2026-11-01 (Phase 7)

- **Service worker:** hashed assets cache-first, pages network-first with cache and /offline/ fallbacks; registered only in production builds.
- **Real-user vitals** load the `web-vitals` package on a 20% sample, only when the Umami script is present, and report LCP, CLS and INP with the path as `web-vitals` events.
- **LAUNCH.md’s draft list is generated from the build** (every noindex content page), so it matches the site exactly.

## 2026-11-02 (content depth)

- **Calculator pages and guides are 1,500–2,500 words** (was 800–1,500 for calculators, no rule for guides), at the owner's request. Enforced in `src/lib/content.test.ts`; raised in stages so CI stays green while existing pages were expanded; the 1,500 minimum applies to every page from 2026-11-02. New sections must add information (worked examples computed with each calculator's `math.ts`, comparison tables, common mistakes, follow-up questions), never filler.

## 2026-11-02 (growth batch 3)

- **Inflation calculator CPI history lives in the calculator's folder** (`src/calculators/inflation-calculator/cpi.ts`), keeping "one calculator = one folder". It's a committed snapshot of BLS CPI-U (FRED CPIAUCNS, not seasonally adjusted) with annual averages computed as BLS does; refreshed yearly by hand (LAUNCH.md). BLS published no October 2025 index (shutdown), so 2025 averages the 11 published months; this is stated on the page. The current year uses the latest monthly index, shown in the field help text as the "as of" month.

## 2026-11-02 (categories expanded)

- **Ten new categories defined:** sports, statistics, physics, chemistry, biology, ecology, construction, conversion, food and other, alongside finance, health, math and everyday (the owner's "Everyday life" maps to the existing `/everyday/`, so that URL is unchanged).
- **Empty categories stay hidden.** `liveCategories` (registry.ts) lists only categories with at least one calculator; the hub page, nav, footer, home page, search, OG images and sitemap all use it. A new category's hub appears automatically with its first calculator, so no thin hub pages are published (hard rule 8) and adding a calculator is still one folder (hard rule 4).
- **Health and fitness split.** Health keeps body composition and nutrition; the running pace calculator moved to the new Sports category (`/health/running-pace-calculator/` → `/sports/running-pace-calculator/`, 301 in redirects.ts). Sports is not YMYL, so it carries no medical disclaimer.
- **Statistics split from Math** (owner decision, same day): standard deviation and mean/median/mode moved to `/statistics/` with 301s from their `/math/` URLs. Math keeps arithmetic and the scientific calculator.

## 2026-11-02 (growth batch 5, construction)

- **Category hubs are indexable only once a calculator in them is reviewed** (pages.ts and the hub page), so a new category doesn't publish an indexable page that lists only drafts.
- **Default assumptions, all editable or stated on the page:** concrete bag yields from the QUIKRETE Concrete Mix data sheet (40 lb 0.30, 60 lb 0.45, 80 lb 0.60 cu ft); paint coverage 350 sq ft per gallon (low end of the usual 350 to 400 label range), doors 21 sq ft (3 × 7 ft) and windows 15 sq ft (3 × 5 ft); gravel 1.4 short tons per cubic yard (planning figures run 1.4 to 1.7; users are told to ask their supplier); 3 shingle bundles per square.
- **Roof area uses footprint × pitch factor**, exact for any roof whose planes share one pitch (gable or hip); mixed pitches are calculated per section, as the page explains.

## 2026-11-03 (growth batch 6: every category live)

- **One calculator and one guide for each of the seven hidden categories**, so all 14 categories now have content: Ohm's law (physics), molarity (chemistry), Punnett square (biology), car CO2 (ecology), length converter (conversion), recipe scaler (food) and tip calculator (other).
- **Header navigation:** with 14 live categories the bar no longer fit on one line, so the header shows the first six categories in `categoryOrder` and puts the rest in a "More" menu built on `<details>` (works without JavaScript; a small script closes it on Escape or an outside click). `categoryOrder` now puts the highest-traffic categories first: finance, health, construction, math, statistics, everyday.
- **Hub copy describes only what exists.** The placeholder copy written when the categories were created promised calculators that don't exist yet; it was rewritten for the seven hubs that went live. Update a hub's copy when its category grows.
- **Data choices:** car CO2 uses the EPA factors of 8,887 g CO2 per gallon of gasoline and 10,180 g per gallon of diesel, and the EPA typical vehicle of 4.6 t a year (page checked 2026-11-03, last updated June 3, 2026). Molar masses are computed from IUPAC standard atomic weights in `math.ts`. Length factors are the exact 1959 definitions. Tipping norms are given as broad ranges with a note that they vary.

## 2026-11-06 (CI split into quick and full, to fit the free Actions minutes)

- **Why:** each push ran the full suite twice (ci.yml on push, plus Deploy calling it), ~84 Actions minutes per push; the private repo used 1,834 of its 2,000 free minutes in the first five days of November. axe on every page in both themes was ~75% of the e2e time.
- **Per push (Deploy calls CI, quick mode, ~10 min):** unit tests, build, typecheck, lint, SEO/link/keyword/uniqueness/byte-budget checks, mobile e2e on every calculator (live update, share URL, no-JS) with axe on one page per type (`pageTypeSamples`), and desktop power features, site tests and per-page JS budgets. ci.yml no longer has its own push trigger.
- **Weekly (Sundays 06:00 UTC) and on demand (Actions → CI → Run workflow):** the full suite, as before: axe on every page in both themes, all e2e on mobile and desktop, Lighthouse ads off and ads on. The performance budgets in CLAUDE.md are therefore enforced weekly, not before every deploy; a failure there is fixed before the next push.
- **Locally:** `npm run verify` runs the quick suite. On the owner's laptop (2-core i7-3520M) the full suite took ~42 min and Lighthouse TBT was borderline from CPU noise, so the full suite stays in CI.
- **calculatorUrls now reads `src/calculators/`** instead of a hard-coded category list, which had left the 15 calculators in categories added since 2026-11-02 out of the per-calculator e2e tests.

## 2026-11-06 (growth batch 7)

- **Batch chosen by the owner:** three finance pages in the owner's area (amortization, mortgage payoff, student loan) and three quick wins (square footage, weight and temperature converters), with three guides. An hours calculator was dropped because the time card calculator already targets "hours worked calculator"; an amortization guide was dropped because the existing mortgage amortization guide targets "amortization schedule explained".
- **Amortization vs loan calculator:** the loan calculator stays the quick payment answer; the amortization calculator adds what that page doesn't: payment dates and a payoff date, yearly and one-time extra payments, and milestones (principal-over-interest crossover, 75/50/25% balance).
- **Mortgage payoff works from today's balance and payment,** not the original loan, so it serves borrowers years into a loan. A remainder under 1% of the payment after the last full payment is folded into it, as lenders adjust the final payment, instead of reporting one extra tiny payment.
- **Student loan plans:** Standard (10 yr), Extended (25 yr, over $30,000) and Tiered Standard (10/15/20/25 yr under $25k/$50k/$100k/above, P.L. 119-21) are level payments. The Graduated plan has no published formula; the estimate uses five 24-month steps at the steepest rise 34 CFR 685.208 allows (×3^¼, so no payment exceeds 3× another), starting no lower than the monthly interest, with the last step re-levelled to clear the balance. Income-based plans (RAP, IBR) aren't modelled because they depend on income and family size; the guide explains them. Default rate 6.52% (2026–27 undergraduate). Interest uses rate ÷ 12, as servicers' estimates do.
- **Converters:** weight through the kilogram with the 1959 pound (0.45359237 kg), troy ounce 31.1034768 g; temperature through kelvin, with temperature differences converted separately (no 32 offset).
- **Hub copy:** the Conversion hub now describes all three converters, and the Construction hub description no longer promises a lumber calculator that doesn't exist.

## 2026-11-06 (growth batch 8)

- **Batch chosen:** five calculators with high-volume, low-YMYL intents not yet on the site (margin, discount, Pythagorean theorem, electricity cost, fuel cost), each paired with a guide on a separate "learn" keyword (margin vs markup, how to calculate a discount, how to use the Pythagorean theorem, how much electricity appliances use, how to calculate gas mileage). Sales tax stays in the backlog (needs a 50-state rate table).
- **Keyword move:** "percent off calculator" moved from the percentage calculator's secondary keywords to the discount calculator, which serves that intent better; "markup" and "sale price" dropped from the percentage calculator's search synonyms.
- **Two new live series** (`gasPrice`: EIA weekly U.S. regular gasoline, FRED GASREGW, range $1–$10; `electricityPrice`: BLS average price of electricity per kWh, U.S. city average, FRED APU000072610, range $0.05–$0.60). Seeded with real values (2026-11-02: $4.153/gal; 2026-09: $0.196/kWh). Live series gained optional `unit`/`per` fields so prices read "$4.153 per gallon" in the as-of badge and on the Methodology page instead of a percent. No new dependency.
- **New hub sub-topics:** Finance "Business" (margin), Math "Geometry" (Pythagorean), Other "Driving" (fuel cost). Hub copy for Math, Physics and Other updated to describe the new calculators.
- **Discounts** are applied in sequence and rounded to the cent at each step, as registers do; stacked discounts multiply (25% then 10% = 32.5%). Tax is charged on the discounted price.
- **Margin** prices round to the cent, so the realised margin can differ from the target in the fourth decimal (shown in the content). Markup is undefined at zero cost and shown as text, never "Infinity".
- **Pythagorean theorem** uses 30-digit decimal square roots; the exact simplified radical (6√2) is shown only when the known sides are whole numbers.
- **Electricity cost** averages days per week over the year (× 365 ÷ 7) so day, week, month and year rows agree; a month is a twelfth of a year.
- **Fuel cost** keeps separate US and metric fields (miles/mpg/$ per gallon vs km/L per 100 km/per litre) so the live gas price only ever fills the per-gallon field; switching units converts the trip. CO₂ uses the EPA's 8,887 g/gal gasoline and 10,180 g/gal diesel, the same factors as the car CO2 calculator.

## 2026-11-21 (indexing audit)

- **`/embed/` is no longer disallowed in robots.txt.** It was both disallowed and `noindex`. Google can't read a `noindex` on a page it may not crawl, so an embed URL linked from another site could show up as "Indexed, though blocked by robots.txt". The pages stay `noindex, follow` with a self-referencing canonical, and they stay out of the sitemap. They do not point their canonical at the main calculator, because `noindex` plus a canonical to another page sends conflicting signals. This changes the brief's robots.txt line, which has been updated.
- **http://www → https://www → https://calcrafty.com is two hops** because Hostinger's CDN forces HTTPS before `.htaccess` runs. `.htaccess` already does both in one 301. This is harmless; it becomes one hop only if "Force HTTPS" is turned off in hPanel, which is the owner's call (see LAUNCH.md).
