# Calcrafty: next batch plan (keyword research, November 2026)

Keyword sheet: [keyword-research-2026-11.csv](keyword-research-2026-11.csv).

**Assumptions and limits.** US English. Revenue: display ads later (ads are built but off), so traffic matters more than per-visit value. No paid SEO tool: **volume, KD, CPC and traffic potential are `needs data`**, and every T score is an assumed 2 (marked `2*`). Results pages were sampled with a web search engine that only approximates Google and doesn't show AI Overviews; check the top picks in Google (incognito, US) before building. Replace the estimates with Keyword Planner or Search Console data when available.

## 1. Strategy card

- **Mission:** Calcrafty helps US adults make money, health and everyday decisions with fast calculators that show the math and explain what to do next.
- **Value path:** ads (traffic), then trust and repeat visits. Weighting: new site, so winnability counts triple.
- **Personas:**
  - *Borrower* (25–45): comparing loans, refinancing, buying a car or home; knows "rate" and "payment", not "APR" or "DTI".
  - *Earner* (20–40): negotiating pay, converting hourly and salary, checking a raise.
  - *Saver* (30–60): building an emergency fund, choosing CDs, worried about inflation.
- **Unfair advantages:**
  - The owner is a **bank auditor** who checks how banks calculate interest, APR and fees. That expertise is real for borrowing and saving topics.
  - Live FRED data (mortgage rates, CPI) is built in.
  - Every page shows its working, the math is tested, and pages load fast.
- **Site strength:** new domain with no proven difficulty range, so only results pages with weak or small sites in the top 10 are realistic.
- **Risk:** finance is YMYL. The owner's finance credentials cover it. Health is YMYL without a clinical reviewer, so new health calculators wait.

## 2. Pillars

| Pillar | Existing pages | New in this plan |
|---|---|---|
| Borrowing & credit | mortgage, loan, auto loan, affordability, credit card payoff, debt payoff | APR, DTI, refinance, HELOC, car affordability + 4 guides |
| Income & pay | paycheck (+10 states) | salary↔hourly, pay raise, (time card) |
| Saving | compound interest, savings goal, investment, retirement | CD, simple interest, inflation, emergency fund + 1 guide |
| Everyday | age, dates, GPA | final grade, (sales tax, tip) |

Start with **Borrowing & credit**. It's closest to the owner's expertise, has the most supporting pages already, and APR and DTI score highest.

## 3. Scoring

Priority = 2V + 3W + T + C + S. Winnability is weighted ×3 for a new site. The maximum is 24: 19 and above is **do now**, 15–18 is **next**, 14 and below is **backlog**. Calculator results pages are made up of tools, which is the right format for a calculator site.

## 4. Ranked backlog

