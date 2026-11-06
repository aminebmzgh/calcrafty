import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computeAmortization, convertTerm, monthlyRateOf, type AmortizationInput, type AmortizationOutput } from './math.ts';

const config: CalculatorConfig<AmortizationInput, AmortizationOutput> = {
  slug: 'amortization-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'Amortization Calculator',
  h1: 'Amortization Calculator',
  intro: 'A dated, payment-by-payment amortization schedule for any fixed-rate loan, with monthly, yearly and one-time extra payments.',
  metaTitle: 'Amortization Calculator: Schedule With Dates & Extras',
  metaDescription:
    'Free amortization calculator: a payment-by-payment schedule with dates, the payoff date, and what monthly, yearly or lump-sum extra payments save in interest.',
  primaryKeyword: 'amortization calculator',
  secondaryKeywords: ['amortization schedule calculator', 'loan amortization calculator', 'amortization schedule with extra payments', 'amortization table'],
  synonyms: ['amortisation', 'payment schedule', 'principal and interest', 'payoff date', 'lump sum', 'extra payment'],
  inputs: [
    { id: 'amount', label: 'Loan amount', type: 'number', unit: 'usd', min: 100, max: 50_000_000, step: 1_000, sliderMin: 1_000, sliderMax: 1_000_000 },
    { id: 'interestRate', label: 'Interest rate', type: 'number', unit: 'percent', min: 0, max: 50, step: 0.01, sliderMax: 20, liveDefault: 'mortgage30' },
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
          { value: 'years', label: 'Years', unit: 'years', min: 0.25, max: 50, step: 1, sliderMax: 40 },
          { value: 'months', label: 'Months', unit: 'months', min: 1, max: 600, step: 1, sliderMax: 480 },
        ],
        convert: (v, from, to) => convertTerm(v, from, to),
      },
    },
    { id: 'startDate', label: 'First payment date', type: 'date', min: '1950-01-01', max: '2100-12-31', helpText: 'Leave empty to start on the first of next month.' },
    { id: 'extraMonthly', label: 'Extra every month', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 25, sliderMax: 2_000, advanced: true, helpText: 'Added to principal with every payment.' },
    { id: 'extraYearly', label: 'Extra once a year', type: 'number', unit: 'usd', min: 0, max: 10_000_000, step: 100, sliderMax: 20_000, advanced: true, helpText: 'Paid with every 12th payment, such as a tax refund or bonus.' },
    { id: 'lumpSum', label: 'One-time lump sum', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 500, sliderMax: 100_000, advanced: true, group: 'lump' },
    { id: 'lumpSumMonth', label: 'Paid with payment number', type: 'number', unit: 'count', min: 1, max: 600, step: 1, integer: true, slider: false, advanced: true, group: 'lump' },
  ],
  defaults: { amount: 300_000, interestRate: 6.5, term: 30, termUnit: 'years', startDate: '', extraMonthly: 0, extraYearly: 0, lumpSum: 0, lumpSumMonth: 12 },
  compute: (i) => computeAmortization(i),
  summarize: (_i, o) => ({
    headline: { label: 'Monthly payment', value: usd(o.payment, true), sub: `principal and interest, paid off ${o.payoffDate}`, raw: o.payment, better: 'lower' },
    items: [
      { label: 'Total interest', value: usd(o.totalInterest, true), raw: o.totalInterest, better: 'lower' },
      { label: 'Total of payments', value: usd(o.totalPaid, true), raw: o.totalPaid, better: 'lower' },
      { label: 'Number of payments', value: `${o.payoffMonths} (${duration(o.payoffMonths)})`, raw: o.payoffMonths, better: 'lower' },
      { label: 'Interest saved by extras', value: usd(o.interestSaved, true), raw: o.interestSaved, better: 'higher' },
    ],
  }),
  explain: (i, o) => {
    if (i.amount <= 0 || !o.rows[0]) return ['Enter a loan amount to see the schedule.'];
    const first = o.rows[0];
    const s = [`Payment 1 (${o.firstDate}) is ${usd(first.interest, true)} interest and ${usd(first.principal, true)} principal: interest is charged on the full ${usd(i.amount)} balance, so early payments go mostly to interest.`];
    if (o.crossoverPeriod > 1) s.push(`From payment ${o.crossoverPeriod}, about ${duration(o.crossoverPeriod - 1)} in, more of each payment goes to principal than to interest.`);
    if (o.interestSaved > 0) s.push(`Your extra payments cut ${duration(o.monthsSaved)} off the loan and save ${usd(o.interestSaved)} in interest, so the last payment moves from ${o.basePayoffDate} to ${o.payoffDate}.`);
    else s.push(`Without extra payments the loan is paid off ${o.payoffDate}. Open More options to see what an extra monthly, yearly or one-time payment saves.`);
    return s;
  },
  steps: (i, o) => {
    const r = monthlyRateOf(i.interestRate);
    const first = o.rows[0];
    return [
      { label: 'Monthly interest rate', formula: 'r = annual rate ÷ 12', substituted: `r = ${pct(i.interestRate, 3)} ÷ 12`, result: num(r, 6) },
      { label: 'Number of payments', formula: 'n = term in months', substituted: `n = ${o.months}`, result: String(o.months) },
      {
        label: 'Monthly payment',
        formula: r === 0 ? 'M = P ÷ n' : 'M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)',
        substituted: r === 0 ? `M = ${usd(i.amount)} ÷ ${o.months}` : `M = ${usd(i.amount)} × ${num(r, 6)}(1 + ${num(r, 6)})^${o.months} ÷ ((1 + ${num(r, 6)})^${o.months} − 1)`,
        result: usd(o.payment, true),
      },
      { label: 'Payment 1 interest', formula: 'balance × r, rounded to the cent', substituted: `${usd(i.amount)} × ${num(r, 6)}`, result: usd(first?.interest ?? 0, true) },
      { label: 'Payment 1 principal', formula: 'M − interest (+ any extra)', substituted: `${usd(o.payment, true)} − ${usd(first?.interest ?? 0, true)}`, result: usd(first?.principal ?? 0, true) },
      { label: 'Each later payment', formula: 'new balance = balance − principal − extra; repeat', substituted: `${o.payoffMonths} payments`, result: `${usd(o.totalInterest, true)} total interest` },
    ];
  },
  answerSummary: (i, o) => `A ${usd(i.amount)} loan at ${pct(i.interestRate)} for ${duration(o.months)} has a ${usd(o.payment, true)} monthly payment and ${usd(o.totalInterest)} of total interest; the first payment is ${usd(o.rows[0]?.interest ?? 0, true)} interest.`,
  ogValue: (_i, o) => `${usd(o.payment)}/mo`,
  related: ['loan-calculator', 'mortgage-calculator', 'mortgage-payoff-calculator', 'refinance-calculator', 'auto-loan-calculator', 'apr-calculator'],
  sources: [
    { title: 'CFPB: What is amortization and how could it affect my auto loan?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-amortization-and-how-could-it-affect-my-auto-loan-en-771/' },
    { title: 'CFPB: What is a prepayment penalty?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-prepayment-penalty-en-1957/' },
    { title: 'Freddie Mac Primary Mortgage Market Survey (via FRED, MORTGAGE30US)', url: 'https://fred.stlouisfed.org/series/MORTGAGE30US' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
