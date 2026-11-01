import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { BODY_DEFAULTS, HEALTH_SOURCES, heightInputs, sexInput, unitsInput, weightInputs } from '../../lib/health-inputs.ts';
import { heightLabel, weightLabel } from '../../lib/math/body.ts';
import { computeIdealWeight, FORMULAS, type IdealWeightInput, type IdealWeightOutput } from './math.ts';

const config: CalculatorConfig<IdealWeightInput, IdealWeightOutput> = {
  slug: 'ideal-weight-calculator',
  category: 'health',
  subtopic: 'Body composition',
  name: 'Ideal Weight Calculator',
  h1: 'Ideal Weight Calculator',
  intro: 'Your ideal body weight by the Robinson, Miller, Devine and Hamwi formulas, next to the healthy BMI range for your height.',
  metaTitle: 'Ideal Weight Calculator: 4 Formulas Compared | Calcrafty',
  metaDescription:
    'Find your ideal body weight for your height and sex with the Robinson, Miller, Devine and Hamwi formulas, compared side by side with the healthy BMI range.',
  primaryKeyword: 'ideal weight calculator',
  secondaryKeywords: ['ideal body weight calculator', 'healthy weight calculator', 'how much should i weigh'],
  synonyms: ['ideal body weight', 'ibw', 'target weight', 'healthy weight', 'devine'],
  inputs: [unitsInput<IdealWeightInput>(), sexInput<IdealWeightInput>(), ...heightInputs<IdealWeightInput>(), ...weightInputs<IdealWeightInput>('Current weight (optional, for comparison)')],
  defaults: { ...BODY_DEFAULTS, sex: 'male' },
  compute: computeIdealWeight,
  summarize: (i, o) => ({
    headline: { label: 'Ideal weight (average of 4 formulas)', value: weightLabel(o.averageKg, i.units, 0), sub: `formulas range from ${weightLabel(o.minKg, i.units, 0)} to ${weightLabel(o.maxKg, i.units, 0)}`, raw: o.averageKg },
    items: [
      ...o.results.map((r) => ({ label: r.name, value: weightLabel(r.kg, i.units, 0), raw: r.kg })),
      { label: 'Healthy BMI range (18.5–24.9)', value: `${weightLabel(o.bmiMinKg, i.units, 0)} – ${weightLabel(o.bmiMaxKg, i.units, 0)}` },
    ],
  }),
  explain: (i, o) => {
    const s = [
      `At ${heightLabel(i)}, the four ideal body weight formulas give ${weightLabel(o.minKg, i.units, 0)} to ${weightLabel(o.maxKg, i.units, 0)} for a ${i.sex === 'female' ? 'woman' : 'man'}, averaging ${weightLabel(o.averageKg, i.units, 0)}.`,
      `The healthy BMI range for your height is wider: ${weightLabel(o.bmiMinKg, i.units, 0)} to ${weightLabel(o.bmiMaxKg, i.units, 0)}. Any weight in that range is considered healthy for most adults.`,
    ];
    if (o.under5ft) s.push('These formulas were designed for people 5 feet and taller; below that, rely more on the BMI range and your doctor’s advice.');
    s.push('The formulas were built for clinical uses such as drug dosing, not as personal goals. Frame, muscle and age all matter.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Inches over 5 feet', formula: 'height in inches − 60', substituted: `${num(o.heightIn, 2)} − 60`, result: num(o.inchesOver5ft, 1) },
    ...o.results.map((r) => ({
      label: r.name,
      formula: `${FORMULAS.find((f) => f.id === r.id)![i.sex][0]} kg + ${FORMULAS.find((f) => f.id === r.id)![i.sex][1]} kg per inch over 5 ft`,
      substituted: `${num(o.inchesOver5ft, 1)} inches over`,
      result: `${num(r.kg, 1)} kg`,
    })),
  ],
  answerSummary: (i, o) => `For a ${i.sex === 'female' ? 'woman' : 'man'} who is ${heightLabel(i)}, ideal body weight formulas give ${weightLabel(o.minKg, i.units, 0)} to ${weightLabel(o.maxKg, i.units, 0)}, and the healthy BMI range is ${weightLabel(o.bmiMinKg, i.units, 0)} to ${weightLabel(o.bmiMaxKg, i.units, 0)}.`,
  ogValue: (i, o) => weightLabel(o.averageKg, i.units, 0),
  related: ['bmi-calculator', 'body-fat-calculator', 'calorie-calculator', 'macro-calculator'],
  sources: [
    { title: 'Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm 1974;8:650–5', url: 'https://journals.sagepub.com/doi/10.1177/106002807400801104' },
    { title: 'Robinson JD et al. Determination of ideal body weight for drug dosage calculations. Am J Hosp Pharm 1983;40:1016–9', url: 'https://pubmed.ncbi.nlm.nih.gov/6869387/' },
    { title: 'Pai MP, Paloucek FP. The origin of the “ideal” body weight equations. Ann Pharmacother 2000;34:1066–9', url: 'https://pubmed.ncbi.nlm.nih.gov/10981254/' },
    HEALTH_SOURCES.cdcBmi,
  ],
  lastReviewed: '2026-11-01',
};

export default config;
