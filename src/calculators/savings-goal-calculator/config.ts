import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, pct, usd } from '../../lib/format.ts';
import { computeSavingsGoal, type SavingsGoalInput, type SavingsGoalOutput } from './math.ts';

const config: CalculatorConfig<SavingsGoalInput, SavingsGoalOutput> = {
  slug: 'savings-goal-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'Savings Goal Calculator',
  h1: 'Savings Goal Calculator',
  intro: 'How much to save each month to reach a goal by a date, or how long it takes at the amount you can afford.',
  metaTitle: 'Savings Goal Calculator: How Much to Save Each Month',
  metaDescription:
    'Free savings goal calculator: the monthly amount to reach a goal by a deadline, or how long it takes at your budget, with interest included and a yearly plan.',
  primaryKeyword: 'savings goal calculator',
  secondaryKeywords: ['savings calculator', 'how long to save calculator', 'monthly savings calculator'],
  synonyms: ['down payment', 'emergency fund', 'sinking fund', 'save', 'goal'],
  inputs: [
    { id: 'goal', label: 'Savings goal', type: 'number', unit: 'usd', min: 1, max: 100_000_000, step: 100, sliderMin: 500, sliderMax: 200_000 },
    { id: 'current', label: 'Saved so far', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 100, sliderMax: 100_000 },
    {
      id: 'mode',
      label: 'I want to know',
      type: 'segmented',
      options: [
        { value: 'deadline', label: 'How much to save' },
        { value: 'deposit', label: 'How long it takes' },
      ],
    },
    { id: 'years', label: 'Reach it in', type: 'number', unit: 'years', min: 0.25, max: 60, step: 0.25, sliderMax: 20, showIf: (i) => i.mode === 'deadline' },
    { id: 'monthly', label: 'I can save per month', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 10, sliderMax: 5_000, showIf: (i) => i.mode === 'deposit' },
    { id: 'rate', label: 'Interest rate', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.05, sliderMax: 10, liveDefault: 'savingsRate', helpText: 'Annual rate on your savings account, compounded daily.' },
  ],
  defaults: { goal: 10_000, current: 1_000, mode: 'deadline', years: 2, monthly: 300, rate: 4 },
  compute: computeSavingsGoal,
  summarize: (i, o) =>
    i.mode === 'deadline'
      ? {
          headline: { label: 'Save each month', value: usd(o.monthlyDeposit, true), sub: `about ${usd(o.weekly, true)} a week for ${duration(o.months)}`, raw: o.monthlyDeposit, better: 'lower' },
          items: [
            { label: 'You deposit', value: usd(o.totalDeposited), raw: o.totalDeposited },
            { label: 'Interest earned', value: usd(o.interestEarned), raw: o.interestEarned, better: 'higher' },
            { label: 'Final balance', value: usd(o.finalBalance), raw: o.finalBalance },
          ],
        }
      : {
          headline: { label: 'Time to reach your goal', value: o.reached ? duration(o.months) : 'Not reachable', sub: o.reached ? `saving ${usd(i.monthly)} a month` : 'Add a monthly deposit to reach it', raw: o.reached ? o.months : undefined, better: 'lower' },
          items: [
            { label: 'You deposit', value: usd(o.totalDeposited), raw: o.totalDeposited },
            { label: 'Interest earned', value: usd(o.interestEarned), raw: o.interestEarned, better: 'higher' },
            { label: 'Final balance', value: usd(o.finalBalance), raw: o.finalBalance },
          ],
        },
  explain: (i, o) => {
    if (i.current >= i.goal) return [`You’ve already reached your ${usd(i.goal)} goal.`];
    if (!o.reached) return ['With no monthly deposit and no interest, the balance never grows. Add a monthly amount to see how long your goal takes.'];
    const s = [
      i.mode === 'deadline'
        ? `Saving ${usd(o.monthlyDeposit, true)} a month gets you from ${usd(i.current)} to ${usd(i.goal)} in ${duration(o.months)}.`
        : `At ${usd(i.monthly)} a month you’ll reach ${usd(i.goal)} in ${duration(o.months)}.`,
    ];
    if (o.interestEarned > 0) s.push(`Interest at ${pct(i.rate)} adds ${usd(o.interestEarned)}, so you deposit ${usd(o.totalDeposited)} rather than the full amount.`);
    s.push('Setting up an automatic transfer on payday makes the plan stick.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Monthly interest rate', formula: 'm = (1 + rate ÷ 365)^(365 ÷ 12) − 1 (daily compounding)', substituted: `rate = ${pct(i.rate)}` },
    i.mode === 'deadline'
      ? { label: 'Monthly deposit', formula: 'PMT = (goal − saved × (1 + m)ⁿ) × m ÷ ((1 + m)ⁿ − 1)', substituted: `goal ${usd(i.goal)}, saved ${usd(i.current)}, n = ${o.months} months`, result: usd(o.monthlyDeposit, true) }
      : { label: 'Months to goal', formula: 'add one month of interest and the deposit until the balance reaches the goal', substituted: `${usd(i.current)} + ${usd(i.monthly)}/month`, result: o.reached ? duration(o.months) : 'never' },
    { label: 'Interest earned', formula: 'final balance − saved so far − deposits', substituted: `${usd(o.finalBalance)} − ${usd(i.current)} − ${usd(o.totalDeposited)}`, result: usd(o.interestEarned) },
  ],
  answerSummary: (i, o) => `To grow ${usd(i.current)} into ${usd(i.goal)} in ${duration(o.months)} at ${pct(i.rate)} interest, save ${usd(o.monthlyDeposit, true)} a month.`,
  ogValue: (_i, o) => `${usd(o.monthlyDeposit)}/mo`,
  related: ['compound-interest-calculator', 'mortgage-affordability-calculator', 'paycheck-calculator', 'investment-calculator'],
  sources: [
    { title: 'CFPB: An essential guide to building an emergency fund', url: 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/' },
    { title: 'FDIC: National rates and rate caps', url: 'https://www.fdic.gov/national-rates-and-rate-caps' },
    { title: 'U.S. Treasury 3-month bill rate (via FRED, DTB3)', url: 'https://fred.stlouisfed.org/series/DTB3' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
