/**
 * Macronutrients: daily calories (Mifflin-St Jeor × activity ± goal, shared with the calorie calculator)
 * split into protein, carbohydrate and fat by a preset or custom percentage split.
 * Energy per gram (Atwater factors): protein 4 kcal, carbohydrate 4 kcal, fat 9 kcal.
 */
import { D } from '../../lib/math/money.ts';
import { computeCalories, type Activity, type Goal } from '../calorie-calculator/math.ts';
import type { BodyFields, Sex } from '../../lib/math/body.ts';

export const PRESETS = {
  balanced: { label: 'Balanced (25% protein, 50% carbs, 25% fat)', protein: 25, carbs: 50, fat: 25 },
  highProtein: { label: 'High protein (35 / 40 / 25)', protein: 35, carbs: 40, fat: 25 },
  lowCarb: { label: 'Low carb (30 / 20 / 50)', protein: 30, carbs: 20, fat: 50 },
  keto: { label: 'Keto (20 / 5 / 75)', protein: 20, carbs: 5, fat: 75 },
  custom: { label: 'Custom split', protein: 0, carbs: 0, fat: 0 },
} as const;
export type Preset = keyof typeof PRESETS;

export interface MacroInput extends BodyFields, Record<string, unknown> {
  sex: Sex;
  age: number;
  activity: Activity;
  goal: Goal;
  preset: Preset;
  customProtein: number;
  customCarbs: number;
  customFat: number;
  meals: number;
}

export interface Macro {
  pct: number;
  grams: number;
  kcal: number;
}

export interface MacroOutput {
  calories: number;
  tdee: number;
  protein: Macro;
  carbs: Macro;
  fat: Macro;
  /** Protein in grams per kg of body weight. */
  proteinPerKg: number;
  perMeal: { protein: number; carbs: number; fat: number };
  splitTotal: number;
  belowFloor: boolean;
}

export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export function splitMacros(calories: number, protein: number, carbs: number, fat: number) {
  const part = (pct: number, perG: number): Macro => {
    const kcal = D(calories).times(pct).div(100);
    return { pct, kcal: kcal.toDecimalPlaces(0).toNumber(), grams: kcal.div(perG).toDecimalPlaces(0).toNumber() };
  };
  return { protein: part(protein, 4), carbs: part(carbs, 4), fat: part(fat, 9) };
}

export function splitFor(i: Pick<MacroInput, 'preset' | 'customProtein' | 'customCarbs' | 'customFat'>) {
  return i.preset === 'custom' ? { protein: i.customProtein, carbs: i.customCarbs, fat: i.customFat } : PRESETS[i.preset];
}

export function splitTotalOf(i: Pick<MacroInput, 'preset' | 'customProtein' | 'customCarbs' | 'customFat'>): number {
  const s = splitFor(i);
  return s.protein + s.carbs + s.fat;
}

export function computeMacros(i: MacroInput): MacroOutput {
  const cal = computeCalories({ ...i, formula: 'mifflin', bodyFat: 20 });
  const s = splitFor(i);
  const m = splitMacros(cal.target, s.protein, s.carbs, s.fat);
  const meals = Math.max(1, Math.round(i.meals));
  const per = (g: number) => D(g).div(meals).toDecimalPlaces(0).toNumber();
  return {
    calories: cal.target,
    tdee: cal.tdee,
    ...m,
    proteinPerKg: D(m.protein.grams).div(cal.weightKg).toDecimalPlaces(1).toNumber(),
    perMeal: { protein: per(m.protein.grams), carbs: per(m.carbs.grams), fat: per(m.fat.grams) },
    splitTotal: s.protein + s.carbs + s.fat,
    belowFloor: cal.belowFloor,
  };
}