| # | Page | Cluster | Verdict | Score | Information gain (why we can win) | When |
|---|---|---|---|---|---|---|
| 1 | APR calculator | B1 | Green | 23 | True APR including fees using the Regulation Z actuarial method. Many ranking tools use a rough approximation. Written from a bank auditor's view. | Month 1 |
| 2 | Debt-to-income ratio calculator | B2 | Green | 23 | Front-end and back-end DTI shown against conventional, FHA and VA limits, plus what to pay down first | Month 1 |
| 3 | Is refinancing worth it? (guide) | G1 | Green | 21 | Break-even tables by loan size and closing costs, and the term-reset trap. The current top results are old 2021 news syndication. | Month 1 |
| 4 | Salary to hourly calculator (both ways) | P1 | Green | 20 | Effective rate after PTO and all pay periods, linking to the paycheck calculator for take-home pay | Month 1 |
| 5 | Pay raise calculator | P2 | Green | 20 | Raise in % or $, per pay period, and the raise after inflation using live CPI | Month 1 |
| 6 | Car affordability calculator | B3 | Amber | 20 | Total cost of ownership measured against take-home pay; connects to auto loan | Month 1 |
| 7 | Refinance calculator | B4 | Amber | 19 | This week's FRED rate as the default; break-even and lifetime interest | Month 2 (after G1) |
| 8 | CD calculator | S1 | Amber | 19 | APY vs APR, early-withdrawal penalty, after-tax yield | Month 2 |
| 9 | HELOC calculator | B5 | Amber | 19 | Available equity at 80–85% combined loan-to-value, and the payment jump when the draw period ends | Month 2 |
| 10 | What is a good DTI? (guide) | G2 | Amber | 19 | Lender limits by loan type, from an auditor's view; supports calculator #2 | Month 2 |
| 11 | How is APR calculated? (guide) | G4 | Amber | 18 | What is included in APR and what isn't, with a worked actuarial example | Month 2 |
| 12 | Simple interest calculator | S2 | Amber | 17 | Day-count conventions; solves for any variable | Month 3 |
| 13 | Inflation calculator | S3 | Amber | 17 | Live CPI from 1913 onward plus future purchasing power | Month 3 |
| 14 | Emergency fund calculator | S4 | Amber | 17 | Number of months based on job stability and dependents, plus time to reach the goal | Month 3 |
| 15 | Minimum payment payoff time (guide) | G3 | Amber | 17 | Payoff tables by balance, APR and the issuer's minimum-payment formula | Month 3 |
| 16 | Final grade calculator | E1 | Amber | 15 | Handles impossible and negative results and weighted categories; pairs with GPA | Month 3 |
| 17 | Emergency fund guide | G5 | Amber | 15 | Merge into calculator #14's content if the SERPs overlap | Month 3 or merge |
| – | Time card calculator | P3 | Amber | 14 | SaaS brands dominate | Backlog (recheck May 2027) |
| – | Sales tax calculator | E2 | Amber | 14 | Needs a 50-state rate table to compete | Backlog |
| – | Tip calculator | E3 | **Red** | – | Google's own tip widget likely answers the query (verify) | Backlog |
| – | Due date calculator | H1 | **Red** | – | Medical YMYL with no clinical reviewer | Backlog |

**Calculator total for this batch:** 12, numbers 1–2, 4–9 and 12–14 plus 16. **Guides:** 5, numbers 3, 10, 11, 15 and 17.

**Keyword map change:** move "hourly to salary calculator" from the paycheck calculator's secondary keywords to the new salary-to-hourly page. The two pages serve different intents: gross conversion versus take-home pay.

## 5. Topical map (Borrowing & credit)

```
/finance/ (hub)
 ├─ APR calculator ──────── How is APR calculated? (guide)
 │      └─ links: loan, auto loan, credit card payoff
 ├─ DTI calculator ──────── What is a good DTI? (guide)
 │      └─ links: mortgage affordability, debt payoff
 ├─ Refinance calculator ── Is refinancing worth it? (guide)
 │      └─ links: mortgage, HELOC
 ├─ HELOC calculator ─────── links: mortgage, refinance, debt payoff
 └─ Car affordability ────── links: auto loan, paycheck, DTI
```

Each new page links up to its hub, across to 2–3 related pages, and to its guide.

## 6. 90-day plan

- **Month 1 (Nov–Dec 2026):**
  - Build #1, #2, #4, #5 and #6, then write guide #3.
  - The owner reviews each batch before it's marked reviewed.
  - Request indexing for each new page in Search Console.
- **Month 2 (Dec 2026–Jan 2027):**
  - Build #7, #8 and #9, then write guides #10 and #11.
  - Update California's 2026 tax figures when the FTB publishes them.
- **Month 3 (Jan–Feb 2027):**
  - Build #12, #13, #14 and #16 and write guide #15.
  - Do the first Search Console review: find pages ranking in positions 8–20 and improve them.
  - Re-score this backlog with real impression data.

## 7. Briefs (top 5)

### Brief: APR calculator
- **Primary keyword:** apr calculator. **Secondary:** loan apr calculator, calculate apr with fees, true apr calculator.
- **Intent:** searchers want to turn a rate plus fees into the real yearly cost and expect a quick tool with a clear explanation.
- **Competitors:**
  - inchcalculator.com: clean, but light on explanation.
  - financer.com: thin content.
  - brightchamps.com: uses a simple-interest approximation, which gives wrong APRs on amortizing loans.
