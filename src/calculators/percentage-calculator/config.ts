import type { CalculatorConfig, NumberInputDef } from '../../lib/types.ts';
import { num, pct } from '../../lib/format.ts';
import { computePercent, type PercentInput, type PercentMode, type PercentOutput } from './math.ts';

const BIG = 1e12;
const field = (id: NumberInputDef<PercentInput>['id'], label: string, mode: PercentMode, unit: 'none' | 'percent' | 'usd' = 'none'): NumberInputDef<PercentInput> => ({
  id,
  label,
  type: 'number',
  unit,
  min: unit === 'percent' ? -BIG : -BIG,
  max: BIG,
  step: 0.01,
  slider: false,
  group: mode,
  showIf: (i) => i.mode === mode,
});

const QUESTION: Record<PercentMode, (i: PercentInput) => string> = {
  of: (i) => `What is ${num(i.ofPct, 6)}% of ${num(i.ofValue, 6)}?`,
  whatPercent: (i) => `${num(i.part, 6)} is what percent of ${num(i.whole, 6)}?`,
  change: (i) => `Percent change from ${num(i.from, 6)} to ${num(i.to, 6)}`,
  off: (i) => `$${num(i.price, 2)} with ${num(i.offPct, 4)}% off`,
  increase: (i) => `${num(i.base, 6)} increased by ${num(i.upPct, 4)}%`,
};

const show = (o: PercentOutput) => (o.result === null ? '—' : o.isPercent ? pct(o.result, 6) : num(o.result, 6));

