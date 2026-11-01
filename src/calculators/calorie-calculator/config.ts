import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { ageInput, BODY_DEFAULTS, heightInputs, sexInput, unitsInput, weightInputs } from '../../lib/health-inputs.ts';
import { ACTIVITY, computeCalories, GOALS, type CalorieInput, type CalorieOutput } from './math.ts';

const FORMULA = { mifflin: 'Mifflin-St Jeor', harris: 'Harris-Benedict (revised)', katch: 'Katch-McArdle' } as const;
const kcal = (n: number) => `${num(n, 0)} kcal`;

const config: CalculatorConfig<CalorieInput, CalorieOutput> = {
  slug: 'calorie-calculator',
  category: 'health',
  subtopic: 'Nutrition',
  name: 'Calorie Calculator',
  h1: 'Calorie Calculator (TDEE)',
  intro: 'How many calories you burn a day (TDEE) and how many to eat to lose, maintain or gain weight.',
  metaTitle: 'Calorie Calculator: TDEE & Daily Calories | Calcrafty',
  metaDescription:
    'Estimate your daily calorie needs (TDEE) with the Mifflin-St Jeor, Harris-Benedict or Katch-McArdle formula, and the calories to lose, keep or gain weight.',
  primaryKeyword: 'calorie calculator',
  secondaryKeywords: ['tdee calculator', 'maintenance calorie calculator', 'calories burned per day calculator'],
  synonyms: ['tdee', 'bmr', 'maintenance calories', 'calorie deficit', 'weight loss', 'diet'],
  inputs: [
    unitsInput<CalorieInput>(),
    sexInput<CalorieInput>(),
    ageInput<CalorieInput>(15),
    ...heightInputs<CalorieInput>(),
    ...weightInputs<CalorieInput>(),
    { id: 'activity', label: 'Activity level', type: 'select', options: Object.entries(ACTIVITY).map(([value, a]) => ({ value, label: a.label })) },
    { id: 'goal', label: 'Goal', type: 'select', options: GOALS.map((g) => ({ value: g.value, label: g.label })) },
    {
      id: 'formula',
      label: 'Formula',
      type: 'select',
      advanced: true,
      options: [
        { value: 'mifflin', label: 'Mifflin-St Jeor (recommended)' },
        { value: 'harris', label: 'Harris-Benedict (revised 1984)' },
        { value: 'katch', label: 'Katch-McArdle (needs body fat %)' },
      ],
    },
    { id: 'bodyFat', label: 'Body fat', type: 'number', unit: 'percent', min: 3, max: 70, step: 0.5, sliderMax: 50, advanced: true, showIf: (i) => i.formula === 'katch', helpText: 'Estimate it with the body fat calculator.' },
  ],
  defaults: { ...BODY_DEFAULTS, sex: 'male', age: 35, activity: 'moderate', formula: 'mifflin', bodyFat: 20, goal: 'maintain' },
  compute: computeCalories,
  summarize: (i, o) => ({
    headline: { label: i.goal === 'maintain' ? 'Calories to maintain your weight' : 'Daily calories for your goal', value: kcal(o.target), sub: GOALS.find((g) => g.value === i.goal)!.label, raw: o.target },
    items: [
      { label: 'Maintenance (TDEE)', value: kcal(o.tdee), raw: o.tdee },
      { label: 'Basal metabolic rate (BMR)', value: kcal(o.bmr), raw: o.bmr },
      ...o.goals.filter((g) => g.value !== i.goal && g.value !== 'maintain').slice(0, 3).map((g) => ({ label: g.label, value: kcal(g.calories), raw: g.calories })),
    ],
  }),
  explain: (i, o) => {
    const s = [
      `Your body burns about ${kcal(o.bmr)} a day at complete rest (BMR, ${FORMULA[i.formula]}). With your activity level, you use about ${kcal(o.tdee)} a day: that’s your maintenance calories.`,
    ];
    if (o.dailyAdjustment !== 0) s.push(`Eating ${kcal(Math.abs(o.dailyAdjustment))} ${o.dailyAdjustment < 0 ? 'less' : 'more'} than that each day (${kcal(o.target)}) works out to about ${num(Math.abs(o.lbPerWeek), 1)} lb a week, using the 3,500-calories-per-pound estimate.`);
    if (o.belowFloor) s.push(`That target is below ${kcal(o.floor)}, a level generally not recommended without medical supervision. Choose a slower goal or add activity instead.`);
    s.push('These are estimates: real needs vary by about 10% between people. Track your weight for 2–3 weeks and adjust.');
    return s;
  },
  steps: (i, o) => [
    {
      label: `BMR (${FORMULA[i.formula]})`,
      formula:
        i.formula === 'mifflin'
          ? `10 × kg + 6.25 × cm − 5 × age ${i.sex === 'male' ? '+ 5' : '− 161'}`
          : i.formula === 'harris'
            ? i.sex === 'male'
              ? '88.362 + 13.397 × kg + 4.799 × cm − 5.677 × age'
              : '447.593 + 9.247 × kg + 3.098 × cm − 4.330 × age'
            : '370 + 21.6 × lean mass (kg)',
      substituted: i.formula === 'katch' ? `370 + 21.6 × ${num(o.weightKg, 1)} × (1 − ${num(i.bodyFat, 1)}%)` : `kg = ${num(o.weightKg, 1)}, cm = ${num(o.heightCm, 1)}, age = ${i.age}`,
      result: kcal(o.bmr),
    },
    { label: 'Total daily energy expenditure', formula: 'TDEE = BMR × activity factor', substituted: `${kcal(o.bmr)} × ${ACTIVITY[i.activity].factor}`, result: kcal(o.tdee) },
    { label: 'Goal calories', formula: 'TDEE ± 500 kcal per pound per week', substituted: `${kcal(o.tdee)} ${o.dailyAdjustment < 0 ? '−' : '+'} ${num(Math.abs(o.dailyAdjustment), 0)}`, result: kcal(o.target) },
  ],
  answerSummary: (i, o) => `A ${i.age}-year-old ${i.sex} at your height and weight with “${ACTIVITY[i.activity].label.split(':')[0]!.toLowerCase()}” activity burns about ${kcal(o.tdee)} a day, with a resting metabolic rate (BMR) of ${kcal(o.bmr)}.`,
  ogValue: (_i, o) => kcal(o.target),
  related: ['macro-calculator', 'bmi-calculator', 'body-fat-calculator', 'ideal-weight-calculator', 'running-pace-calculator'],
  sources: [
    { title: 'Mifflin MD, St Jeor ST et al. A new predictive equation for resting energy expenditure. Am J Clin Nutr 1990;51:241–7', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
    { title: 'Roza AM, Shizgal HM. The Harris Benedict equation reevaluated. Am J Clin Nutr 1984;40:168–82', url: 'https://pubmed.ncbi.nlm.nih.gov/6741850/' },
    { title: 'Frankenfield D et al. Comparison of predictive equations for resting metabolic rate. J Am Diet Assoc 2005;105:775–89', url: 'https://pubmed.ncbi.nlm.nih.gov/15883556/' },
    { title: 'NIH Body Weight Planner', url: 'https://www.niddk.nih.gov/bwp' },
    { title: 'CDC: Steps for losing weight', url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
