import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeGravel, type GravelInput, type GravelOutput } from './math.ts';

const config: CalculatorConfig<GravelInput, GravelOutput> = {
  slug: 'gravel-calculator',
  category: 'construction',
  subtopic: 'Area and volume',
  name: 'Gravel Calculator',
  h1: 'Gravel Calculator',
  intro: 'How much gravel or crushed stone you need for a driveway, patio or path, in cubic yards, tons and bags.',
  metaTitle: 'Gravel Calculator: Cubic Yards and Tons Needed',
  metaDescription:
    'Calculate how much gravel or crushed stone you need in cubic yards and tons for a driveway, patio or path, with extra for compaction and the number of bags.',
  primaryKeyword: 'gravel calculator',
  secondaryKeywords: ['how much gravel do i need', 'crushed stone calculator', 'gravel tons calculator', 'driveway gravel calculator'],
  synonyms: ['crushed stone', 'pea gravel', 'river rock', 'road base', 'aggregate', 'tons of gravel'],
  inputs: [
    { id: 'length', label: 'Length', type: 'number', unit: 'ft', min: 0, max: 10_000, step: 0.5, sliderMax: 200, group: 'dims' },
    { id: 'width', label: 'Width', type: 'number', unit: 'ft', min: 0, max: 10_000, step: 0.5, sliderMax: 50, group: 'dims' },
    { id: 'depth', label: 'Depth', type: 'number', unit: 'in', min: 0, max: 120, step: 0.5, sliderMax: 12, helpText: '2 to 3 inches for paths and patios, 4 to 6 inches for driveways (often in layers).' },
    { id: 'extra', label: 'Extra for compaction', type: 'number', unit: 'percent', min: 0, max: 50, step: 1, sliderMax: 25, helpText: 'Gravel settles when compacted; 10% is a common allowance.' },
    { id: 'density', label: 'Weight per cubic yard (tons)', type: 'number', unit: 'none', min: 0.1, max: 5, step: 0.05, slider: false, advanced: true, helpText: 'Most gravel and crushed stone weighs about 1.4 to 1.7 tons per cubic yard. Ask your supplier for theirs.' },
    { id: 'bagVolume', label: 'Bag size (cu ft)', type: 'number', unit: 'none', min: 0.1, max: 10, step: 0.05, slider: false, advanced: true, helpText: 'Check the bag; 0.5 cu ft is common for bagged gravel.' },
  ],
  defaults: { length: 20, width: 10, depth: 3, extra: 10, density: 1.4, bagVolume: 0.5 },
  compute: computeGravel,
  summarize: (i, o) => ({
    headline: { label: 'Gravel needed', value: `${num(o.cubicYards, 2)} cubic yards`, sub: `about ${num(o.tons, 2)} tons, including ${num(i.extra, 0)}% for compaction`, raw: o.cubicYards },
    items: [
      { label: 'Weight', value: `${num(o.tons, 2)} tons (${num(o.pounds, 0)} lb)`, raw: o.tons },
      { label: 'Cubic feet', value: `${num(o.cubicFeet, 2)} cu ft (${num(o.cubicMeters, 2)} m³)`, raw: o.cubicFeet },
      { label: `Bags of ${num(i.bagVolume, 2)} cu ft`, value: `${num(o.bags, 0)} bags`, raw: o.bags },
      { label: 'Area covered', value: `${num(o.area, 0)} sq ft`, raw: o.area },
    ],
  }),
  explain: (i, o) => {
    if (o.cubicFeet <= 0) return ['Enter the area and depth to see how much gravel you need.'];
    const s = [`Covering ${num(o.area, 0)} sq ft ${num(i.depth, 1)} inches deep takes ${num(o.netCubicYards, 2)} cubic yards; with ${num(i.extra, 0)}% extra for compaction, order ${num(o.cubicYards, 2)} cubic yards, about ${num(o.tons, 2)} tons at ${num(i.density, 2)} tons per cubic yard.`];
    s.push(
      o.cubicYards >= 1
        ? 'Bulk delivery from a landscape or aggregate supplier is usually far cheaper than bags at this size. Suppliers sell by the ton or by the cubic yard, so ask which and convert with the figures above.'
        : `For a small job like this, ${num(o.bags, 0)} bags from a home-improvement store may be easier than a bulk delivery.`,
    );
    return s;
  },
  steps: (i, o) => [
    { label: 'Area', formula: 'length × width', substituted: `${num(i.length, 2)} × ${num(i.width, 2)}`, result: `${num(o.area, 2)} sq ft` },
    { label: 'Volume', formula: 'area × depth (in) ÷ 12, + compaction', substituted: `${num(o.area, 2)} × ${num(i.depth, 2)} ÷ 12 + ${num(i.extra, 0)}%`, result: `${num(o.cubicFeet, 2)} cu ft` },
    { label: 'Cubic yards', formula: 'cubic feet ÷ 27', substituted: `${num(o.cubicFeet, 2)} ÷ 27`, result: `${num(o.cubicYards, 2)} yd³` },
    { label: 'Tons', formula: 'cubic yards × tons per cubic yard', substituted: `${num(o.cubicYards, 2)} × ${num(i.density, 2)}`, result: `${num(o.tons, 2)} tons` },
    { label: 'Bags', formula: 'cubic feet ÷ bag size, rounded up', substituted: `${num(o.cubicFeet, 2)} ÷ ${num(i.bagVolume, 2)}`, result: `${num(o.bags, 0)} bags` },
  ],
  answerSummary: (i, o) => `A ${num(o.area, 0)} sq ft area ${num(i.depth, 1)} inches deep needs about ${num(o.cubicYards, 2)} cubic yards of gravel with ${num(i.extra, 0)}% for compaction, roughly ${num(o.tons, 2)} tons.`,
  ogValue: (_i, o) => `${num(o.tons, 2)} tons`,
  related: ['concrete-calculator', 'flooring-calculator', 'roofing-calculator', 'paint-calculator', 'heloc-calculator'],
  sources: [
    { title: 'NIST Handbook 44: Specifications, Tolerances, and Other Technical Requirements for Weighing and Measuring Devices', url: 'https://www.nist.gov/pml/owm/nist-handbook-44-current-edition' },
    { title: 'NIST Special Publication 811: Guide for the Use of the SI (conversion factors)', url: 'https://www.nist.gov/pml/special-publication-811' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
