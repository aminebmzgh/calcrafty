# Calcrafty

Free online calculators at **https://calcrafty.com**: live results as you type, today's data built in, plain-English explanations and the math shown step by step.

Static site: [Astro](https://astro.build) (static output) + [Preact](https://preactjs.com) islands + Tailwind CSS + MDX. Every page is pre-rendered HTML that works without JavaScript.

- Specification: [docs/BUILD-BRIEF.md](docs/BUILD-BRIEF.md)
- Status: [PROGRESS.md](PROGRESS.md) · Decisions: [DECISIONS.md](DECISIONS.md) · Owner to-do: [LAUNCH.md](LAUNCH.md)

## Run it locally

Requires Node 22.23+ (CI uses Node 24).

```sh
npm install
npm run dev           # http://localhost:4321
npm run build         # production build into dist/
npm run preview       # serve dist/
npm run test          # unit tests (Vitest), including math reference values
npm run test:e2e      # Playwright: calculators, share URLs, axe, no-JS (run after build)
npm run lhci          # Lighthouse CI, ads-off and ads-on profiles (run after build)
npm run check         # typecheck + lint + keyword map + SEO + links + uniqueness + budgets (run after build)
npm run data:refresh  # fetch live data from FRED into src/data/live/snapshot.json
```

Put `FRED_API_KEY=...` in a git-ignored `.env` to use the FRED API; without it, `data:refresh` uses FRED's public CSV download, and if that fails it keeps the committed snapshot. Live data never breaks the build.

## How deployment works

1. Push to `main`. GitHub Actions runs `ci.yml` (every quality gate).
2. If CI passes, `deploy.yml` refreshes live data, builds, and force-pushes `dist/` to the **`deploy`** branch. Never edit `deploy` by hand.
3. Hostinger's Git auto-deployment pulls `deploy` into `public_html`.
4. `scripts/indexnow.ts` pings IndexNow with the URLs whose HTML changed.

`deploy.yml` also runs every Monday 06:00 UTC (weekly data refresh) and on demand (Actions → Deploy → Run workflow).

## How to add a calculator

A calculator is **one folder** in `src/calculators/<slug>/`. Nothing else needs editing: the page, embed page, sitemap entry, schema, OG image, search index, hub listing and internal links are all generated from the folder. The mortgage calculator (`src/calculators/mortgage-calculator/`) is the reference implementation.

1. **Check the keyword map.** Find (or add) the row in `research/keyword-map.csv`. The primary keyword must be unique, and the row's `url` must be `/<category>/<slug>/`.

2. **`math.ts`: the formulas, and only here.** Pure functions, no UI. Use `src/lib/math/money.ts` (`D`, `cents`, `annuityPayment`, `amortize`) for money so nothing is computed in floating point. Export one `compute<Name>(input)` function plus small helpers for anything the UI needs (unit conversions, validation checks). Mortgage example: `computeMortgage`, `convertDownPayment`, `downPaymentTooLarge`.

3. **`math.test.ts`: at least 4 reference values from authoritative sources**, with the source in a comment, plus edge cases (0% rate, a single period, very small and very large values, empty or negative input). Example: "$300,000 at 6.5% for 30 years → $1,896.20".

4. **`config.ts`: the single definition** (`CalculatorConfig` in `src/lib/types.ts`):
   - SEO: `slug` (must equal the folder name), `category`, `subtopic` (one of the hub's sub-topics in `src/lib/categories.ts`), `name`, `h1`, `intro`, `metaTitle` (≤ 60 chars), `metaDescription` (140–160 chars), `primaryKeyword`, `secondaryKeywords`, `synonyms` (for site search).
   - `inputs` + `defaults`: every input id needs a default. Number inputs declare `unit`, `min`, `max`, `step`, and optionally a slider range, `advanced: true` (goes under "More options"), `group` (side-by-side fields), `liveDefault` (e.g. `'mortgage30'` uses this week's FRED value and shows the as-of badge), or a `unitToggle` ($/%, lbs/kg) whose `convert` function comes from `math.ts`.
   - `compute` (from `math.ts`), `summarize` (headline + secondary results, formatted with `src/lib/format.ts`), `explain` (2–4 plain-English sentences), `steps` (Show the math), `answerSummary` (the AnswerBox sentence), `ogValue`.
   - `related` (next-step calculators), `sources`, `lastReviewed`.

5. **`Widget.tsx`:** wrap the shared shell and add any charts or tables:

   ```tsx
   export default function Widget(props: WidgetProps<MortgageInput>) {
     return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
   }
   ```

   The shell provides live results (150 ms debounce), validation messages, share links, copy result, compare (up to 3), favorites, history, print and reset. Charts live in `src/components/charts/` (LineChart, DonutChart, StackedBar); tables use `DataTable` (collapsible, CSV export). Widgets hydrate on first interaction; the server HTML already shows the default result.

6. **`content.mdx`:** frontmatter `status: draft` (never set `reviewed` yourself; a person does that after review), 5–8 FAQ entries, optional `howTo` steps. Body: 800–1,500 words. Each H2 opens with a direct 2–3 sentence answer: how to use it, a worked example with unique, realistic numbers (compute them with `math.ts`), the formula in plain English, key terms, what to do with the result, and at least 3 links to related calculators or guides.

7. **Run the gates:** `npm test && npm run build && npm run check && npm run test:e2e`. The e2e suite picks up the new page automatically (load, live update, share-URL round-trip, axe in both themes, no-JS, JS budget).

Draft pages are visible on the site but `noindex` and left out of the sitemap until their status is `reviewed`.
