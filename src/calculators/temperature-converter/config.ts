import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeTemperature, UNITS, type TempUnit, type TemperatureInput, type TemperatureOutput } from './math.ts';

export const UNIT_NAMES: Record<TempUnit, string> = { C: 'Celsius', F: 'Fahrenheit', K: 'kelvin', R: 'Rankine' };
export const SYMBOLS: Record<TempUnit, string> = { C: '°C', F: '°F', K: 'K', R: '°R' };
const options = UNITS.map((u) => ({ value: u, label: `${UNIT_NAMES[u][0]!.toUpperCase()}${UNIT_NAMES[u].slice(1)} (${SYMBOLS[u]})` }));
const fmt = (n: number) => num(n, 4);

const FORMULA: Record<string, string> = {
  CF: '°F = °C × 9/5 + 32',
  FC: '°C = (°F − 32) × 5/9',
  CK: 'K = °C + 273.15',
  KC: '°C = K − 273.15',
  FK: 'K = (°F − 32) × 5/9 + 273.15',
  KF: '°F = (K − 273.15) × 9/5 + 32',
  KR: '°R = K × 9/5',
  RK: 'K = °R × 5/9',
  FR: '°R = °F + 459.67',
  RF: '°F = °R − 459.67',
  CR: '°R = (°C + 273.15) × 9/5',
  RC: '°C = °R × 5/9 − 273.15',
};

const config: CalculatorConfig<TemperatureInput, TemperatureOutput> = {
  slug: 'temperature-converter',
  category: 'conversion',
  subtopic: 'Temperature and energy',
  name: 'Temperature Converter',
  h1: 'Temperature Converter',
  intro: 'Convert between Fahrenheit, Celsius, kelvin and Rankine with the exact formulas, for temperatures and for temperature changes.',
  metaTitle: 'Temperature Converter: Fahrenheit to Celsius & Kelvin',
  metaDescription:
    'Convert temperatures between Fahrenheit, Celsius, kelvin and Rankine with exact formulas, see every scale at once, and convert a temperature change correctly.',
  primaryKeyword: 'temperature converter',
  secondaryKeywords: ['fahrenheit to celsius', 'celsius to fahrenheit', 'celsius to kelvin', 'f to c'],
  synonyms: ['c to f', 'degrees fahrenheit', 'degrees celsius', 'centigrade', 'kelvin to celsius', 'temperature conversion'],
  inputs: [
    { id: 'value', label: 'Temperature', type: 'number', unit: 'none', min: -1_000_000, max: 1_000_000_000, step: 0.1, slider: false },
    { id: 'from', label: 'From', type: 'select', options, group: 'units' },
    { id: 'to', label: 'To', type: 'select', options, group: 'units' },
  ],
  defaults: { value: 72, from: 'F', to: 'C' },
  compute: computeTemperature,
  summarize: (i, o) => ({
    headline: { label: `${fmt(i.value)} ${SYMBOLS[i.from]} is`, value: `${fmt(o.result)} ${SYMBOLS[i.to]}`, sub: i.from === i.to ? 'same scale' : FORMULA[i.from + i.to]!, raw: o.result },
    items: [
      { label: 'In kelvin', value: `${fmt(o.kelvin)} K`, raw: o.kelvin },
      { label: `A change of ${fmt(i.value)} ${SYMBOLS[i.from]} is`, value: `a change of ${fmt(o.difference)} ${SYMBOLS[i.to]}` },
    ],
  }),
  explain: (i, o) => {
    if (o.belowAbsoluteZero) return [`${fmt(i.value)} ${SYMBOLS[i.from]} is below absolute zero (0 K, −273.15 °C, −459.67 °F), the lowest temperature possible, so it can’t be a real temperature. It can still be a temperature difference: see the second result.`];
    return [
      `${fmt(i.value)} ${SYMBOLS[i.from]} is ${fmt(o.result)} ${SYMBOLS[i.to]}. ${i.from === i.to ? '' : `The formula is ${FORMULA[i.from + i.to]}.`}`.trim(),
      `A temperature change converts differently, because the scales’ zero points don’t matter: a rise of ${fmt(i.value)} ${SYMBOLS[i.from]} is a rise of ${fmt(o.difference)} ${SYMBOLS[i.to]}.`,
    ];
  },
  steps: (i, o) => [
    { label: 'To kelvin', formula: i.from === 'K' ? 'already in kelvin' : FORMULA[i.from + 'K']!, substituted: `${fmt(i.value)} ${SYMBOLS[i.from]}`, result: `${fmt(o.kelvin)} K` },
    { label: `To ${UNIT_NAMES[i.to]}`, formula: i.to === 'K' ? 'already in kelvin' : FORMULA['K' + i.to]!, substituted: `${fmt(o.kelvin)} K`, result: `${fmt(o.result)} ${SYMBOLS[i.to]}` },
  ],
  answerSummary: (i, o) => `${fmt(i.value)} ${SYMBOLS[i.from]} is ${fmt(o.result)} ${SYMBOLS[i.to]}${i.from === i.to ? '' : `, using ${FORMULA[i.from + i.to]}`}. Water freezes at 32 °F (0 °C) and boils at 212 °F (100 °C) at sea level.`,
  ogValue: (i, o) => `${fmt(o.result)} ${SYMBOLS[i.to]}`,
  related: ['length-converter', 'weight-converter', 'recipe-scaler', 'scientific-calculator', 'molarity-calculator', 'ohms-law-calculator'],
  sources: [
    { title: 'NIST Special Publication 811: Guide for the Use of the SI, temperature conversions', url: 'https://www.nist.gov/pml/special-publication-811' },
    { title: 'BIPM: The International System of Units (SI Brochure), definition of the kelvin', url: 'https://www.bipm.org/en/publications/si-brochure' },
    { title: 'NIST: Unit conversion', url: 'https://www.nist.gov/pml/weights-and-measures/metric-si/unit-conversion' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
