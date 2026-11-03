import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeOhms, type KnownPair, type OhmsInput, type OhmsOutput } from './math.ts';

const KNOWN: Record<KnownPair, string> = {
  VR: 'voltage and resistance',
  VI: 'voltage and current',
  IR: 'current and resistance',
  PV: 'power and voltage',
  PI: 'power and current',
  PR: 'power and resistance',
};
const has = (i: OhmsInput, q: 'V' | 'I' | 'R' | 'P') => i.known.includes(q);

const config: CalculatorConfig<OhmsInput, OhmsOutput> = {
  slug: 'ohms-law-calculator',
  category: 'physics',
  subtopic: 'Electricity',
  name: 'Ohm’s Law Calculator',
  h1: 'Ohm’s Law Calculator: Ohms, Volts, Amps and Watts',
  intro: 'Enter any two of voltage, current, resistance and power to find the other two, with the formula used.',
  metaTitle: 'Ohm’s Law Calculator: Volts, Amps, Ohms and Watts',
  metaDescription:
    'Find voltage, current, resistance or power from any two known values with Ohm’s law (V = I × R) and the power formula P = V × I, each step shown.',
  primaryKeyword: 'ohms law calculator',
  secondaryKeywords: ['volts amps watts calculator', 'voltage calculator', 'resistance calculator', 'watts to amps calculator'],
  synonyms: ['ohm’s law', 'v = ir', 'volts', 'amps', 'ohms', 'watts', 'electrical power'],
  inputs: [
    {
      id: 'known',
      label: 'What do you know?',
      type: 'select',
      options: (Object.keys(KNOWN) as KnownPair[]).map((k) => ({ value: k, label: KNOWN[k][0]!.toUpperCase() + KNOWN[k].slice(1) })),
    },
    { id: 'voltage', label: 'Voltage (volts, V)', type: 'number', unit: 'none', min: 0, max: 1_000_000, step: 0.01, slider: false, showIf: (i) => has(i, 'V') },
    { id: 'current', label: 'Current (amps, A)', type: 'number', unit: 'none', min: 0, max: 1_000_000, step: 0.001, slider: false, showIf: (i) => has(i, 'I') },
    { id: 'resistance', label: 'Resistance (ohms, Ω)', type: 'number', unit: 'none', min: 0, max: 1_000_000_000, step: 0.01, slider: false, showIf: (i) => has(i, 'R') },
    { id: 'power', label: 'Power (watts, W)', type: 'number', unit: 'none', min: 0, max: 1_000_000_000, step: 0.1, slider: false, showIf: (i) => has(i, 'P') },
  ],
  defaults: { known: 'VR', voltage: 12, current: 2, resistance: 6, power: 24 },
  compute: computeOhms,
  summarize: (_i, o) => ({
    headline: { label: 'Current', value: o.valid ? `${num(o.current, 4)} A` : '—', sub: o.valid ? `${num(o.voltage, 4)} V, ${num(o.resistance, 4)} Ω, ${num(o.power, 4)} W` : 'Enter two non-zero values', raw: o.current },
    items: [
      { label: 'Voltage', value: `${num(o.voltage, 4)} V`, raw: o.voltage },
      { label: 'Resistance', value: `${num(o.resistance, 4)} Ω`, raw: o.resistance },
      { label: 'Power', value: `${num(o.power, 4)} W`, raw: o.power },
    ],
  }),
  explain: (i, o) => {
    if (!o.valid) return ['One of the values you entered is zero, which would mean dividing by zero. Enter two non-zero values.'];
    return [
      `From the ${KNOWN[i.known]}, ${o.formulas[0]} and ${o.formulas[1]}.`,
      `The circuit has ${num(o.voltage, 4)} volts across ${num(o.resistance, 4)} ohms, so ${num(o.current, 4)} amps flow and ${num(o.power, 4)} watts are used, mostly given off as heat.`,
      'Ohm’s law holds for resistors and most simple loads. Motors, LEDs and other components with changing resistance only follow it approximately, so use their rated values.',
    ];
  },
  steps: (_i, o) => [
    { label: 'First unknown', formula: o.formulas[0], substituted: 'using the two values you entered', result: o.formulas[0].startsWith('I') ? `${num(o.current, 4)} A` : o.formulas[0].startsWith('V') ? `${num(o.voltage, 4)} V` : `${num(o.resistance, 4)} Ω` },
    { label: 'Second unknown', formula: o.formulas[1], substituted: 'using the two values you entered', result: o.formulas[1].startsWith('P') ? `${num(o.power, 4)} W` : o.formulas[1].startsWith('V') ? `${num(o.voltage, 4)} V` : `${num(o.resistance, 4)} Ω` },
    { label: 'Check', formula: 'V = I × R and P = V × I', substituted: `${num(o.current, 4)} A × ${num(o.resistance, 4)} Ω; ${num(o.voltage, 4)} V × ${num(o.current, 4)} A`, result: `${num(o.voltage, 4)} V; ${num(o.power, 4)} W` },
  ],
  answerSummary: (_i, o) => `A ${num(o.voltage, 4)} volt supply across ${num(o.resistance, 4)} ohms drives ${num(o.current, 4)} amps and uses ${num(o.power, 4)} watts.`,
  ogValue: (_i, o) => `${num(o.current, 3)} A`,
  related: ['molarity-calculator', 'length-converter', 'scientific-calculator', 'percentage-calculator', 'car-co2-calculator'],
  sources: [
    { title: 'NIST: The SI redefinition, the ampere', url: 'https://www.nist.gov/si-redefinition/ampere' },
    { title: 'NIST: SI units', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
