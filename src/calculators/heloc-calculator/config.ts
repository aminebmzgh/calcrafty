import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, pct, usd } from '../../lib/format.ts';
import { computeHeloc, type HelocInput, type HelocOutput } from './math.ts';

const config: CalculatorConfig<HelocInput, HelocOutput> = {
  slug: 'heloc-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'HELOC Calculator',
  h1: 'HELOC Calculator',
  intro: 'How much you can borrow against your home, the interest-only payment while you draw, and the bigger payment when repayment starts.',
  metaTitle: 'HELOC Calculator: Credit Limit & Payment Shock',
  metaDescription:
    'Estimate your home equity line of credit limit, the interest-only payment while you draw and the higher payment when repayment begins, plus total interest.',
  primaryKeyword: 'heloc calculator',
  secondaryKeywords: ['home equity line of credit calculator', 'heloc payment calculator', 'how much can i borrow heloc', 'heloc interest only calculator'],
  synonyms: ['home equity', 'equity line', 'second mortgage', 'cltv', 'borrow against house'],
  inputs: [
    { id: 'homeValue', label: 'Home value', type: 'number', unit: 'usd', min: 10_000, max: 50_000_000, step: 1_000, sliderMin: 100_000, sliderMax: 2_000_000 },
    { id: 'mortgageBalance', label: 'Mortgage balance', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 1_000, sliderMax: 1_500_000 },
    { id: 'maxCltv', label: 'Lender’s maximum CLTV', type: 'number', unit: 'percent', min: 50, max: 100, step: 1, sliderMin: 60, helpText: 'Combined loan-to-value: most lenders allow 80% to 90% of the home’s value across all loans.' },
    { id: 'draw', label: 'Amount you’ll draw', type: 'number', unit: 'usd', min: 0, max: 10_000_000, step: 1_000, sliderMax: 300_000 },
    { id: 'rate', label: 'HELOC interest rate', type: 'number', unit: 'percent', min: 0, max: 25, step: 0.01, sliderMax: 15, helpText: 'Usually variable: the prime rate plus a margin. Try a higher rate to test the risk.' },
    { id: 'drawYears', label: 'Draw period', type: 'number', unit: 'years', min: 0, max: 15, step: 1, integer: true, slider: false, group: 'periods' },
    { id: 'repayYears', label: 'Repayment period', type: 'number', unit: 'years', min: 1, max: 30, step: 1, integer: true, slider: false, group: 'periods' },
  ],
  defaults: { homeValue: 450_000, mortgageBalance: 250_000, maxCltv: 85, draw: 50_000, rate: 8.5, drawYears: 10, repayYears: 20 },
  compute: computeHeloc,
  summarize: (i, o) => ({
    headline: { label: 'Available credit', value: usd(o.creditLimit), sub: `${pct(i.maxCltv, 0)} of ${usd(i.homeValue)} minus your ${usd(i.mortgageBalance)} mortgage`, raw: o.creditLimit, better: 'higher' },
    items: [
      { label: `Interest-only payment (first ${i.drawYears} years)`, value: usd(o.interestOnlyPayment, true), raw: o.interestOnlyPayment, better: 'lower' },
      { label: `Payment in repayment (${i.repayYears} years)`, value: usd(o.repaymentPayment, true), raw: o.repaymentPayment, better: 'lower' },
      { label: 'Payment jump when repayment starts', value: usd(o.paymentShock, true), raw: o.paymentShock, better: 'lower' },
      { label: 'Total interest', value: usd(o.totalInterest, true), raw: o.totalInterest, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.creditLimit <= 0) return [`At a ${pct(i.maxCltv, 0)} limit, your ${usd(i.mortgageBalance)} mortgage already uses all the borrowable equity in a ${usd(i.homeValue)} home, so a HELOC isn’t available on these numbers.`];
    const s = [
      `You have ${usd(o.equity)} of equity, and a lender allowing ${pct(i.maxCltv, 0)} combined loan-to-value could offer a line of up to ${usd(o.creditLimit)}.`,
    ];
    if (o.drawCapped) s.push(`Your planned draw is more than that limit, so the payments below use ${usd(o.drawUsed)}.`);
    if (o.drawUsed > 0)
      s.push(
        `Drawing ${usd(o.drawUsed)} costs ${usd(o.interestOnlyPayment, true)} a month while you pay interest only. When the ${duration(o.drawMonths)} draw period ends, the payment rises to ${usd(o.repaymentPayment, true)} to repay the balance over ${duration(o.repayMonths)}, and the total interest comes to ${usd(o.totalInterest)}.`,
      );
    s.push('HELOC rates are usually variable, so payments rise if rates do. Paying down principal during the draw period softens the jump later.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Credit limit', formula: 'home value × max CLTV − mortgage balance', substituted: `${usd(i.homeValue)} × ${pct(i.maxCltv, 0)} − ${usd(i.mortgageBalance)}`, result: usd(o.creditLimit) },
    { label: 'Interest-only payment', formula: 'balance × rate ÷ 12', substituted: `${usd(o.drawUsed)} × ${pct(i.rate)} ÷ 12`, result: usd(o.interestOnlyPayment, true) },
    { label: 'Repayment payment', formula: 'M = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), r = rate ÷ 12', substituted: `${usd(o.drawUsed)} over ${o.repayMonths} months at ${pct(i.rate)}`, result: usd(o.repaymentPayment, true) },
    { label: 'Total interest', formula: 'interest-only payments + interest during repayment', substituted: `${usd(o.drawInterest, true)} + ${usd(o.repayInterest, true)}`, result: usd(o.totalInterest, true) },
  ],
  answerSummary: (i, o) =>
    `A ${usd(i.homeValue)} home with a ${usd(i.mortgageBalance)} mortgage supports a HELOC of up to ${usd(o.creditLimit)} at ${pct(i.maxCltv, 0)} CLTV; drawing ${usd(o.drawUsed)} at ${pct(i.rate)} costs ${usd(o.interestOnlyPayment, true)} a month interest-only, then ${usd(o.repaymentPayment, true)} in repayment.`,
  ogValue: (_i, o) => `${usd(o.creditLimit)} line`,
  related: ['refinance-calculator', 'mortgage-calculator', 'debt-payoff-calculator', 'loan-calculator', 'debt-to-income-ratio-calculator'],
  sources: [
    { title: 'CFPB: What you should know about home equity lines of credit', url: 'https://www.consumerfinance.gov/consumer-tools/mortgages/what-you-should-know-about-home-equity-lines-of-credit/' },
    { title: 'Federal Reserve: Bank prime loan rate (via FRED, DPRIME)', url: 'https://fred.stlouisfed.org/series/DPRIME' },
    { title: 'IRS Publication 936: Home Mortgage Interest Deduction', url: 'https://www.irs.gov/publications/p936' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
