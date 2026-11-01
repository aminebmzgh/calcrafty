# Launch checklist (owner actions)

Everything here needs your accounts, keys or judgment. Claude Code has built and tested everything else. Work top to bottom; tick each box when done.

## Done already

- [x] GitHub CLI installed and authenticated (account `aminebmzgh`).
- [x] Private repo `aminebmzgh/calcrafty` created and pushed.
- [x] CI and Deploy workflows pass; the `deploy` branch contains the built site.

## 1. Hostinger: connect the deploy branch (makes the site live)

1. Log in to **hPanel** → **Websites** → **calcrafty.com** → **Manage**.
2. Delete Hostinger's default files: **Files → File Manager → public_html**, select all, delete (the folder must be empty).
3. Open **Advanced → Git**.
4. Repository: `git@github.com:aminebmzgh/calcrafty.git`. hPanel shows an SSH key: copy it, then on GitHub open **calcrafty → Settings → Deploy keys → Add deploy key**, paste it, leave "Allow write access" unticked, save.
5. Branch: **`deploy`**. Install path: leave empty (= `public_html`). Click **Create**.
6. Click **Auto deployment**, copy the webhook URL. On GitHub: **calcrafty → Settings → Webhooks → Add webhook**, paste it, content type `application/json`, "Just the push event", save.
7. Back in hPanel, click **Deploy** once. Visit https://calcrafty.com/.

**Fallback** (only if Git deployment isn't available on your plan): hPanel → **Advanced → SSH Access** → enable SSH, note host, port and username, add an SSH public key. Then run:

```sh
gh secret set SSH_HOST
gh secret set SSH_PORT
gh secret set SSH_USER
gh secret set SSH_KEY < path/to/private_key
gh variable set DEPLOY_VIA_SSH --body true
```

## 2. Hostinger: SSL, redirects and CDN

1. hPanel → **Security → SSL**: install the free certificate for `calcrafty.com` and `www.calcrafty.com`. Wait until it shows **Active**.
2. Check: `http://www.calcrafty.com/finance/` should redirect to `https://calcrafty.com/finance/` in one step.
3. hPanel → **Performance → CDN**: enable it if your plan includes it. If not, consider Cloudflare's free plan in front of the site (SSL mode "Full (strict)").
4. Check the security headers once live: open https://securityheaders.com/?q=calcrafty.com, which should show HSTS, CSP, X-Content-Type-Options, Referrer-Policy and Permissions-Policy. Tell Claude Code "check the live headers" to have it verify everything.

## 3. Live mortgage rates and data (recommended)

Without a key, the weekly refresh uses FRED's public CSV download, which works today. An API key is more reliable:

1. Create a free account at https://fred.stlouisfed.org/ → **My Account → API Keys → Request API Key**.
2. Run `gh secret set FRED_API_KEY` and paste the key.

The Deploy workflow refreshes rates every Monday 06:00 UTC and redeploys.

## 4. Analytics (privacy-friendly, no cookies)

1. Create a free account at https://cloud.umami.is/ → **Add website** → domain `calcrafty.com`.
2. Copy the **Website ID** (a UUID).
3. Run `gh secret set ANALYTICS_ID` and paste it. The next deploy adds the script, and a 20% sample of visits reports Core Web Vitals as `web-vitals` events.

(Plausible works too; tell Claude Code to switch the script and CSP domain.)

## 5. Search engines

**Google Search Console**
1. Go to https://search.google.com/search-console → **Add property** → **Domain** → `calcrafty.com`.
2. Copy the TXT record and add it in hPanel → **Domains → DNS / Nameservers → DNS records** (type TXT, name `@`). Click **Verify**.
3. **Sitemaps** → submit `https://calcrafty.com/sitemap-index.xml`.

**Bing Webmaster Tools**
1. Go to https://www.bing.com/webmasters → **Import from Google Search Console** (easiest), or add the site and verify by DNS.
2. Submit `https://calcrafty.com/sitemap-index.xml`.
3. IndexNow is already set up: every deploy pings Bing and other IndexNow engines with changed URLs (key file `/4cadaef7ac8aae1d1f5165d207581ea6.txt`).

## 6. About page and contact

- [ ] Add who runs Calcrafty to `src/pages/about.astro` (search for `TODO: owner`): your name, background and why you started it. This matters for trust (E-E-A-T).
- [ ] Set up the `hello@calcrafty.com` mailbox (hPanel → **Emails**), or change `SITE.email` in `src/lib/site.ts`.
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

### State data to verify

- [ ] California: California 2026 bracket widths, standard deduction and exemption credit were not yet indexed when published; the 2025 amounts are used (Tax Foundation note).
- [ ] New York: NY disability (DBL) employee cap of $0.60 a week: confirm with NY DFS / WCB for 2026.
- [ ] New York: NYC resident income tax rates (3.078%–3.876%): confirm current NYC rates.
- [ ] Pennsylvania: Philadelphia resident wage tax rate (about 3.74%): confirm the current rate with the City of Philadelphia.
- [ ] Pennsylvania: PA employee unemployment compensation rate (0.07%): confirm for 2026.
- [ ] Ohio: Ohio personal exemption by income level for 2026 ($2,400 used for all incomes).
- [ ] Georgia: Georgia 2026 rate: Tax Foundation lists 5.19%; scheduled 0.10-point annual cuts under HB 111 are subject to revenue triggers. Confirm with Georgia DOR Form 500 instructions.
- [ ] Michigan: Detroit resident (2.4%) / non-resident (1.2%) rates: confirm current rates.

## 9. Monetization (optional, later)

Ad slots and affiliate boxes are built but switched off. When you have an ad network or affiliate program, tell Claude Code which one; it will add the script and CSP domain and set `ADS_ENABLED=true` in the deploy workflow. Ads never appear between inputs and results.
