import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, pct, usd } from '../../lib/format.ts';
import { computeCardPayoff, type CardInput, type CardOutput } from './math.ts';

const config: CalculatorConfig<CardInput, CardOutput> = {
  slug: 'credit-card-payoff-calculator',
  category: 'finance',
  subtopic: 'Loans and debt',
  name: 'Credit Card Payoff Calculator',
  h1: 'Credit Card Payoff Calculator',
  intro: 'How long it takes to clear a card balance, the interest you’ll pay, and what paying only the minimum really costs.',
  metaTitle: 'Credit Card Payoff Calculator: Time and Interest',
  metaDescription:
    'See how long it takes to pay off a credit card, the total interest, the payment to be debt-free by a date, and how much paying only the minimum would cost you.',
  primaryKeyword: 'credit card payoff calculator',
  secondaryKeywords: ['credit card payment calculator', 'credit card interest calculator', 'pay off credit card calculator'],
  synonyms: ['credit card', 'minimum payment', 'apr', 'card debt', 'balance'],
  inputs: [
    { id: 'balance', label: 'Card balance', type: 'number', unit: 'usd', min: 1, max: 10_000_000, step: 50, sliderMin: 100, sliderMax: 30_000 },
    { id: 'apr', label: 'APR', type: 'number', unit: 'percent', min: 0, max: 60, step: 0.01, sliderMax: 36, liveDefault: 'creditCard' },
    {
      id: 'mode',
      label: 'I want to',
      type: 'segmented',
      options: [
        { value: 'payment', label: 'Pay a fixed amount' },
        { value: 'months', label: 'Be debt-free by' },
      ],
    },
    { id: 'payment', label: 'Monthly payment', type: 'number', unit: 'usd', min: 1, max: 10_000_000, step: 10, sliderMax: 2_000, showIf: (i) => i.mode === 'payment' },
    { id: 'months', label: 'Months to pay off', type: 'number', unit: 'months', min: 1, max: 360, step: 1, integer: true, sliderMax: 60, showIf: (i) => i.mode === 'months' },
    { id: 'minPct', label: 'Minimum payment: % of balance', type: 'number', unit: 'percent', min: 0, max: 10, step: 0.5, sliderMax: 5, advanced: true, group: 'min', helpText: 'Plus that month’s interest. Check your statement for your card’s rule.' },
    { id: 'minFloor', label: 'Minimum payment floor', type: 'number', unit: 'usd', min: 0, max: 500, step: 5, sliderMax: 100, advanced: true, group: 'min' },
  ],
  defaults: { balance: 5_000, apr: 22, mode: 'payment', payment: 200, months: 24, minPct: 1, minFloor: 25 },
  compute: computeCardPayoff,
  summarize: (i, o) => {
    const p = o.plan;
    return {
      headline: p.paysOff
        ? i.mode === 'payment'
          ? { label: 'Debt-free in', value: duration(p.months), sub: `paying ${usd(o.monthlyPayment)} a month`, raw: p.months, better: 'lower' }
          : { label: 'Pay each month', value: usd(o.monthlyPayment, true), sub: `to be debt-free in ${duration(p.months)}`, raw: o.monthlyPayment, better: 'lower' }
        : { label: 'Debt-free in', value: 'Never', sub: `Pay more than ${usd(o.interestOnlyPayment, true)} a month to make progress` },
      items: [
        { label: 'Total interest', value: p.paysOff ? usd(p.totalInterest, true) : '—', raw: p.paysOff ? p.totalInterest : undefined, better: 'lower' },
        { label: 'Total paid', value: p.paysOff ? usd(p.totalPaid, true) : '—', raw: p.paysOff ? p.totalPaid : undefined, better: 'lower' },
        { label: 'Interest this month', value: usd(o.firstInterest, true), raw: o.firstInterest },
        { label: 'Minimum payments only', value: o.minimum.paysOff ? `${duration(o.minimum.months)}, ${usd(o.minimum.totalInterest)} interest` : 'never paid off' },
      ],
    };
  },
  explain: (i, o) => {
    if (!o.plan.paysOff) return [`At ${pct(i.apr)} APR your balance gains ${usd(o.firstInterest, true)} of interest this month, so a payment of ${usd(o.monthlyPayment)} never reduces it. Pay at least ${usd(o.interestOnlyPayment, true)}, and ideally much more.`];
    const s = [`Paying ${usd(o.monthlyPayment, true)} a month clears ${usd(i.balance)} in ${duration(o.plan.months)}, with ${usd(o.plan.totalInterest)} of interest.`];
    if (o.minimum.paysOff && o.interestSaved > 0) s.push(`Paying only the minimum would take ${duration(o.minimum.months)} and cost ${usd(o.minimum.totalInterest)} in interest. Your plan saves ${usd(o.interestSaved)}.`);
    s.push('This assumes no new purchases on the card. Moving the balance to a lower-rate loan or a 0% transfer card can cut the interest further.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Monthly interest rate', formula: 'r = APR ÷ 12', substituted: `r = ${pct(i.apr)} ÷ 12` },
    { label: 'This month’s interest', formula: 'balance × r', substituted: `${usd(i.balance)} × ${pct(i.apr)} ÷ 12`, result: usd(o.firstInterest, true) },
    i.mode === 'months'
      ? { label: 'Payment for your target', formula: 'P = B × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)', substituted: `B = ${usd(i.balance)}, n = ${i.months}`, result: usd(o.monthlyPayment, true) }
      : { label: 'Months to pay off', formula: 'n = −ln(1 − r × B ÷ P) ÷ ln(1 + r), rounded up', substituted: `B = ${usd(i.balance)}, P = ${usd(i.payment)}`, result: o.plan.paysOff ? `${o.plan.months} payments` : 'never (payment ≤ interest)' },
    { label: 'Minimum payment path', formula: `each month: interest + ${pct(i.minPct)} of the balance, at least ${usd(i.minFloor)}`, substituted: o.minimum.paysOff ? `${o.minimum.months} payments` : 'never pays off', result: o.minimum.paysOff ? usd(o.minimum.totalInterest, true) : undefined },
  ],
  answerSummary: (i, o) =>
    o.plan.paysOff
      ? `Paying ${usd(o.monthlyPayment)} a month on a ${usd(i.balance)} balance at ${pct(i.apr)} APR clears it in ${duration(o.plan.months)} with ${usd(o.plan.totalInterest)} of interest${o.minimum.paysOff ? `, versus ${duration(o.minimum.months)} on minimum payments` : ''}.`
      : `A ${usd(i.balance)} balance at ${pct(i.apr)} APR needs more than ${usd(o.interestOnlyPayment, true)} a month just to shrink.`,
  ogValue: (_i, o) => (o.plan.paysOff ? duration(o.plan.months) : 'Never'),
  related: ['debt-payoff-calculator', 'loan-calculator', 'paycheck-calculator', 'savings-goal-calculator'],
  sources: [
    { title: 'Federal Reserve G.19: credit card interest rates (via FRED, TERMCBCCALLNS)', url: 'https://fred.stlouisfed.org/series/TERMCBCCALLNS' },
    { title: 'CFPB: What is a minimum payment on a credit card?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-minimum-payment-on-a-credit-card-en-1745/' },
    { title: 'CFPB Regulation Z, 12 CFR 1026.7: periodic statement and minimum payment warning (Credit CARD Act of 2009)', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/7/' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
