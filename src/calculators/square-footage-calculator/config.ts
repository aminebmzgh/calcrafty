import type { CalculatorConfig } from '../../lib/types.ts';
import { num, usd } from '../../lib/format.ts';
import { computeSquareFootage, type LengthUnit, type Shape, type SquareFootageInput, type SquareFootageOutput } from './math.ts';

export const SHAPE_NAMES: Record<Shape, string> = { rectangle: 'Rectangle', lshape: 'L-shape', circle: 'Circle', triangle: 'Triangle' };
const UNIT_NAMES: Record<LengthUnit, string> = { ft: 'feet', in: 'inches', yd: 'yards', m: 'meters', cm: 'centimeters' };
const is = (...s: Shape[]) => (i: SquareFootageInput) => s.includes(i.shape);
const dim = { type: 'number', unit: 'none', min: 0, max: 1_000_000, step: 0.1, slider: false } as const;
const sq = (n: number) => num(n, 2);

const formula = (i: SquareFootageInput): { f: string; s: string } => {
  const u = i.unit;
  switch (i.shape) {
    case 'rectangle':
      return { f: 'area = length × width', s: `${num(i.length, 2)} ${u} × ${num(i.width, 2)} ${u}` };
    case 'lshape':
      return { f: 'area = (length₁ × width₁) + (length₂ × width₂)', s: `(${num(i.length, 2)} × ${num(i.width, 2)}) + (${num(i.length2, 2)} × ${num(i.width2, 2)}) ${u}²` };
    case 'circle':
      return { f: 'area = π × (diameter ÷ 2)²', s: `π × (${num(i.diameter, 2)} ÷ 2)² ${u}²` };
    case 'triangle':
      return { f: 'area = base × height ÷ 2', s: `${num(i.base, 2)} × ${num(i.height, 2)} ÷ 2 ${u}²` };
  }
};