const config: CalculatorConfig<PercentInput, PercentOutput> = {
  slug: 'percentage-calculator',
  category: 'math',
  subtopic: 'Arithmetic',
  name: 'Percentage Calculator',
  h1: 'Percentage Calculator',
  intro: 'Work out X% of a number, what percent one number is of another, percent change, discounts and increases.',
  metaTitle: 'Percentage Calculator: Percent of, Change & Off | Calcrafty',
  metaDescription:
    'Free percentage calculator: find X% of a number, what percent one number is of another, percent increase or decrease, and sale prices, with the working shown.',
  primaryKeyword: 'percentage calculator',
  secondaryKeywords: ['percent calculator', 'percent change calculator', 'what percent of calculator'],
  synonyms: ['percent', 'percentage', 'discount', 'increase', 'decrease', 'tip'],
  inputs: [
    {
      id: 'mode',
      label: 'I want to find',
      type: 'select',
      options: [
        { value: 'of', label: 'X% of a number' },
        { value: 'whatPercent', label: 'What percent X is of Y' },
        { value: 'change', label: 'Percent change from X to Y' },
        { value: 'off', label: 'Price after a discount' },
        { value: 'increase', label: 'A number increased by X%' },
      ],
    },
    field('ofPct', 'Percent', 'of', 'percent'),
    field('ofValue', 'Of the number', 'of'),
    field('part', 'The number (part)', 'whatPercent'),
    field('whole', 'Is what percent of (whole)', 'whatPercent'),
    field('from', 'From (original value)', 'change'),
    field('to', 'To (new value)', 'change'),
    field('price', 'Original price', 'off', 'usd'),
    field('offPct', 'Discount', 'off', 'percent'),
    field('base', 'Starting number', 'increase'),
    field('upPct', 'Increase by', 'increase', 'percent'),
  ],
  defaults: { mode: 'of', ofPct: 15, ofValue: 80, part: 30, whole: 120, from: 50, to: 65, price: 120, offPct: 30, base: 200, upPct: 8 },
  compute: computePercent,
  summarize: (i, o) => ({
    headline: { label: QUESTION[i.mode](i), value: o.error ? '—' : show(o), sub: o.error ?? undefined, raw: o.result ?? undefined },
    items:
      i.mode === 'off'
        ? [{ label: 'You save', value: `$${num(o.difference ?? 0, 2)}` }]
        : i.mode === 'change'
          ? [
              { label: 'Difference', value: num(o.difference ?? 0, 6) },
              { label: 'Direction', value: (o.result ?? 0) > 0 ? 'Increase' : (o.result ?? 0) < 0 ? 'Decrease' : 'No change' },
            ]
          : i.mode === 'increase'
            ? [{ label: 'Amount added', value: num(o.difference ?? 0, 6) }]
            : i.mode === 'of'
              ? [{ label: 'What’s left', value: num(o.difference ?? 0, 6) }]
              : [],
  }),
  explain: (i, o) => {
    if (o.error) return [o.error];
    switch (i.mode) {
      case 'of':
        return [`${num(i.ofPct, 6)}% of ${num(i.ofValue, 6)} is ${show(o)}: multiply ${num(i.ofValue, 6)} by ${num(i.ofPct, 6)} and divide by 100.`];
      case 'whatPercent':
        return [`${num(i.part, 6)} is ${show(o)} of ${num(i.whole, 6)}: divide the part by the whole and multiply by 100.`];
      case 'change':
        return [`Going from ${num(i.from, 6)} to ${num(i.to, 6)} is a change of ${num(o.difference ?? 0, 6)}, which is ${show(o)} of the original value.`, 'Percent change always compares with the starting value, so a 50% drop followed by a 50% rise doesn’t get you back to where you started.'];
      case 'off':
        return [`${num(i.offPct, 4)}% off $${num(i.price, 2)} saves $${num(o.difference ?? 0, 2)}, so you pay $${num(o.result ?? 0, 2)}.`];
      case 'increase':
        return [`Adding ${num(i.upPct, 4)}% to ${num(i.base, 6)} adds ${num(o.difference ?? 0, 6)}, giving ${show(o)}.`];
    }
  },
  steps: (i, o) => {
    switch (i.mode) {
      case 'of':
        return [{ label: 'X% of Y', formula: 'Y × X ÷ 100', substituted: `${num(i.ofValue, 6)} × ${num(i.ofPct, 6)} ÷ 100`, result: show(o) }];
      case 'whatPercent':
        return [{ label: 'Part as a percent of the whole', formula: 'part ÷ whole × 100', substituted: `${num(i.part, 6)} ÷ ${num(i.whole, 6)} × 100`, result: show(o) }];
      case 'change':
        return [
          { label: 'Difference', formula: 'new − original', substituted: `${num(i.to, 6)} − ${num(i.from, 6)}`, result: num(o.difference ?? 0, 6) },
          { label: 'Percent change', formula: 'difference ÷ |original| × 100', substituted: `${num(o.difference ?? 0, 6)} ÷ ${num(Math.abs(i.from), 6)} × 100`, result: show(o) },
        ];
      case 'off':
        return [
          { label: 'Amount saved', formula: 'price × discount ÷ 100', substituted: `${num(i.price, 2)} × ${num(i.offPct, 4)} ÷ 100`, result: `$${num(o.difference ?? 0, 2)}` },
          { label: 'Sale price', formula: 'price − amount saved', substituted: `${num(i.price, 2)} − ${num(o.difference ?? 0, 2)}`, result: `$${num(o.result ?? 0, 2)}` },
        ];
      case 'increase':
        return [
          { label: 'Amount added', formula: 'number × percent ÷ 100', substituted: `${num(i.base, 6)} × ${num(i.upPct, 4)} ÷ 100`, result: num(o.difference ?? 0, 6) },
          { label: 'New value', formula: 'number + amount added', substituted: `${num(i.base, 6)} + ${num(o.difference ?? 0, 6)}`, result: show(o) },
        ];
    }
  },
  answerSummary: (i, o) => `${num(i.ofPct, 6)}% of ${num(i.ofValue, 6)} is ${show(o)}. To find a percentage of any number, multiply the number by the percentage and divide by 100.`,
  ogValue: (_i, o) => show(o),
  related: ['fraction-calculator', 'scientific-calculator', 'compound-interest-calculator', 'gpa-calculator'],
  sources: [
    { title: 'NIST Guide for the Use of the SI: percent (%) as a number', url: 'https://www.nist.gov/pml/special-publication-811' },
    { title: 'Khan Academy: Percentages', url: 'https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-ratios-prop-topic' },
    { title: 'U.S. Bureau of Labor Statistics: How to calculate percent change', url: 'https://www.bls.gov/cpi/factsheets/cpi-math-calculations.pdf' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
