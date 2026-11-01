import type { CalculatorConfig, InputDef } from '../../lib/types.ts';
import { num, pct } from '../../lib/format.ts';
import { ageInput, BODY_DEFAULTS, heightInputs, sexInput, unitsInput, weightInputs } from '../../lib/health-inputs.ts';
import { weightLabel } from '../../lib/math/body.ts';
import { computeBodyFat, convertMeasurements, measurementsIn, type BodyFatInput, type BodyFatOutput } from './math.ts';

const tape = (key: 'neck' | 'waist' | 'hip', label: string, help: string, female = false): InputDef<BodyFatInput>[] => [
  { id: `${key}In`, label, type: 'number', unit: 'in', min: 5, max: 100, step: 0.25, slider: false, helpText: help, group: 'tape', e2eValue: key === 'waist' ? '38' : undefined, showIf: (i) => i.units === 'imperial' && (!female || i.sex === 'female') },
  { id: `${key}Cm`, label, type: 'number', unit: 'cm', min: 12, max: 250, step: 0.5, slider: false, helpText: help, group: 'tape', showIf: (i) => i.units === 'metric' && (!female || i.sex === 'female') },
];

const config: CalculatorConfig<BodyFatInput, BodyFatOutput> = {
  slug: 'body-fat-calculator',
  category: 'health',
  subtopic: 'Body composition',
  name: 'Body Fat Calculator',
  h1: 'Body Fat Calculator',
  intro: 'Estimate your body fat percentage with a tape measure using the US Navy method, with the BMI method for comparison.',
  metaTitle: 'Body Fat Calculator: US Navy Tape Method | Calcrafty',
  metaDescription:
    'Estimate body fat percentage with the US Navy tape-measure method and the BMI method. See your fat and lean mass and where you fall on the ACE body fat chart.',
  primaryKeyword: 'body fat calculator',
  secondaryKeywords: ['body fat percentage calculator', 'navy body fat calculator', 'army body fat calculator'],
  synonyms: ['body fat percentage', 'lean mass', 'navy method', 'tape measure', 'body composition'],
  inputs: [
    unitsInput<BodyFatInput>((to, i) => convertMeasurements(to, i)),
    sexInput<BodyFatInput>(),
    ageInput<BodyFatInput>(),
    ...heightInputs<BodyFatInput>(),
    ...weightInputs<BodyFatInput>(),
    ...tape('neck', 'Neck', 'Just below the larynx, tape sloping slightly down to the front.'),
    ...tape('waist', 'Waist', 'Men: at the navel. Women: at the narrowest point. Relaxed, after breathing out.'),
    ...tape('hip', 'Hips', 'At the widest point of the buttocks.', true),
  ],
  defaults: { ...BODY_DEFAULTS, sex: 'male', age: 35, neckIn: 15, waistIn: 34, hipIn: 38, neckCm: 38.1, waistCm: 86.4, hipCm: 96.5 },
  validate: (i) => {
    const m = measurementsIn(i);
    return m.waist <= m.neck ? [{ id: i.units === 'metric' ? 'waistCm' : 'waistIn', message: 'Waist must be larger than neck. Check both measurements.' }] : [];
  },
  compute: computeBodyFat,
  summarize: (i, o) => ({
    headline: { label: 'Body fat (US Navy method)', value: o.navy === null ? '—' : pct(o.navy, 1), sub: o.category ?? 'Check your measurements', raw: o.navy ?? undefined },
    items: [
      { label: 'Body fat (BMI method)', value: pct(o.bmiMethod, 1), raw: o.bmiMethod },
      { label: 'Fat mass', value: o.fatKg === null ? '—' : weightLabel(o.fatKg, i.units), raw: o.fatKg ?? undefined },
      { label: 'Lean mass', value: o.leanKg === null ? '—' : weightLabel(o.leanKg, i.units), raw: o.leanKg ?? undefined },
      { label: 'BMI', value: num(o.bmi, 1) },
    ],
  }),
  explain: (i, o) => {
    if (o.navy === null) return ['These measurements don’t give a valid estimate. Re-measure your waist and neck; the waist (plus hips for women) must be clearly larger than the neck.'];
    return [
      `At ${pct(o.navy, 1)} body fat, about ${weightLabel(o.fatKg!, i.units)} of your weight is fat and ${weightLabel(o.leanKg!, i.units)} is lean mass (muscle, bone, organs and water).`,
      `That’s in the “${o.category!.toLowerCase()}” range on the American Council on Exercise chart for ${i.sex === 'female' ? 'women' : 'men'}.`,
      `The BMI method gives ${pct(o.bmiMethod, 1)}. The two often differ by a few points; the tape method usually tracks change better because it measures you, not just your weight.`,
    ];
  },
  steps: (i, o) => {
    const m = measurementsIn(i);
    return [
      {
        label: 'US Navy formula',
        formula: i.sex === 'male' ? '86.010 × log₁₀(waist − neck) − 70.041 × log₁₀(height) + 36.76' : '163.205 × log₁₀(waist + hip − neck) − 97.684 × log₁₀(height) − 78.387',
        substituted: i.sex === 'male' ? `waist ${num(m.waist, 2)} in, neck ${num(m.neck, 2)} in` : `waist ${num(m.waist, 2)} in, hip ${num(m.hip, 2)} in, neck ${num(m.neck, 2)} in`,
        result: o.navy === null ? 'invalid' : pct(o.navy, 1),
      },
      { label: 'BMI method (Deurenberg)', formula: `1.20 × BMI + 0.23 × age ${i.sex === 'male' ? '− 10.8 ' : ''}− 5.4`, substituted: `1.20 × ${num(o.bmi, 1)} + 0.23 × ${i.age}${i.sex === 'male' ? ' − 10.8' : ''} − 5.4`, result: pct(o.bmiMethod, 1) },
      { label: 'Fat and lean mass', formula: 'fat = weight × body fat %; lean = weight − fat', substituted: weightLabel(o.weightKg, i.units), result: o.fatKg === null ? '—' : `${weightLabel(o.fatKg, i.units)} fat` },
    ];
  },
  answerSummary: (i, o) => `With a ${num(measurementsIn(i).waist, 1)}-inch waist and ${num(measurementsIn(i).neck, 1)}-inch neck at your height, the US Navy method estimates ${pct(o.navy ?? 0, 1)} body fat for a ${i.sex === 'female' ? 'woman' : 'man'}, in the ${(o.category ?? '').toLowerCase()} range.`,
  ogValue: (_i, o) => (o.navy === null ? '—' : `${num(o.navy, 1)}% fat`),
  related: ['bmi-calculator', 'calorie-calculator', 'macro-calculator', 'ideal-weight-calculator'],
  sources: [
    { title: 'Hodgdon JA, Beckett MB. Prediction of percent body fat for U.S. Navy men and women from body circumferences and height. Naval Health Research Center, 1984', url: 'https://apps.dtic.mil/sti/citations/ADA143890' },
    { title: 'Deurenberg P et al. Body mass index as a measure of body fatness. Br J Nutr 1991;65:105–14', url: 'https://pubmed.ncbi.nlm.nih.gov/2043597/' },
    { title: 'American Council on Exercise: Percent body fat norms', url: 'https://www.acefitness.org/resources/everyone/tools-calculators/percent-body-fat-calculator/' },
    { title: 'CDC: Assessing your weight', url: 'https://www.cdc.gov/healthy-weight-growth/about/index.html' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
