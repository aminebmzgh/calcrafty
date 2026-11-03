import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { COMPOUNDS, compoundMolarMass, computeMolarity, type MolarityInput, type MolarityOutput } from './math.ts';

const config: CalculatorConfig<MolarityInput, MolarityOutput> = {
  slug: 'molarity-calculator',
  category: 'chemistry',
  subtopic: 'Solutions',
  name: 'Molarity Calculator',
  h1: 'Molarity Calculator',
  intro: 'The molarity of a solution, the mass of solute to weigh out, or the volume to make up, from the molar mass.',
  metaTitle: 'Molarity Calculator: Moles, Mass and Volume',
  metaDescription:
    'Calculate molarity in mol/L from the mass of solute and volume of solution, or the grams to weigh out, with molar masses of common compounds built in.',
  primaryKeyword: 'molarity calculator',
  secondaryKeywords: ['molar concentration calculator', 'mass to molarity calculator', 'grams to molarity calculator', 'solution concentration calculator'],
  synonyms: ['molar', 'mol/l', 'moles per liter', 'concentration', 'molar mass', 'mmol'],
  inputs: [
    {
      id: 'solveFor',
      label: 'Find',
      type: 'segmented',
      options: [
        { value: 'molarity', label: 'Molarity' },
        { value: 'mass', label: 'Mass to weigh' },
        { value: 'volume', label: 'Volume' },
      ],
    },
    {
      id: 'compound',
      label: 'Compound',
      type: 'select',
      options: [...COMPOUNDS.map((c) => ({ value: c.value, label: `${c.label} (${num(c.molarMass, 2)} g/mol)` })), { value: 'custom', label: 'Other: enter the molar mass' }],
      onChange: (value) => {
        const mw = compoundMolarMass(value);
        return mw === null ? {} : { molarMass: mw };
      },
    },
    { id: 'molarMass', label: 'Molar mass (g/mol)', type: 'number', unit: 'none', min: 0, max: 100_000, step: 0.01, slider: false, showIf: (i) => i.compound === 'custom' },
    { id: 'mass', label: 'Mass of solute (g)', type: 'number', unit: 'none', min: 0, max: 1_000_000, step: 0.001, slider: false, showIf: (i) => i.solveFor !== 'mass' },
    { id: 'volumeMl', label: 'Volume of solution (mL)', type: 'number', unit: 'none', min: 0, max: 10_000_000, step: 1, slider: false, showIf: (i) => i.solveFor !== 'volume' },
    { id: 'molarity', label: 'Molarity (mol/L)', type: 'number', unit: 'none', min: 0, max: 100, step: 0.001, slider: false, showIf: (i) => i.solveFor !== 'molarity' },
  ],
  defaults: { solveFor: 'molarity', compound: 'nacl', molarMass: 58.44, mass: 5.844, volumeMl: 500, molarity: 1 },
  compute: computeMolarity,
  summarize: (i, o) => {
    const headline =
      i.solveFor === 'mass'
        ? { label: 'Mass of solute', value: o.valid ? `${num(o.mass, 4)} g` : '—', raw: o.mass }
        : i.solveFor === 'volume'
          ? { label: 'Volume of solution', value: o.valid ? `${num(o.volumeMl, 4)} mL` : '—', raw: o.volumeMl }
          : { label: 'Molarity', value: o.valid ? `${num(o.molarity, 4)} M` : '—', raw: o.molarity };
    return {
      headline: { ...headline, sub: o.valid ? `${num(o.moles, 6)} mol of solute (${num(o.millimoles, 4)} mmol)` : 'Enter non-zero values' },
      items: [
        { label: 'Molarity', value: `${num(o.molarity, 4)} mol/L`, raw: o.molarity },
        { label: 'Mass of solute', value: `${num(o.mass, 4)} g`, raw: o.mass },
        { label: 'Volume of solution', value: `${num(o.volumeMl, 4)} mL`, raw: o.volumeMl },
      ],
    };
  },
  explain: (i, o) => {
    if (!o.valid) return ['Enter a molar mass and non-zero amounts to see the result.'];
    const s = [`${num(o.mass, 4)} g of solute at ${num(i.molarMass, 2)} g/mol is ${num(o.moles, 6)} mol. Dissolved and made up to ${num(o.volumeMl, 4)} mL of solution, that’s ${num(o.molarity, 4)} mol/L.`];
    if (i.solveFor === 'mass') s.push(`To prepare it, weigh ${num(o.mass, 4)} g, dissolve it in less water than you need, then add water up to the ${num(o.volumeMl, 4)} mL mark of a volumetric flask.`);
    s.push('Molarity is per liter of the finished solution, not per liter of water added, so always make up to the final volume.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Moles of solute', formula: 'moles = mass ÷ molar mass', substituted: `${num(o.mass, 4)} g ÷ ${num(i.molarMass, 2)} g/mol`, result: `${num(o.moles, 6)} mol` },
    { label: 'Volume in liters', formula: 'mL ÷ 1,000', substituted: `${num(o.volumeMl, 4)} ÷ 1,000`, result: `${num(o.liters, 6)} L` },
    { label: 'Molarity', formula: 'M = moles ÷ liters', substituted: `${num(o.moles, 6)} ÷ ${num(o.liters, 6)}`, result: `${num(o.molarity, 4)} mol/L` },
  ],
  answerSummary: (i, o) => `Dissolving ${num(o.mass, 4)} g of ${COMPOUNDS.find((c) => c.value === i.compound)?.label.split(',')[0]!.toLowerCase() ?? 'solute'} in water to make ${num(o.volumeMl, 4)} mL of solution gives ${num(o.moles, 4)} mol, a ${num(o.molarity, 4)} M solution.`,
  ogValue: (_i, o) => `${num(o.molarity, 3)} M`,
  related: ['ohms-law-calculator', 'punnett-square-calculator', 'scientific-calculator', 'percentage-calculator', 'length-converter'],
  sources: [
    { title: 'NIST: Atomic weights and isotopic compositions', url: 'https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-relative-atomic-masses' },
    { title: 'NIST: SI units (the mole)', url: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
