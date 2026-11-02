import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeRoofing, type RoofingInput, type RoofingOutput } from './math.ts';

const config: CalculatorConfig<RoofingInput, RoofingOutput> = {
  slug: 'roofing-calculator',
  category: 'construction',
  subtopic: 'Roofing and framing',
  name: 'Roofing Calculator',
  h1: 'Roofing Calculator',
  intro: 'Your roof’s area from the house footprint and pitch, in squares, with the bundles of shingles to buy.',
  metaTitle: 'Roofing Calculator: Roof Area, Squares and Shingles',
  metaDescription:
    'Calculate your roof area from the house footprint, overhang and pitch, then convert it to roofing squares and bundles of shingles, with a waste allowance.',
  primaryKeyword: 'roofing calculator',
  secondaryKeywords: ['roof square footage calculator', 'shingle calculator', 'how many bundles of shingles do i need', 'roof pitch calculator'],
  synonyms: ['roof squares', 'shingles', 'bundles', 'roof area', 'pitch factor', 'reroof'],
  inputs: [
    { id: 'length', label: 'House length', type: 'number', unit: 'ft', min: 0, max: 1_000, step: 0.5, sliderMax: 120, group: 'dims', helpText: 'Measured outside walls, on the ground.' },
    { id: 'width', label: 'House width', type: 'number', unit: 'ft', min: 0, max: 1_000, step: 0.5, sliderMax: 80, group: 'dims' },
    { id: 'pitch', label: 'Roof pitch (rise per 12 in)', type: 'number', unit: 'in', min: 0, max: 24, step: 0.5, sliderMax: 18, helpText: '4 to 6 is common; 12 is a 45° roof.' },
    { id: 'overhang', label: 'Overhang on each side', type: 'number', unit: 'in', min: 0, max: 60, step: 1, slider: false },
    { id: 'waste', label: 'Waste allowance', type: 'number', unit: 'percent', min: 0, max: 50, step: 1, sliderMax: 25, helpText: 'About 10% for a simple gable roof, 15% or more for hips, valleys and dormers.' },
    { id: 'bundlesPerSquare', label: 'Bundles per square', type: 'number', unit: 'count', min: 1, max: 10, step: 1, integer: true, slider: false, advanced: true, helpText: 'Most asphalt shingles come 3 bundles to a square; check the wrapper.' },
  ],
  defaults: { length: 40, width: 30, overhang: 12, pitch: 6, waste: 10, bundlesPerSquare: 3 },
  compute: computeRoofing,
  summarize: (i, o) => ({
    headline: { label: 'Roof area', value: `${num(o.roofArea, 0)} sq ft`, sub: `${num(o.squares, 2)} squares at a ${num(i.pitch, 1)}/12 pitch`, raw: o.roofArea },
    items: [
      { label: `Squares with ${num(i.waste, 0)}% waste`, value: num(o.squaresWithWaste, 2), raw: o.squaresWithWaste },
      { label: 'Bundles of shingles', value: `${num(o.bundles, 0)} bundles`, raw: o.bundles },
      { label: 'Pitch', value: `${num(i.pitch, 1)}/12 (${num(o.pitchDegrees, 1)}°), factor ${num(o.pitchFactor, 4)}`, raw: o.pitchFactor },
      { label: 'Footprint with overhang', value: `${num(o.planArea, 0)} sq ft`, raw: o.planArea },
    ],
  }),
  explain: (i, o) => {
    if (o.roofArea <= 0) return ['Enter the house size and roof pitch to see the roof area.'];
    const s = [`With the overhang, the roof covers ${num(o.planArea, 0)} sq ft of ground. A ${num(i.pitch, 1)}/12 pitch makes the sloped surface ${num(o.pitchFactor, 4)} times larger, so the roof is ${num(o.roofArea, 0)} sq ft, or ${num(o.squares, 2)} squares.`];
    s.push(`Adding ${num(i.waste, 0)}% for cutting and starter rows gives ${num(o.squaresWithWaste, 2)} squares: buy ${num(o.bundles, 0)} bundles. Ridge caps, underlayment, drip edge and flashing are counted separately.`);
    s.push('The same pitch on every plane gives the same area whether the roof is a gable or a hip. Different pitches, dormers or porches should be measured as separate sections and added together.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Footprint with overhang', formula: '(length + 2 × overhang) × (width + 2 × overhang)', substituted: `(${num(i.length, 2)} ft + 2 × ${num(i.overhang, 0)} in) × (${num(i.width, 2)} ft + 2 × ${num(i.overhang, 0)} in)`, result: `${num(o.planArea, 2)} sq ft` },
    { label: 'Pitch factor', formula: '√(1 + (rise ÷ 12)²)', substituted: `√(1 + (${num(i.pitch, 1)} ÷ 12)²)`, result: num(o.pitchFactor, 4) },
    { label: 'Roof area', formula: 'footprint × pitch factor', substituted: `${num(o.planArea, 2)} × ${num(o.pitchFactor, 4)}`, result: `${num(o.roofArea, 2)} sq ft` },
    { label: 'Squares', formula: 'roof area ÷ 100, + waste', substituted: `${num(o.roofArea, 2)} ÷ 100 + ${num(i.waste, 0)}%`, result: num(o.squaresWithWaste, 2) },
    { label: 'Bundles', formula: 'squares × bundles per square, rounded up', substituted: `${num(o.squaresWithWaste, 2)} × ${num(i.bundlesPerSquare, 0)}`, result: `${num(o.bundles, 0)} bundles` },
  ],
  answerSummary: (i, o) => `A ${num(i.length, 0)} × ${num(i.width, 0)} ft house with a ${num(i.pitch, 1)}/12 roof and ${num(i.overhang, 0)}-inch overhangs has about ${num(o.roofArea, 0)} sq ft of roof, ${num(o.squares, 2)} squares; with ${num(i.waste, 0)}% waste that's ${num(o.bundles, 0)} bundles of shingles.`,
  ogValue: (_i, o) => `${num(o.squares, 1)} squares`,
  related: ['paint-calculator', 'concrete-calculator', 'flooring-calculator', 'gravel-calculator', 'heloc-calculator'],
  sources: [
    { title: 'National Roofing Contractors Association (NRCA)', url: 'https://www.nrca.net/' },
    { title: 'Asphalt Roofing Manufacturers Association (ARMA)', url: 'https://www.asphaltroofing.org/' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
