import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computeLoan, convertTerm, monthlyRateOf, type LoanInput, type LoanOutput } from './math.ts';

const config: CalculatorConfig<LoanInput, LoanOutput> = {
  slug: 'loan-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'Loan Calculator',
  h1: 'Loan Calculator',
  intro: 'The monthly payment, total interest and payoff schedule for any fixed-rate loan, including extra payments.',
  metaTitle: 'Loan Calculator: Monthly Payment & Total Interest',
  metaDescription:
    'Free loan calculator: find the monthly payment and total interest on a personal or other fixed-rate loan, see the amortization schedule and what extra payments save.',
  primaryKeyword: 'loan calculator',
  secondaryKeywords: ['personal loan calculator', 'loan payment calculator', 'emi calculator', 'monthly payment calculator'],
  synonyms: ['emi', 'installment', 'personal loan', 'amortization', 'borrow', 'payment'],
  inputs: [
    { id: 'amount', label: 'Loan amount', type: 'number', unit: 'usd', min: 100, max: 50_000_000, step: 100, sliderMin: 1_000, sliderMax: 100_000 },
    { id: 'interestRate', label: 'Interest rate (APR)', type: 'number', unit: 'percent', min: 0, max: 100, step: 0.01, sliderMax: 36, liveDefault: 'personalLoan24' },
    {
      id: 'term',
      label: 'Loan term',
      type: 'number',
      unit: 'years',
      min: 1,
      max: 50,
      step: 1,
      integer: false,
      unitToggle: {
        id: 'termUnit',
        label: 'Term unit',
        options: [
          { value: 'years', label: 'Years', unit: 'years', min: 0.25, max: 50, step: 0.5, sliderMax: 10 },
          { value: 'months', label: 'Months', unit: 'months', min: 1, max: 600, step: 1, sliderMax: 120 },
        ],
        convert: (v, from, to) => convertTerm(v, from, to),
      },
    },
    { id: 'extraMonthly', label: 'Extra payment per month', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 10, sliderMax: 1000, advanced: true, helpText: 'Paid toward principal every month. Check your loan has no prepayment penalty.' },
  ],
  defaults: { amount: 15_000, interestRate: 12, term: 3, termUnit: 'years', extraMonthly: 0 },
  compute: computeLoan,
  summarize: (_i, o) => ({
    headline: { label: 'Monthly payment', value: usd(o.payment, true), sub: `for ${duration(o.months)}`, raw: o.payment, better: 'lower' },
    items: [
      { label: 'Total interest', value: usd(o.totalInterest, true), raw: o.totalInterest, better: 'lower' },
      { label: 'Total of payments', value: usd(o.totalPaid, true), raw: o.totalPaid, better: 'lower' },
      { label: 'Paid off in', value: duration(o.payoffMonths), raw: o.payoffMonths, better: 'lower' },
      { label: 'Interest as % of loan', value: pct(o.interestPct, 1), raw: o.interestPct, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (i.amount <= 0) return [];
    const s = [`You’ll repay ${usd(o.totalPaid)} in total: the ${usd(i.amount)} you borrow plus ${usd(o.totalInterest)} in interest, which is ${pct(o.interestPct, 1)} of the loan.`];
    if (o.rows[0]) s.push(`Your first payment is ${usd(o.rows[0].interest, true)} interest and ${usd(o.rows[0].principal, true)} principal. As the balance falls, more of each payment goes to principal.`);
    if (i.extraMonthly > 0 && o.monthsSaved > 0) s.push(`Paying ${usd(i.extraMonthly)} extra each month saves ${usd(o.interestSaved)} and finishes ${duration(o.monthsSaved)} early.`);
    else s.push('A shorter term raises the payment but cuts total interest; a longer one does the opposite. Try both with Add to compare.');
    return s;
  },
  steps: (i, o) => {
    const r = monthlyRateOf(i.interestRate);
    return [
      { label: 'Monthly interest rate', formula: 'r = APR ÷ 12', substituted: `r = ${pct(i.interestRate, 3)} ÷ 12`, result: num(r, 6) },
      { label: 'Number of payments', formula: 'n = term in months', substituted: `n = ${o.months}`, result: String(o.months) },
      {
        label: 'Monthly payment',
        formula: r === 0 ? 'M = P ÷ n' : 'M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)',
        substituted: r === 0 ? `M = ${usd(i.amount)} ÷ ${o.months}` : `M = ${usd(i.amount)} × ${num(r, 6)}(1 + ${num(r, 6)})^${o.months} ÷ ((1 + ${num(r, 6)})^${o.months} − 1)`,
        result: usd(o.payment, true),
      },
      { label: 'Total interest', formula: 'sum of each month’s interest (balance × r, rounded to the cent)', substituted: `${o.payoffMonths} payments`, result: usd(o.totalInterest, true) },
    ];
  },
  answerSummary: (i, o) => `A ${usd(i.amount)} loan at ${pct(i.interestRate)} APR for ${duration(o.months)} costs ${usd(o.payment, true)} a month, with ${usd(o.totalInterest)} in total interest.`,
  ogValue: (_i, o) => `${usd(o.payment)}/mo`,
  related: ['debt-payoff-calculator', 'credit-card-payoff-calculator', 'auto-loan-calculator', 'paycheck-calculator', 'mortgage-calculator'],
  sources: [
    { title: 'Federal Reserve G.19 Consumer Credit: personal loan rates (via FRED, TERMCBPER24NS)', url: 'https://fred.stlouisfed.org/series/TERMCBPER24NS' },
    { title: 'CFPB: What is the difference between a loan interest rate and the APR?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-loan-interest-rate-and-the-apr-en-733/' },
    { title: 'CFPB: Truth in Lending Act (Regulation Z)', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
