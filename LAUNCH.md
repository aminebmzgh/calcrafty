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

- [x] About page: built and run by Amine Boumazzoughe (bank auditor, coding enthusiast); also in the Organization schema as `founder`. Add more about why you started it whenever you like.
- [x] `hello@calcrafty.com` mailbox created.
- [ ] When official social profiles exist, add their URLs to `SITE.sameAs` in `src/lib/site.ts` (used in Organization schema).

## 7. Keyword research

- [ ] **Replace estimated keyword data with real data.** `research/keyword-map.csv` uses estimated volume and difficulty (marked `estimate` in `data_source`). Export keyword data from Ahrefs, Semrush or Google Keyword Planner into `research/raw/`, then ask Claude Code to "update the keyword map from research/raw".

## 8. Content review (done 2026-11-01)

- [x] All 25 calculators, 5 guides and 20 state pages reviewed by the owner and set to `status: reviewed` (finance pages: "Amine Boumazzoughe, bank auditor"; others: "Amine Boumazzoughe"). They're indexable and listed in the sitemap (63 URLs).

Optional, for stronger trust signals on health and retirement topics:

- [ ] Have a clinician or registered dietitian check the health pages (BMI, calorie, body fat, macro, ideal weight, running pace, and the calories guide), and a CFP check the retirement guide. Search for `TODO: expert review` to see what each note asks. Then change `reviewedBy` to their name and credential.

To edit a page later: change its MDX file, update `lastReviewed`, commit and push.

### Growth batch 1 (reviewed 2026-11-01)

- [x] APR, debt-to-income ratio, salary to hourly, pay raise and car affordability calculators, and the "Is refinancing worth it?" guide: reviewed by the owner (bank auditor) and indexable.

### Content depth expansion (reviewed 2026-11-02)

- [x] All 30 calculator pages and 6 guides expanded to 1,500+ words and re-read by the owner; `lastReviewed` set to 2026-11-02.

### Growth batch 2 (reviewed 2026-11-02)

- [x] Refinance, CD and HELOC calculators, and the guides "What is a good debt-to-income ratio?" and "How is APR calculated?": reviewed by the owner (bank auditor) and indexable.

### Growth batch 7, finance and quick wins (waiting for review, 2026-11-06)

Drafts (`noindex`, not in the sitemap) until you review them. Tell Claude Code "batch 7 reviewed" or name the pages. Each page ends with a `TODO: expert review` comment listing what to double-check. The student loan pages need the closest look: the July 2026 plan changes (Tiered Standard, RAP, which plans older loans keep) come from secondary sources and the CRS, not yet from StudentAid.gov itself, and the Graduated plan schedule is an estimate.

- [ ] https://calcrafty.com/finance/amortization-calculator/
- [ ] https://calcrafty.com/finance/mortgage-payoff-calculator/
- [ ] https://calcrafty.com/finance/student-loan-calculator/
- [ ] https://calcrafty.com/construction/square-footage-calculator/
- [ ] https://calcrafty.com/conversion/weight-converter/
- [ ] https://calcrafty.com/conversion/temperature-converter/
- [ ] https://calcrafty.com/guides/how-to-pay-off-mortgage-early/
- [ ] https://calcrafty.com/guides/student-loan-repayment-plans/
- [ ] https://calcrafty.com/guides/how-to-calculate-square-footage/

### Growth batch 6, one per new category (reviewed 2026-11-03)

- [x] Ohm’s law, molarity, Punnett square, car CO2, length converter, recipe scaler and tip calculators, and their seven guides: reviewed by the owner and indexable, along with the Physics, Chemistry, Biology, Ecology, Conversion, Food and Other hubs.

### Growth batch 5, construction (reviewed 2026-11-02)

- [x] Concrete, paint, flooring, gravel and roofing calculators: reviewed by the owner and indexable, along with the Construction hub.

### Growth batch 4 (reviewed 2026-11-02)

- [x] 401(k), net worth, overtime, time card and mean/median/mode calculators, and the guides on 401(k) contributions, Roth vs traditional 401(k), reading a pay stub, net worth by age and mortgage amortization: reviewed by the owner and indexable.

Every three years: the net worth medians (`src/calculators/net-worth-calculator/math.ts`) come from the Federal Reserve's Survey of Consumer Finances (2022). Ask Claude Code to update them when the 2025 survey is published.

### Growth batch 3 (reviewed 2026-11-02)

- [x] Simple interest, inflation, emergency fund and final grade calculators, and the guide "How long to pay off a credit card at minimum payments": reviewed by the owner and indexable.

Yearly task: the inflation calculator's CPI history (`src/calculators/inflation-calculator/cpi.ts`) is a snapshot from FRED (series CPIAUCNS) taken 2026-11-02. Ask Claude Code to "refresh the CPI history" each February, once BLS has published the previous year's December index.

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
