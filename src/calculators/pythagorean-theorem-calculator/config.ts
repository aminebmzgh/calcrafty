import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computePythagoras, type PythagorasInput, type PythagorasOutput, type Unknown } from './math.ts';

const NAMES: Record<Unknown, string> = { c: 'hypotenuse c', a: 'leg a', b: 'leg b' };
const n4 = (x: number) => num(x, 4);
const deg = (x: number) => `${num(x, 2)}°`;
const side = (o: PythagorasOutput, s: Unknown) => o[s];

const config: CalculatorConfig<PythagorasInput, PythagorasOutput> = {
  slug: 'pythagorean-theorem-calculator',
  category: 'math',
  subtopic: 'Geometry',
  name: 'Pythagorean Theorem Calculator',
  h1: 'Pythagorean Theorem Calculator',
  intro: 'Find the hypotenuse or a missing leg of a right triangle with a² + b² = c², plus the exact square-root form, angles, area and perimeter.',
  metaTitle: 'Pythagorean Theorem Calculator: Find Any Side',
  metaDescription:
    'Solve a² + b² = c² for the hypotenuse or a missing leg of a right triangle, with the exact square-root answer, both angles, area and perimeter, step by step.',
  primaryKeyword: 'pythagorean theorem calculator',
  secondaryKeywords: ['hypotenuse calculator', 'right triangle calculator', 'a2 b2 c2 calculator', 'missing side of a right triangle calculator'],
  synonyms: ['pythagoras', 'hypotenuse', 'right triangle', 'right angle triangle', 'a² + b² = c²', 'triangle side', 'legs'],
  inputs: [
    {
      id: 'solve',
      label: 'Find',
      type: 'segmented',
      options: [
        { value: 'c', label: 'Hypotenuse c' },
        { value: 'a', label: 'Leg a' },
        { value: 'b', label: 'Leg b' },
      ],
    },
    { id: 'a', label: 'Leg a', type: 'number', unit: 'none', min: 0, max: 1_000_000_000, step: 0.01, slider: false, showIf: (i) => i.solve !== 'a' },
    { id: 'b', label: 'Leg b', type: 'number', unit: 'none', min: 0, max: 1_000_000_000, step: 0.01, slider: false, showIf: (i) => i.solve !== 'b' },
    { id: 'c', label: 'Hypotenuse c (the side opposite the right angle)', type: 'number', unit: 'none', min: 0, max: 1_000_000_000, step: 0.01, slider: false, showIf: (i) => i.solve !== 'c' },
  ],
  defaults: { solve: 'c', a: 7, b: 10, c: 13 },
  validate: (i) => {
    if (i.solve === 'c') return [];
    const leg = i.solve === 'a' ? 'b' : 'a';
    return i.c > 0 && i.c <= i[leg] ? [{ id: 'c', message: `The hypotenuse must be longer than leg ${leg}.` }] : [];
  },
  compute: computePythagoras,
  summarize: (i, o) => {
    if (!o.valid) return { headline: { label: NAMES[i.solve][0]!.toUpperCase() + NAMES[i.solve].slice(1), value: '—', sub: o.problem }, items: [] };
    return {
      headline: {
        label: NAMES[i.solve][0]!.toUpperCase() + NAMES[i.solve].slice(1),
        value: n4(side(o, i.solve)),
        sub: o.exact && !/^\d+$/.test(o.exact) ? `Exactly ${o.exact}` : o.triple ? 'A whole-number Pythagorean triple' : `${i.solve}² = ${num(o.squared, 6)}`,
        raw: side(o, i.solve),
      },
      items: [
        { label: 'Sides a, b, c', value: `${n4(o.a)}, ${n4(o.b)}, ${n4(o.c)}` },
        { label: 'Angle A (opposite a)', value: deg(o.angleA), raw: o.angleA },
        { label: 'Angle B (opposite b)', value: deg(o.angleB), raw: o.angleB },
        { label: 'Area', value: n4(o.area), raw: o.area },
        { label: 'Perimeter', value: n4(o.perimeter), raw: o.perimeter },
      ],
    };
  },
  explain: (i, o) => {
    if (!o.valid) return [o.problem ?? 'Check the values you entered.'];
    const s =
      i.solve === 'c'
        ? [`Squaring the legs and adding them gives ${num(o.a, 4)}² + ${num(o.b, 4)}² = ${num(o.squared, 6)}, so the hypotenuse is √${num(o.squared, 6)} = ${n4(o.c)}.`]
        : [`Subtracting the known leg's square from the hypotenuse's square gives ${num(o.c, 4)}² − ${num(i.solve === 'a' ? o.b : o.a, 4)}² = ${num(o.squared, 6)}, so leg ${i.solve} is √${num(o.squared, 6)} = ${n4(side(o, i.solve))}.`];
    if (o.exact && !/^\d+$/.test(o.exact)) s.push(`In exact form that's ${o.exact}, which is what a math teacher usually wants instead of the rounded decimal.`);
    if (o.triple) s.push(`${o.a}, ${o.b} and ${o.c} are all whole numbers, so they form a Pythagorean triple.`);
    s.push(`The two acute angles are ${deg(o.angleA)} and ${deg(o.angleB)}; together with the right angle they add up to 180°. Use the same unit for every side, and the area comes out in that unit squared.`);
    return s;
  },
  steps: (i, o) => {
    if (!o.valid) return [];
    const legKnown = i.solve === 'a' ? o.b : o.a;
    return [
      i.solve === 'c'
        ? { label: 'Square and add the legs', formula: 'c² = a² + b²', substituted: `${num(o.a, 4)}² + ${num(o.b, 4)}² = ${num(o.a ** 2, 6)} + ${num(o.b ** 2, 6)}`, result: num(o.squared, 6) }
        : { label: 'Subtract the known leg', formula: `${i.solve}² = c² − ${i.solve === 'a' ? 'b' : 'a'}²`, substituted: `${num(o.c, 4)}² − ${num(legKnown, 4)}² = ${num(o.c ** 2, 6)} − ${num(legKnown ** 2, 6)}`, result: num(o.squared, 6) },
      { label: 'Take the square root', formula: `${i.solve} = √${i.solve}²`, substituted: `√${num(o.squared, 6)}${o.exact && !/^\d+$/.test(o.exact) ? ` = ${o.exact}` : ''}`, result: n4(side(o, i.solve)) },
      { label: 'Angle A', formula: 'A = arctan(a ÷ b)', substituted: `arctan(${n4(o.a)} ÷ ${n4(o.b)})`, result: deg(o.angleA) },
      { label: 'Area', formula: 'a × b ÷ 2', substituted: `${n4(o.a)} × ${n4(o.b)} ÷ 2`, result: n4(o.area) },
    ];
  },
  answerSummary: (i, o) =>
    o.valid
      ? `A right triangle with legs ${n4(o.a)} and ${n4(o.b)} has a hypotenuse of ${n4(o.c)}${o.exact && i.solve === 'c' && !/^\d+$/.test(o.exact) ? ` (exactly ${o.exact})` : ''}, because ${n4(o.a)}² + ${n4(o.b)}² = ${num(o.c ** 2, 4)}.`
      : 'Enter two sides of a right triangle to find the third with the Pythagorean theorem.',
  ogValue: (i, o) => (o.valid ? `${i.solve} = ${num(side(o, i.solve), 3)}` : '—'),
  related: ['scientific-calculator', 'square-footage-calculator', 'roofing-calculator', 'fraction-calculator', 'length-converter'],
  sources: [
    { title: 'Wolfram MathWorld: Pythagorean Theorem', url: 'https://mathworld.wolfram.com/PythagoreanTheorem.html' },
    { title: 'Common Core State Standards: Grade 8 Geometry (8.G.B.6–8, the Pythagorean theorem)', url: 'https://www.thecorestandards.org/Math/Content/8/G/' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
