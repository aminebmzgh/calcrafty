import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computeEmergency, type EmergencyInput, type EmergencyOutput } from './math.ts';

const config: CalculatorConfig<EmergencyInput, EmergencyOutput> = {
  slug: 'emergency-fund-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'Emergency Fund Calculator',
  h1: 'Emergency Fund Calculator',
  intro: 'How big your emergency fund should be, how many months your savings already cover, and how long it takes to get there.',
  metaTitle: 'Emergency Fund Calculator: How Much Do You Need?',
  metaDescription:
    'Work out your emergency fund target from your essential monthly expenses, see how many months your savings cover now, and how long it takes to reach the goal.',
  primaryKeyword: 'emergency fund calculator',
  secondaryKeywords: ['how much emergency fund do i need', 'rainy day fund calculator', 'emergency savings calculator', 'how many months of expenses to save'],
  synonyms: ['rainy day fund', 'emergency savings', 'safety net', '3 to 6 months expenses', 'cash cushion'],
  inputs: [
    { id: 'essentials', label: 'Essential monthly expenses', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 50, sliderMax: 15_000, helpText: 'Housing, utilities, food, insurance, transport, childcare and minimum debt payments.' },
    { id: 'months', label: 'Months to cover', type: 'number', unit: 'months', min: 1, max: 24, step: 1, integer: true, sliderMax: 12, helpText: '3 to 6 is a common guideline; 6 to 12 if your income is irregular or you are the only earner.' },
    { id: 'saved', label: 'Already saved', type: 'number', unit: 'usd', min: 0, max: 10_000_000, step: 100, sliderMax: 50_000 },
    { id: 'monthlySaving', label: 'You can save each month', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 25, sliderMax: 3_000 },
    { id: 'rate', label: 'Savings account rate', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.01, sliderMax: 8, liveDefault: 'savingsRate' },
    { id: 'deadlineMonths', label: 'Goal date (months from now)', type: 'number', unit: 'months', min: 1, max: 240, step: 1, integer: true, sliderMax: 60, advanced: true },
  ],
  defaults: { essentials: 3_500, months: 6, saved: 2_000, monthlySaving: 400, rate: 4, deadlineMonths: 24 },
  compute: computeEmergency,
  summarize: (i, o) => ({
    headline: { label: 'Emergency fund target', value: usd(o.target), sub: `${num(i.months, 0)} months × ${usd(i.essentials)} of essentials`, raw: o.target },
    items: [
      { label: 'Your savings cover', value: `${num(o.coveredMonths, 1)} months (${pct(o.progress, 0)})`, raw: o.coveredMonths, better: 'higher' },
      { label: 'Still to save', value: usd(o.gap), raw: o.gap, better: 'lower' },
      { label: `Time to reach it at ${usd(i.monthlySaving)} a month`, value: o.monthsToGoal === null ? 'Not at this rate' : o.monthsToGoal === 0 ? 'Already there' : duration(o.monthsToGoal), raw: o.monthsToGoal ?? undefined, better: 'lower' },
      { label: `Monthly saving to finish in ${duration(i.deadlineMonths)}`, value: usd(o.neededForDeadline, true), raw: o.neededForDeadline, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (i.essentials <= 0) return ['Enter your essential monthly expenses to see a target.'];
    if (o.gap === 0) return [`Your ${usd(i.saved)} already covers ${num(o.coveredMonths, 1)} months of essentials, more than your ${num(i.months, 0)}-month target. Keep it somewhere safe and easy to reach, and direct new savings to other goals.`];
    const s = [`Covering ${num(i.months, 0)} months of ${usd(i.essentials)} in essential costs takes ${usd(o.target)}. Your ${usd(i.saved)} covers about ${num(o.coveredMonths, 1)} months so far.`];
    s.push(
      o.monthsToGoal === null
        ? 'At your current monthly saving you won’t reach the target; even a small regular amount gets you moving.'
        : `Saving ${usd(i.monthlySaving)} a month in an account paying ${pct(i.rate)}, you'll reach it in ${duration(o.monthsToGoal)}. To finish in ${duration(i.deadlineMonths)}, save ${usd(o.neededForDeadline, true)} a month.`,
    );
    s.push('A first milestone of one month of expenses, or $1,000, already covers many common emergencies, so celebrate it and keep going.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Target', formula: 'essential monthly expenses × months', substituted: `${usd(i.essentials)} × ${num(i.months, 0)}`, result: usd(o.target) },
    { label: 'Gap', formula: 'target − already saved', substituted: `${usd(o.target)} − ${usd(i.saved)}`, result: usd(o.gap) },
    { label: 'Months covered now', formula: 'already saved ÷ monthly essentials', substituted: `${usd(i.saved)} ÷ ${usd(i.essentials)}`, result: num(o.coveredMonths, 1) },
    {
      label: 'Time to reach the target',
      formula: 'each month: balance + interest + deposit, until balance ≥ target',
      substituted: `${usd(i.saved)} growing at ${pct(i.rate)}, plus ${usd(i.monthlySaving)} a month`,
      result: o.monthsToGoal === null ? 'never' : duration(o.monthsToGoal),
    },
  ],
  answerSummary: (i, o) =>
    `With ${usd(i.essentials)} of essential monthly expenses, a ${num(i.months, 0)}-month emergency fund is ${usd(o.target)}; your savings cover ${num(o.coveredMonths, 1)} months so far.`,
  ogValue: (_i, o) => usd(o.target),
  related: ['savings-goal-calculator', 'paycheck-calculator', 'debt-payoff-calculator', 'cd-calculator', 'compound-interest-calculator'],
  sources: [
    { title: 'CFPB: An essential guide to building an emergency fund', url: 'https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/' },
    { title: 'Federal Reserve: Economic Well-Being of U.S. Households (emergency expense survey)', url: 'https://www.federalreserve.gov/consumerscommunities/shed.htm' },
    { title: 'FDIC: Deposit insurance', url: 'https://www.fdic.gov/resources/deposit-insurance/' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
