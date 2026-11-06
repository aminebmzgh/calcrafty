import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeWeight, KG_PER, UNITS, type WeightInput, type WeightOutput, type WeightUnit } from './math.ts';

export const UNIT_NAMES: Record<WeightUnit, string> = {
  mg: 'milligrams',
  g: 'grams',
  kg: 'kilograms',
  t: 'metric tons',
  oz: 'ounces',
  lb: 'pounds',
  st: 'stone',
  ton: 'short tons (US)',
  lt: 'long tons (UK)',
  ozt: 'troy ounces',
};
export const UNIT_SYMBOLS: Record<WeightUnit, string> = { mg: 'mg', g: 'g', kg: 'kg', t: 't', oz: 'oz', lb: 'lb', st: 'st', ton: 'ton', lt: 'long ton', ozt: 'oz t' };
const options = UNITS.map((u) => ({ value: u, label: `${UNIT_NAMES[u][0]!.toUpperCase()}${UNIT_NAMES[u].slice(1)} (${UNIT_SYMBOLS[u]})` }));
const fmt = (n: number) => num(n, 6);

const config: CalculatorConfig<WeightInput, WeightOutput> = {
  slug: 'weight-converter',
  category: 'conversion',
  subtopic: 'Weight and volume',
  name: 'Weight Converter',
  h1: 'Weight Converter',
  intro: 'Convert between kilograms, pounds, ounces, grams, stone and tons with exact factors, and see any weight in pounds and ounces.',
  metaTitle: 'Weight Converter: kg to lbs, lbs to kg, oz to grams',
  metaDescription:
    'Convert weights between kilograms, pounds, ounces, grams, stone, metric, short and long tons and troy ounces, with exact factors and pounds-and-ounces results.',
  primaryKeyword: 'weight converter',
  secondaryKeywords: ['kg to lbs', 'lbs to kg', 'grams to ounces', 'ounces to grams'],
  synonyms: ['mass converter', 'kilograms to pounds', 'pounds to kilograms', 'stone to kg', 'oz to g', 'weight conversion'],
  inputs: [
    { id: 'value', label: 'Weight', type: 'number', unit: 'none', min: 0, max: 1_000_000_000_000, step: 0.01, slider: false },
    { id: 'from', label: 'From', type: 'select', options, group: 'units' },
    { id: 'to', label: 'To', type: 'select', options, group: 'units' },
  ],
  defaults: { value: 70, from: 'kg', to: 'lb' },
  compute: computeWeight,
  summarize: (i, o) => ({
    headline: { label: `${fmt(i.value)} ${UNIT_NAMES[i.from]} is`, value: `${fmt(o.result)} ${UNIT_SYMBOLS[i.to]}`, sub: `1 ${UNIT_SYMBOLS[i.from]} = ${fmt(o.factor)} ${UNIT_SYMBOLS[i.to]}`, raw: o.result },
    items: [
      { label: 'In kilograms', value: `${fmt(o.kilograms)} kg`, raw: o.kilograms },
      { label: 'In pounds and ounces', value: `${num(o.poundsOunces.pounds, 0)} lb ${num(o.poundsOunces.ounces, 2)} oz` },
      { label: 'In stone and pounds', value: `${num(o.stonePounds.stone, 0)} st ${num(o.stonePounds.pounds, 1)} lb` },
    ],
  }),
  explain: (i, o) => [
    `${fmt(i.value)} ${UNIT_NAMES[i.from]} equals ${fmt(o.result)} ${UNIT_NAMES[i.to]}. Every conversion goes through the kilogram, using exact definitions such as 1 pound = 0.45359237 kg, so nothing is rounded until the final figure.`,
    'Strictly, these units measure mass. On Earth, a scale reading in pounds or kilograms is the same thing in everyday use.',
  ],
  steps: (i, o) => [
    { label: 'To kilograms', formula: `${UNIT_SYMBOLS[i.from]} × kilograms per ${UNIT_SYMBOLS[i.from]}`, substituted: `${fmt(i.value)} × ${num(KG_PER[i.from].toNumber(), 10)}`, result: `${fmt(o.kilograms)} kg` },
    { label: `To ${UNIT_NAMES[i.to]}`, formula: `kilograms ÷ kilograms per ${UNIT_SYMBOLS[i.to]}`, substituted: `${fmt(o.kilograms)} ÷ ${num(KG_PER[i.to].toNumber(), 10)}`, result: `${fmt(o.result)} ${UNIT_SYMBOLS[i.to]}` },
  ],
  answerSummary: (i, o) => `${fmt(i.value)} ${UNIT_NAMES[i.from]} is ${fmt(o.result)} ${UNIT_NAMES[i.to]}: one ${UNIT_NAMES[i.from].replace(/s$/, '')} is ${fmt(o.factor)} ${UNIT_NAMES[i.to]}.`,
  ogValue: (i, o) => `${fmt(o.result)} ${UNIT_SYMBOLS[i.to]}`,
  related: ['length-converter', 'temperature-converter', 'bmi-calculator', 'recipe-scaler', 'ideal-weight-calculator', 'calorie-calculator'],
  sources: [
    { title: 'NIST: Unit conversion', url: 'https://www.nist.gov/pml/weights-and-measures/metric-si/unit-conversion' },
    { title: 'NIST Special Publication 811: Guide for the Use of the SI (conversion factors)', url: 'https://www.nist.gov/pml/special-publication-811' },
    { title: 'NIST Handbook 44, Appendix C: General tables of units of measurement', url: 'https://www.nist.gov/document/2026-nist-handbook-44-appendix-c' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