- **Information gain:** solves for APR the way lenders must disclose it (the Regulation Z actuarial method, an internal-rate-of-return calculation). It shows which fees count (origination, points, prepaid interest) and which don't, compares two offers side by side, and is written by a bank auditor.
- **Outline:**
  1. How to use it
  2. What APR includes
  3. Worked example: $20,000 for 60 months at 7% with a $600 fee
  4. APR vs interest rate
  5. How lenders calculate APR
  6. When APR misleads (short holding periods, adjustable-rate mortgages)
  7. FAQ
- **Opening:** "APR is the yearly cost of a loan including fees, not just interest. Enter the loan amount, rate, term and fees to see the APR a lender would disclose."
- **SEO tags:**
  - Title: "APR Calculator: True Loan Cost Including Fees"
  - H1: "APR Calculator"
  - URL: `/finance/apr-calculator/`
- **Links:** in from loan, auto loan, mortgage and the guide; out to loan, auto loan and the APR guide.
- **Structured data:** existing WebApplication + HowTo. **Review:** May 2027.

### Brief: Debt-to-income ratio calculator
- **Primary keyword:** debt to income ratio calculator. **Secondary:** dti calculator, debt to income ratio for mortgage.
- **Intent:** searchers want to know their DTI and whether a lender will approve them, and expect a tool that gives a verdict.
- **Competitors:**
  - NerdWallet: back-end ratio only.
  - TransUnion: has a gated feel.
  - basic-mathematics.com: shows front-end and back-end ratios, but the design is dated.
- **Information gain:** both ratios, with pass or fail against 28/36 (conventional), 31/43 (FHA) and 41% (VA). Also shows how much a debt payoff would lower the ratio, and links to debt payoff.
- **Outline:**
  1. How to use it
  2. Front-end vs back-end DTI
  3. Lender limits by loan type
  4. Worked example
  5. How to lower your DTI
  6. FAQ
- **SEO tags:**
  - Title: "Debt-to-Income Ratio Calculator (DTI) for Mortgages"
  - URL: `/finance/debt-to-income-ratio-calculator/`
- **Links:** to mortgage affordability, debt payoff and the DTI guide. **Review:** May 2027.

### Brief: Salary to hourly calculator
- **Primary keyword:** salary to hourly calculator. **Secondary:** hourly to salary calculator, annual salary to hourly.
- **Intent:** searchers want a quick two-way conversion across pay periods.
- **Competitors:** finmasters, softwaretestinghelp and gigacalculator, all thin. Spam domains also rank.
- **Information gain:**
  - Converts in both directions on one page.
  - Shows the effective rate after unpaid time off, with all six pay periods in one table.
  - Gives a one-click handoff to take-home pay in the paycheck calculator.
- **Outline:**
  1. How to use it
  2. The formula (2,080 hours)
  3. Common conversions table ($15–$100 an hour)
  4. Salaried vs hourly pay
  5. FAQ
- **SEO tags:**
  - Title: "Salary to Hourly Calculator (and Hourly to Salary)"
  - URL: `/finance/salary-to-hourly-calculator/`
- **Review:** May 2027.

### Brief: Is refinancing worth it? (guide)
- **Primary keyword:** is it worth refinancing for 1 percent. **Secondary:** when to refinance mortgage, refinance break even.
- **Intent:** searchers want a yes or no for their situation, and expect a guide with worked numbers.
- **Competitors:**
  - Fox syndicated articles from 2021: outdated.
  - refi.com: one example only.
  - mortgageresearch.com: generic.
- **Information gain:**
  - A break-even table by loan balance ($200k–$600k) and closing costs (2–5%), at this week's FRED rate.
  - A worked term-reset example.
  - A checklist from the owner's audit experience.
- **Outline:**
  1. Short answer
  2. The 1% rule and why it's incomplete
  3. Break-even table
  4. The term-reset trap
  5. When a 0.5% drop is worth it
  6. Costs to include
  7. Checklist
  8. FAQ
- **SEO tags:**
  - Title: "Is Refinancing Worth It for 1%? Break-Even Math"
  - URL: `/guides/is-refinancing-worth-it/`
