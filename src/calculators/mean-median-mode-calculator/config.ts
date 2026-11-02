import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { parseData } from '../standard-deviation-calculator/math.ts';
import { computeMmm, type MmmInput, type MmmOutput } from './math.ts';

const list = (xs: number[]) => (xs.length ? xs.map((x) => num(x, 10)).join(', ') : 'none');

const config: CalculatorConfig<MmmInput, MmmOutput> = {
  slug: 'mean-median-mode-calculator',
  category: 'statistics',
  subtopic: 'Descriptive statistics',
  name: 'Mean, Median and Mode Calculator',
  h1: 'Mean, Median and Mode Calculator',
  intro: 'The mean, median, mode and range of any list of numbers, with the sorted list and every step shown.',
  metaTitle: 'Mean, Median, Mode and Range Calculator',
  metaDescription:
    'Find the mean, median, mode and range of a list of numbers instantly. Paste values from a spreadsheet and see the sorted list, the sum and each step worked out.',
  primaryKeyword: 'mean median mode calculator',
  secondaryKeywords: ['average calculator', 'median calculator', 'mode calculator', 'mean median mode and range calculator'],
  synonyms: ['average', 'arithmetic mean', 'middle value', 'most common value', 'central tendency'],
  inputs: [
    {
      id: 'data',
      label: 'Your numbers',
      type: 'textarea',
      placeholder: 'e.g. 2, 4, 4, 5, 7, 9',
      maxLength: 20_000,
      helpText: 'Separate values with commas, spaces or new lines. You can paste a column from a spreadsheet.',
      e2eValue: '3 7 7 19 24',
      validate: (s) => (parseData(s).values.length === 0 ? 'Enter at least one number.' : null),
    },
  ],
  defaults: { data: '72, 85, 90, 66, 85, 78, 94, 85, 70, 88' },
  compute: computeMmm,
  summarize: (_i, o) => ({
    headline: { label: 'Mean (average)', value: num(o.mean, 4), sub: `of ${o.count} values`, raw: o.mean },
    items: [
      { label: 'Median', value: num(o.median, 4), raw: o.median },
      { label: o.modes.length > 1 ? 'Modes' : 'Mode', value: o.modes.length ? `${list(o.modes)} (${o.modeCount} times)` : 'No mode (every value is unique)' },
      { label: 'Range', value: `${num(o.range, 4)} (${num(o.min, 4)} to ${num(o.max, 4)})`, raw: o.range },
      { label: 'Sum', value: num(o.sum, 4), raw: o.sum },
    ],
  }),
  explain: (_i, o) => {
    if (o.count === 0) return ['Enter some numbers to see the results.'];
    const s = [`The ${o.count} values add up to ${num(o.sum, 4)}, so the mean is ${num(o.sum, 4)} ÷ ${o.count} = ${num(o.mean, 4)}. The median, the middle value once they're sorted, is ${num(o.median, 4)}.`];
    if (Math.abs(o.mean - o.median) > 0.1 * Math.max(1, Math.abs(o.median)))
      s.push(o.mean > o.median ? 'The mean is noticeably higher than the median, a sign that a few large values are pulling the average up.' : 'The mean is noticeably lower than the median, a sign that a few small values are pulling the average down.');
    else s.push('The mean and median are close, which suggests the values are fairly evenly spread on both sides of the center.');
    if (o.invalid.length) s.push(`Ignored entries that aren't numbers: ${o.invalid.slice(0, 5).join(', ')}.`);
    return s;
  },
  steps: (_i, o) => [
    { label: 'Sort the values', formula: 'smallest to largest', substituted: o.sorted.length > 30 ? `${list(o.sorted.slice(0, 30))}, …` : list(o.sorted), result: `${o.count} values` },
    { label: 'Mean', formula: 'sum ÷ count', substituted: `${num(o.sum, 4)} ÷ ${o.count}`, result: num(o.mean, 4) },
    { label: 'Median', formula: o.count % 2 ? 'the middle value' : 'average of the two middle values', substituted: `position ${o.count % 2 ? (o.count + 1) / 2 : `${o.count / 2} and ${o.count / 2 + 1}`}`, result: num(o.median, 4) },
    { label: 'Mode', formula: 'the value(s) that appear most often', substituted: o.modes.length ? `appears ${o.modeCount} times` : 'every value appears once', result: list(o.modes) },
    { label: 'Range', formula: 'largest − smallest', substituted: `${num(o.max, 4)} − ${num(o.min, 4)}`, result: num(o.range, 4) },
  ],
  answerSummary: (_i, o) => `For the ${o.count} sample values, the mean is ${num(o.mean, 4)}, the median is ${num(o.median, 4)}, the mode is ${list(o.modes)} and the range is ${num(o.range, 4)}.`,
  ogValue: (_i, o) => `Mean ${num(o.mean, 2)}`,
  related: ['standard-deviation-calculator', 'percentage-calculator', 'final-grade-calculator', 'gpa-calculator', 'scientific-calculator'],
  sources: [
    { title: 'NIST/SEMATECH e-Handbook of Statistical Methods: Measures of location', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda351.htm' },
    { title: 'U.S. Census Bureau: Why the Census Bureau reports median income', url: 'https://www.census.gov/topics/income-poverty/income/guidance/overview.html' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
