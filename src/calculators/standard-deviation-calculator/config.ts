import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeStdDev, parseData, type StdDevInput, type StdDevOutput } from './math.ts';

const v = (n: number | null, dp = 6) => (n === null ? '—' : num(n, dp));

const config: CalculatorConfig<StdDevInput, StdDevOutput> = {
  slug: 'standard-deviation-calculator',
  category: 'statistics',
  subtopic: 'Descriptive statistics',
  name: 'Standard Deviation Calculator',
  h1: 'Standard Deviation Calculator',
  intro: 'Paste a list of numbers to get the sample and population standard deviation, variance and mean, with every step shown.',
  metaTitle: 'Standard Deviation Calculator with Steps | Calcrafty',
  metaDescription:
    'Find the sample and population standard deviation, variance, mean and standard error of a data set, with a deviations table and every step of the working shown.',
  primaryKeyword: 'standard deviation calculator',
  secondaryKeywords: ['sample standard deviation calculator', 'population standard deviation calculator', 'variance calculator'],
  synonyms: ['sd', 'stdev', 'variance', 'sigma', 'mean', 'statistics', 'spread'],
  inputs: [
    {
      id: 'data',
      label: 'Your numbers',
      type: 'textarea',
      placeholder: 'e.g. 12, 15, 9, 20, 14',
      maxLength: 20_000,
      helpText: 'Separate values with commas, spaces or new lines. You can paste a column from a spreadsheet.',
      e2eValue: '3 7 7 19 24',
      validate: (s) => (parseData(s).values.length === 0 ? 'Enter at least one number.' : null),
    },
    {
      id: 'kind',
      label: 'My data is a',
      type: 'segmented',
      options: [
        { value: 'sample', label: 'Sample' },
        { value: 'population', label: 'Whole population' },
      ],
      helpText: 'Use “sample” unless your list includes every member of the group you care about.',
    },
  ],
  defaults: { data: '12, 15, 9, 20, 14, 18, 11', kind: 'sample' },
  compute: computeStdDev,
  summarize: (i, o) => ({
    headline: {
      label: i.kind === 'sample' ? 'Sample standard deviation (s)' : 'Population standard deviation (σ)',
      value: o.n === 0 ? '—' : v(i.kind === 'sample' ? o.sampleSd : o.populationSd),
      sub: o.error ?? `${o.n} values, mean ${v(o.mean)}`,
      raw: (i.kind === 'sample' ? o.sampleSd : o.populationSd) ?? undefined,
    },
    items: [
      { label: i.kind === 'sample' ? 'Population SD (σ)' : 'Sample SD (s)', value: v(i.kind === 'sample' ? o.populationSd : o.sampleSd) },
      { label: 'Mean', value: v(o.mean) },
      { label: 'Sample variance (s²)', value: v(o.sampleVariance) },
      { label: 'Population variance (σ²)', value: v(o.populationVariance) },
      { label: 'Standard error of the mean', value: v(o.standardError) },
      { label: 'Count (n)', value: String(o.n) },
      { label: 'Sum', value: v(o.sum) },
      { label: 'Median', value: v(o.median) },
      { label: 'Min / max', value: `${v(o.min)} / ${v(o.max)}` },
    ],
  }),
  explain: (i, o) => {
    if (o.n === 0) return ['Enter some numbers to see their standard deviation.'];
    const sd = i.kind === 'sample' ? o.sampleSd : o.populationSd;
    const s = [`The ${o.n} values average ${v(o.mean, 4)}, and a typical value sits about ${v(sd, 4)} away from that average.`];
    if (o.sampleSd !== null) s.push(`The sample standard deviation (${v(o.sampleSd, 4)}) divides by n − 1 = ${o.n - 1}, which corrects for estimating the mean from the same data; the population version divides by n and is a little smaller (${v(o.populationSd, 4)}).`);
    else s.push('With a single value, the sample standard deviation is undefined (it divides by n − 1 = 0).');
    if (o.error) s.push(o.error);
    return s;
  },
  steps: (i, o) =>
    o.n === 0
      ? []
      : [
          { label: 'Mean', formula: 'x̄ = Σx ÷ n', substituted: `${v(o.sum)} ÷ ${o.n}`, result: v(o.mean) },
          { label: 'Squared deviations', formula: 'Σ(x − x̄)²', substituted: o.deviations.slice(0, 8).map((d) => `(${v(d.x, 4)} − ${v(o.mean, 4)})²`).join(' + ') + (o.n > 8 ? ' + …' : ''), result: v(o.ss) },
          i.kind === 'sample'
            ? { label: 'Sample variance', formula: 's² = Σ(x − x̄)² ÷ (n − 1)', substituted: `${v(o.ss)} ÷ ${o.n - 1}`, result: v(o.sampleVariance) }
            : { label: 'Population variance', formula: 'σ² = Σ(x − x̄)² ÷ n', substituted: `${v(o.ss)} ÷ ${o.n}`, result: v(o.populationVariance) },
          i.kind === 'sample'
            ? { label: 'Sample standard deviation', formula: 's = √s²', substituted: `√${v(o.sampleVariance)}`, result: v(o.sampleSd) }
            : { label: 'Population standard deviation', formula: 'σ = √σ²', substituted: `√${v(o.populationVariance)}`, result: v(o.populationSd) },
        ],
  answerSummary: (_i, o) => `For the data 12, 15, 9, 20, 14, 18, 11, the mean is ${v(o.mean, 4)}, the sample standard deviation is ${v(o.sampleSd, 4)} and the population standard deviation is ${v(o.populationSd, 4)}.`,
  ogValue: (_i, o) => `s = ${v(o.sampleSd, 3)}`,
  related: ['percentage-calculator', 'scientific-calculator', 'fraction-calculator', 'gpa-calculator'],
  sources: [
    { title: 'NIST/SEMATECH e-Handbook of Statistical Methods: Measures of scale', url: 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda356.htm' },
    { title: 'NIST Statistical Reference Datasets (univariate summary statistics)', url: 'https://www.itl.nist.gov/div898/strd/univ/homepage.html' },
    { title: 'OpenStax Introductory Statistics: Measures of the spread of the data', url: 'https://openstax.org/books/introductory-statistics-2e/pages/2-7-measures-of-the-spread-of-the-data' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
