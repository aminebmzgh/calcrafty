import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeInvestment, type InvestmentInput, type InvestmentOutput } from './math.ts';

const config: CalculatorConfig<InvestmentInput, InvestmentOutput> = {
  slug: 'investment-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'Investment Calculator',
  h1: 'Investment Calculator',
  intro: 'Project what your investments could grow to with regular contributions, and what that’s worth in today’s dollars.',
  metaTitle: 'Investment Calculator: Growth with Monthly Contributions',
  metaDescription:
    'Free investment calculator: project growth from a starting amount and monthly contributions that rise each year, and see the result in today’s dollars.',
  primaryKeyword: 'investment calculator',
  secondaryKeywords: ['investment growth calculator', 'investment return calculator', 'stock investment calculator'],
  synonyms: ['stocks', 'index fund', 'portfolio', 'brokerage', 'roth ira', 'returns', 'inflation'],
  inputs: [
    { id: 'initial', label: 'Starting amount', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 500, sliderMax: 250_000 },
    { id: 'monthly', label: 'Monthly contribution', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 25, sliderMax: 5_000 },
    { id: 'returnRate', label: 'Expected annual return', type: 'number', unit: 'percent', min: -20, max: 30, step: 0.1, sliderMin: 0, sliderMax: 12, group: 'rate', helpText: 'An average, not a promise: real returns vary year to year.' },
    { id: 'years', label: 'Years to grow', type: 'number', unit: 'years', min: 1, max: 80, step: 1, integer: true, sliderMax: 50, group: 'rate' },
    { id: 'contributionIncrease', label: 'Raise contributions each year by', type: 'number', unit: 'percent', min: 0, max: 50, step: 0.5, sliderMax: 10, advanced: true, group: 'adv' },
    { id: 'inflation', label: 'Inflation', type: 'number', unit: 'percent', min: -5, max: 20, step: 0.1, sliderMin: 0, sliderMax: 8, advanced: true, group: 'adv', liveDefault: 'cpiInflation' },
  ],
  defaults: { initial: 10_000, monthly: 500, returnRate: 6, years: 25, contributionIncrease: 2, inflation: 3 },
  compute: computeInvestment,
  summarize: (i, o) => ({
    headline: { label: `Value in ${i.years} years`, value: usd(o.balance), sub: `${usd(o.realBalance)} in today’s dollars`, raw: o.balance, better: 'higher' },
    items: [
      { label: 'You contribute', value: usd(o.totalContributed), raw: o.totalContributed },
      { label: 'Investment growth', value: usd(o.growth), raw: o.growth, better: 'higher' },
      { label: 'Growth share of balance', value: pct(o.growthShare, 1), raw: o.growthShare, better: 'higher' },
      { label: 'Monthly contribution in the final year', value: usd(o.finalMonthly), raw: o.finalMonthly },
    ],
  }),
  explain: (i, o) => {
    const s = [`You’d put in ${usd(o.totalContributed)} and growth would add ${usd(o.growth)}, for ${usd(o.balance)} after ${i.years} years if returns average ${pct(i.returnRate)} a year.`];
    s.push(`With ${pct(i.inflation)} inflation, that balance would buy what ${usd(o.realBalance)} buys today.`);
    if (o.growthShare > 50) s.push(`More than half the final balance (${pct(o.growthShare, 0)}) is growth rather than money you put in: time does most of the work.`);
    if (i.contributionIncrease > 0) s.push(`Raising your contribution ${pct(i.contributionIncrease)} a year takes it from ${usd(i.monthly)} to ${usd(o.finalMonthly)} a month by the final year.`);
    return s.slice(0, 4);
  },
  steps: (i, o) => [
    { label: 'Monthly return', formula: 'm = annual return ÷ 12 (compounded monthly)', substituted: `m = ${pct(i.returnRate)} ÷ 12` },
    { label: 'Each month', formula: 'balance = balance × (1 + m) + contribution', substituted: `${i.years * 12} months, contributions rising ${pct(i.contributionIncrease)} each year` },
    { label: 'Final balance', formula: 'contributions + growth', substituted: `${usd(o.totalContributed)} + ${usd(o.growth)}`, result: usd(o.balance) },
    { label: 'In today’s dollars', formula: 'balance ÷ (1 + inflation)^years', substituted: `${usd(o.balance)} ÷ (1 + ${pct(i.inflation)})^${i.years}`, result: usd(o.realBalance) },
  ],
  answerSummary: (i, o) => `Investing ${usd(i.initial)} plus ${usd(i.monthly)} a month at a ${pct(i.returnRate)} average return grows to about ${usd(o.balance)} in ${i.years} years, or ${usd(o.realBalance)} in today’s dollars at ${pct(i.inflation)} inflation.`,
  ogValue: (_i, o) => usd(o.balance),
  related: ['retirement-calculator', 'compound-interest-calculator', 'savings-goal-calculator', 'paycheck-calculator'],
  sources: [
    { title: 'SEC Investor.gov: Compound interest calculator', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
    { title: 'SEC Investor.gov: Saving and investing', url: 'https://www.investor.gov/introduction-investing/getting-started/saving-investing' },
    { title: 'Bureau of Labor Statistics CPI-U (via FRED, CPIAUCSL)', url: 'https://fred.stlouisfed.org/series/CPIAUCSL' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
