import type { CalculatorConfig } from '../../lib/types.ts';
import { num, pct, usd } from '../../lib/format.ts';
import { computeSimple, type SimpleInput, type SimpleOutput } from './math.ts';

const TIME_LABEL = { years: 'years', months: 'months', days: 'days' } as const;

const config: CalculatorConfig<SimpleInput, SimpleOutput> = {
  slug: 'simple-interest-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'Simple Interest Calculator',
  h1: 'Simple Interest Calculator',
  intro: 'Interest with I = Prt, or solve for the principal, rate or time, with days counted on a 365- or 360-day year.',
  metaTitle: 'Simple Interest Calculator (I = Prt): Solve Any Value',
  metaDescription:
    'Calculate simple interest with I = Prt, or solve for the principal, rate or time. Enter time in years, months or days, on an actual/365 or actual/360 basis.',
  primaryKeyword: 'simple interest calculator',
  secondaryKeywords: ['simple interest formula calculator', 'i = prt calculator', 'calculate simple interest', 'simple interest rate calculator'],
  synonyms: ['i=prt', 'flat interest', 'interest on principal', 'banker’s rule', 'actual/360'],
  inputs: [
    {
      id: 'solveFor',
      label: 'Solve for',
      type: 'segmented',
      options: [
        { value: 'interest', label: 'Interest' },
        { value: 'principal', label: 'Principal' },
        { value: 'rate', label: 'Rate' },
        { value: 'time', label: 'Time' },
      ],
    },
    { id: 'principal', label: 'Principal', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 100, sliderMax: 200_000, showIf: (i) => i.solveFor !== 'principal' },
    { id: 'interest', label: 'Interest earned or paid', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 1, sliderMax: 50_000, showIf: (i) => i.solveFor !== 'interest' },
    { id: 'rate', label: 'Annual interest rate', type: 'number', unit: 'percent', min: 0, max: 100, step: 0.01, sliderMax: 25, showIf: (i) => i.solveFor !== 'rate' },
    { id: 'time', label: 'Time', type: 'number', unit: 'none', min: 0, max: 100_000, step: 1, slider: false, group: 'time', showIf: (i) => i.solveFor !== 'time' },
    {
      id: 'timeUnit',
      label: 'Unit',
      type: 'select',
      group: 'time',
      showIf: (i) => i.solveFor !== 'time',
      options: [
        { value: 'years', label: 'years' },
        { value: 'months', label: 'months' },
        { value: 'days', label: 'days' },
      ],
    },
    {
      id: 'dayCount',
      label: 'Day count for days',
      type: 'segmented',
      advanced: true,
      helpText: 'Actual/360 (the "banker’s rule") divides days by 360 and gives slightly more interest.',
      options: [
        { value: '365', label: 'Actual/365' },
        { value: '360', label: 'Actual/360' },
      ],
    },
  ],
  defaults: { solveFor: 'interest', principal: 5_000, rate: 4, time: 3, timeUnit: 'years', interest: 600, dayCount: '365' },
  compute: computeSimple,
  summarize: (i, o) => {
    const headline =
      i.solveFor === 'principal'
        ? { label: 'Principal', value: usd(o.principal, true), raw: o.principal }
        : i.solveFor === 'rate'
          ? { label: 'Annual interest rate', value: pct(o.rate, 3), raw: o.rate }
          : i.solveFor === 'time'
            ? { label: 'Time', value: `${num(o.years, 2)} years`, raw: o.years }
            : { label: 'Interest', value: usd(o.interest, true), raw: o.interest };
    return {
      headline: o.valid ? { ...headline, sub: `I = P × r × t` } : { label: 'Not enough information', value: '—', sub: 'This combination of inputs has no answer.' },
      items: [
        { label: 'Principal', value: usd(o.principal, true), raw: o.principal },
        { label: 'Interest', value: usd(o.interest, true), raw: o.interest },
        { label: 'Total (principal + interest)', value: usd(o.total, true), raw: o.total },
        { label: 'Rate and time', value: `${pct(o.rate, 3)} for ${num(o.years, 4)} years` },
      ],
    };
  },
  explain: (i, o) => {
    if (!o.valid) return ['To solve for this value, the other inputs must be above zero: for example, you can’t find the time needed at a 0% rate.'];
    const s = [`${usd(o.principal, true)} at ${pct(o.rate, 3)} simple interest for ${num(o.years, 4)} years earns ${usd(o.interest, true)}, for a total of ${usd(o.total, true)}.`];
    if (i.timeUnit === 'days' && i.solveFor !== 'time') s.push(`Days are converted to years using a ${i.dayCount}-day year (actual/${i.dayCount}).`);
    s.push('Simple interest never earns interest on interest. Most savings accounts compound, so over long periods they earn more than this.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Time in years', formula: i.timeUnit === 'months' ? 'months ÷ 12' : i.timeUnit === 'days' ? `days ÷ ${i.dayCount}` : 'years', substituted: `${num(i.time, 2)} ${TIME_LABEL[i.timeUnit]}`, result: `${num(o.years, 4)} years` },
    i.solveFor === 'principal'
      ? { label: 'Principal', formula: 'P = I ÷ (r × t)', substituted: `${usd(i.interest, true)} ÷ (${pct(i.rate)} × ${num(o.years, 4)})`, result: usd(o.principal, true) }
      : i.solveFor === 'rate'
        ? { label: 'Rate', formula: 'r = I ÷ (P × t)', substituted: `${usd(i.interest, true)} ÷ (${usd(i.principal, true)} × ${num(o.years, 4)})`, result: pct(o.rate, 3) }
        : i.solveFor === 'time'
          ? { label: 'Time', formula: 't = I ÷ (P × r)', substituted: `${usd(i.interest, true)} ÷ (${usd(i.principal, true)} × ${pct(i.rate)})`, result: `${num(o.years, 4)} years` }
          : { label: 'Interest', formula: 'I = P × r × t', substituted: `${usd(i.principal, true)} × ${pct(i.rate)} × ${num(o.years, 4)}`, result: usd(o.interest, true) },
    { label: 'Total', formula: 'A = P + I = P × (1 + r × t)', substituted: `${usd(o.principal, true)} + ${usd(o.interest, true)}`, result: usd(o.total, true) },
  ],
  answerSummary: (_i, o) => `${usd(o.principal, true)} at ${pct(o.rate, 3)} simple interest for ${num(o.years, 4)} years earns ${usd(o.interest, true)}, for a total of ${usd(o.total, true)}.`,
  ogValue: (_i, o) => usd(o.interest, true),
  related: ['compound-interest-calculator', 'cd-calculator', 'loan-calculator', 'auto-loan-calculator', 'percentage-calculator'],
  sources: [
    { title: 'Investor.gov: Compound interest calculator and the difference from simple interest', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
    { title: 'CFPB: Regulation Z, Appendix J (actuarial method and interest computation)', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/j/' },
    { title: 'TreasuryDirect: Treasury bills (discount and investment rate calculations)', url: 'https://www.treasurydirect.gov/marketable-securities/treasury-bills/' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
