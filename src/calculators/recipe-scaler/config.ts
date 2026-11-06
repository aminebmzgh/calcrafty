import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeRecipe, type RecipeInput, type RecipeOutput } from './math.ts';

const SAMPLE = ['2 cups flour', '1 1/2 tsp baking powder', '1/2 tsp salt', '3 eggs', '1/3 cup sugar', '1 cup milk', 'vanilla to taste'].join('\n');

const config: CalculatorConfig<RecipeInput, RecipeOutput> = {
  slug: 'recipe-scaler',
  category: 'food',
  subtopic: 'Recipes and portions',
  name: 'Recipe Scaler',
  h1: 'Recipe Scaler',
  intro: 'Paste a recipe and change the servings: every quantity is scaled and shown as an easy kitchen fraction.',
  metaTitle: 'Recipe Scaler: Double, Halve or Resize Any Recipe',
  metaDescription:
    'Scale a recipe up or down to any number of servings. Paste the ingredients and get each amount resized and rounded to kitchen fractions like 1/3 cup.',
  primaryKeyword: 'recipe scaler',
  secondaryKeywords: ['recipe converter', 'recipe resizer', 'double a recipe calculator', 'half a recipe calculator'],
  synonyms: ['scale recipe', 'halve a recipe', 'double recipe', 'servings', 'portions', 'cooking fractions'],
  inputs: [
    { id: 'servings', label: 'Recipe makes', type: 'number', unit: 'count', min: 0.25, max: 1_000, step: 0.25, slider: false, group: 'serv', helpText: 'Servings, or pieces, or batches.' },
    { id: 'newServings', label: 'You want', type: 'number', unit: 'count', min: 0.25, max: 1_000, step: 0.25, slider: false, group: 'serv', e2eValue: '9' },
    { id: 'ingredients', label: 'Ingredients, one per line', type: 'textarea', placeholder: '2 cups flour', maxLength: 6_000, helpText: 'Start each line with the amount: 2, 1/2, 1 1/2, 0.75 or ½ all work.' },
  ],
  defaults: { servings: 4, newServings: 6, ingredients: SAMPLE },
  compute: computeRecipe,
  summarize: (i, o) => ({
    headline: { label: 'Scale factor', value: `× ${num(o.factor, 4)}`, sub: `${num(i.servings, 2)} → ${num(i.newServings, 2)} servings, ${o.scaledCount} ingredient${o.scaledCount === 1 ? '' : 's'} resized`, raw: o.factor },
    items: o.lines.slice(0, 4).map((l) => ({ label: l.rest || l.original, value: l.display ?? 'unchanged' })),
  }),
  explain: (_i, o) => {
    if (!o.lines.length) return ['Paste your ingredients, one per line, starting with the amount.'];
    const s = [`Every amount is multiplied by ${num(o.factor, 4)} and rounded to the nearest eighth, sixth, third or two-thirds, so it’s easy to measure.`];
    if (o.lines.some((l) => l.approximate)) s.push('Some tiny amounts were rounded noticeably; they are marked ≈ in the list. Use a pinch or a smaller measure for those.');
    if (o.lines.some((l) => /egg/i.test(l.rest) && l.scaled !== null && l.scaled % 1 !== 0)) s.push('For part of an egg, beat the eggs together and measure: one large egg is about 3 tablespoons, so half an egg is about 1½ tablespoons.');
    s.push('Baking times and pan sizes don’t scale in a straight line. Use a pan of the right size and check doneness early.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Scale factor', formula: 'servings you want ÷ servings the recipe makes', substituted: `${num(i.newServings, 2)} ÷ ${num(i.servings, 2)}`, result: `× ${num(o.factor, 4)}` },
    ...o.lines
      .filter((l) => l.quantity !== null)
      .slice(0, 8)
      .map((l) => ({ label: l.rest, formula: 'amount × factor', substituted: `${num(l.quantity, 4)} × ${num(o.factor, 4)} = ${num(l.scaled, 4)}`, result: l.display ?? '' })),
  ],
  answerSummary: (i, o) => `To turn a ${num(i.servings, 0)}-serving recipe into ${num(i.newServings, 0)} servings, multiply every ingredient by ${num(o.factor, 2)}${o.lines[0]?.display ? `: ${o.lines[0].original} becomes ${o.lines[0].display} ${o.lines[0].rest}` : ''}.`,
  ogValue: (_i, o) => `× ${num(o.factor, 2)}`,
  related: ['fraction-calculator', 'percentage-calculator', 'calorie-calculator', 'macro-calculator', 'tip-calculator'],
  sources: [
    { title: 'NIST: Unit conversion (U.S. customary cooking measures)', url: 'https://www.nist.gov/pml/weights-and-measures/metric-si/unit-conversion' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
