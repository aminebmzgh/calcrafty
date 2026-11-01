# Launch checklist (owner actions)

Everything here needs your accounts, keys or judgment. Claude Code has built and tested everything else. Work top to bottom; tick each box when done.

## Done already

- [x] GitHub CLI installed and authenticated (account `aminebmzgh`).
- [x] Private repo `aminebmzgh/calcrafty` created and pushed.
- [x] CI and Deploy workflows pass; the `deploy` branch contains the built site.

## 1–2. Hostinger hosting, SSL and CDN (done 2026-11-01)

- [x] Site created in hPanel and connected with **Import from GitHub**, branch **`deploy`** (prebuilt site; Hostinger's GitHub app redeploys on every push to `deploy`, so no SSH key or webhook is needed).
- [x] SSL active; `http://` and `www` redirect to `https://calcrafty.com/`.
- [x] Hostinger CDN active (Brotli). Security headers verified live: HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- [x] Checked live: pages, robots.txt, sitemap-index.xml, 404 page, IndexNow key file, service worker; source files not exposed.

Keep the branch on `deploy`: only builds that passed CI reach it.

## 3. Live mortgage rates and data (recommended)

Without a key, the weekly refresh uses FRED's public CSV download, which works today. An API key is more reliable:

1. Create a free account at https://fred.stlouisfed.org/ → **My Account → API Keys → Request API Key**.
2. Run `gh secret set FRED_API_KEY` and paste the key.

The Deploy workflow refreshes rates every Monday 06:00 UTC and redeploys.

## 4. Analytics (done 2026-11-01)

- [x] Umami Cloud website created; Website ID stored as the `ANALYTICS_ID` GitHub secret. The script is live on every page (cookie-free, honors Do Not Track), and a 20% sample of visits reports Core Web Vitals as `web-vitals` events. See the dashboard at https://cloud.umami.is/.

## 5. Search engines (done 2026-11-01)

- [x] Google Search Console verified; `sitemap-index.xml` submitted. "Couldn't fetch" right after submitting is normal and clears within a day or two. The sitemap lists only reviewed pages, so it grows as you review drafts (section 8).
- [x] Bing Webmaster Tools imported from Search Console.
- [x] IndexNow: every deploy pings Bing and other IndexNow engines with changed URLs (key file `/4cadaef7ac8aae1d1f5165d207581ea6.txt`).

Note: Hostinger's CDN returns 403 to fake "Googlebot" requests from non-Google IPs; real Googlebot is unaffected (check with URL Inspection → Test live URL).

## 6. About page and contact

- [x] About page: built and run by Amine Boumazzoughe (banker, coding enthusiast); also in the Organization schema as `founder`. Add more about why you started it whenever you like.
- [x] `hello@calcrafty.com` mailbox created.
- [ ] When official social profiles exist, add their URLs to `SITE.sameAs` in `src/lib/site.ts` (used in Organization schema).

## 7. Keyword research

- [ ] **Replace estimated keyword data with real data.** `research/keyword-map.csv` uses estimated volume and difficulty (marked `estimate` in `data_source`). Export keyword data from Ahrefs, Semrush or Google Keyword Planner into `research/raw/`, then ask Claude Code to "update the keyword map from research/raw".

## 8. Review draft pages (makes them indexable)

Every content page starts as a **draft**: visible on the site, but `noindex` and left out of the sitemap. For each page:

1. Read it on the site (and ideally have a credentialed reviewer check finance and health pages; search each file for `TODO: expert review`).
2. Edit the MDX file if needed.
3. In its frontmatter set `status: reviewed`, `reviewedBy: "Name, credential"` and `lastReviewed: "YYYY-MM-DD"`.
4. Commit and push; the page enters the sitemap and llms.txt on the next deploy.

### Calculators (25)

Edit `src/calculators/<slug>/content.mdx`. State pages under a calculator become indexable when that calculator is reviewed.

- [ ] https://calcrafty.com/everyday/age-calculator/  (file: src/calculators/age-calculator/content.mdx)
- [ ] https://calcrafty.com/everyday/days-between-dates-calculator/  (file: src/calculators/days-between-dates-calculator/content.mdx)
- [ ] https://calcrafty.com/everyday/gpa-calculator/  (file: src/calculators/gpa-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/auto-loan-calculator/  (file: src/calculators/auto-loan-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/compound-interest-calculator/  (file: src/calculators/compound-interest-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/credit-card-payoff-calculator/  (file: src/calculators/credit-card-payoff-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/debt-payoff-calculator/  (file: src/calculators/debt-payoff-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/investment-calculator/  (file: src/calculators/investment-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/loan-calculator/  (file: src/calculators/loan-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/mortgage-affordability-calculator/  (file: src/calculators/mortgage-affordability-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/mortgage-calculator/  (file: src/calculators/mortgage-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/paycheck-calculator/  (file: src/calculators/paycheck-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/rent-vs-buy-calculator/  (file: src/calculators/rent-vs-buy-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/retirement-calculator/  (file: src/calculators/retirement-calculator/content.mdx)
- [ ] https://calcrafty.com/finance/savings-goal-calculator/  (file: src/calculators/savings-goal-calculator/content.mdx)
- [ ] https://calcrafty.com/health/bmi-calculator/  (file: src/calculators/bmi-calculator/content.mdx)
- [ ] https://calcrafty.com/health/body-fat-calculator/  (file: src/calculators/body-fat-calculator/content.mdx)
- [ ] https://calcrafty.com/health/calorie-calculator/  (file: src/calculators/calorie-calculator/content.mdx)
- [ ] https://calcrafty.com/health/ideal-weight-calculator/  (file: src/calculators/ideal-weight-calculator/content.mdx)
- [ ] https://calcrafty.com/health/macro-calculator/  (file: src/calculators/macro-calculator/content.mdx)
- [ ] https://calcrafty.com/health/running-pace-calculator/  (file: src/calculators/running-pace-calculator/content.mdx)
- [ ] https://calcrafty.com/math/fraction-calculator/  (file: src/calculators/fraction-calculator/content.mdx)
- [ ] https://calcrafty.com/math/percentage-calculator/  (file: src/calculators/percentage-calculator/content.mdx)
- [ ] https://calcrafty.com/math/scientific-calculator/  (file: src/calculators/scientific-calculator/content.mdx)
- [ ] https://calcrafty.com/math/standard-deviation-calculator/  (file: src/calculators/standard-deviation-calculator/content.mdx)

### Guides (5)

Edit `src/content/guides/<slug>.mdx`.

- [ ] https://calcrafty.com/guides/how-many-calories-should-i-eat/
- [ ] https://calcrafty.com/guides/how-much-do-i-need-to-retire/
- [ ] https://calcrafty.com/guides/how-much-house-can-i-afford/
- [ ] https://calcrafty.com/guides/how-to-calculate-percentage/
- [ ] https://calcrafty.com/guides/how-to-pay-off-debt/

### State pages and state indexes (22), reviewed with their parent calculator

- [ ] https://calcrafty.com/finance/mortgage-calculator/california/
- [ ] https://calcrafty.com/finance/mortgage-calculator/florida/
- [ ] https://calcrafty.com/finance/mortgage-calculator/georgia/
- [ ] https://calcrafty.com/finance/mortgage-calculator/illinois/
- [ ] https://calcrafty.com/finance/mortgage-calculator/michigan/
- [ ] https://calcrafty.com/finance/mortgage-calculator/new-york/
- [ ] https://calcrafty.com/finance/mortgage-calculator/north-carolina/
- [ ] https://calcrafty.com/finance/mortgage-calculator/ohio/
- [ ] https://calcrafty.com/finance/mortgage-calculator/pennsylvania/
- [ ] https://calcrafty.com/finance/mortgage-calculator/states/
- [ ] https://calcrafty.com/finance/mortgage-calculator/texas/
- [ ] https://calcrafty.com/finance/paycheck-calculator/california/
- [ ] https://calcrafty.com/finance/paycheck-calculator/florida/
- [ ] https://calcrafty.com/finance/paycheck-calculator/georgia/
- [ ] https://calcrafty.com/finance/paycheck-calculator/illinois/
- [ ] https://calcrafty.com/finance/paycheck-calculator/michigan/
- [ ] https://calcrafty.com/finance/paycheck-calculator/new-york/
- [ ] https://calcrafty.com/finance/paycheck-calculator/north-carolina/
- [ ] https://calcrafty.com/finance/paycheck-calculator/ohio/
- [ ] https://calcrafty.com/finance/paycheck-calculator/pennsylvania/
- [ ] https://calcrafty.com/finance/paycheck-calculator/states/
- [ ] https://calcrafty.com/finance/paycheck-calculator/texas/

### State data (checked 2026-11-01)

Claude Code checked the 8 open items against official sources. Corrected in the data and on the pages:

- [x] Georgia: HB 463 (signed May 11, 2026) cut the 2026 rate to **4.99%** (retroactive to January 1) and raised the standard deduction to **$15,000 / $30,000**. Was 5.19% and $12,000 / $24,000.
- [x] Ohio: personal exemption now follows the income tiers ($2,400 / $2,150 / $1,900 per person, none at $500,000 or more). Was a flat $2,400.
- [x] California: standard deduction corrected to the 2025 FTB amount ($5,706 / $11,412); it was the 2024 figure.
- [x] Philadelphia: wage tax 3.735% resident / 3.425% non-resident from July 1, 2026 (phila.gov).
- [x] Confirmed unchanged: NY DBL $0.60/week cap, NYC rates 3.078%–3.876%, PA UC 0.07%, Detroit 2.4% / 1.2%.

Still open:

- [ ] California: FTB hadn't published the 2026 indexed brackets, standard deduction and credit by 2026-11-01. The calculator uses the 2025 amounts; ask Claude Code to update `src/data/static/states.ts` once FTB publishes them (usually by December).

## 9. Monetization (optional, later)

Ad slots and affiliate boxes are built but switched off. When you have an ad network or affiliate program, tell Claude Code which one; it will add the script and CSP domain and set `ADS_ENABLED=true` in the deploy workflow. Ads never appear between inputs and results.
