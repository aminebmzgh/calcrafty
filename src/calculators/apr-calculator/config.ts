import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computeApr, feesTooLarge, type AprInput, type AprOutput } from './math.ts';
import { monthlyRate } from '../../lib/math/money.ts';

const config: CalculatorConfig<AprInput, AprOutput> = {
  slug: 'apr-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'APR Calculator',
  h1: 'APR Calculator',
  intro: 'The true yearly cost of a loan, with origination fees and points included, calculated the way lenders must disclose it.',
  metaTitle: 'APR Calculator: True Loan Cost Including Fees',
  metaDescription:
    'Find the real APR of a loan with origination fees and points included, using the same method lenders must use. Compare APR with the interest rate in seconds.',
  primaryKeyword: 'apr calculator',
  secondaryKeywords: ['loan apr calculator', 'calculate apr with fees', 'true apr calculator', 'annual percentage rate calculator'],
  synonyms: ['annual percentage rate', 'origination fee', 'points', 'finance charge', 'true cost of loan'],
  inputs: [
    { id: 'loanAmount', label: 'Loan amount', type: 'number', unit: 'usd', min: 100, max: 50_000_000, step: 100, sliderMin: 1_000, sliderMax: 500_000 },
    { id: 'interestRate', label: 'Interest rate', type: 'number', unit: 'percent', min: 0, max: 40, step: 0.01, sliderMax: 25, helpText: 'The note rate on the loan offer, before fees.' },
    { id: 'termMonths', label: 'Loan term', type: 'number', unit: 'months', min: 1, max: 480, step: 1, sliderMax: 360, integer: true },
    {
      id: 'fees',
      label: 'Fees and points',
      type: 'number',
      unit: 'usd',
      min: 0,
      max: 5_000_000,
      step: 25,
      sliderMax: 15_000,
      helpText: 'Origination fees, discount points and other charges the lender requires. Leave out third-party costs such as appraisal or title insurance.',
    },
    {
      id: 'feeMode',
      label: 'How the fees are paid',
      type: 'segmented',
      options: [
        { value: 'upfront', label: 'Upfront or deducted' },
        { value: 'financed', label: 'Added to the loan' },
      ],
    },
  ],
  defaults: { loanAmount: 20_000, interestRate: 7, termMonths: 60, fees: 600, feeMode: 'upfront' },
  validate: (i) => (feesTooLarge(i) ? [{ id: 'fees', message: 'Fees paid upfront must be less than the loan amount.' }] : []),
  compute: computeApr,
  summarize: (_i, o) => ({
    headline: { label: 'APR', value: pct(o.apr), sub: `${num(o.spread)} points above the interest rate`, raw: o.apr, better: 'lower' },
    items: [
      { label: 'Monthly payment', value: usd(o.payment, true), raw: o.payment, better: 'lower' },
      { label: 'Amount financed', value: usd(o.amountFinanced, true), raw: o.amountFinanced },
      { label: 'Finance charge (interest + fees)', value: usd(o.financeCharge, true), raw: o.financeCharge, better: 'lower' },
      { label: 'Total of payments', value: usd(o.totalOfPayments, true), raw: o.totalOfPayments, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.amountFinanced <= 0) return ['The fees are as large as the loan, so no credit is actually extended. Check the amounts.'];
    if (i.fees === 0) return [`With no fees, the APR is the same as the ${pct(i.interestRate)} interest rate: interest is the only cost of this loan.`];
    const s = [
      `The ${usd(i.fees)} in fees raises the yearly cost from ${pct(i.interestRate)} to an APR of ${pct(o.apr)}. In total you pay ${usd(o.financeCharge, true)} to borrow ${usd(o.amountFinanced)}: ${usd(o.totalInterest, true)} in interest plus the fees.`,
    ];
    if (i.termMonths <= 36) s.push('Fees weigh more on short loans: the same fee spread over fewer months raises the APR more. Compare offers by APR, not by rate alone.');
    else s.push('If you’ll repay or refinance early, the fees cost more per year than the APR shows, because the APR spreads them over the full term.');
    return s;
  },
  steps: (i, o) => {
    const r = monthlyRate(i.interestRate).toNumber();
    return [
      {
        label: 'Amount financed',
        formula: i.feeMode === 'financed' ? 'loan amount (the fees are added to the balance instead)' : 'loan amount − prepaid fees',
        substituted: i.feeMode === 'financed' ? `${usd(i.loanAmount)}; balance ${usd(i.loanAmount)} + ${usd(i.fees)} = ${usd(o.principal)}` : `${usd(i.loanAmount)} − ${usd(i.fees)}`,
        result: usd(o.amountFinanced, true),
      },
      {
        label: 'Monthly payment at the interest rate',
        formula: r === 0 ? 'M = P ÷ n' : 'M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), r = rate ÷ 12',
        substituted: r === 0 ? `M = ${usd(o.principal)} ÷ ${i.termMonths}` : `M = ${usd(o.principal)} × ${num(r, 6)}(1 + ${num(r, 6)})^${i.termMonths} ÷ ((1 + ${num(r, 6)})^${i.termMonths} − 1)`,
        result: usd(o.payment, true),
      },
      { label: 'Finance charge', formula: 'payment × n − amount financed', substituted: `${usd(o.payment, true)} × ${i.termMonths} − ${usd(o.amountFinanced, true)}`, result: usd(o.financeCharge, true) },
      {
        label: 'APR',
        formula: 'the rate a where amount financed = M × (1 − (1 + a/12)⁻ⁿ) ÷ (a/12), solved numerically',
        substituted: `${usd(o.amountFinanced, true)} = ${usd(o.payment, true)} × (1 − (1 + a/12)^−${i.termMonths}) ÷ (a/12)`,
        result: pct(o.apr),
      },
    ];
  },
  answerSummary: (i, o) =>
    `A ${usd(i.loanAmount)} loan at ${pct(i.interestRate)} for ${duration(i.termMonths)} with ${usd(i.fees)} in fees has an APR of ${pct(o.apr)} and a monthly payment of ${usd(o.payment, true)}.`,
  ogValue: (_i, o) => `${pct(o.apr)} APR`,
  related: ['loan-calculator', 'auto-loan-calculator', 'mortgage-calculator', 'credit-card-payoff-calculator', 'debt-to-income-ratio-calculator'],
  sources: [
    { title: 'CFPB: Regulation Z, 12 CFR 1026.22 (determination of annual percentage rate)', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/22/' },
    { title: 'CFPB: Regulation Z, Appendix J (annual percentage rate computations for closed-end credit)', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/j/' },
    { title: 'CFPB: What is the difference between a loan interest rate and the APR?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
