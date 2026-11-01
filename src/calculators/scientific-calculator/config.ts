import type { CalculatorConfig } from '../../lib/types.ts';
import { computeScientific, type SciInput, type SciOutput } from './math.ts';

const config: CalculatorConfig<SciInput, SciOutput> = {
  slug: 'scientific-calculator',
  category: 'math',
  subtopic: 'Scientific',
  name: 'Scientific Calculator',
  h1: 'Scientific Calculator',
  intro: 'A free online scientific calculator with trig, logs, powers, roots and factorials. Type or tap, and see the answer live.',
  metaTitle: 'Free Online Scientific Calculator | Calcrafty',
  metaDescription:
    'Free online scientific calculator: trig in degrees or radians, logs, powers, roots, factorials and π. Type on your keyboard or tap the keypad; answers are live.',
  primaryKeyword: 'scientific calculator',
  secondaryKeywords: ['online scientific calculator', 'calculator online', 'free scientific calculator'],
  synonyms: ['calculator', 'trig', 'sin', 'cos', 'tan', 'log', 'exponent', 'square root', 'pi'],
  inputs: [
    { id: 'expression', label: 'Expression', type: 'custom' },
    {
      id: 'angle',
      label: 'Angles in',
      type: 'segmented',
      options: [
        { value: 'deg', label: 'Degrees' },
        { value: 'rad', label: 'Radians' },
      ],
    },
  ],
  defaults: { expression: '(3 + 4) × 2^3 − sqrt(16)', angle: 'deg' },
  compute: computeScientific,
  summarize: (i, o) => ({
    headline: { label: o.error ? 'Result' : `${o.normalized} =`, value: o.display, sub: o.error ?? (i.angle === 'deg' ? 'Angles in degrees' : 'Angles in radians'), raw: o.value ?? undefined },
    items: [],
  }),
  explain: (_i, o) =>
    o.error
      ? [o.error]
      : [
          `Calcrafty follows the standard order of operations: parentheses, then powers (right to left), then multiplication and division, then addition and subtraction.`,
          'Results are shown to 12 significant digits, which removes tiny binary rounding errors (so 0.1 + 0.2 shows 0.3).',
        ],
  steps: (i, o) => (o.error ? [] : [{ label: 'Read as', formula: 'with every operator written out', substituted: o.normalized, result: o.display }, { label: 'Angle mode', substituted: i.angle === 'deg' ? 'degrees (360° in a circle)' : 'radians (2π in a circle)' }]),
  answerSummary: (_i, o) => `(3 + 4) × 2³ − √16 = ${o.display}: the calculator works out the parentheses and the power first, multiplies, then subtracts.`,
  ogValue: (_i, o) => o.display,
  related: ['percentage-calculator', 'fraction-calculator', 'standard-deviation-calculator', 'compound-interest-calculator'],
  sources: [
    { title: 'NIST Digital Library of Mathematical Functions', url: 'https://dlmf.nist.gov/' },
    { title: 'IEEE 754: Standard for floating-point arithmetic', url: 'https://standards.ieee.org/ieee/754/6210/' },
    { title: 'OpenStax College Algebra: Order of operations', url: 'https://openstax.org/books/college-algebra-2e/pages/1-1-real-numbers-algebra-essentials' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
