/**
 * Daily calorie needs: BMR by Mifflin-St Jeor (default), revised Harris-Benedict (Roza & Shizgal 1984)
 * or Katch-McArdle, times an activity factor (TDEE), then adjusted for a weight goal.
 * Goal adjustments use the common approximation of ~3,500 kcal per pound (~7,700 kcal per kg) of body weight.
 */
import { D } from '../../lib/math/money.ts';
import { heightCmOf, weightKgOf, type BodyFields, type Sex } from '../../lib/math/body.ts';

export type Formula = 'mifflin' | 'harris' | 'katch';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very';

export const ACTIVITY: Record<Activity, { factor: number; label: string }> = {
  sedentary: { factor: 1.2, label: 'Sedentary: little or no exercise' },
  light: { factor: 1.375, label: 'Light: exercise 1–3 days a week' },
  moderate: { factor: 1.55, label: 'Moderate: exercise 3–5 days a week' },
  active: { factor: 1.725, label: 'Active: hard exercise 6–7 days a week' },
  very: { factor: 1.9, label: 'Very active: physical job or training twice a day' },
};

/** Weekly change in pounds → daily kcal adjustment (3,500 kcal ≈ 1 lb). */
export const GOALS = [
  { value: 'lose2', label: 'Lose 2 lb (0.9 kg) a week', lbPerWeek: -2 },
  { value: 'lose1', label: 'Lose 1 lb (0.45 kg) a week', lbPerWeek: -1 },
  { value: 'lose05', label: 'Lose 0.5 lb (0.23 kg) a week', lbPerWeek: -0.5 },
  { value: 'maintain', label: 'Maintain weight', lbPerWeek: 0 },
  { value: 'gain05', label: 'Gain 0.5 lb (0.23 kg) a week', lbPerWeek: 0.5 },
  { value: 'gain1', label: 'Gain 1 lb (0.45 kg) a week', lbPerWeek: 1 },
] as const;
export type Goal = (typeof GOALS)[number]['value'];

export interface CalorieInput extends BodyFields, Record<string, unknown> {
  sex: Sex;
  age: number;
  activity: Activity;
  formula: Formula;
  bodyFat: number;
  goal: Goal;
}

export interface CalorieOutput {
  bmr: number;
  tdee: number;
  target: number;
  dailyAdjustment: number;
  /** Expected weekly change in pounds (negative = loss). */
  lbPerWeek: number;
  /** Commonly cited minimum intake without medical supervision (1,200 women / 1,500 men). */
  floor: number;
  belowFloor: boolean;
  goals: { value: Goal; label: string; calories: number }[];
  weightKg: number;
  heightCm: number;
}

export function bmrMifflin(sex: Sex, kg: number, cm: number, age: number): number {
  const base = D(kg).times(10).plus(D(cm).times(6.25)).minus(D(age).times(5));
  return base.plus(sex === 'male' ? 5 : -161).toNumber();
}

export function bmrHarris(sex: Sex, kg: number, cm: number, age: number): number {
  return sex === 'male'
    ? D(88.362).plus(D(kg).times(13.397)).plus(D(cm).times(4.799)).minus(D(age).times(5.677)).toNumber()
    : D(447.593).plus(D(kg).times(9.247)).plus(D(cm).times(3.098)).minus(D(age).times(4.33)).toNumber();
}

export function bmrKatch(kg: number, bodyFatPct: number): number {
  const lbm = D(kg).times(D(1).minus(D(bodyFatPct).div(100)));
  return D(370).plus(lbm.times(21.6)).toNumber();
}

export function computeCalories(i: CalorieInput): CalorieOutput {
  const kg = weightKgOf(i);
  const cm = heightCmOf(i);
  const bmr = i.formula === 'harris' ? bmrHarris(i.sex, kg, cm, i.age) : i.formula === 'katch' ? bmrKatch(kg, i.bodyFat) : bmrMifflin(i.sex, kg, cm, i.age);
  const tdeeExact = D(bmr).times(ACTIVITY[i.activity].factor);
  const tdee = tdeeExact.toDecimalPlaces(0).toNumber();
  const adj = (lb: number) => D(lb).times(3500).div(7).toNumber();
  const goals = GOALS.map((g) => ({ value: g.value, label: g.label, calories: tdeeExact.plus(adj(g.lbPerWeek)).toDecimalPlaces(0).toNumber() }));
  const target = goals.find((g) => g.value === i.goal)!.calories;
  const floor = i.sex === 'male' ? 1500 : 1200;
  return {
    bmr: D(bmr).toDecimalPlaces(0).toNumber(),
    tdee,
    target,
    dailyAdjustment: adj(GOALS.find((g) => g.value === i.goal)!.lbPerWeek),
    lbPerWeek: GOALS.find((g) => g.value === i.goal)!.lbPerWeek,
    floor,
    belowFloor: target < floor,
    goals,
    weightKg: kg,
    heightCm: cm,
  };
}
