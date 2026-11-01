import type { CalculatorConfig, NumberInputDef } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeFraction, fmt, mixedLabel, resultLabel, type FractionInput, type FractionOutput } from './math.ts';

const part = (id: NumberInputDef<FractionInput>['id'], label: string, group: string, min = -1_000_000_000): NumberInputDef<FractionInput> => ({
  id,
  label,
  type: 'number',
  unit: 'count',
  min,
  max: 1_000_000_000,
  step: 1,
  integer: true,
  slider: false,
  group,
});

const OP_LABEL = { '+': '+', '-': '−', '*': '×', '/': '÷' } as const;
const asText = (i: FractionInput, w: 'w1' | 'w2', n: 'n1' | 'n2', d: 'd1' | 'd2') => (i[w] !== 0 ? `${i[w]} ${i[n]}/${i[d]}` : `${i[n]}/${i[d]}`);

const config: CalculatorConfig<FractionInput, FractionOutput> = {
  slug: 'fraction-calculator',
  category: 'math',
  subtopic: 'Arithmetic',
  name: 'Fraction Calculator',
  h1: 'Fraction Calculator',
  intro: 'Add, subtract, multiply and divide fractions and mixed numbers, with every simplification step shown.',
  metaTitle: 'Fraction Calculator with Steps: Mixed Numbers | Calcrafty',
  metaDescription:
    'Add, subtract, multiply and divide fractions and mixed numbers. Get the simplified answer, mixed number and decimal, with every step from LCD to GCD shown.',
  primaryKeyword: 'fraction calculator',
  secondaryKeywords: ['fraction simplifier', 'adding fractions calculator', 'mixed number calculator'],
  synonyms: ['fractions', 'mixed numbers', 'simplify', 'lcd', 'common denominator', 'numerator', 'denominator'],
  inputs: [
    part('w1', 'First: whole number', 'a'),
    part('n1', 'First: numerator', 'a'),
    part('d1', 'First: denominator', 'a'),
    {
      id: 'op',
      label: 'Operation',
      type: 'segmented',
      options: [
        { value: '+', label: '+ Add' },
        { value: '-', label: '− Subtract' },
        { value: '*', label: '× Multiply' },
        { value: '/', label: '÷ Divide' },
      ],
    },
    part('w2', 'Second: whole number', 'b'),
    part('n2', 'Second: numerator', 'b'),
    part('d2', 'Second: denominator', 'b'),
  ],
  defaults: { w1: 0, n1: 3, d1: 4, op: '+', w2: 0, n2: 2, d2: 3 },
  validate: (i) => [...(i.d1 === 0 ? [{ id: 'd1' as const, message: 'Denominator can’t be zero.' }] : []), ...(i.d2 === 0 ? [{ id: 'd2' as const, message: 'Denominator can’t be zero.' }] : [])],
  compute: computeFraction,
  summarize: (i, o) =>
    o.error
      ? { headline: { label: 'Result', value: '—', sub: o.error }, items: [] }
      : {
          headline: { label: `${asText(i, 'w1', 'n1', 'd1')} ${OP_LABEL[i.op]} ${asText(i, 'w2', 'n2', 'd2')} =`, value: resultLabel(o.result), sub: o.result.d === 1n ? 'a whole number' : 'in simplest form' },
          items: [
            { label: 'Mixed number', value: mixedLabel(o.mixed) },
            { label: 'Decimal', value: num(o.decimal, 10) },
            ...(o.gcd > 1n ? [{ label: 'Simplified by', value: `dividing by ${o.gcd}` }] : []),
          ],
        },
  explain: (i, o) => {
    if (o.error) return [o.error];
    const s = [`${asText(i, 'w1', 'n1', 'd1')} ${OP_LABEL[i.op]} ${asText(i, 'w2', 'n2', 'd2')} = ${fmt(o.result)}${o.mixed.whole !== 0n && o.mixed.n !== 0n ? `, or ${mixedLabel(o.mixed)} as a mixed number` : ''}.`];
    if (o.lcd) s.push(`To ${i.op === '+' ? 'add' : 'subtract'} fractions, both need the same denominator; the smallest one that works is ${o.lcd}.`);
    if (i.op === '/') s.push('Dividing by a fraction is the same as multiplying by its reciprocal (flip the second fraction).');
    if (o.gcd > 1n) s.push(`The answer was simplified by dividing the top and bottom by their greatest common divisor, ${o.gcd}.`);
    return s;
  },
  steps: (_i, o) => (o.error ? [] : o.steps.map((s) => ({ label: s.label, substituted: s.text }))),
  answerSummary: (i, o) => `${asText(i, 'w1', 'n1', 'd1')} ${OP_LABEL[i.op]} ${asText(i, 'w2', 'n2', 'd2')} = ${fmt(o.result)}, which is ${mixedLabel(o.mixed)} as a mixed number or ${num(o.decimal, 6)} as a decimal.`,
  ogValue: (_i, o) => (o.error ? '—' : mixedLabel(o.mixed)),
  related: ['percentage-calculator', 'scientific-calculator', 'standard-deviation-calculator', 'gpa-calculator'],
  sources: [
    { title: 'Common Core State Standards for Mathematics: Number and Operations—Fractions', url: 'https://www.thecorestandards.org/Math/Content/NF/' },
    { title: 'Khan Academy: Fractions', url: 'https://www.khanacademy.org/math/arithmetic/fraction-arithmetic' },
    { title: 'Euclid’s algorithm for the greatest common divisor (NIST DADS)', url: 'https://xlinux.nist.gov/dads/HTML/euclidalgo.html' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