- **Links:** to the refinance calculator (once built) and mortgage. **Structured data:** Article. **Review:** May 2027.

### Brief: What is a good debt-to-income ratio? (guide)
- **Primary keyword:** what is a good debt to income ratio. **Secondary:** dti for mortgage, max dti fha.
- **Intent:** a benchmark number plus what to do about it.
- **Competitors:** LendingTree, Rocket Mortgage, Schwab and credit.com. They're strong, but their answers are generic and often contradict each other on thresholds (35% vs 36% vs 43%).
- **Information gain:**
  - One clear table of limits by loan type with sources (Fannie Mae, FHA and VA handbooks).
  - How lenders actually count debts (student loans, co-signed loans), from the auditor's view.
- **Outline:**
  1. Short answer
  2. DTI bands
  3. Limits by loan type
  4. What counts as debt
  5. How to lower it
  6. FAQ
- **SEO tags:**
  - Title: "What Is a Good Debt-to-Income Ratio? Limits by Loan"
  - URL: `/guides/good-debt-to-income-ratio/`
- **Links:** to the DTI calculator and mortgage affordability. **Review:** May 2027.

## 8. Measurement

- **Judging new pages:** wait 8–12 weeks. Expect 3–6 months on a new domain.
- **Monthly, in Search Console:**
  - Queries for each page.
  - Pages in positions 8–20, which are candidates for improvement.
  - Pages with low click-through at positions 1–5, which need better titles.
  - Queries where two of our pages compete.
- **Quarterly:** re-score this backlog, and promote or retire items.

## Sources (SERP samples, 2026-11-01)

- **APR:** [inchcalculator APR](https://www.inchcalculator.com/apr-calculator/), [financer APR](https://financer.com/loans/apr-calculator/), [brightchamps APR](https://brightchamps.com/en-us/math/calculators/apr-calculator).
- **DTI:** [NerdWallet DTI](https://www.nerdwallet.com/mortgages/calculators/debt-to-income-ratio), [basic-mathematics DTI](https://basic-mathematics.com/debt-to-income-ratio-calculator.html).
- **Pay:** [finmasters salary to hourly](https://finmasters.com/salary-to-hourly-calculator/), [gigacalculator](https://www.gigacalculator.com/calculators/salary-to-hourly-calculator.php), [inchcalculator pay raise](https://inchcalculator.com/pay-raise-calculator).
- **Car and refinance calculators:** [KBB affordability](https://kbb.com/car-affordability-calculator/), [Bankrate refinance break-even](https://www.bankrate.com/mortgages/mortgage-refinance-break-even-calculator/), [Lower break-even](https://www.lower.com/mortgages/calculators/refinance-break-even).
- **Saving:** [Bankrate CD](https://www.bankrate.com/banking/savings/bank-cd-calculator), [Omni HELOC](https://www.omnicalculator.com/finance/heloc), [NerdWallet inflation](https://www.nerdwallet.com/finance/calculators/inflation-calculator), [NerdWallet emergency fund](https://www.nerdwallet.com/article/finance/emergency-fund-calculator).
- **Everyday:** [RogerHub final grade](https://rogerhub.com/final), [Hubstaff time card](https://hubstaff.com/time-tracking/free-timecard-calculator), [Stripe sales tax](https://stripe.com/en-ro/guides/tools/sales-tax-calculator), [Mayo Clinic due date](https://www.mayoclinic.org/zh-hans/healthy-lifestyle/getting-pregnant/in-depth/due-date-calculator/itt-20084955).
- **Guides:** [refi.com 1% refinance](https://www.refi.com/learn/worth-refinancing-mortgage-for-1-percent/), [LendingTree good DTI](https://www.lendingtree.com/debt-consolidation/whats-a-good-debt-income-ratio/), [Experian APR vs rate](https://www.experian.com/blogs/ask-experian/apr-vs-interest-rate-whats-the-difference/), [Motley Fool minimum payments](https://www.fool.com/money/credit-cards/articles/heres-how-long-it-takes-to-pay-off-5000-making-only-minimum-payments/).
