import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computePayoff, monthInterest, type PayoffInput, type PayoffOutput } from './math.ts';

const config: CalculatorConfig<PayoffInput, PayoffOutput> = {
  slug: 'mortgage-payoff-calculator',
  category: 'finance',
  subtopic: 'Home buying',
  name: 'Mortgage Payoff Calculator',
  h1: 'Mortgage Payoff Calculator',
  intro: 'How soon your mortgage is paid off from today’s balance, and how much an extra payment or lump sum saves.',
  metaTitle: 'Mortgage Payoff Calculator: Pay Off Your Home Early',
  metaDescription:
    'Free mortgage payoff calculator: enter your current balance, rate and payment to see your payoff date and what extra payments or a lump sum save in interest.',
  primaryKeyword: 'mortgage payoff calculator',
  secondaryKeywords: ['pay off mortgage early calculator', 'extra mortgage payment calculator', 'mortgage principal payoff calculator', 'early mortgage payoff calculator'],
  synonyms: ['pay off house early', 'extra principal', 'lump sum mortgage', 'mortgage free', 'prepay mortgage', 'remaining balance'],
  inputs: [
    { id: 'balance', label: 'Current loan balance', type: 'number', unit: 'usd', min: 1_000, max: 50_000_000, step: 1_000, sliderMin: 10_000, sliderMax: 1_000_000, helpText: 'From your latest mortgage statement.' },
    { id: 'interestRate', label: 'Interest rate', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.01, sliderMax: 12, helpText: 'Your loan’s note rate, not the APR.' },
    { id: 'payment', label: 'Monthly principal and interest', type: 'number', unit: 'usd', min: 1, max: 1_000_000, step: 10, sliderMin: 100, sliderMax: 10_000, helpText: 'Leave out escrow for taxes and insurance; it doesn’t pay down the loan.' },
    { id: 'extraMonthly', label: 'Extra each month', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 25, sliderMax: 3_000 },
    { id: 'lumpSum', label: 'One-time lump sum now', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 1_000, sliderMax: 100_000, advanced: true },
    { id: 'targetYears', label: 'Goal: paid off in (years)', type: 'number', unit: 'years', min: 0, max: 40, step: 1, slider: false, advanced: true, helpText: 'Shows the extra monthly payment you’d need. Leave at 0 for no goal.' },
  ],
  defaults: { balance: 250_000, interestRate: 6.5, payment: 1_800, extraMonthly: 200, lumpSum: 0, targetYears: 0 },
  validate: (i) => {
    const interest = monthInterest(i.balance, i.interestRate);
    return i.payment + i.extraMonthly <= interest ? [{ id: 'payment', message: `The payment must be more than the month’s interest (${usd(interest, true)}), or the balance never goes down.` }] : [];
  },
  compute: computePayoff,
  summarize: (_i, o) => ({
    headline: {
      label: 'Paid off in',
      value: o.actual.paysOff ? duration(o.actual.months) : 'Never',
      sub: o.monthsSaved > 0 ? `${duration(o.monthsSaved)} sooner than your current payment` : 'at your current payment',
      raw: o.actual.months,
      better: 'lower',
    },
    items: [
      { label: 'Interest saved', value: usd(o.interestSaved), raw: o.interestSaved, better: 'higher' },
      { label: 'Interest still to pay', value: usd(o.actual.totalInterest), raw: o.actual.totalInterest, better: 'lower' },
      { label: 'Without extra payments', value: o.base.paysOff ? `${duration(o.base.months)}, ${usd(o.base.totalInterest)} interest` : 'Never paid off' },
      ...(o.requiredExtra !== null ? [{ label: 'Extra needed for your goal', value: `${usd(o.requiredExtra, true)} a month`, raw: o.requiredExtra, better: 'lower' as const }] : []),
    ],
  }),
  explain: (i, o) => {
    if (!o.base.paysOff) return [`At ${usd(i.payment)} a month the balance never falls: this month’s interest alone is ${usd(o.firstInterest, true)}. Raise the payment to see a payoff date.`];
    const s = [`This month ${usd(o.firstInterest, true)} of your payment is interest on the ${usd(i.balance)} balance. Every extra dollar goes straight to principal, so next month’s interest is lower and more of the regular payment repays the loan.`];
    if (o.monthsSaved > 0) {
      const what = [i.extraMonthly > 0 ? `${usd(i.extraMonthly)} extra a month` : '', i.lumpSum > 0 ? `a ${usd(i.lumpSum)} lump sum` : ''].filter(Boolean).join(' and ');
      s.push(`With ${what}, you’re mortgage-free in ${duration(o.actual.months)} instead of ${duration(o.base.months)}, and pay ${usd(o.interestSaved)} less interest.`);
    } else s.push(`At your current payment the loan is paid off in ${duration(o.base.months)}, with ${usd(o.base.totalInterest)} of interest still to pay. Add an extra payment to see what it saves.`);
    if (o.requiredExtra !== null) s.push(o.requiredExtra > 0 ? `To be done in ${num(i.targetYears, 0)} years you’d need ${usd(o.requiredExtra, true)} extra each month.` : `Your payment already pays the loan off within ${num(i.targetYears, 0)} years.`);
    return s;
  },
  steps: (i, o) => [
    { label: 'Monthly interest rate', formula: 'r = annual rate ÷ 12', substituted: `r = ${pct(i.interestRate, 3)} ÷ 12`, result: num(o.rate, 6) },
    { label: 'This month’s interest', formula: 'balance × r, rounded to the cent', substituted: `${usd(i.balance)} × ${num(o.rate, 6)}`, result: usd(o.firstInterest, true) },
    { label: 'This month’s principal', formula: 'payment + extra − interest', substituted: `${usd(i.payment, true)} + ${usd(i.extraMonthly, true)} − ${usd(o.firstInterest, true)}`, result: usd(o.firstPrincipal, true) },
    { label: 'Repeat each month', formula: 'new balance = balance − principal, until it reaches zero', substituted: `${o.actual.paysOff ? o.actual.months : '∞'} payments`, result: o.actual.paysOff ? duration(o.actual.months) : 'Never' },
    { label: 'Interest saved', formula: 'interest at current payment − interest with extras', substituted: `${usd(o.base.totalInterest)} − ${usd(o.actual.totalInterest)}`, result: usd(o.interestSaved) },
  ],
  answerSummary: (i, o) =>
    o.monthsSaved > 0
      ? `Paying ${usd(i.extraMonthly)} extra a month on a ${usd(i.balance)} mortgage at ${pct(i.interestRate)} with a ${usd(i.payment)} payment pays it off ${duration(o.monthsSaved)} sooner and saves ${usd(o.interestSaved)} in interest.`
      : `A ${usd(i.balance)} mortgage at ${pct(i.interestRate)} with a ${usd(i.payment)} monthly payment is paid off in ${duration(o.base.months)}.`,
  ogValue: (_i, o) => (o.monthsSaved > 0 ? `${duration(o.monthsSaved)} sooner` : duration(o.base.months)),
  related: ['mortgage-calculator', 'amortization-calculator', 'refinance-calculator', 'heloc-calculator', 'emergency-fund-calculator', 'debt-payoff-calculator'],
  sources: [
    { title: 'CFPB: What is a prepayment penalty?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-prepayment-penalty-en-1957/' },
    { title: 'CFPB: Regulation Z §1026.43(g), limits on prepayment penalties', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/43/' },
    { title: 'CFPB: What is amortization?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-amortization-and-how-could-it-affect-my-auto-loan-en-771/' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
