import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { monthlyRateOf, paymentsOf, computeMortgage, convertDownPayment, downPaymentTooLarge, type MortgageInput, type MortgageOutput } from './math.ts';

const config: CalculatorConfig<MortgageInput, MortgageOutput> = {
  slug: 'mortgage-calculator',
  category: 'finance',
  subtopic: 'Home buying',
  name: 'Mortgage Calculator',
  h1: 'Mortgage Calculator',
  intro: 'Your full monthly house payment with taxes, insurance, PMI and HOA, using this week’s average rate.',
  metaTitle: 'Mortgage Calculator with Taxes, PMI & Today’s Rates',
  metaDescription:
    'Calculate your monthly mortgage payment with property tax, insurance, PMI and HOA. Uses this week’s average rate, shows amortization and extra-payment savings.',
  primaryKeyword: 'mortgage calculator',
  secondaryKeywords: ['mortgage payment calculator', 'house payment calculator', 'home loan calculator', 'mortgage calculator with taxes and insurance', 'mortgage calculator with pmi'],
  synonyms: ['house payment', 'home loan', 'amortization', 'piti', 'escrow', 'refinance'],
  inputs: [
    { id: 'homePrice', label: 'Home price', type: 'number', unit: 'usd', min: 10_000, max: 50_000_000, step: 1000, sliderMin: 50_000, sliderMax: 2_000_000 },
    {
      id: 'downPayment',
      label: 'Down payment',
      type: 'number',
      unit: 'percent',
      min: 0,
      max: 100,
      step: 0.5,
      sliderMax: 50,
      helpText: 'Under 20% down usually means paying private mortgage insurance (PMI).',
      unitToggle: {
        id: 'downMode',
        label: 'Down payment unit',
        options: [
          { value: 'percent', label: '%', unit: 'percent', min: 0, max: 100, step: 0.5, sliderMax: 50 },
          { value: 'usd', label: '$', unit: 'usd', min: 0, max: 50_000_000, step: 1000, sliderMax: 500_000 },
        ],
        convert: (value, from, to, input) => convertDownPayment(input.homePrice, value, from as 'percent' | 'usd', to as 'percent' | 'usd'),
      },
    },
    { id: 'interestRate', label: 'Interest rate', type: 'number', unit: 'percent', min: 0, max: 30, step: 0.01, sliderMax: 12, liveDefault: 'mortgage30' },
    {
      id: 'termYears',
      label: 'Loan term',
      type: 'segmented',
      options: [
        { value: '30', label: '30 years' },
        { value: '20', label: '20 years' },
        { value: '15', label: '15 years' },
        { value: '10', label: '10 years' },
      ],
    },
    { id: 'propertyTaxRate', label: 'Property tax', type: 'number', unit: 'percent', min: 0, max: 5, step: 0.01, sliderMax: 3, group: 'escrow', helpText: 'Per year, as a % of the home price. The US average effective rate is about 0.9%.' },
    { id: 'homeInsurance', label: 'Home insurance', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 50, sliderMax: 10_000, group: 'escrow', helpText: 'Per year. Use your quote if you have one.' },
    { id: 'pmiRate', label: 'PMI rate', type: 'number', unit: 'percent', min: 0, max: 3, step: 0.05, sliderMax: 2, advanced: true, group: 'extras', helpText: 'Per year, as a % of the loan. Freddie Mac estimates $30–$70 a month per $100,000 borrowed (0.36%–0.84%).' },
    { id: 'hoa', label: 'HOA dues', type: 'number', unit: 'usd', min: 0, max: 10_000, step: 10, sliderMax: 1000, advanced: true, group: 'extras', helpText: 'Per month.' },
    { id: 'extraMonthly', label: 'Extra payment', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 25, sliderMax: 2000, advanced: true, helpText: 'Added to principal every month.' },
  ],
  defaults: {
    homePrice: 375_000,
    downPayment: 20,
    downMode: 'percent',
    interestRate: 6.5,
    termYears: 30,
    propertyTaxRate: 0.9,
    homeInsurance: 2000,
    pmiRate: 0.6,
    hoa: 0,
    extraMonthly: 0,
  },
  validate: (i) => {
    const errs: { id: 'downPayment'; message: string }[] = [];
    if (downPaymentTooLarge(i.homePrice, i.downPayment, i.downMode)) errs.push({ id: 'downPayment', message: 'Down payment can’t be more than the home price.' });
    return errs;
  },
  compute: computeMortgage,
  summarize: (_i, o) => ({
    headline: {
      label: 'Monthly payment',
      value: usd(o.totalMonthly),
      sub: `${usd(o.monthlyPI)} principal & interest + ${usd(o.monthlyNonPI)} taxes, insurance${o.monthlyPMI ? ', PMI' : ''}${o.monthlyHOA ? ', HOA' : ''}`,
      raw: o.totalMonthly,
      better: 'lower',
    },
    items: [
      { label: 'Principal & interest', value: usd(o.monthlyPI, true), raw: o.monthlyPI, better: 'lower' },
      { label: 'Property tax', value: `${usd(o.monthlyTax)}/mo`, raw: o.monthlyTax, better: 'lower' },
      { label: 'Home insurance', value: `${usd(o.monthlyInsurance)}/mo`, raw: o.monthlyInsurance, better: 'lower' },
      ...(o.monthlyPMI ? [{ label: 'PMI', value: `${usd(o.monthlyPMI)}/mo`, raw: o.monthlyPMI, better: 'lower' as const }] : []),
      ...(o.monthlyHOA ? [{ label: 'HOA', value: `${usd(o.monthlyHOA)}/mo`, raw: o.monthlyHOA, better: 'lower' as const }] : []),
      { label: 'Loan amount', value: usd(o.loanAmount), raw: o.loanAmount },
      { label: 'Total interest', value: usd(o.totalInterest), raw: o.totalInterest, better: 'lower' },
      { label: 'Paid off in', value: duration(o.payoffMonths), raw: o.payoffMonths, better: 'lower' },
      { label: 'Total cost', value: usd(o.totalCost), raw: o.totalCost, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.loanAmount <= 0) return ['With the full price paid up front there’s no loan: your monthly cost is property tax, insurance and any HOA dues.'];
    const s: string[] = [];
    const ratio = o.totalInterest / o.loanAmount;
    s.push(
      `You’ll pay ${usd(o.totalInterest)} in interest over ${duration(o.payoffMonths)}, ${ratio > 1.02 ? 'more than the loan itself' : ratio > 0.98 ? 'about as much as the loan itself' : `${Math.round(ratio * 100)}% of the amount you borrow`}.`,
    );
    if (o.extraSuggestion && o.extraSuggestion.interestSaved > 0) {
      s.push(`Adding ${usd(o.extraSuggestion.amount)} a month would save ${usd(o.extraSuggestion.interestSaved)} and finish ${duration(o.extraSuggestion.monthsSaved)} early.`);
    } else if (i.extraMonthly > 0 && o.interestSaved > 0) {
      s.push(`Your extra ${usd(i.extraMonthly)} a month saves ${usd(o.interestSaved)} in interest and pays the loan off ${duration(o.monthsSaved)} early.`);
    }
    if (o.pmiMonths > 0) {
      s.push(`PMI adds ${usd(o.monthlyPMI)} a month for the first ${duration(o.pmiMonths)}, until your balance reaches 78% of the home’s price; it costs ${usd(o.pmiTotal)} in total.`);
    } else if (o.downPaymentPct >= 20) {
      s.push(`With ${pct(o.downPaymentPct, 1)} down you avoid private mortgage insurance.`);
    }
    if (o.monthlyNonPI > 0) s.push(`Taxes, insurance${o.monthlyPMI ? ', PMI' : ''}${o.monthlyHOA ? ' and HOA' : ''} add ${usd(o.monthlyNonPI)} a month on top of principal and interest.`);
    return s.slice(0, 4);
  },
  steps: (i, o) => {
    const r = monthlyRateOf(i.interestRate);
    const n = paymentsOf(i.termYears);
    return [
      { label: 'Loan amount', formula: 'P = home price − down payment', substituted: `P = ${usd(i.homePrice)} − ${usd(o.downPaymentAmount)}`, result: usd(o.loanAmount) },
      { label: 'Monthly interest rate', formula: 'r = annual rate ÷ 12', substituted: `r = ${pct(i.interestRate, 3)} ÷ 12`, result: num(r, 6) },
      { label: 'Number of payments', formula: 'n = years × 12', substituted: `n = ${i.termYears} × 12`, result: String(n) },
      {
        label: 'Monthly principal & interest',
        formula: r === 0 ? 'M = P ÷ n (no interest)' : 'M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)',
        substituted: r === 0 ? `M = ${usd(o.loanAmount)} ÷ ${n}` : `M = ${usd(o.loanAmount)} × ${num(r, 6)}(1 + ${num(r, 6)})^${n} ÷ ((1 + ${num(r, 6)})^${n} − 1)`,
        result: usd(o.monthlyPI, true),
      },
      {
        label: 'Total monthly payment',
        formula: 'principal & interest + tax + insurance + PMI + HOA',
        substituted: `${usd(o.monthlyPI, true)} + ${usd(o.monthlyTax, true)} + ${usd(o.monthlyInsurance, true)} + ${usd(o.monthlyPMI, true)} + ${usd(o.monthlyHOA, true)}`,
        result: usd(o.totalMonthly, true),
      },
    ];
  },
  answerSummary: (i, o) =>
    `On a ${usd(o.loanAmount)} loan at ${pct(i.interestRate)} for ${i.termYears} years, the monthly principal and interest payment is ${usd(o.monthlyPI, true)}. With property tax and insurance it’s about ${usd(o.totalMonthly)} a month.`,
  ogValue: (_i, o) => `${usd(o.totalMonthly)}/mo`,
  related: ['mortgage-affordability-calculator', 'rent-vs-buy-calculator', 'loan-calculator', 'paycheck-calculator', 'savings-goal-calculator'],
  statePages: { kind: 'mortgage' },
  sources: [
    { title: 'Freddie Mac Primary Mortgage Market Survey (via FRED, MORTGAGE30US)', url: 'https://fred.stlouisfed.org/series/MORTGAGE30US' },
    { title: 'CFPB: What is private mortgage insurance?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-private-mortgage-insurance-en-122/' },
    { title: 'CFPB: When can I remove private mortgage insurance (PMI)?', url: 'https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/' },
    { title: 'Homeowners Protection Act of 1998, 12 U.S.C. 4901–4910', url: 'https://www.law.cornell.edu/uscode/text/12/chapter-49' },
    { title: 'Freddie Mac: Private mortgage insurance', url: 'https://myhome.freddiemac.com/buying/private-mortgage-insurance' },
    { title: 'Tax Foundation: Property taxes by state', url: 'https://taxfoundation.org/data/all/state/property-taxes-by-state-county/' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
