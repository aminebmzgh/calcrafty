import type { CalculatorConfig } from '../../lib/types.ts';
import { duration, num, pct, usd } from '../../lib/format.ts';
import { computeCd, type CdInput, type CdOutput } from './math.ts';

const config: CalculatorConfig<CdInput, CdOutput> = {
  slug: 'cd-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'CD Calculator',
  h1: 'CD Calculator',
  intro: 'What a certificate of deposit earns by maturity, after tax and inflation, and what cashing out early would cost.',
  metaTitle: 'CD Calculator: Interest, APY & Early Withdrawal',
  metaDescription:
    'Calculate how much a CD earns by maturity from its APY and term, see your return after tax and inflation, and see what an early withdrawal penalty costs you.',
  primaryKeyword: 'cd calculator',
  secondaryKeywords: ['certificate of deposit calculator', 'cd interest calculator', 'cd rate calculator', 'cd early withdrawal penalty calculator'],
  synonyms: ['certificate of deposit', 'cd rates', 'cd ladder', 'term deposit', 'apy'],
  inputs: [
    { id: 'deposit', label: 'Deposit', type: 'number', unit: 'usd', min: 0, max: 50_000_000, step: 100, sliderMin: 500, sliderMax: 250_000 },
    { id: 'apy', label: 'APY', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.01, sliderMax: 8, helpText: 'The annual percentage yield the bank quotes for the CD.' },
    {
      id: 'termMonths',
      label: 'Term',
      type: 'select',
      options: [
        { value: '3', label: '3 months' },
        { value: '6', label: '6 months' },
        { value: '12', label: '1 year' },
        { value: '18', label: '18 months' },
        { value: '24', label: '2 years' },
        { value: '36', label: '3 years' },
        { value: '48', label: '4 years' },
        { value: '60', label: '5 years' },
      ],
    },
    { id: 'taxRate', label: 'Tax rate on interest', type: 'number', unit: 'percent', min: 0, max: 60, step: 1, sliderMax: 50, group: 'real', helpText: 'Your federal bracket plus state tax.' },
    { id: 'inflation', label: 'Inflation', type: 'number', unit: 'percent', min: -5, max: 30, step: 0.01, sliderMin: 0, sliderMax: 10, liveDefault: 'cpiInflation', group: 'real' },
    {
      id: 'compounding',
      label: 'Compounding',
      type: 'select',
      advanced: true,
      helpText: 'Only changes the equivalent APR; the APY already includes compounding.',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' },
      ],
    },
    { id: 'withdrawMonth', label: 'Cash out early after (months)', type: 'number', unit: 'months', min: 0, max: 120, step: 1, integer: true, sliderMax: 60, advanced: true, helpText: '0 means you hold the CD to maturity.', group: 'early' },
    { id: 'penaltyMonths', label: 'Penalty (months of interest)', type: 'number', unit: 'months', min: 0, max: 36, step: 1, integer: true, sliderMax: 24, advanced: true, group: 'early' },
  ],
  defaults: { deposit: 10_000, apy: 4.25, termMonths: 12, compounding: 'daily', taxRate: 22, inflation: 3, penaltyMonths: 3, withdrawMonth: 0 },
  compute: computeCd,
  summarize: (i, o) => ({
    headline: { label: 'Balance at maturity', value: usd(o.balance, true), sub: `${usd(o.interest, true)} interest over ${duration(i.termMonths)}`, raw: o.balance, better: 'higher' },
    items: [
      { label: 'Interest after tax', value: usd(o.afterTaxInterest, true), raw: o.afterTaxInterest, better: 'higher' },
      { label: 'Real return (after tax and inflation)', value: pct(o.realReturn), raw: o.realReturn, better: 'higher' },
      { label: 'Equivalent APR', value: pct(o.apr, 3), raw: o.apr },
      o.early
        ? { label: `Cash out after ${duration(o.early.month)}`, value: `${usd(o.early.payout, true)} (penalty ${usd(o.early.penalty, true)})`, raw: o.early.payout, better: 'higher' }
        : { label: 'Early withdrawal penalty', value: `${num(i.penaltyMonths, 0)} months of interest`, raw: i.penaltyMonths, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (i.deposit <= 0) return ['Enter a deposit to see what the CD earns.'];
    const s = [`${usd(i.deposit)} at ${pct(i.apy)} APY grows to ${usd(o.balance, true)} after ${duration(i.termMonths)}, earning ${usd(o.interest, true)}. After ${pct(i.taxRate, 0)} tax, you keep ${usd(o.afterTaxInterest, true)}.`];
    if (o.realReturn < 0) s.push(`With inflation at ${pct(i.inflation)}, that's a real return of ${pct(o.realReturn)}: your money keeps its nominal value but loses buying power.`);
    else s.push(`After tax and ${pct(i.inflation)} inflation, your real return is ${pct(o.realReturn)} a year.`);
    if (o.early) {
      s.push(
        o.early.net < 0
          ? `Cashing out after ${duration(o.early.month)} would cost ${usd(o.early.penalty, true)} in penalties, more than the ${usd(o.early.interestEarned, true)} earned so far, so you'd get back less than you deposited.`
          : `Cashing out after ${duration(o.early.month)} would earn ${usd(o.early.interestEarned, true)} but cost a ${usd(o.early.penalty, true)} penalty, leaving ${usd(o.early.payout, true)}.`,
      );
    }
    return s;
  },
  steps: (i, o) => [
    { label: 'Balance at maturity', formula: 'deposit × (1 + APY)^(months ÷ 12)', substituted: `${usd(i.deposit)} × (1 + ${pct(i.apy)})^(${i.termMonths} ÷ 12)`, result: usd(o.balance, true) },
    { label: 'Interest', formula: 'balance − deposit', substituted: `${usd(o.balance, true)} − ${usd(i.deposit)}`, result: usd(o.interest, true) },
    { label: 'After tax', formula: 'interest × (1 − tax rate)', substituted: `${usd(o.interest, true)} × (1 − ${pct(i.taxRate, 0)})`, result: usd(o.afterTaxInterest, true) },
    { label: 'Equivalent APR', formula: 'n × ((1 + APY)^(1/n) − 1), n = compounding periods a year', substituted: `${i.compounding} compounding`, result: pct(o.apr, 3) },
    ...(o.early
      ? [{ label: 'Early withdrawal penalty', formula: 'deposit × APR ÷ 12 × penalty months', substituted: `${usd(i.deposit)} × ${pct(o.apr, 3)} ÷ 12 × ${i.penaltyMonths}`, result: usd(o.early.penalty, true) }]
      : []),
  ],
  answerSummary: (i, o) => `${usd(i.deposit)} in a ${duration(i.termMonths)} CD at ${pct(i.apy)} APY grows to ${usd(o.balance, true)}, earning ${usd(o.interest, true)} in interest before tax.`,
  ogValue: (_i, o) => `+${usd(o.interest)}`,
  related: ['compound-interest-calculator', 'savings-goal-calculator', 'investment-calculator', 'retirement-calculator', 'pay-raise-calculator'],
  sources: [
    { title: 'CFPB: Regulation DD (Truth in Savings), Appendix A: annual percentage yield calculation', url: 'https://www.consumerfinance.gov/rules-policy/regulations/1030/a/' },
    { title: 'FDIC: Deposit insurance (up to $250,000 per depositor, per bank, per ownership category)', url: 'https://www.fdic.gov/resources/deposit-insurance/' },
    { title: 'Investor.gov: Certificates of deposit', url: 'https://www.investor.gov/introduction-investing/investing-basics/investment-products/certificates-deposit-cds' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
