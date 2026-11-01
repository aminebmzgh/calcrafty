import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeAffordability, type AffordabilityInput, type AffordabilityOutput } from './math.ts';

const config: CalculatorConfig<AffordabilityInput, AffordabilityOutput> = {
  slug: 'mortgage-affordability-calculator',
  category: 'finance',
  subtopic: 'Home buying',
  name: 'Mortgage Affordability Calculator',
  h1: 'Mortgage Affordability Calculator',
  intro: 'The home price your income supports under lender debt-to-income rules, with taxes, insurance and today’s rate.',
  metaTitle: 'Home Affordability Calculator: How Much House?',
  metaDescription:
    'See how much house you can afford from your income, debts and down payment. Uses lender 28/36 debt-to-income rules, today’s mortgage rate, taxes and insurance.',
  primaryKeyword: 'mortgage affordability calculator',
  secondaryKeywords: ['home affordability calculator', 'house affordability calculator', 'how much mortgage can i afford'],
  synonyms: ['afford', 'dti', 'debt to income', 'how much house', 'pre-approval', 'budget'],
  inputs: [
    { id: 'annualIncome', label: 'Household income', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 1000, sliderMax: 400_000, helpText: 'Gross yearly income before taxes, for everyone on the loan.' },
    { id: 'monthlyDebts', label: 'Monthly debt payments', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 25, sliderMax: 5_000, helpText: 'Car, student loan and minimum card payments. Not rent, utilities or groceries.' },
    { id: 'downPayment', label: 'Down payment', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 1000, sliderMax: 300_000 },
    { id: 'interestRate', label: 'Interest rate', type: 'number', unit: 'percent', min: 0, max: 30, step: 0.01, sliderMax: 12, liveDefault: 'mortgage30', group: 'loan' },
    {
      id: 'termYears',
      label: 'Loan term',
      type: 'select',
      group: 'loan',
      options: [
        { value: '30', label: '30 years' },
        { value: '20', label: '20 years' },
        { value: '15', label: '15 years' },
      ],
    },
    { id: 'propertyTaxRate', label: 'Property tax', type: 'number', unit: 'percent', min: 0, max: 5, step: 0.01, sliderMax: 3, group: 'escrow', helpText: 'Per year, % of price.' },
    { id: 'homeInsurance', label: 'Home insurance', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 50, sliderMax: 10_000, group: 'escrow', helpText: 'Per year.' },
    { id: 'hoa', label: 'HOA dues', type: 'number', unit: 'usd', min: 0, max: 10_000, step: 10, sliderMax: 1_000, advanced: true, group: 'adv1', helpText: 'Per month.' },
    { id: 'pmiRate', label: 'PMI rate', type: 'number', unit: 'percent', min: 0, max: 3, step: 0.05, sliderMax: 2, advanced: true, group: 'adv1', helpText: 'Per year, charged when the down payment is under 20%.' },
    { id: 'frontRatio', label: 'Max housing ratio', type: 'number', unit: 'percent', min: 10, max: 60, step: 1, sliderMax: 50, advanced: true, group: 'adv2', helpText: 'Housing payment ÷ gross income. 28% is the traditional guideline.' },
    { id: 'backRatio', label: 'Max total debt ratio', type: 'number', unit: 'percent', min: 10, max: 65, step: 1, sliderMax: 55, advanced: true, group: 'adv2', helpText: 'All debts ÷ gross income. 36% is traditional; some loans allow up to 43%–50%.' },
  ],
  defaults: {
    annualIncome: 100_000,
    monthlyDebts: 500,
    downPayment: 50_000,
    interestRate: 6.5,
    termYears: 30,
    propertyTaxRate: 0.9,
    homeInsurance: 2_000,
    hoa: 0,
    pmiRate: 0.6,
    frontRatio: 28,
    backRatio: 36,
  },
  compute: computeAffordability,
  summarize: (_i, o) => ({
    headline: { label: 'You can afford a home up to', value: usd(o.maxPrice), sub: `${usd(o.payment.total, true)} a month all-in`, raw: o.maxPrice, better: 'higher' },
    items: [
      { label: 'Loan amount', value: usd(o.loanAmount), raw: o.loanAmount },
      { label: 'Principal & interest', value: usd(o.payment.pi, true), raw: o.payment.pi },
      { label: 'Taxes, insurance, PMI, HOA', value: usd(o.payment.nonPI, true), raw: o.payment.nonPI },
      { label: 'Housing ratio (front-end)', value: pct(o.frontDti, 1), raw: o.frontDti, better: 'lower' },
      { label: 'Total debt ratio (back-end)', value: pct(o.backDti, 1), raw: o.backDti, better: 'lower' },
      { label: 'Down payment', value: pct(o.downPaymentPct, 1), raw: o.downPaymentPct },
    ],
  }),
  explain: (i, o) => {
    if (o.limitedBy === 'none') return [`Your monthly debts of ${usd(i.monthlyDebts)} already use up the ${pct(i.backRatio, 0)} total-debt limit on ${usd(o.monthlyIncome)} of monthly income, so lenders wouldn’t approve a mortgage until those debts fall.`];
    const s = [
      `On ${usd(o.monthlyIncome)} a month before tax, lenders’ ${pct(i.frontRatio, 0)}/${pct(i.backRatio, 0)} rules allow a housing payment up to ${usd(o.housingLimit, true)}, which buys a home of about ${usd(o.maxPrice)} with ${usd(i.downPayment)} down.`,
      o.limitedBy === 'back'
        ? `Your existing debts are the limit: ${usd(i.monthlyDebts)} a month counts against the ${pct(i.backRatio, 0)} total-debt ratio. Paying one off would raise your budget.`
        : `The housing ratio is the limit, not your other debts; you have ${usd(o.headroom, true)} a month of room under the total-debt ratio.`,
    ];
    if (o.payment.pmi > 0) s.push(`With ${pct(o.downPaymentPct, 1)} down, the payment includes ${usd(o.payment.pmi, true)} a month of PMI.`);
    s.push('This is the most a lender might approve, not a budget. Make sure the payment leaves room for savings and everyday costs.');
    return s.slice(0, 4);
  },
  steps: (i, o) => [
    { label: 'Monthly income', formula: 'annual income ÷ 12', substituted: `${usd(i.annualIncome)} ÷ 12`, result: usd(o.monthlyIncome, true) },
    { label: 'Housing limit (front-end)', formula: 'income × housing ratio', substituted: `${usd(o.monthlyIncome, true)} × ${pct(i.frontRatio, 0)}`, result: usd(o.frontLimit, true) },
    { label: 'Housing limit (back-end)', formula: 'income × total debt ratio − other debts', substituted: `${usd(o.monthlyIncome, true)} × ${pct(i.backRatio, 0)} − ${usd(i.monthlyDebts)}`, result: usd(o.backLimit, true) },
    {
      label: 'Highest price that fits',
      formula: 'largest price where P&I + tax + insurance + PMI + HOA ≤ the lower limit',
      substituted: `${usd(o.payment.pi, true)} + ${usd(o.payment.tax, true)} + ${usd(o.payment.insurance, true)} + ${usd(o.payment.pmi, true)} + ${usd(o.payment.hoa, true)}`,
      result: `${usd(o.payment.total, true)} → ${usd(o.maxPrice)}`,
    },
  ],
  answerSummary: (i, o) => `With ${usd(i.annualIncome)} of household income, ${usd(i.monthlyDebts)} a month in other debts and ${usd(i.downPayment)} down, you can afford a home up to about ${usd(o.maxPrice)} at ${pct(i.interestRate)} under the ${pct(i.frontRatio, 0)}/${pct(i.backRatio, 0)} rule.`,
  ogValue: (_i, o) => usd(o.maxPrice),
  related: ['mortgage-calculator', 'rent-vs-buy-calculator', 'savings-goal-calculator', 'paycheck-calculator', 'debt-payoff-calculator'],
  sources: [
    { title: 'CFPB: What is a debt-to-income ratio?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/' },
    { title: 'Fannie Mae Selling Guide: Debt-to-income ratios (B3-6-02)', url: 'https://selling-guide.fanniemae.com/sel/b3-6-02/debt-income-ratios' },
    { title: 'Freddie Mac Primary Mortgage Market Survey (via FRED, MORTGAGE30US)', url: 'https://fred.stlouisfed.org/series/MORTGAGE30US' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
