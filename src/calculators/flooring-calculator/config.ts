import type { CalculatorConfig } from '../../lib/types.ts';
import { num, usd } from '../../lib/format.ts';
import { computeFlooring, type FlooringInput, type FlooringOutput } from './math.ts';

const config: CalculatorConfig<FlooringInput, FlooringOutput> = {
  slug: 'flooring-calculator',
  category: 'construction',
  subtopic: 'Materials',
  name: 'Flooring Calculator',
  h1: 'Flooring Calculator',
  intro: 'How many square feet and boxes of flooring a room needs, with a waste allowance for cuts, and what it will cost.',
  metaTitle: 'Flooring Calculator: Square Feet, Boxes and Cost',
  metaDescription:
    'Calculate how much flooring you need: room square footage plus a waste allowance, the boxes to buy and the cost, for laminate, vinyl, hardwood or tile.',
  primaryKeyword: 'flooring calculator',
  secondaryKeywords: ['how much flooring do i need', 'laminate flooring calculator', 'vinyl plank flooring calculator', 'square footage calculator for flooring'],
  synonyms: ['laminate', 'vinyl plank', 'lvp', 'hardwood floor', 'boxes of flooring', 'square feet'],
  inputs: [
    { id: 'length', label: 'Room length', type: 'number', unit: 'ft', min: 0, max: 1_000, step: 0.5, sliderMax: 50, group: 'room' },
    { id: 'width', label: 'Room width', type: 'number', unit: 'ft', min: 0, max: 1_000, step: 0.5, sliderMax: 50, group: 'room' },
    { id: 'extraArea', label: 'Extra area, e.g. a closet (sq ft)', type: 'number', unit: 'none', min: 0, max: 100_000, step: 1, slider: false },
    { id: 'waste', label: 'Waste allowance', type: 'number', unit: 'percent', min: 0, max: 50, step: 1, sliderMax: 25, helpText: '10% for straight layouts; 15% or more for diagonal, herringbone or rooms with many corners.' },
    { id: 'boxCoverage', label: 'Coverage per box (sq ft)', type: 'number', unit: 'none', min: 0, max: 1_000, step: 0.01, slider: false, group: 'box', helpText: 'On the box label.' },
    { id: 'price', label: 'Price per sq ft', type: 'number', unit: 'usd', min: 0, max: 1_000, step: 0.01, sliderMax: 20, group: 'box' },
  ],
  defaults: { length: 15, width: 12, extraArea: 0, waste: 10, boxCoverage: 20, price: 3.5 },
  compute: computeFlooring,
  summarize: (i, o) => ({
    headline: { label: 'Boxes to buy', value: `${num(o.boxes, 0)} boxes`, sub: `${num(o.purchasedArea, 2)} sq ft for a ${num(o.area, 2)} sq ft floor`, raw: o.boxes },
    items: [
      { label: 'Floor area', value: `${num(o.area, 2)} sq ft`, raw: o.area },
      { label: `With ${num(i.waste, 0)}% waste`, value: `${num(o.areaWithWaste, 2)} sq ft`, raw: o.areaWithWaste },
      { label: 'Flooring cost', value: usd(o.cost, true), raw: o.cost, better: 'lower' },
      { label: 'Cost per sq ft of floor covered', value: usd(o.costPerFloorSqFt, true), raw: o.costPerFloorSqFt, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.area <= 0) return ['Enter the room size to see how much flooring you need.'];
    const s = [`The floor is ${num(o.area, 2)} sq ft. Adding ${num(i.waste, 0)}% for cuts and mistakes makes ${num(o.areaWithWaste, 2)} sq ft, which is ${num(o.boxes, 0)} boxes of ${num(i.boxCoverage, 2)} sq ft.`];
    if (i.price > 0) s.push(`At ${usd(i.price, true)} per sq ft, the flooring itself costs ${usd(o.cost, true)}. Underlayment, trim, transitions and installation are extra.`);
    s.push('Buy all the boxes at once from the same production lot, so the color and finish match, and keep a spare box for future repairs.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Floor area', formula: 'length × width + extra area', substituted: `${num(i.length, 2)} × ${num(i.width, 2)} + ${num(i.extraArea, 2)}`, result: `${num(o.area, 2)} sq ft` },
    { label: 'Add waste', formula: 'area × (1 + waste %)', substituted: `${num(o.area, 2)} + ${num(i.waste, 0)}%`, result: `${num(o.areaWithWaste, 2)} sq ft` },
    { label: 'Boxes', formula: 'area with waste ÷ coverage per box, rounded up', substituted: `${num(o.areaWithWaste, 2)} ÷ ${num(i.boxCoverage, 2)}`, result: `${num(o.boxes, 0)} boxes` },
    { label: 'Cost', formula: 'boxes × coverage per box × price per sq ft', substituted: `${num(o.purchasedArea, 2)} sq ft × ${usd(i.price, true)}`, result: usd(o.cost, true) },
  ],
  answerSummary: (i, o) => `A ${num(o.area, 0)} sq ft floor with ${num(i.waste, 0)}% waste needs ${num(o.areaWithWaste, 0)} sq ft of flooring, or ${num(o.boxes, 0)} boxes, costing about ${usd(o.cost)}.`,
  ogValue: (_i, o) => `${num(o.boxes, 0)} boxes`,
  related: ['paint-calculator', 'concrete-calculator', 'roofing-calculator', 'gravel-calculator', 'heloc-calculator'],
  sources: [
    { title: 'National Wood Flooring Association', url: 'https://nwfa.org/' },
    { title: 'Tile Council of North America', url: 'https://www.tcnatile.com/' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
