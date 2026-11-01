/**
 * Adult BMI (CDC/WHO): weight (kg) ÷ height (m)². The imperial form, 703 × lb ÷ in², gives the same
 * result to rounding; we convert to metric with exact factors and use one formula.
 */
import { D } from '../../lib/math/money.ts';
import { heightCmOf, weightKgOf, type BodyFields } from '../../lib/math/body.ts';

export interface BmiInput extends BodyFields, Record<string, unknown> {}

export type BmiCategory = 'Underweight' | 'Healthy weight' | 'Overweight' | 'Obesity class 1' | 'Obesity class 2' | 'Obesity class 3';

/** CDC adult categories: lower bound of each category. */
export const BMI_CATEGORIES: { min: number; label: BmiCategory; range: string }[] = [
  { min: 0, label: 'Underweight', range: 'under 18.5' },
  { min: 18.5, label: 'Healthy weight', range: '18.5–24.9' },
  { min: 25, label: 'Overweight', range: '25–29.9' },
  { min: 30, label: 'Obesity class 1', range: '30–34.9' },
  { min: 35, label: 'Obesity class 2', range: '35–39.9' },
  { min: 40, label: 'Obesity class 3', range: '40 and over' },
];

export interface BmiOutput {
  bmi: number;
  /** BMI rounded to one decimal, as clinicians report it. */
  bmiRounded: number;
  category: BmiCategory;
  heightM: number;
  weightKg: number;
  /** Weight range (kg) for BMI 18.5–24.9 at this height. */
  healthyMinKg: number;
  healthyMaxKg: number;
  /** kg to lose (positive) or gain (negative) to reach the nearest healthy bound; 0 if within. */
  toHealthyKg: number;
}

export function bmiOf(weightKg: number, heightCm: number): number {
  const m = D(heightCm).div(100);
  if (m.lte(0)) return 0;
  return D(weightKg).div(m.times(m)).toNumber();
}

export function categoryOf(bmiRounded: number): BmiCategory {
  let label: BmiCategory = 'Underweight';
  for (const c of BMI_CATEGORIES) if (bmiRounded >= c.min) label = c.label;
  return label;
}

export function computeBmi(i: BmiInput): BmiOutput {
  const cm = heightCmOf(i);
  const kg = weightKgOf(i);
  const bmi = bmiOf(kg, cm);
  const bmiRounded = D(bmi).toDecimalPlaces(1).toNumber();
  const m2 = D(cm).div(100).pow(2);
  const healthyMinKg = m2.times(18.5).toDecimalPlaces(1).toNumber();
  const healthyMaxKg = m2.times(24.9).toDecimalPlaces(1).toNumber();
  const toHealthyKg = kg > healthyMaxKg ? D(kg).minus(healthyMaxKg).toDecimalPlaces(1).toNumber() : kg < healthyMinKg ? D(kg).minus(healthyMinKg).toDecimalPlaces(1).toNumber() : 0;
  return { bmi, bmiRounded, category: categoryOf(bmiRounded), heightM: D(cm).div(100).toNumber(), weightKg: kg, healthyMinKg, healthyMaxKg, toHealthyKg };
}
