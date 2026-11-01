import type { CalculatorConfig } from '../../lib/types.ts';
import { num, pct } from '../../lib/format.ts';
import { ageInput, BODY_DEFAULTS, heightInputs, sexInput, unitsInput, weightInputs } from '../../lib/health-inputs.ts';
import { ACTIVITY, GOALS } from '../calorie-calculator/math.ts';
import { computeMacros, PRESETS, splitFor, splitTotalOf, type MacroInput, type MacroOutput } from './math.ts';

const g = (n: number) => `${num(n, 0)} g`;
const custom = (i: MacroInput) => i.preset === 'custom';

const config: CalculatorConfig<MacroInput, MacroOutput> = {
  slug: 'macro-calculator',
  category: 'health',
  subtopic: 'Nutrition',
  name: 'Macro Calculator',
  h1: 'Macro Calculator',
  intro: 'Daily protein, carbs and fat in grams for your calorie goal, with balanced, high-protein, low-carb or keto splits.',
  metaTitle: 'Macro Calculator: Protein, Carbs and Fat | Calcrafty',
  metaDescription:
    'Calculate your daily macros: grams of protein, carbs and fat for your calorie goal, with balanced, high-protein, low-carb, keto or custom splits.',
  primaryKeyword: 'macro calculator',
  secondaryKeywords: ['macronutrient calculator', 'iifym calculator', 'keto macro calculator'],
  synonyms: ['macros', 'protein', 'carbs', 'fat', 'keto', 'iifym', 'meal plan'],
  inputs: [
    unitsInput<MacroInput>(),
    sexInput<MacroInput>(),
    ageInput<MacroInput>(15),
    ...heightInputs<MacroInput>(),
    ...weightInputs<MacroInput>(),
    { id: 'activity', label: 'Activity level', type: 'select', options: Object.entries(ACTIVITY).map(([value, a]) => ({ value, label: a.label })) },
    { id: 'goal', label: 'Goal', type: 'select', options: GOALS.map((x) => ({ value: x.value, label: x.label })) },
    { id: 'preset', label: 'Macro split', type: 'select', options: Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label })) },
    { id: 'customProtein', label: 'Protein', type: 'number', unit: 'percent', min: 5, max: 70, step: 1, sliderMax: 60, group: 'custom', showIf: custom },
    { id: 'customCarbs', label: 'Carbs', type: 'number', unit: 'percent', min: 0, max: 80, step: 1, sliderMax: 75, group: 'custom', showIf: custom },
    { id: 'customFat', label: 'Fat', type: 'number', unit: 'percent', min: 5, max: 85, step: 1, sliderMax: 80, group: 'custom', showIf: custom },
    { id: 'meals', label: 'Meals per day', type: 'number', unit: 'count', min: 1, max: 8, step: 1, integer: true, slider: false, advanced: true },
  ],
  defaults: { ...BODY_DEFAULTS, sex: 'male', age: 35, activity: 'moderate', goal: 'maintain', preset: 'balanced', customProtein: 30, customCarbs: 40, customFat: 30, meals: 3 },
  validate: (i) => {
    if (i.preset !== 'custom') return [];
    const total = splitTotalOf(i);
    return total === 100 ? [] : [{ id: 'customFat', message: `Protein, carbs and fat must add up to 100% (now ${total}%).` }];
  },
  compute: computeMacros,
  summarize: (i, o) => ({
    headline: { label: 'Daily macros', value: `${g(o.protein.grams)} · ${g(o.carbs.grams)} · ${g(o.fat.grams)}`, sub: `protein · carbs · fat, for ${num(o.calories, 0)} calories a day` },
    items: [
      { label: `Protein (${pct(o.protein.pct, 0)})`, value: `${g(o.protein.grams)} · ${num(o.protein.kcal, 0)} kcal`, raw: o.protein.grams },
      { label: `Carbs (${pct(o.carbs.pct, 0)})`, value: `${g(o.carbs.grams)} · ${num(o.carbs.kcal, 0)} kcal`, raw: o.carbs.grams },
      { label: `Fat (${pct(o.fat.pct, 0)})`, value: `${g(o.fat.grams)} · ${num(o.fat.kcal, 0)} kcal`, raw: o.fat.grams },
      { label: `Per meal (${i.meals} meals)`, value: `${g(o.perMeal.protein)} P · ${g(o.perMeal.carbs)} C · ${g(o.perMeal.fat)} F` },
      { label: 'Protein per kg of body weight', value: `${num(o.proteinPerKg, 1)} g/kg` },
    ],
  }),
  explain: (i, o) => {
    const s = [`For ${num(o.calories, 0)} calories a day, the ${PRESETS[i.preset].label.split(' (')[0]!.toLowerCase()} split gives ${g(o.protein.grams)} of protein, ${g(o.carbs.grams)} of carbohydrate and ${g(o.fat.grams)} of fat.`];
    s.push(`That’s ${num(o.proteinPerKg, 1)} g of protein per kg of body weight. Adults need at least 0.8 g/kg; people who strength-train or are losing weight often aim for about 1.2 to 2.0 g/kg.`);
    if (o.belowFloor) s.push('Your calorie target is below the usual minimum (1,200 for women, 1,500 for men). Choose a slower goal.');
    s.push('Hit the daily totals roughly; being within about 10% most days is plenty.');
    return s;
  },
  steps: (i, o) => {
    const sp = splitFor(i);
    return [
      { label: 'Daily calories', formula: 'Mifflin-St Jeor BMR × activity ± goal', substituted: `TDEE ${num(o.tdee, 0)} kcal, goal adjusted`, result: `${num(o.calories, 0)} kcal` },
      { label: 'Protein', formula: 'calories × protein % ÷ 4 kcal/g', substituted: `${num(o.calories, 0)} × ${sp.protein}% ÷ 4`, result: g(o.protein.grams) },
      { label: 'Carbohydrate', formula: 'calories × carb % ÷ 4 kcal/g', substituted: `${num(o.calories, 0)} × ${sp.carbs}% ÷ 4`, result: g(o.carbs.grams) },
      { label: 'Fat', formula: 'calories × fat % ÷ 9 kcal/g', substituted: `${num(o.calories, 0)} × ${sp.fat}% ÷ 9`, result: g(o.fat.grams) },
    ];
  },
  answerSummary: (_i, o) => `On ${num(o.calories, 0)} calories a day with a balanced 25/50/25 split, eat about ${g(o.protein.grams)} of protein, ${g(o.carbs.grams)} of carbohydrate and ${g(o.fat.grams)} of fat daily.`,
  ogValue: (_i, o) => `${num(o.protein.grams, 0)}g protein`,
  related: ['calorie-calculator', 'body-fat-calculator', 'bmi-calculator', 'ideal-weight-calculator'],
  sources: [
    { title: 'National Academies: Dietary Reference Intakes for macronutrients (AMDR)', url: 'https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids' },
    { title: 'USDA/HHS: Dietary Guidelines for Americans', url: 'https://www.dietaryguidelines.gov/' },
    { title: 'Jäger R et al. ISSN position stand: protein and exercise. J Int Soc Sports Nutr 2017;14:20', url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/' },
    { title: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov/' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
