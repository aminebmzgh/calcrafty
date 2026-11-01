import type { CalculatorConfig } from '../../lib/types.ts';
import { num, pct, usd } from '../../lib/format.ts';
import { computeCompound, type CompoundInput, type CompoundOutput } from './math.ts';

const FREQ: Record<CompoundInput['compounding'], string> = {
  daily: 'daily',
  monthly: 'monthly',
  quarterly: 'quarterly',
  semiannually: 'twice a year',
  annually: 'annually',
  continuously: 'continuously',
};

const config: CalculatorConfig<CompoundInput, CompoundOutput> = {
  slug: 'compound-interest-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'Compound Interest Calculator',
  h1: 'Compound Interest Calculator',
  intro: 'See how a balance grows with compound interest and regular deposits, compounded daily, monthly or yearly.',
  metaTitle: 'Compound Interest Calculator with Monthly Deposits',
  metaDescription:
    'Free compound interest calculator: see how savings grow with daily, monthly or annual compounding and monthly deposits, with APY, a chart and a yearly table.',
  primaryKeyword: 'compound interest calculator',
  secondaryKeywords: ['compound interest formula calculator', 'daily compound interest calculator', 'interest calculator'],
  synonyms: ['apy', 'interest', 'savings growth', 'cd', 'high yield savings'],
  inputs: [
    { id: 'principal', label: 'Starting balance', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 100, sliderMax: 100_000 },
    { id: 'monthly', label: 'Monthly deposit', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 10, sliderMax: 3_000 },
    { id: 'rate', label: 'Interest rate', type: 'number', unit: 'percent', min: 0, max: 50, step: 0.01, sliderMax: 15, liveDefault: 'savingsRate', group: 'rate', helpText: 'Annual rate. Defaults to the 3-month Treasury bill yield, a benchmark for high-yield savings.' },
    { id: 'years', label: 'Years', type: 'number', unit: 'years', min: 1, max: 100, step: 1, integer: true, sliderMax: 50, group: 'rate' },
    {
      id: 'compounding',
      label: 'Compounded',
      type: 'select',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'semiannually', label: 'Twice a year' },
        { value: 'annually', label: 'Annually' },
        { value: 'continuously', label: 'Continuously' },
      ],
    },
    {
      id: 'timing',
      label: 'Deposits made at the',
      type: 'segmented',
      advanced: true,
      options: [
        { value: 'end', label: 'End of month' },
        { value: 'start', label: 'Start of month' },
      ],
    },
  ],
  defaults: { principal: 10_000, monthly: 200, rate: 4, years: 10, compounding: 'daily', timing: 'end' },
  compute: computeCompound,
  summarize: (i, o) => ({
    headline: { label: `Balance after ${i.years} ${i.years === 1 ? 'year' : 'years'}`, value: usd(o.balance), raw: o.balance, better: 'higher' },
    items: [
      { label: 'Total deposited', value: usd(o.totalContributed), raw: o.totalContributed },
      { label: 'Interest earned', value: usd(o.totalInterest), raw: o.totalInterest, better: 'higher' },
      { label: 'APY', value: pct(o.apy, 3), raw: o.apy, better: 'higher' },
      { label: 'Interest in the last year', value: usd(o.lastYearInterest), raw: o.lastYearInterest, better: 'higher' },
    ],
  }),
  explain: (i, o) => {
    const s = [`You’d deposit ${usd(o.totalContributed)} and earn ${usd(o.totalInterest)} in interest, for ${usd(o.balance)} after ${i.years} ${i.years === 1 ? 'year' : 'years'}.`];
    if (o.apy > 0) s.push(`At ${pct(i.rate)} compounded ${FREQ[i.compounding]}, the effective yearly yield (APY) is ${pct(o.apy, 3)}.`);
    if (o.doublingYears !== null) s.push(`At this rate, money left alone doubles in about ${num(o.doublingYears, 1)} years.`);
    if (o.lastYearInterest > 0 && i.years > 1) s.push(`In the final year alone you earn ${usd(o.lastYearInterest)} in interest: compounding speeds up over time.`);
    return s.slice(0, 4);
  },
  steps: (i, o) => [
    {
      label: 'Monthly growth rate',
      formula: i.compounding === 'continuously' ? 'm = e^(r ÷ 12) − 1' : 'm = (1 + r ÷ k)^(k ÷ 12) − 1, k = compounding periods per year',
      substituted: i.compounding === 'continuously' ? `m = e^(${num(i.rate / 100, 4)} ÷ 12) − 1` : `m = (1 + ${num(i.rate / 100, 4)} ÷ k)^(k ÷ 12) − 1`,
      result: num(o.monthlyRate, 7),
    },
    { label: 'Starting balance grows', formula: 'P × (1 + m)^(12 × years)', substituted: `${usd(i.principal)} × (1 + ${num(o.monthlyRate, 7)})^${i.years * 12}` },
    {
      label: 'Monthly deposits grow',
      formula: i.timing === 'start' ? 'D × ((1 + m)ⁿ − 1) ÷ m × (1 + m)' : 'D × ((1 + m)ⁿ − 1) ÷ m',
      substituted: `${usd(i.monthly)} × ((1 + ${num(o.monthlyRate, 7)})^${i.years * 12} − 1) ÷ ${num(o.monthlyRate, 7)}`,
    },
    { label: 'Final balance', formula: 'both parts added together', substituted: `${usd(o.totalContributed)} deposited + ${usd(o.totalInterest)} interest`, result: usd(o.balance, true) },
  ],
  answerSummary: (i, o) => `${usd(i.principal)} plus ${usd(i.monthly)} a month at ${pct(i.rate)} compounded ${FREQ[i.compounding]} grows to ${usd(o.balance)} in ${i.years} years, including ${usd(o.totalInterest)} of interest.`,
  ogValue: (_i, o) => usd(o.balance),
  related: ['investment-calculator', 'savings-goal-calculator', 'retirement-calculator', 'credit-card-payoff-calculator'],
  sources: [
    { title: 'SEC Investor.gov: Compound interest calculator', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
    { title: 'FDIC: National rates and rate caps', url: 'https://www.fdic.gov/national-rates-and-rate-caps' },
    { title: 'U.S. Treasury 3-month bill rate (via FRED, DTB3)', url: 'https://fred.stlouisfed.org/series/DTB3' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
