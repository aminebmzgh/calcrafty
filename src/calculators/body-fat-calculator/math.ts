/**
 * Body fat percentage:
 * - US Navy circumference method (Hodgdon & Beckett 1984), inch form:
 *   men   %BF = 86.010 × log10(waist − neck) − 70.041 × log10(height) + 36.76
 *   women %BF = 163.205 × log10(waist + hip − neck) − 97.684 × log10(height) − 78.387
 * - BMI method (Deurenberg et al. 1991): %BF = 1.20 × BMI + 0.23 × age − 10.8 × sex − 5.4 (sex: 1 men, 0 women).
 * Categories follow the American Council on Exercise (ACE) chart.
 */
import { D } from '../../lib/math/money.ts';
import { cmToIn, heightInOf, inToCm, weightKgOf, heightCmOf, type BodyFields, type Sex } from '../../lib/math/body.ts';

export interface BodyFatInput extends BodyFields, Record<string, unknown> {
  sex: Sex;
  age: number;
  neckIn: number;
  waistIn: number;
  hipIn: number;
  neckCm: number;
  waistCm: number;
  hipCm: number;
}

export type BodyFatCategory = 'Below essential fat' | 'Essential fat' | 'Athletes' | 'Fitness' | 'Average' | 'Obese';

/** ACE body fat chart: lower bound (%) of each category. */
export const ACE: Record<Sex, { min: number; label: BodyFatCategory; range: string }[]> = {
  female: [
    { min: 0, label: 'Below essential fat', range: 'under 10%' },
    { min: 10, label: 'Essential fat', range: '10–13%' },
    { min: 14, label: 'Athletes', range: '14–20%' },
    { min: 21, label: 'Fitness', range: '21–24%' },
    { min: 25, label: 'Average', range: '25–31%' },
    { min: 32, label: 'Obese', range: '32% and over' },
  ],
  male: [
    { min: 0, label: 'Below essential fat', range: 'under 2%' },
    { min: 2, label: 'Essential fat', range: '2–5%' },
    { min: 6, label: 'Athletes', range: '6–13%' },
    { min: 14, label: 'Fitness', range: '14–17%' },
    { min: 18, label: 'Average', range: '18–24%' },
    { min: 25, label: 'Obese', range: '25% and over' },
  ],
};

export interface BodyFatOutput {
  /** Navy method %, or null if the measurements are impossible (e.g. waist ≤ neck). */
  navy: number | null;
  bmiMethod: number;
  bmi: number;
  category: BodyFatCategory | null;
  fatKg: number | null;
  leanKg: number | null;
  weightKg: number;
}

export function navyBodyFat(sex: Sex, heightIn: number, neckIn: number, waistIn: number, hipIn: number): number | null {
  const log10 = (x: number) => D(x).log(10);
  if (sex === 'male') {
    const d = waistIn - neckIn;
    if (d <= 0 || heightIn <= 0) return null;
    return D(86.01).times(log10(d)).minus(D(70.041).times(log10(heightIn))).plus(36.76).toNumber();
  }
  const d = waistIn + hipIn - neckIn;
  if (d <= 0 || heightIn <= 0) return null;
  return D(163.205).times(log10(d)).minus(D(97.684).times(log10(heightIn))).minus(78.387).toNumber();
}

export function bmiBodyFat(sex: Sex, bmi: number, age: number): number {
  return D(1.2).times(bmi).plus(D(0.23).times(age)).minus(sex === 'male' ? 10.8 : 0).minus(5.4).toNumber();
}

export function categoryFor(sex: Sex, pct: number): BodyFatCategory {
  let label: BodyFatCategory = 'Below essential fat';
  for (const c of ACE[sex]) if (Math.round(pct) >= c.min) label = c.label;
  return label;
}

/** Tape measurements in inches from whichever unit system is active. */
export function measurementsIn(i: BodyFatInput): { neck: number; waist: number; hip: number } {
  return i.units === 'metric' ? { neck: cmToIn(i.neckCm), waist: cmToIn(i.waistCm), hip: cmToIn(i.hipCm) } : { neck: i.neckIn, waist: i.waistIn, hip: i.hipIn };
}

/** Converts tape measurements when switching units. */
export function convertMeasurements(to: string, i: BodyFatInput): Partial<BodyFatInput> {
  if (to === i.units) return {};
  const r = (n: number) => D(n).toDecimalPlaces(1).toNumber();
  return to === 'metric'
    ? { neckCm: r(inToCm(i.neckIn)), waistCm: r(inToCm(i.waistIn)), hipCm: r(inToCm(i.hipIn)) }
    : { neckIn: r(cmToIn(i.neckCm)), waistIn: r(cmToIn(i.waistCm)), hipIn: r(cmToIn(i.hipCm)) };
}

export function computeBodyFat(i: BodyFatInput): BodyFatOutput {
  const m = measurementsIn(i);
  const kg = weightKgOf(i);
  const cm = heightCmOf(i);
  const bmi = cm > 0 ? D(kg).div(D(cm).div(100).pow(2)).toNumber() : 0;
  const navyRaw = navyBodyFat(i.sex, heightInOf(i), m.neck, m.waist, m.hip);
  const navy = navyRaw === null || navyRaw < 0 || navyRaw > 75 ? null : D(navyRaw).toDecimalPlaces(1).toNumber();
  const fatKg = navy === null ? null : D(kg).times(navy).div(100).toDecimalPlaces(1).toNumber();
  return {
    navy,
    bmiMethod: D(bmiBodyFat(i.sex, bmi, i.age)).toDecimalPlaces(1).toNumber(),
    bmi,
    category: navy === null ? null : categoryFor(i.sex, navy),
    fatKg,
    leanKg: fatKg === null ? null : D(kg).minus(fatKg).toDecimalPlaces(1).toNumber(),
    weightKg: kg,
  };
}
