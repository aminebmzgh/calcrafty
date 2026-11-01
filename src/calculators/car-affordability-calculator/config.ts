import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computeCarAffordability, type CarAffordInput, type CarAffordOutput } from './math.ts';
import { monthlyRate } from '../../lib/math/money.ts';

const config: CalculatorConfig<CarAffordInput, CarAffordOutput> = {
  slug: 'car-affordability-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'Car Affordability Calculator',
  h1: 'How Much Car Can I Afford?',
  intro: 'The highest car price that fits your income, using the 20/4/10 guideline, today’s auto loan rate, tax and fees.',
  metaTitle: 'How Much Car Can I Afford? Car Affordability Calculator',
  metaDescription:
    'Find the most you should spend on a car from your income, down payment, trade-in and today’s auto loan rate, using the 20/4/10 rule with insurance and fuel.',
  primaryKeyword: 'how much car can i afford calculator',
  secondaryKeywords: ['car affordability calculator', 'how much car can i afford', 'car budget calculator', '20/4/10 rule calculator'],
  synonyms: ['car budget', 'afford a car', 'vehicle budget', '20 4 10 rule', 'car price from payment'],
  inputs: [
    { id: 'annualIncome', label: 'Gross annual income', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 1_000, sliderMin: 10_000, sliderMax: 300_000 },
    {
      id: 'budgetPct',
      label: 'Share of income for car costs',
      type: 'number',
      unit: 'percent',
      min: 1,
      max: 50,
      step: 0.5,
      sliderMax: 25,
      helpText: 'The 20/4/10 guideline keeps the payment, insurance and running costs under 10% of gross income.',
    },
    { id: 'runningCosts', label: 'Insurance, fuel and maintenance', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 10, sliderMax: 1_000, helpText: 'Per month, paid from the same budget.' },
    { id: 'downPayment', label: 'Down payment', type: 'number', unit: 'usd', min: 0, max: 5_000_000, step: 100, sliderMax: 40_000, group: 'cash' },
    { id: 'tradeIn', label: 'Trade-in (after payoff)', type: 'number', unit: 'usd', min: 0, max: 5_000_000, step: 100, sliderMax: 40_000, group: 'cash' },
    { id: 'interestRate', label: 'Interest rate (APR)', type: 'number', unit: 'percent', min: 0, max: 40, step: 0.01, sliderMax: 20, liveDefault: 'autoLoan60' },
    {
      id: 'termMonths',
      label: 'Loan term',
      type: 'segmented',
      options: [
        { value: '36', label: '36 mo' },
        { value: '48', label: '48 mo' },
        { value: '60', label: '60 mo' },
        { value: '72', label: '72 mo' },
      ],
    },
    { id: 'salesTaxRate', label: 'Sales tax', type: 'number', unit: 'percent', min: 0, max: 15, step: 0.05, sliderMax: 11, group: 'tax', advanced: true },
    { id: 'fees', label: 'Title, registration and fees', type: 'number', unit: 'usd', min: 0, max: 50_000, step: 25, sliderMax: 3_000, group: 'tax', advanced: true },
    { id: 'taxAfterTradeIn', label: 'My state taxes the price minus the trade-in', type: 'checkbox', advanced: true },
  ],
  defaults: { annualIncome: 75_000, budgetPct: 10, runningCosts: 200, downPayment: 5_000, tradeIn: 0, interestRate: 7.5, termMonths: 48, salesTaxRate: 6, taxAfterTradeIn: true, fees: 500 },
  compute: computeCarAffordability,
  summarize: (i, o) => ({
    headline: { label: 'Car price you can afford', value: usd(o.maxPrice), sub: `with a ${usd(o.payment, true)} payment for ${i.termMonths} months`, raw: o.maxPrice, better: 'higher' },
    items: [
      { label: 'Monthly car budget', value: usd(o.monthlyBudget, true), raw: o.monthlyBudget },
      { label: 'Loan amount', value: usd(o.loanAmount), raw: o.loanAmount },
      { label: 'Down payment and trade-in', value: `${usd(o.upfront)} (${pct(o.downPct, 1)})`, raw: o.downPct, better: 'higher' },
      { label: 'Total interest', value: usd(o.totalInterest, true), raw: o.totalInterest, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.monthlyBudget <= 0) return ['Enter your income to see your car budget.'];
    if (o.loanAmount <= 0) return [`Insurance and running costs of ${usd(i.runningCosts)} a month use up the whole ${usd(o.monthlyBudget)} budget, so there’s nothing left for a loan payment. Your down payment and trade-in alone cover a car of about ${usd(o.maxPrice)}.`];
    const s = [
      `${pct(i.budgetPct, 1)} of your gross income is ${usd(o.monthlyBudget)} a month for the car. After ${usd(i.runningCosts)} for insurance and running costs, ${usd(o.payment)} goes to the loan, which supports borrowing ${usd(o.loanAmount)} over ${duration(i.termMonths)}. With your cash up front, that’s a car of up to ${usd(o.maxPrice)} including tax and fees.`,
    ];
    if (o.downPct < 20) s.push(`Your down payment and trade-in are ${pct(o.downPct, 1)} of the price. The 20/4/10 guideline suggests 20%, which lowers the risk of owing more than the car is worth.`);
    if (i.termMonths > 48) s.push('A term longer than 4 years raises the price you can afford but adds interest, and cars lose value faster than a long loan is paid down.');
    return s;
  },
  steps: (i, o) => {
    const r = monthlyRate(i.interestRate).toNumber();
    return [
      { label: 'Monthly car budget', formula: 'annual income ÷ 12 × budget %', substituted: `${usd(i.annualIncome)} ÷ 12 × ${pct(i.budgetPct, 1)}`, result: usd(o.monthlyBudget, true) },
      { label: 'Available for the payment', formula: 'budget − insurance and running costs', substituted: `${usd(o.monthlyBudget, true)} − ${usd(i.runningCosts)}`, result: usd(o.available, true) },
      {
        label: 'Largest loan',
        formula: r === 0 ? 'payment × n' : 'payment × (1 − (1 + r)⁻ⁿ) ÷ r, r = APR ÷ 12',
        substituted: r === 0 ? `${usd(o.available, true)} × ${i.termMonths}` : `${usd(o.available, true)} × (1 − (1 + ${num(r, 6)})^−${i.termMonths}) ÷ ${num(r, 6)}`,
        result: usd(o.loanAmount),
      },
      {
        label: 'Highest price',
        formula: i.taxAfterTradeIn ? '(loan + down + trade-in × (1 + tax) − fees) ÷ (1 + tax)' : '(loan + down + trade-in − fees) ÷ (1 + tax)',
        substituted: i.taxAfterTradeIn
          ? `(${usd(o.loanAmount)} + ${usd(i.downPayment)} + ${usd(i.tradeIn)} × (1 + ${pct(i.salesTaxRate)}) − ${usd(i.fees)}) ÷ (1 + ${pct(i.salesTaxRate)})`
          : `(${usd(o.loanAmount)} + ${usd(i.downPayment)} + ${usd(i.tradeIn)} − ${usd(i.fees)}) ÷ (1 + ${pct(i.salesTaxRate)})`,
        result: usd(o.maxPrice),
      },
    ];
  },
  answerSummary: (i, o) =>
    `On ${usd(i.annualIncome)} a year, keeping car costs to ${pct(i.budgetPct, 1)} of income with ${usd(i.downPayment)} down and a ${i.termMonths}-month loan at ${pct(i.interestRate)}, you can afford a car of about ${usd(o.maxPrice)}.`,
  ogValue: (_i, o) => usd(o.maxPrice),
  related: ['auto-loan-calculator', 'paycheck-calculator', 'debt-to-income-ratio-calculator', 'savings-goal-calculator', 'apr-calculator'],
  sources: [
    { title: 'Federal Reserve G.19: new car loan rates at commercial banks (via FRED, RIFLPBCIANM60NM)', url: 'https://fred.stlouisfed.org/series/RIFLPBCIANM60NM' },
    { title: 'CFPB: Understanding auto loans', url: 'https://www.consumerfinance.gov/consumer-tools/auto-loans/' },
    { title: 'Bureau of Labor Statistics: Consumer Expenditure Survey (transportation spending)', url: 'https://www.bls.gov/cex/' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
