import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeLength, UNITS, type LengthInput, type LengthOutput, type LengthUnit } from './math.ts';

export const UNIT_NAMES: Record<LengthUnit, string> = {
  mm: 'millimeters',
  cm: 'centimeters',
  m: 'meters',
  km: 'kilometers',
  in: 'inches',
  ft: 'feet',
  yd: 'yards',
  mi: 'miles',
  nmi: 'nautical miles',
};
const options = UNITS.map((u) => ({ value: u, label: `${UNIT_NAMES[u][0]!.toUpperCase()}${UNIT_NAMES[u].slice(1)} (${u})` }));
const fmt = (n: number) => num(n, 6);

const config: CalculatorConfig<LengthInput, LengthOutput> = {
  slug: 'length-converter',
  category: 'conversion',
  subtopic: 'Length and area',
  name: 'Length Converter',
  h1: 'Length Converter',
  intro: 'Convert between feet, inches, meters, centimeters, miles, kilometers and more, using exact conversion factors.',
  metaTitle: 'Length Converter: Feet, Inches, Meters, Miles, km',
  metaDescription:
    'Convert lengths between mm, cm, meters, km, inches, feet, yards, miles and nautical miles with exact factors, and see any length in feet and inches.',
  primaryKeyword: 'length converter',
  secondaryKeywords: ['feet to meters', 'cm to inches', 'meters to feet', 'miles to km'],
  synonyms: ['unit converter', 'ft to m', 'inches to cm', 'km to miles', 'metric conversion', 'height in feet'],
  inputs: [
    { id: 'value', label: 'Length', type: 'number', unit: 'none', min: -1_000_000_000, max: 1_000_000_000, step: 0.01, slider: false },
    { id: 'from', label: 'From', type: 'select', options, group: 'units' },
    { id: 'to', label: 'To', type: 'select', options, group: 'units' },
  ],
  defaults: { value: 6, from: 'ft', to: 'm' },
  compute: computeLength,
  summarize: (i, o) => ({
    headline: { label: `${fmt(i.value)} ${UNIT_NAMES[i.from]} is`, value: `${fmt(o.result)} ${i.to}`, sub: `1 ${i.from} = ${fmt(o.factor)} ${i.to}`, raw: o.result },
    items: [
      { label: 'In meters', value: `${fmt(o.meters)} m`, raw: o.meters },
      { label: 'In feet and inches', value: `${num(o.feetInches.feet, 0)} ft ${num(o.feetInches.inches, 2)} in` },
    ],
  }),
  explain: (i, o) => [
    `${fmt(i.value)} ${UNIT_NAMES[i.from]} equals ${fmt(o.result)} ${UNIT_NAMES[i.to]}. Every conversion goes through the meter, using exact definitions such as 1 inch = 2.54 cm and 1 foot = 0.3048 m, so there’s no rounding until the final figure.`,
    `The table below shows the same length in every unit.`,
  ],
  steps: (i, o) => [
    { label: 'To meters', formula: `${i.from} × meters per ${i.from}`, substituted: `${fmt(i.value)} ${i.from}`, result: `${fmt(o.meters)} m` },
    { label: `To ${i.to}`, formula: `meters ÷ meters per ${i.to}`, substituted: `${fmt(o.meters)} m`, result: `${fmt(o.result)} ${i.to}` },
  ],
  answerSummary: (i, o) => `${fmt(i.value)} ${UNIT_NAMES[i.from]} is ${fmt(o.result)} ${UNIT_NAMES[i.to]}: one ${i.from} is exactly ${fmt(o.factor)} ${i.to}.`,
  ogValue: (i, o) => `${fmt(o.result)} ${i.to}`,
  related: ['percentage-calculator', 'scientific-calculator', 'running-pace-calculator', 'flooring-calculator', 'ohms-law-calculator'],
  sources: [
    { title: 'NIST: Unit conversion', url: 'https://www.nist.gov/pml/weights-and-measures/metric-si/unit-conversion' },
    { title: 'NIST Special Publication 811: Guide for the Use of the SI (conversion factors)', url: 'https://www.nist.gov/pml/special-publication-811' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
