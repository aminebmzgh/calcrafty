import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeRaise, convertRaise, type RaiseInput, type RaiseMode, type RaiseOutput, type RaisePeriod } from './math.ts';

const PER: Record<RaisePeriod, string> = { hour: 'an hour', biweek: 'per paycheck', month: 'a month', year: 'a year' };

const config: CalculatorConfig<RaiseInput, RaiseOutput> = {
  slug: 'pay-raise-calculator',
  category: 'finance',
  subtopic: 'Income',
  name: 'Pay Raise Calculator',
  h1: 'Pay Raise Calculator',
  intro: 'Your new pay after a raise, what it adds to each paycheck, and whether it beats inflation.',
  metaTitle: 'Pay Raise Calculator: New Salary & Real Raise',
  metaDescription:
    'Work out your new pay from a percentage or dollar raise, see the extra per paycheck, month and year, and check whether the raise beats this year’s inflation.',
  primaryKeyword: 'pay raise calculator',
  secondaryKeywords: ['salary increase calculator', 'raise percentage calculator', 'how much is a 3 percent raise', 'pay increase calculator'],
  synonyms: ['salary raise', 'cost of living raise', 'merit increase', 'percent increase in pay', 'cola'],
  inputs: [
    { id: 'currentPay', label: 'Current pay', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 0.01, sliderMax: 250_000, group: 'pay' },
    {
      id: 'period',
      label: 'Paid',
      type: 'select',
      group: 'pay',
      options: [
        { value: 'hour', label: 'per hour' },
        { value: 'biweek', label: 'every two weeks' },
        { value: 'month', label: 'per month' },
        { value: 'year', label: 'per year' },
      ],
    },
    { id: 'hoursPerWeek', label: 'Hours per week', type: 'number', unit: 'hours', min: 1, max: 100, step: 0.5, sliderMax: 60, showIf: (i) => i.period === 'hour' },
    {
      id: 'raise',
      label: 'Raise',
      type: 'number',
      unit: 'percent',
      min: 0,
      max: 100,
      step: 0.1,
      sliderMax: 20,
      unitToggle: {
        id: 'raiseMode',
        label: 'Raise unit',
        options: [
          { value: 'percent', label: '%', unit: 'percent', min: 0, max: 100, step: 0.1, sliderMax: 20 },
          { value: 'usd', label: '$', unit: 'usd', min: 0, max: 10_000_000, step: 0.01, sliderMax: 20_000 },
        ],
        convert: (value, from, to, input) => convertRaise(input.currentPay, value, from as RaiseMode, to as RaiseMode),
      },
    },
    { id: 'inflation', label: 'Inflation (last 12 months)', type: 'number', unit: 'percent', min: -5, max: 30, step: 0.01, sliderMin: 0, sliderMax: 10, liveDefault: 'cpiInflation' },
  ],
  defaults: { currentPay: 60_000, period: 'year', hoursPerWeek: 40, raise: 4, raiseMode: 'percent', inflation: 3 },
  compute: computeRaise,
  summarize: (i, o) => ({
    headline: { label: 'New pay', value: usd(o.newPay, true), sub: `${PER[i.period]}, up ${usd(o.increase, true)} (${pct(o.raisePct)})`, raw: o.newPay, better: 'higher' },
    items: [
      { label: 'Extra per year', value: usd(o.annualIncrease, true), raw: o.annualIncrease, better: 'higher' },
      { label: 'Extra per month', value: usd(o.monthlyIncrease, true), raw: o.monthlyIncrease, better: 'higher' },
      { label: 'Extra per biweekly paycheck', value: usd(o.biweeklyIncrease, true), raw: o.biweeklyIncrease, better: 'higher' },
      { label: 'Raise after inflation', value: pct(o.realRaisePct), raw: o.realRaisePct, better: 'higher' },
    ],
  }),
  explain: (i, o) => {
    if (o.currentAnnual <= 0) return ['Enter your current pay to see what the raise is worth.'];
    const s = [`A ${pct(o.raisePct)} raise takes you from ${usd(o.currentAnnual)} to ${usd(o.newAnnual)} a year before tax: ${usd(o.monthlyIncrease, true)} more a month.`];
    if (o.realRaisePct < 0) s.push(`With prices up ${pct(i.inflation)} over the past year, the raise doesn’t keep up: in real terms your pay buys about ${pct(-o.realRaisePct)} less than before.`);
    else if (o.realRaisePct < 1) s.push(`Prices rose ${pct(i.inflation)} over the past year, so most of the raise covers higher costs. Your real raise is ${pct(o.realRaisePct)}.`);
    else s.push(`After ${pct(i.inflation)} inflation, your real raise is ${pct(o.realRaisePct)}, so your pay buys more than it did.`);
    s.push('Taxes take part of every raise; the paycheck calculator shows how much reaches your bank account.');
    return s;
  },
  steps: (i, o) => [
    {
      label: 'Raise per period',
      formula: i.raiseMode === 'percent' ? 'current pay × raise %' : 'dollar raise',
      substituted: i.raiseMode === 'percent' ? `${usd(i.currentPay, true)} × ${pct(i.raise)}` : usd(i.raise, true),
      result: usd(o.increase, true),
    },
    { label: 'New pay', formula: 'current pay + raise', substituted: `${usd(i.currentPay, true)} + ${usd(o.increase, true)}`, result: usd(o.newPay, true) },
    { label: 'Raise percentage', formula: 'raise ÷ current pay × 100', substituted: `${usd(o.increase, true)} ÷ ${usd(i.currentPay, true)} × 100`, result: pct(o.raisePct) },
    { label: 'Extra per year', formula: 'new annual pay − current annual pay', substituted: `${usd(o.newAnnual, true)} − ${usd(o.currentAnnual, true)}`, result: usd(o.annualIncrease, true) },
    {
      label: 'Raise after inflation',
      formula: '(1 + raise) ÷ (1 + inflation) − 1',
      substituted: `(1 + ${pct(o.raisePct)}) ÷ (1 + ${pct(i.inflation)}) − 1`,
      result: pct(o.realRaisePct),
    },
  ],
  answerSummary: (i, o) =>
    `A ${pct(o.raisePct)} raise on ${usd(i.currentPay, true)} ${PER[i.period]} brings your pay to ${usd(o.newPay, true)}, or ${usd(o.annualIncrease)} more a year; after ${pct(i.inflation)} inflation the real raise is ${pct(o.realRaisePct)}.`,
  ogValue: (_i, o) => `+${usd(o.annualIncrease)}/yr`,
  related: ['salary-to-hourly-calculator', 'paycheck-calculator', 'retirement-calculator', 'savings-goal-calculator', 'investment-calculator'],
  sources: [
    { title: 'Bureau of Labor Statistics: Consumer Price Index (CPI-U), via FRED (CPIAUCSL)', url: 'https://fred.stlouisfed.org/series/CPIAUCSL' },
    { title: 'Bureau of Labor Statistics: Employment Cost Index', url: 'https://www.bls.gov/eci/' },
    { title: 'Bureau of Labor Statistics: CPI Inflation Calculator', url: 'https://www.bls.gov/data/inflation_calculator.htm' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
