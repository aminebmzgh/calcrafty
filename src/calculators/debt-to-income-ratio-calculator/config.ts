import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeDti, type DtiInput, type DtiOutput } from './math.ts';

const BAND_LABEL = { good: 'Good', manageable: 'Manageable', high: 'High' } as const;

const config: CalculatorConfig<DtiInput, DtiOutput> = {
  slug: 'debt-to-income-ratio-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'Debt-to-Income Ratio Calculator',
  h1: 'Debt-to-Income Ratio Calculator',
  intro: 'Your front-end and back-end DTI, checked against conventional, FHA, VA and USDA lending guidelines.',
  metaTitle: 'Debt-to-Income Ratio Calculator (DTI) for Mortgages',
  metaDescription:
    'Calculate your front-end and back-end debt-to-income ratio and see if it meets conventional, FHA, VA or USDA limits, plus the largest housing payment you fit.',
  primaryKeyword: 'debt to income ratio calculator',
  secondaryKeywords: ['dti calculator', 'debt to income ratio for mortgage', 'calculate debt to income ratio'],
  synonyms: ['dti', 'debt ratio', 'front end ratio', 'back end ratio', 'mortgage qualification'],
  inputs: [
    { id: 'annualIncome', label: 'Gross annual income', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 1_000, sliderMin: 10_000, sliderMax: 400_000, helpText: 'Before tax, for everyone on the loan.' },
    { id: 'housing', label: 'Monthly housing payment', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 25, sliderMax: 8_000, helpText: 'Rent, or the mortgage payment with property tax, insurance, PMI and HOA dues.' },
    { id: 'autoLoans', label: 'Car payments', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 10, sliderMax: 2_000, group: 'debts1' },
    { id: 'studentLoans', label: 'Student loan payments', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 10, sliderMax: 2_000, group: 'debts1' },
    { id: 'creditCards', label: 'Credit card minimums', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 10, sliderMax: 2_000, group: 'debts2' },
    { id: 'otherDebts', label: 'Other debt payments', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 10, sliderMax: 3_000, group: 'debts2', helpText: 'Personal loans, child support, alimony.' },
    {
      id: 'loanType',
      label: 'Compare with',
      type: 'segmented',
      options: [
        { value: 'conventional', label: 'Conventional' },
        { value: 'fha', label: 'FHA' },
        { value: 'va', label: 'VA' },
        { value: 'usda', label: 'USDA' },
      ],
    },
  ],
  defaults: { annualIncome: 84_000, housing: 1_800, autoLoans: 450, studentLoans: 250, creditCards: 120, otherDebts: 0, loanType: 'conventional' },
  compute: computeDti,
  summarize: (_i, o) => ({
    headline: { label: 'Debt-to-income ratio', value: pct(o.backEnd, 1), sub: `${BAND_LABEL[o.band]}: ${usd(o.totalDebts)} of ${usd(o.monthlyIncome)} a month`, raw: o.backEnd, better: 'lower' },
    items: [
      { label: 'Front-end (housing) ratio', value: pct(o.frontEnd, 1), raw: o.frontEnd, better: 'lower' },
      { label: `${o.limits.name} guideline`, value: o.limits.front === null ? `${o.limits.back}% back-end` : `${o.limits.front}% / ${o.limits.back}%` },
      { label: `Largest housing payment at ${o.limits.back}%`, value: usd(o.maxHousing), raw: o.maxHousing, better: 'higher' },
      { label: 'Monthly debt to cut to qualify', value: usd(o.reductionNeeded), raw: o.reductionNeeded, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.monthlyIncome <= 0) return ['Enter your gross income to see your ratios.'];
    const s = [`${usd(o.totalDebts)} of monthly debt payments on ${usd(o.monthlyIncome)} of gross monthly income gives a debt-to-income ratio of ${pct(o.backEnd, 1)}; housing alone is ${pct(o.frontEnd, 1)}.`];
    const front = o.limits.front === null ? '' : ` and ${o.meetsFront ? 'meets' : 'is above'} the ${o.limits.front}% housing guideline`;
    s.push(
      o.meetsBack
        ? `That’s within the ${o.limits.name} guideline of ${o.limits.back}% for total debt${front}.`
        : `That’s above the ${o.limits.name} guideline of ${o.limits.back}%${front}. Cutting ${usd(o.reductionNeeded)} a month of payments, or raising income, would bring you within it; lenders can also approve higher ratios with strong credit or savings.`,
    );
    if (i.creditCards > 0 && !o.meetsBack) s.push('Paying off a small card or loan entirely removes its whole payment from the ratio, which often helps more than spreading the same money across several debts.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Gross monthly income', formula: 'annual income ÷ 12', substituted: `${usd(i.annualIncome)} ÷ 12`, result: usd(o.monthlyIncome, true) },
    {
      label: 'Total monthly debts',
      formula: 'housing + car + student loans + card minimums + other',
      substituted: `${usd(i.housing)} + ${usd(i.autoLoans)} + ${usd(i.studentLoans)} + ${usd(i.creditCards)} + ${usd(i.otherDebts)}`,
      result: usd(o.totalDebts),
    },
    { label: 'Front-end ratio', formula: 'housing ÷ monthly income × 100', substituted: `${usd(i.housing)} ÷ ${usd(o.monthlyIncome, true)} × 100`, result: pct(o.frontEnd) },
    { label: 'Back-end ratio (DTI)', formula: 'total debts ÷ monthly income × 100', substituted: `${usd(o.totalDebts)} ÷ ${usd(o.monthlyIncome, true)} × 100`, result: pct(o.backEnd) },
    {
      label: 'Largest housing payment',
      formula: `monthly income × ${o.limits.back}% − other debts`,
      substituted: `${usd(o.monthlyIncome, true)} × ${o.limits.back}% − ${usd(o.nonHousingDebts)}`,
      result: usd(o.maxHousing),
    },
  ],
  answerSummary: (_i, o) =>
    `With ${usd(o.totalDebts)} of monthly debt payments on ${usd(o.monthlyIncome)} of gross monthly income, your debt-to-income ratio is ${pct(o.backEnd, 1)} and your housing ratio is ${pct(o.frontEnd, 1)}.`,
  ogValue: (_i, o) => `${pct(o.backEnd, 1)} DTI`,
  related: ['mortgage-affordability-calculator', 'mortgage-calculator', 'debt-payoff-calculator', 'paycheck-calculator', 'apr-calculator'],
  sources: [
    { title: 'CFPB: What is a debt-to-income ratio?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-why-is-the-43-debt-to-income-ratio-important-en-1791/' },
    { title: 'Fannie Mae Selling Guide B3-6-02: Debt-to-Income Ratios', url: 'https://selling-guide.fanniemae.com/sel/b3-6-02/debt-income-ratios' },
    { title: 'HUD Handbook 4000.1: FHA Single Family Housing Policy', url: 'https://www.hud.gov/hud-partners/single-family-handbook-4000-1' },
    { title: 'VA Lenders Handbook (VA Pamphlet 26-7), Chapter 4: Credit Underwriting', url: 'https://www.benefits.va.gov/WARMS/pam26_7.asp' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
