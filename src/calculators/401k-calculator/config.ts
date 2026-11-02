import type { CalculatorConfig } from '../../lib/types.ts';
import { num, pct, usd } from '../../lib/format.ts';
import { compute401k, deferralLimit, type K401Input, type K401Output } from './math.ts';

const config: CalculatorConfig<K401Input, K401Output> = {
  slug: '401k-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: '401(k) Calculator',
  h1: '401k Calculator: Project Your 401(k) Balance',
  intro: 'What your 401(k) could grow to by retirement, with your employer match, raises and the 2026 contribution limits.',
  metaTitle: '401(k) Calculator: Growth with Employer Match',
  metaDescription:
    'Project your 401(k) balance at retirement with your contributions, employer match, raises and 2026 IRS limits, and see how much match you may be leaving behind.',
  primaryKeyword: '401k calculator',
  secondaryKeywords: ['401k growth calculator', '401k match calculator', '401k contribution calculator', 'how much will my 401k be worth'],
  synonyms: ['401(k)', 'employer match', '403b', 'retirement plan', 'catch-up contribution'],
  inputs: [
    { id: 'currentAge', label: 'Current age', type: 'number', unit: 'years', min: 16, max: 80, step: 1, integer: true, slider: false, group: 'ages' },
    { id: 'retireAge', label: 'Retirement age', type: 'number', unit: 'years', min: 30, max: 85, step: 1, integer: true, slider: false, group: 'ages' },
    { id: 'salary', label: 'Annual salary', type: 'number', unit: 'usd', min: 0, max: 10_000_000, step: 1_000, sliderMin: 20_000, sliderMax: 400_000 },
    { id: 'contribPct', label: 'Your contribution', type: 'number', unit: 'percent', min: 0, max: 100, step: 0.5, sliderMax: 30, helpText: 'Capped at the IRS limit: $24,500 in 2026, more from age 50.' },
    { id: 'matchRate', label: 'Employer match', type: 'number', unit: 'percent', min: 0, max: 200, step: 5, sliderMax: 100, group: 'match', helpText: '50% means 50 cents per dollar you put in.' },
    { id: 'matchUpTo', label: 'on contributions up to', type: 'number', unit: 'percent', min: 0, max: 100, step: 0.5, sliderMax: 10, group: 'match', helpText: 'Percent of salary the employer matches.' },
    { id: 'balance', label: 'Current 401(k) balance', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 1_000, sliderMax: 500_000 },
    { id: 'returnRate', label: 'Expected annual return', type: 'number', unit: 'percent', min: 0, max: 15, step: 0.1, sliderMax: 12 },
    { id: 'salaryGrowth', label: 'Yearly raise', type: 'number', unit: 'percent', min: 0, max: 15, step: 0.1, sliderMax: 8, advanced: true },
    { id: 'inflation', label: 'Inflation', type: 'number', unit: 'percent', min: 0, max: 15, step: 0.1, sliderMax: 8, liveDefault: 'cpiInflation', advanced: true },
  ],
  defaults: { currentAge: 30, retireAge: 67, salary: 70_000, salaryGrowth: 3, contribPct: 6, matchRate: 50, matchUpTo: 6, balance: 20_000, returnRate: 6.5, inflation: 3 },
  validate: (i) => (i.retireAge <= i.currentAge ? [{ id: 'retireAge', message: 'Retirement age must be after your current age.' }] : []),
  compute: compute401k,
  summarize: (i, o) => ({
    headline: { label: `Balance at ${i.retireAge}`, value: usd(o.balance), sub: `${usd(o.todaysDollars)} in today’s dollars`, raw: o.balance, better: 'higher' },
    items: [
      { label: 'Your contributions', value: usd(o.employeeTotal), raw: o.employeeTotal },
      { label: 'Employer match', value: usd(o.employerTotal), raw: o.employerTotal, better: 'higher' },
      { label: 'Investment growth', value: usd(o.growth), raw: o.growth, better: 'higher' },
      { label: 'Match you’re leaving on the table', value: `${usd(o.matchMissed)} a year`, raw: o.matchMissed, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    const s = [
      `Putting ${pct(i.contribPct, 1)} of a ${usd(i.salary)} salary into your 401(k) is ${usd(o.firstEmployee)} this year, and your employer adds ${usd(o.firstEmployer)}. With raises and a ${pct(i.returnRate, 1)} return, the account could reach ${usd(o.balance)} by ${i.retireAge}, about ${usd(o.todaysDollars)} in today’s money.`,
    ];
    if (o.matchMissed > 0) s.push(`You're contributing less than your employer will match. Raising your contribution to ${pct(i.matchUpTo, 1)} would add ${usd(o.matchMissed)} a year of free money from your employer.`);
    else s.push(`You're getting the full employer match, which adds ${usd(o.employerTotal)} over your career.`);
    if (o.yearsAtLimit > 0) s.push(`Your contribution reaches the IRS limit (${usd(deferralLimit(i.currentAge))} at your age in 2026) in ${num(o.yearsAtLimit, 0)} of the years. Consider an IRA or taxable account for savings beyond it.`);
    return s;
  },
  steps: (i, o) => [
    { label: 'Your contribution this year', formula: 'salary × contribution % (capped at the IRS limit)', substituted: `${usd(i.salary)} × ${pct(i.contribPct, 1)}`, result: usd(o.firstEmployee) },
    { label: 'Employer match this year', formula: 'salary × min(your %, match limit %) × match rate', substituted: `${usd(i.salary)} × ${pct(Math.min(i.contribPct, i.matchUpTo), 1)} × ${pct(i.matchRate, 0)}`, result: usd(o.firstEmployer) },
    { label: 'Growth each month', formula: 'balance × (1 + return ÷ 12) + contributions ÷ 12', substituted: `${pct(i.returnRate, 1)} a year, compounded monthly, salary rising ${pct(i.salaryGrowth, 1)} a year`, result: `${i.retireAge - i.currentAge} years` },
    { label: 'In today’s dollars', formula: 'balance ÷ (1 + inflation)^years', substituted: `${usd(o.balance)} ÷ (1 + ${pct(i.inflation)})^${i.retireAge - i.currentAge}`, result: usd(o.todaysDollars) },
  ],
  answerSummary: (i, o) => `Contributing ${pct(i.contribPct, 1)} of ${usd(i.salary)} with a ${pct(i.matchRate, 0)} match on up to ${pct(i.matchUpTo, 1)}, your 401(k) could grow to about ${usd(o.balance)} by age ${i.retireAge}.`,
  ogValue: (_i, o) => usd(o.balance),
  related: ['retirement-calculator', 'paycheck-calculator', 'investment-calculator', 'compound-interest-calculator', 'pay-raise-calculator'],
  sources: [
    { title: 'IRS Notice 2025-67: 2026 limits for 401(k) plans and IRAs', url: 'https://www.irs.gov/pub/irs-drop/n-25-67.pdf' },
    { title: 'IRS: 401(k) plan overview', url: 'https://www.irs.gov/retirement-plans/plan-sponsor/401k-plan-overview' },
    { title: 'U.S. Department of Labor: Understanding retirement plan fees and expenses', url: 'https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/publications/understanding-retirement-plan-fees-and-expenses' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