const config: CalculatorConfig<SquareFootageInput, SquareFootageOutput> = {
  slug: 'square-footage-calculator',
  category: 'construction',
  subtopic: 'Area and volume',
  name: 'Square Footage Calculator',
  h1: 'Square Footage Calculator',
  intro: 'The square footage of a room, an L-shaped space, a circle or a triangle, from measurements in feet, inches, yards or meters.',
  metaTitle: 'Square Footage Calculator: Rooms, L-Shapes & Circles',
  metaDescription:
    'Free square footage calculator: area in square feet for rectangles, L-shaped rooms, circles and triangles, converted to square yards, square meters and acres.',
  primaryKeyword: 'square footage calculator',
  secondaryKeywords: ['square feet calculator', 'sq ft calculator', 'area calculator', 'room square footage calculator'],
  synonyms: ['square feet', 'sq ft', 'area of a room', 'square meters to square feet', 'square yards', 'acreage'],
  inputs: [
    {
      id: 'shape',
      label: 'Shape',
      type: 'segmented',
      options: (Object.keys(SHAPE_NAMES) as Shape[]).map((s) => ({ value: s, label: SHAPE_NAMES[s] })),
    },
    { id: 'unit', label: 'Measured in', type: 'select', options: (Object.keys(UNIT_NAMES) as LengthUnit[]).map((u) => ({ value: u, label: `${UNIT_NAMES[u][0]!.toUpperCase()}${UNIT_NAMES[u].slice(1)}` })) },
    { ...dim, id: 'length', label: 'Length', showIf: is('rectangle', 'lshape'), group: 'a' },
    { ...dim, id: 'width', label: 'Width', showIf: is('rectangle', 'lshape'), group: 'a' },
    { ...dim, id: 'length2', label: 'Second section length', showIf: is('lshape'), group: 'b', helpText: 'Split the L into two rectangles that don’t overlap.' },
    { ...dim, id: 'width2', label: 'Second section width', showIf: is('lshape'), group: 'b' },
    { ...dim, id: 'diameter', label: 'Diameter', showIf: is('circle'), helpText: 'The distance straight across, through the center.' },
    { ...dim, id: 'base', label: 'Base', showIf: is('triangle'), group: 'c' },
    { ...dim, id: 'height', label: 'Height', showIf: is('triangle'), group: 'c', helpText: 'Measured at a right angle to the base.' },
    { id: 'count', label: 'Number of identical areas', type: 'number', unit: 'count', min: 1, max: 10_000, step: 1, integer: true, slider: false, advanced: true },
    { id: 'wastePct', label: 'Add for waste', type: 'number', unit: 'percent', min: 0, max: 50, step: 1, sliderMax: 25, advanced: true, helpText: 'About 10% for flooring or tile laid straight, 15% for diagonal patterns.' },
    { id: 'pricePerSqFt', label: 'Price per sq ft', type: 'number', unit: 'usd', min: 0, max: 10_000, step: 0.05, sliderMax: 30, advanced: true },
  ],
  defaults: { shape: 'rectangle', unit: 'ft', length: 15, width: 12, length2: 10, width2: 8, diameter: 10, base: 10, height: 6, count: 1, wastePct: 0, pricePerSqFt: 0 },
  compute: computeSquareFootage,
  summarize: (i, o) => ({
    headline: { label: 'Area', value: `${sq(o.sqft)} sq ft`, sub: i.count > 1 ? `${i.count} × ${sq(o.eachSqft)} sq ft` : `${SHAPE_NAMES[i.shape]} measured in ${UNIT_NAMES[i.unit]}`, raw: o.sqft },
    items: [
      { label: 'Square meters', value: `${sq(o.sqm)} m²`, raw: o.sqm },
      { label: 'Square yards', value: `${sq(o.sqyd)} sq yd`, raw: o.sqyd },
      { label: 'Acres', value: num(o.acres, 4), raw: o.acres },
      ...(i.wastePct > 0 ? [{ label: `With ${num(i.wastePct, 0)}% waste`, value: `${sq(o.withWaste)} sq ft`, raw: o.withWaste }] : []),
      ...(i.pricePerSqFt > 0 ? [{ label: 'Estimated cost', value: usd(o.cost, true), raw: o.cost, better: 'lower' as const }] : []),
    ],
  }),
  explain: (i, o) => {
    const s = [`The ${SHAPE_NAMES[i.shape].toLowerCase()} works out to ${sq(o.sqft)} square feet, or ${sq(o.sqm)} square meters. ${o.sqft > 0 ? `That’s the same area as a square about ${num(o.squareSide, 1)} feet on each side.` : ''}`.trim()];
    if (i.shape === 'lshape') s.push('An L-shaped room is two rectangles added together. Measure each part separately and make sure they don’t overlap, or the corner is counted twice.');
    if (i.wastePct > 0) s.push(`Adding ${num(i.wastePct, 0)}% for cuts and mistakes, buy about ${sq(o.withWaste)} sq ft of material.`);
    else s.push('Buying flooring, tile or sod? Add 5% to 15% for cuts and mistakes under More options.');
    return s;
  },
  steps: (i, o) => {
    const { f, s } = formula(i);
    const steps = [{ label: 'Area of the shape', formula: f, substituted: s, result: `${sq(o.eachSqft)} sq ft` }];
    if (i.unit !== 'ft') steps.push({ label: 'Convert to square feet', formula: `1 ${i.unit} = ${({ in: '1/12', yd: '3', m: '3.28084', cm: '0.0328084', ft: '1' } as const)[i.unit]} ft, so square the factor`, substituted: `${sq(o.sqm / Math.max(1, i.count))} m² ÷ 0.09290304`, result: `${sq(o.eachSqft)} sq ft` });
    if (i.count > 1) steps.push({ label: 'Multiply by the number of areas', formula: 'total = area × count', substituted: `${sq(o.eachSqft)} × ${i.count}`, result: `${sq(o.sqft)} sq ft` });
    steps.push({ label: 'Other units', formula: 'sq yd = sq ft ÷ 9; m² = sq ft × 0.09290304; acres = sq ft ÷ 43,560', substituted: `${sq(o.sqft)} sq ft`, result: `${sq(o.sqyd)} sq yd, ${sq(o.sqm)} m²` });
    return steps;
  },
  answerSummary: (i, o) =>
    i.shape === 'rectangle'
      ? `A ${num(i.length, 2)} by ${num(i.width, 2)} ${UNIT_NAMES[i.unit]} room is ${sq(o.sqft)} square feet (${sq(o.sqyd)} square yards, ${sq(o.sqm)} m²): multiply the length by the width.`
      : `This ${SHAPE_NAMES[i.shape].toLowerCase()} is ${sq(o.sqft)} square feet (${sq(o.sqyd)} square yards, ${sq(o.sqm)} m²), using ${formula(i).f}.`,
  ogValue: (_i, o) => `${sq(o.sqft)} sq ft`,
  related: ['flooring-calculator', 'paint-calculator', 'concrete-calculator', 'gravel-calculator', 'roofing-calculator', 'length-converter'],
  sources: [
    { title: 'NIST: Unit conversion', url: 'https://www.nist.gov/pml/weights-and-measures/metric-si/unit-conversion' },
    { title: 'NIST Handbook 44, Appendix C: General tables of units of measurement', url: 'https://www.nist.gov/document/2026-nist-handbook-44-appendix-c' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
