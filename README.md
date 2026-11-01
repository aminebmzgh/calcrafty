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

See the "How to add a calculator" section, filled in with the mortgage calculator as the worked example.
