import type { CalculatorConfig } from '../../lib/types.ts';
import { num, pct, usd } from '../../lib/format.ts';
import { computeInflation, CURRENT_YEAR, MIN_YEAR, yearOutOfRange, type InflationInput, type InflationOutput } from './math.ts';
import { CPI_LATEST } from './cpi.ts';

const config: CalculatorConfig<InflationInput, InflationOutput> = {
  slug: 'inflation-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'Inflation Calculator',
  h1: 'Inflation Calculator',
  intro: `What a dollar amount from any year since ${MIN_YEAR} is worth today, using official Consumer Price Index data, or what today’s prices could be in the future.`,
  metaTitle: 'Inflation Calculator: US Dollar Value Since 1913 (CPI)',
  metaDescription:
    'See what money from any year since 1913 is worth today using official CPI data, the total and average inflation between two years, and future prices.',
  primaryKeyword: 'inflation calculator',
  secondaryKeywords: ['cpi inflation calculator', 'value of a dollar calculator', 'buying power calculator', 'dollar value over time'],
  synonyms: ['cpi', 'purchasing power', 'cost of living', 'price index', 'what is it worth today'],
  inputs: [
    {
      id: 'mode',
      label: 'I want to',
      type: 'segmented',
      options: [
        { value: 'past', label: 'Compare two years' },
        { value: 'future', label: 'Project the future' },
      ],
    },
    { id: 'amount', label: 'Amount', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 1, sliderMax: 100_000 },
    { id: 'fromYear', label: 'From year', type: 'number', unit: 'none', min: MIN_YEAR, max: CURRENT_YEAR, step: 1, integer: true, slider: false, group: 'years', showIf: (i) => i.mode === 'past' },
    { id: 'toYear', label: 'To year', type: 'number', unit: 'none', min: MIN_YEAR, max: CURRENT_YEAR, step: 1, integer: true, slider: false, group: 'years', showIf: (i) => i.mode === 'past', helpText: `${CURRENT_YEAR} uses the latest index (${CPI_LATEST.month}).` },
    { id: 'rate', label: 'Expected inflation', type: 'number', unit: 'percent', min: -5, max: 30, step: 0.01, sliderMin: 0, sliderMax: 10, liveDefault: 'cpiInflation', group: 'future', showIf: (i) => i.mode === 'future' },
    { id: 'years', label: 'Years from now', type: 'number', unit: 'years', min: 0, max: 100, step: 1, integer: true, sliderMax: 50, group: 'future', showIf: (i) => i.mode === 'future' },
  ],
  defaults: { mode: 'past', amount: 100, fromYear: 2000, toYear: CURRENT_YEAR, rate: 3, years: 10 },
  validate: (i) => {
    if (i.mode !== 'past') return [];
    const e: { id: 'fromYear' | 'toYear'; message: string }[] = [];
    if (yearOutOfRange(i.fromYear)) e.push({ id: 'fromYear', message: `Choose a year from ${MIN_YEAR} to ${CURRENT_YEAR}.` });
    if (yearOutOfRange(i.toYear)) e.push({ id: 'toYear', message: `Choose a year from ${MIN_YEAR} to ${CURRENT_YEAR}.` });
    return e;
  },
  compute: computeInflation,
  summarize: (i, o) =>
    i.mode === 'future'
      ? {
          headline: { label: `Cost in ${o.span} years`, value: usd(o.value, true), sub: `for what costs ${usd(i.amount, true)} today, at ${pct(i.rate)} a year`, raw: o.value },
          items: [
            { label: 'Total price increase', value: pct(o.cumulative), raw: o.cumulative },
            { label: `${usd(i.amount)} then, in today’s dollars`, value: usd(o.todaysValue, true), raw: o.todaysValue, better: 'higher' },
            { label: 'Purchasing power of $1', value: usd(o.purchasingPower, true), raw: o.purchasingPower, better: 'higher' },
          ],
        }
      : {
          headline: { label: `Worth in ${o.toLabel}`, value: usd(o.value, true), sub: `${usd(i.amount, true)} in ${i.fromYear}`, raw: o.value },
          items: [
            { label: 'Total inflation', value: pct(o.cumulative), raw: o.cumulative },
            { label: 'Average inflation per year', value: pct(o.averageRate), raw: o.averageRate },
            { label: `CPI ${i.fromYear} → ${o.toLabel}`, value: `${num(o.cpiFrom, 3)} → ${num(o.cpiTo, 3)}` },
          ],
        },
  explain: (i, o) => {
    if (i.mode === 'future')
      return [
        `At ${pct(i.rate)} a year, something that costs ${usd(i.amount, true)} today would cost about ${usd(o.value, true)} in ${o.span} years. Put the other way, ${usd(i.amount, true)} then would buy only what ${usd(o.todaysValue, true)} buys now.`,
        'Inflation rarely stays constant, so treat this as a planning estimate and test a higher and a lower rate.',
      ];
    if (o.span === 0) return ['Pick two different years to see how prices changed.'];
    return o.span > 0
      ? [
          `Prices rose ${pct(o.cumulative)} between ${i.fromYear} and ${o.toLabel}, so ${usd(i.amount, true)} in ${i.fromYear} had the same buying power as ${usd(o.value, true)} in ${o.toLabel}.`,
          `That's an average of ${pct(o.averageRate)} a year. Savings that earned less than that after tax lost buying power over the period.`,
        ]
      : [`${usd(i.amount, true)} in ${i.fromYear} had the same buying power as ${usd(o.value, true)} in ${o.toLabel}, when prices were lower.`];
  },
  steps: (i, o) =>
    i.mode === 'future'
      ? [
          { label: 'Future cost', formula: 'amount × (1 + inflation)^years', substituted: `${usd(i.amount, true)} × (1 + ${pct(i.rate)})^${o.span}`, result: usd(o.value, true) },
          { label: 'Value in today’s dollars', formula: 'amount ÷ (1 + inflation)^years', substituted: `${usd(i.amount, true)} ÷ (1 + ${pct(i.rate)})^${o.span}`, result: usd(o.todaysValue, true) },
        ]
      : [
          { label: 'Adjusted value', formula: 'amount × CPI(to) ÷ CPI(from)', substituted: `${usd(i.amount, true)} × ${num(o.cpiTo, 3)} ÷ ${num(o.cpiFrom, 3)}`, result: usd(o.value, true) },
          { label: 'Total inflation', formula: '(CPI(to) ÷ CPI(from) − 1) × 100', substituted: `(${num(o.cpiTo, 3)} ÷ ${num(o.cpiFrom, 3)} − 1) × 100`, result: pct(o.cumulative) },
          { label: 'Average per year', formula: '(later CPI ÷ earlier CPI)^(1 ÷ years) − 1', substituted: `over ${Math.abs(o.span)} years`, result: pct(o.averageRate) },
        ],
  answerSummary: (i, o) =>
    i.mode === 'future'
      ? `At ${pct(i.rate)} inflation, ${usd(i.amount, true)} of today's prices becomes ${usd(o.value, true)} in ${o.span} years.`
      : `${usd(i.amount, true)} in ${i.fromYear} has the same buying power as ${usd(o.value, true)} in ${o.toLabel}, based on the Consumer Price Index.`,
  ogValue: (_i, o) => usd(o.value, true),
  related: ['pay-raise-calculator', 'compound-interest-calculator', 'retirement-calculator', 'investment-calculator', 'cd-calculator'],
  sources: [
    { title: 'U.S. Bureau of Labor Statistics: Consumer Price Index for All Urban Consumers (CPI-U), via FRED (CPIAUCNS)', url: 'https://fred.stlouisfed.org/series/CPIAUCNS' },
    { title: 'U.S. Bureau of Labor Statistics: CPI Inflation Calculator', url: 'https://www.bls.gov/data/inflation_calculator.htm' },
    { title: 'U.S. Bureau of Labor Statistics: Consumer Price Index frequently asked questions', url: 'https://www.bls.gov/cpi/questions-and-answers.htm' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
