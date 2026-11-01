import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeRetirement, type RetirementInput, type RetirementOutput } from './math.ts';

const config: CalculatorConfig<RetirementInput, RetirementOutput> = {
  slug: 'retirement-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'Retirement Calculator',
  h1: 'Retirement Calculator',
  intro: 'Check whether your savings will cover the income you want in retirement, and what to save each month if not.',
  metaTitle: 'Retirement Calculator: Are You Saving Enough?',
  metaDescription:
    'Free retirement calculator: project your savings, see the nest egg you need after Social Security and inflation, how long it lasts and what to save each month.',
  primaryKeyword: 'retirement calculator',
  secondaryKeywords: ['retirement savings calculator', '401k retirement calculator', 'how much do i need to retire calculator'],
  synonyms: ['401k', 'ira', 'nest egg', 'pension', 'social security', 'retire', '4% rule'],
  inputs: [
    { id: 'currentAge', label: 'Your age', type: 'number', unit: 'years', min: 16, max: 90, step: 1, integer: true, slider: false, group: 'ages' },
    { id: 'retirementAge', label: 'Retire at', type: 'number', unit: 'years', min: 30, max: 90, step: 1, integer: true, slider: false, group: 'ages' },
    { id: 'currentSavings', label: 'Retirement savings now', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 1000, sliderMax: 1_000_000 },
    { id: 'monthly', label: 'Monthly contribution', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 25, sliderMax: 5_000, helpText: 'Include any employer match.' },
    { id: 'incomeNeeded', label: 'Income you want in retirement', type: 'number', unit: 'usd', min: 0, max: 5_000_000, step: 1000, sliderMax: 250_000, helpText: 'Per year, in today’s dollars. Many people plan on 70% to 80% of their pre-retirement income.' },
    { id: 'socialSecurity', label: 'Social Security per month', type: 'number', unit: 'usd', min: 0, max: 10_000, step: 50, sliderMax: 5_000, helpText: 'In today’s dollars. Get your estimate at ssa.gov/myaccount.' },
    { id: 'preReturn', label: 'Return before retiring', type: 'number', unit: 'percent', min: -10, max: 20, step: 0.1, sliderMin: 0, sliderMax: 12, advanced: true, group: 'returns' },
    { id: 'postReturn', label: 'Return in retirement', type: 'number', unit: 'percent', min: -10, max: 20, step: 0.1, sliderMin: 0, sliderMax: 10, advanced: true, group: 'returns' },
    { id: 'lifeExpectancy', label: 'Plan to age', type: 'number', unit: 'years', min: 50, max: 120, step: 1, integer: true, slider: false, advanced: true, group: 'other' },
    { id: 'inflation', label: 'Inflation', type: 'number', unit: 'percent', min: -5, max: 20, step: 0.1, sliderMin: 0, sliderMax: 8, advanced: true, group: 'other', liveDefault: 'cpiInflation' },
  ],
  defaults: {
    currentAge: 35,
    retirementAge: 67,
    lifeExpectancy: 92,
    currentSavings: 50_000,
    monthly: 750,
    preReturn: 6,
    postReturn: 4.5,
    incomeNeeded: 60_000,
    socialSecurity: 2_000,
    inflation: 3,
  },
  validate: (i) => {
    const e: { id: 'retirementAge' | 'lifeExpectancy'; message: string }[] = [];
    if (i.retirementAge < i.currentAge) e.push({ id: 'retirementAge', message: 'Retirement age must be at least your current age.' });
    if (i.lifeExpectancy <= i.retirementAge) e.push({ id: 'lifeExpectancy', message: '“Plan to age” must be later than your retirement age.' });
    return e;
  },
  compute: computeRetirement,
  summarize: (i, o) => ({
    headline: {
      label: `Savings at ${i.retirementAge}`,
      value: usd(o.savingsAtRetirement),
      sub: o.onTrack ? `On track: ${usd(o.surplus)} more than you need` : `Short by ${usd(-o.surplus)} for your income goal`,
      raw: o.savingsAtRetirement,
      better: 'higher',
    },
    items: [
      { label: 'Nest egg needed', value: usd(o.needed), raw: o.needed, better: 'lower' },
      { label: 'In today’s dollars', value: usd(o.savingsTodaysDollars), raw: o.savingsTodaysDollars, better: 'higher' },
      { label: 'Savings last until', value: o.runsOutAge === null ? `${i.lifeExpectancy}+` : `age ${o.runsOutAge}`, raw: o.runsOutAge ?? i.lifeExpectancy + 1, better: 'higher' },
      { label: 'Monthly saving needed', value: o.onTrack ? usd(i.monthly) : usd(o.requiredMonthly, true), raw: o.onTrack ? i.monthly : o.requiredMonthly, better: 'lower' },
      { label: 'First-year withdrawal rate', value: pct(o.withdrawalRate, 1), raw: o.withdrawalRate, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    const s = [
      `In ${o.yearsToRetire} years your savings could grow to ${usd(o.savingsAtRetirement)}, worth about ${usd(o.savingsTodaysDollars)} in today’s money.`,
      o.annualGap > 0
        ? `After Social Security, your savings need to provide ${usd(o.annualGap)} a year in today’s dollars, rising with inflation, for ${o.yearsInRetirement} years. That takes a nest egg of ${usd(o.needed)} at ${i.retirementAge}.`
        : 'Social Security covers the income you want, so your savings are a cushion rather than a necessity.',
    ];
    if (!o.onTrack) s.push(`To close the gap, save ${usd(o.requiredMonthly, true)} a month instead of ${usd(i.monthly)}, retire later, or plan on less income.${o.runsOutAge !== null ? ` At the current pace the money runs out around age ${o.runsOutAge}.` : ''}`);
    else s.push(`You’re on track, with ${usd(o.surplus)} to spare at retirement.`);
    s.push(`Your first-year withdrawal would be ${pct(o.withdrawalRate, 1)} of your savings; the widely cited 4% guideline is a common benchmark for a sustainable rate.`);
    return s;
  },
  steps: (i, o) => [
    { label: 'Savings at retirement', formula: 'grow today’s savings and monthly contributions for the years until retirement', substituted: `${usd(i.currentSavings)} + ${usd(i.monthly)}/month for ${o.yearsToRetire} years at ${pct(i.preReturn)}`, result: usd(o.savingsAtRetirement) },
    { label: 'Yearly income gap (today’s dollars)', formula: 'income wanted − Social Security × 12', substituted: `${usd(i.incomeNeeded)} − ${usd(i.socialSecurity)} × 12`, result: usd(o.annualGap) },
    {
      label: 'Nest egg needed at retirement',
      formula: 'present value of withdrawals rising with inflation, at the retirement return',
      substituted: `${o.yearsInRetirement} yearly withdrawals, inflation ${pct(i.inflation)}, return ${pct(i.postReturn)}`,
      result: usd(o.needed),
    },
    { label: 'Surplus or shortfall', formula: 'savings at retirement − nest egg needed', substituted: `${usd(o.savingsAtRetirement)} − ${usd(o.needed)}`, result: usd(o.surplus) },
  ],
  answerSummary: (i, o) =>
    `Saving ${usd(i.monthly)} a month from age ${i.currentAge} with ${usd(i.currentSavings)} already saved grows to about ${usd(o.savingsAtRetirement)} by ${i.retirementAge}${o.onTrack ? ', enough for' : ', short of'} ${usd(i.incomeNeeded)} a year of income with ${usd(i.socialSecurity)} a month from Social Security.`,
  ogValue: (_i, o) => usd(o.savingsAtRetirement),
  related: ['investment-calculator', 'paycheck-calculator', 'compound-interest-calculator', 'savings-goal-calculator'],
  sources: [
    { title: 'SSA: Get your Social Security statement (my Social Security)', url: 'https://www.ssa.gov/myaccount/' },
    { title: 'SEC Investor.gov: Retirement planning', url: 'https://www.investor.gov/additional-resources/retirement-toolkit' },
    { title: 'IRS: 2026 retirement plan contribution limits', url: 'https://www.irs.gov/retirement-plans/cola-increases-for-dollar-limitations-on-benefits-and-contributions' },
    { title: 'Bureau of Labor Statistics CPI-U (via FRED, CPIAUCSL)', url: 'https://fred.stlouisfed.org/series/CPIAUCSL' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
