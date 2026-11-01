import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { BODY_DEFAULTS, HEALTH_SOURCES, heightInputs, unitsInput, weightInputs } from '../../lib/health-inputs.ts';
import { heightLabel, weightLabel } from '../../lib/math/body.ts';
import { computeBmi, type BmiInput, type BmiOutput } from './math.ts';

const config: CalculatorConfig<BmiInput, BmiOutput> = {
  slug: 'bmi-calculator',
  category: 'health',
  subtopic: 'Body composition',
  name: 'BMI Calculator',
  h1: 'BMI Calculator',
  intro: 'Your body mass index and CDC weight category, plus the healthy weight range for your height, in pounds or kilograms.',
  metaTitle: 'BMI Calculator: Body Mass Index for Adults | Calcrafty',
  metaDescription:
    'Calculate your adult BMI in pounds and feet or kilograms and centimeters. See your CDC weight category, the healthy weight range for your height and its limits.',
  primaryKeyword: 'bmi calculator',
  secondaryKeywords: ['body mass index calculator', 'bmi calculator for women', 'bmi calculator for men'],
  synonyms: ['body mass index', 'healthy weight', 'overweight', 'obesity', 'weight'],
  inputs: [unitsInput<BmiInput>(), ...heightInputs<BmiInput>(), ...weightInputs<BmiInput>()],
  defaults: { ...BODY_DEFAULTS },
  compute: computeBmi,
  summarize: (i, o) => ({
    headline: { label: 'Your BMI', value: num(o.bmiRounded, 1), sub: o.category, raw: o.bmiRounded },
    items: [
      { label: 'Healthy weight for your height', value: `${weightLabel(o.healthyMinKg, i.units, 0)} – ${weightLabel(o.healthyMaxKg, i.units, 0)}` },
      { label: o.toHealthyKg > 0 ? 'Above the healthy range by' : o.toHealthyKg < 0 ? 'Below the healthy range by' : 'Distance to healthy range', value: o.toHealthyKg === 0 ? 'Within range' : weightLabel(Math.abs(o.toHealthyKg), i.units) },
      { label: 'Height', value: heightLabel(i) },
    ],
  }),
  explain: (i, o) => {
    const s = [`A BMI of ${num(o.bmiRounded, 1)} is in the “${o.category.toLowerCase()}” category for adults (CDC).`];
    s.push(`For your height, a BMI between 18.5 and 24.9 means a weight of ${weightLabel(o.healthyMinKg, i.units, 0)} to ${weightLabel(o.healthyMaxKg, i.units, 0)}.`);
    if (o.toHealthyKg > 0) s.push(`Losing about ${weightLabel(o.toHealthyKg, i.units)} would bring your BMI to 24.9.`);
    else if (o.toHealthyKg < 0) s.push(`Gaining about ${weightLabel(-o.toHealthyKg, i.units)} would bring your BMI to 18.5.`);
    s.push('BMI is a screening tool, not a diagnosis: it doesn’t distinguish muscle from fat. Talk to a health professional about what your number means for you.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Height in meters', formula: i.units === 'imperial' ? 'inches × 2.54 ÷ 100' : 'cm ÷ 100', substituted: heightLabel(i), result: `${num(o.heightM, 4)} m` },
    { label: 'Weight in kilograms', formula: i.units === 'imperial' ? 'pounds × 0.45359237' : 'kg', substituted: weightLabel(o.weightKg, i.units, 1), result: `${num(o.weightKg, 2)} kg` },
    { label: 'BMI', formula: 'BMI = weight (kg) ÷ height (m)²', substituted: `${num(o.weightKg, 2)} ÷ ${num(o.heightM, 4)}²`, result: num(o.bmiRounded, 1) },
    { label: 'Healthy range for your height', formula: '18.5 × height² to 24.9 × height²', substituted: `18.5 × ${num(o.heightM, 4)}² to 24.9 × ${num(o.heightM, 4)}²`, result: `${num(o.healthyMinKg, 1)}–${num(o.healthyMaxKg, 1)} kg` },
  ],
  answerSummary: (i, o) => `At ${heightLabel(i)} and ${weightLabel(o.weightKg, i.units, 0)}, your BMI is ${num(o.bmiRounded, 1)}, which the CDC classes as ${o.category.toLowerCase()}. A healthy weight for this height is ${weightLabel(o.healthyMinKg, i.units, 0)} to ${weightLabel(o.healthyMaxKg, i.units, 0)}.`,
  ogValue: (_i, o) => `BMI ${num(o.bmiRounded, 1)}`,
  related: ['ideal-weight-calculator', 'body-fat-calculator', 'calorie-calculator', 'macro-calculator'],
  sources: [
    HEALTH_SOURCES.cdcBmi,
    { title: 'CDC: About adult BMI', url: 'https://www.cdc.gov/bmi/about/index.html' },
    HEALTH_SOURCES.nihBmi,
    HEALTH_SOURCES.whoBmi,
  ],
  lastReviewed: '2026-11-01',
};

export default config;
