import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, pct, usd } from '../../lib/format.ts';
import { computeRefinance, type RefiInput, type RefiOutput } from './math.ts';

const config: CalculatorConfig<RefiInput, RefiOutput> = {
  slug: 'refinance-calculator',
  category: 'finance',
  subtopic: 'Home buying',
  name: 'Refinance Calculator',
  h1: 'Mortgage Refinance Calculator',
  intro: 'Your new payment, break-even month and lifetime savings from refinancing, at this week’s average mortgage rate.',
  metaTitle: 'Mortgage Refinance Calculator: Break-Even & Savings',
  metaDescription:
    'See your new mortgage payment, when a refinance breaks even and whether it saves money over the life of the loan, including the cost of restarting the term.',
  primaryKeyword: 'mortgage refinance calculator',
  secondaryKeywords: ['refinance calculator', 'refinance break even calculator', 'should i refinance calculator', 'refinance savings calculator'],
  synonyms: ['refi', 'refinancing', 'break even', 'lower my mortgage rate', 'closing costs'],
  inputs: [
    { id: 'balance', label: 'Current loan balance', type: 'number', unit: 'usd', min: 1_000, max: 50_000_000, step: 1_000, sliderMin: 50_000, sliderMax: 1_500_000 },
    { id: 'currentRate', label: 'Current interest rate', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.01, sliderMax: 12, group: 'current' },
    { id: 'yearsLeft', label: 'Years left on current loan', type: 'number', unit: 'years', min: 1, max: 40, step: 1, integer: true, sliderMax: 30, group: 'current' },
    { id: 'newRate', label: 'New interest rate', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.01, sliderMax: 12, liveDefault: 'mortgage30' },
    {
      id: 'newTermYears',
      label: 'New loan term',
      type: 'segmented',
      options: [
        { value: '15', label: '15 yr' },
        { value: '20', label: '20 yr' },
        { value: '25', label: '25 yr' },
        { value: '30', label: '30 yr' },
      ],
    },
    { id: 'closingCosts', label: 'Closing costs', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 100, sliderMax: 30_000, helpText: 'Lender fees, points, appraisal, title and recording fees from your Loan Estimate.' },
    { id: 'yearsToKeep', label: 'Years you expect to keep the new loan', type: 'number', unit: 'years', min: 1, max: 40, step: 1, integer: true, sliderMax: 30 },
    { id: 'rollCosts', label: 'Add the closing costs to the new loan', type: 'checkbox', advanced: true },
  ],
  defaults: { balance: 300_000, currentRate: 7.5, yearsLeft: 27, newRate: 6.75, newTermYears: 30, closingCosts: 6_000, rollCosts: false, yearsToKeep: 7 },
  compute: computeRefinance,
  summarize: (i, o) => ({
    headline: {
      label: o.monthlySavings >= 0 ? 'Monthly savings' : 'Monthly increase',
      value: usd(Math.abs(o.monthlySavings), true),
      sub: `${usd(o.currentPayment, true)} → ${usd(o.newPayment, true)} principal and interest`,
      raw: o.monthlySavings,
      better: 'higher',
    },
    items: [
      { label: 'Break-even', value: o.breakEvenMonths === null ? 'Never' : duration(o.breakEvenMonths), raw: o.breakEvenMonths ?? undefined, better: 'lower' },
      { label: `Net result after ${i.yearsToKeep} years`, value: `${o.savingsAtHorizon >= 0 ? '+' : '−'}${usd(Math.abs(o.savingsAtHorizon))}`, raw: o.savingsAtHorizon, better: 'higher' },
      { label: 'Lifetime savings', value: `${o.lifetimeSavings >= 0 ? '+' : '−'}${usd(Math.abs(o.lifetimeSavings))}`, raw: o.lifetimeSavings, better: 'higher' },
      { label: 'Payoff date', value: o.extraMonths === 0 ? 'Unchanged' : o.extraMonths > 0 ? `${duration(o.extraMonths)} later` : `${duration(-o.extraMonths)} sooner`, raw: o.extraMonths, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.monthlySavings <= 0 && o.lifetimeSavings <= 0) return [`At ${pct(i.newRate)} the new payment isn’t lower and the refinance doesn’t save interest, so it isn’t worth it on these numbers.`];
    const s: string[] = [];
    if (o.monthlySavings > 0) {
      s.push(
        o.breakEvenMonths === null
          ? `Refinancing lowers the payment by ${usd(o.monthlySavings, true)} a month, but it never comes out ahead once the balance you still owe is counted.`
          : `Refinancing lowers the payment by ${usd(o.monthlySavings, true)} a month and comes out ahead after ${duration(o.breakEvenMonths)}, counting the closing costs and the balance still owed on each loan.`,
      );
    }
    s.push(
      o.savingsAtHorizon >= 0
        ? `If you keep the new loan for ${i.yearsToKeep} years, you’re ${usd(o.savingsAtHorizon)} better off than not refinancing.`
        : `If you sell or refinance again after ${i.yearsToKeep} years, you’d be ${usd(-o.savingsAtHorizon)} worse off than keeping your current loan.`,
    );
    if (o.extraMonths > 0 && o.lifetimeSavings < 0)
      s.push(`The new term ends ${duration(o.extraMonths)} later than your current loan, so over its full life you’d pay ${usd(-o.lifetimeSavings)} more. Choosing a term that matches your remaining years, or paying extra each month, avoids that.`);
    else if (o.lifetimeSavings > 0) s.push(`Over the full term, you’d pay ${usd(o.lifetimeSavings)} less in interest and costs than on your current loan.`);
    return s;
  },
  steps: (i, o) => [
    { label: 'Current payment', formula: 'P&I on the current balance over the years left', substituted: `${usd(i.balance)} at ${pct(i.currentRate)} for ${i.yearsLeft} years`, result: usd(o.currentPayment, true) },
    {
      label: 'New payment',
      formula: i.rollCosts ? 'P&I on balance + closing costs over the new term' : 'P&I on the balance over the new term',
      substituted: `${usd(o.newLoan)} at ${pct(i.newRate)} for ${i.newTermYears} years`,
      result: usd(o.newPayment, true),
    },
    { label: 'Monthly savings', formula: 'current payment − new payment', substituted: `${usd(o.currentPayment, true)} − ${usd(o.newPayment, true)}`, result: usd(o.monthlySavings, true) },
    {
      label: 'Classic break-even',
      formula: 'upfront closing costs ÷ monthly savings',
      substituted: o.simpleBreakEven === null ? 'not applicable (no upfront costs or no savings)' : `${usd(i.closingCosts)} ÷ ${usd(o.monthlySavings, true)}`,
      result: o.simpleBreakEven === null ? '—' : duration(o.simpleBreakEven),
    },
    {
      label: 'Lifetime savings',
      formula: 'interest left on current loan − interest on new loan − closing costs',
      substituted: `${usd(o.currentInterest, true)} − ${usd(o.newInterest, true)} − ${usd(i.closingCosts)}`,
      result: usd(o.lifetimeSavings, true),
    },
  ],
  answerSummary: (i, o) =>
    `Refinancing ${usd(i.balance)} from ${pct(i.currentRate)} to ${pct(i.newRate)} for ${i.newTermYears} years changes the payment from ${usd(o.currentPayment, true)} to ${usd(o.newPayment, true)}${o.breakEvenMonths !== null && o.monthlySavings > 0 ? ` and breaks even after ${duration(o.breakEvenMonths)}` : ''}.`,
  ogValue: (_i, o) => `${o.monthlySavings >= 0 ? 'Save' : 'Pay'} ${usd(Math.abs(o.monthlySavings))}/mo`,
  related: ['mortgage-calculator', 'apr-calculator', 'heloc-calculator', 'debt-to-income-ratio-calculator', 'mortgage-affordability-calculator'],
  sources: [
    { title: 'Freddie Mac Primary Mortgage Market Survey (via FRED, MORTGAGE30US)', url: 'https://fred.stlouisfed.org/series/MORTGAGE30US' },
    { title: 'CFPB: Loan Estimate explainer', url: 'https://www.consumerfinance.gov/owning-a-home/loan-estimate/' },
    { title: 'Federal Reserve: A consumer’s guide to mortgage refinancings', url: 'https://www.federalreserve.gov/pubs/refinancings/default.htm' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
