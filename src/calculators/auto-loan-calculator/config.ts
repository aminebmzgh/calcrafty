import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computeAutoLoan, type AutoLoanInput, type AutoLoanOutput } from './math.ts';
import { monthlyRate } from '../../lib/math/money.ts';

const config: CalculatorConfig<AutoLoanInput, AutoLoanOutput> = {
  slug: 'auto-loan-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'Auto Loan Calculator',
  h1: 'Auto Loan Calculator',
  intro: 'Your monthly car payment with down payment, trade-in, sales tax and fees, at today’s average auto loan rate.',
  metaTitle: 'Auto Loan Calculator: Car Payment with Tax & Trade-In',
  metaDescription:
    'Calculate your car payment with down payment, trade-in, sales tax and fees. See the amount financed, total interest and how loan length changes the total cost.',
  primaryKeyword: 'auto loan calculator',
  secondaryKeywords: ['car loan calculator', 'car payment calculator', 'auto payment calculator'],
  synonyms: ['car payment', 'vehicle loan', 'car finance', 'trade-in', 'truck loan'],
  inputs: [
    { id: 'price', label: 'Vehicle price', type: 'number', unit: 'usd', min: 500, max: 2_000_000, step: 100, sliderMin: 5_000, sliderMax: 100_000 },
    { id: 'downPayment', label: 'Down payment', type: 'number', unit: 'usd', min: 0, max: 2_000_000, step: 100, sliderMax: 30_000 },
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
        { value: '84', label: '84 mo' },
      ],
    },
    { id: 'tradeInValue', label: 'Trade-in value', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 100, sliderMax: 40_000, group: 'trade' },
    { id: 'tradeInOwed', label: 'Still owed on trade-in', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 100, sliderMax: 40_000, group: 'trade' },
    { id: 'salesTaxRate', label: 'Sales tax', type: 'number', unit: 'percent', min: 0, max: 15, step: 0.05, sliderMax: 11, group: 'tax', helpText: 'Your state plus local rate.' },
    { id: 'fees', label: 'Title, registration and fees', type: 'number', unit: 'usd', min: 0, max: 50_000, step: 25, sliderMax: 3_000, group: 'tax' },
    { id: 'taxAfterTradeIn', label: 'My state taxes the price minus the trade-in', type: 'checkbox', advanced: true, helpText: 'True in most states. A few (for example California) tax the full price.' },
  ],
  defaults: { price: 32_000, downPayment: 3_000, tradeInValue: 0, tradeInOwed: 0, salesTaxRate: 6, taxAfterTradeIn: true, fees: 500, interestRate: 7.5, termMonths: 60 },
  compute: computeAutoLoan,
  summarize: (i, o) => ({
    headline: { label: 'Monthly payment', value: usd(o.payment, true), sub: `for ${i.termMonths} months`, raw: o.payment, better: 'lower' },
    items: [
      { label: 'Amount financed', value: usd(o.amountFinanced, true), raw: o.amountFinanced, better: 'lower' },
      { label: 'Sales tax', value: usd(o.salesTax, true), raw: o.salesTax, better: 'lower' },
      { label: 'Total interest', value: usd(o.totalInterest, true), raw: o.totalInterest, better: 'lower' },
      { label: 'Total cost of the car', value: usd(o.totalCost, true), raw: o.totalCost, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.amountFinanced <= 0) return ['Your down payment and trade-in cover the full cost, so there’s nothing to finance.'];
    const s = [`You’ll finance ${usd(o.amountFinanced)} and pay ${usd(o.totalInterest)} in interest over ${duration(i.termMonths)}, so the car costs ${usd(o.totalCost)} in total including your down payment.`];
    if (o.negativeEquity > 0) s.push(`You owe ${usd(o.negativeEquity)} more on your trade-in than it’s worth. That negative equity is added to the new loan, so you’re paying interest on a car you no longer own.`);
    if (i.termMonths >= 72) s.push('Loans of 72 months or more keep the payment low, but cars lose value fast, so you can owe more than the car is worth for years.');
    else s.push('Compare a shorter term with Add to compare: the payment rises, but the total interest falls.');
    return s;
  },
  steps: (i, o) => {
    const r = monthlyRate(i.interestRate).toNumber();
    return [
      { label: 'Sales tax', formula: i.taxAfterTradeIn ? '(price − trade-in value) × tax rate' : 'price × tax rate', substituted: i.taxAfterTradeIn ? `(${usd(i.price)} − ${usd(i.tradeInValue)}) × ${pct(i.salesTaxRate)}` : `${usd(i.price)} × ${pct(i.salesTaxRate)}`, result: usd(o.salesTax, true) },
      {
        label: 'Amount financed',
        formula: 'price + tax + fees − down payment − (trade-in value − amount owed)',
        substituted: `${usd(i.price)} + ${usd(o.salesTax, true)} + ${usd(i.fees)} − ${usd(i.downPayment)} − ${usd(o.netTradeIn)}`,
        result: usd(o.amountFinanced, true),
      },
      {
        label: 'Monthly payment',
        formula: r === 0 ? 'M = P ÷ n' : 'M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), r = APR ÷ 12',
        substituted: r === 0 ? `M = ${usd(o.amountFinanced, true)} ÷ ${i.termMonths}` : `M = ${usd(o.amountFinanced, true)} × ${num(r, 6)}(1 + ${num(r, 6)})^${i.termMonths} ÷ ((1 + ${num(r, 6)})^${i.termMonths} − 1)`,
        result: usd(o.payment, true),
      },
    ];
  },
  answerSummary: (i, o) => `A ${usd(i.price)} car with ${usd(i.downPayment)} down, ${pct(i.salesTaxRate)} sales tax and ${usd(i.fees)} in fees means financing ${usd(o.amountFinanced)}; at ${pct(i.interestRate)} for ${i.termMonths} months the payment is ${usd(o.payment, true)} a month.`,
  ogValue: (_i, o) => `${usd(o.payment)}/mo`,
  related: ['loan-calculator', 'paycheck-calculator', 'savings-goal-calculator', 'debt-payoff-calculator', 'compound-interest-calculator'],
  sources: [
    { title: 'Federal Reserve G.19: new car loan rates at commercial banks (via FRED, RIFLPBCIANM60NM)', url: 'https://fred.stlouisfed.org/series/RIFLPBCIANM60NM' },
    { title: 'CFPB: Understanding auto loans', url: 'https://www.consumerfinance.gov/consumer-tools/auto-loans/' },
    { title: 'FTC: Buying a new car', url: 'https://consumer.ftc.gov/articles/buying-new-car' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
