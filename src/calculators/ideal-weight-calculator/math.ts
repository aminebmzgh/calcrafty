/**
 * Ideal body weight (IBW) by four published formulas, each "base kg + kg per inch over 5 feet":
 *   Robinson (1983): men 52 + 1.9, women 49 + 1.7
 *   Miller (1983):   men 56.2 + 1.41, women 53.1 + 1.36
 *   Devine (1974):   men 50 + 2.3, women 45.5 + 2.3
 *   Hamwi (1964):    men 48 + 2.7, women 45.5 + 2.2
 * plus the BMI 18.5–24.9 healthy range. The formulas were derived for heights of 5 ft and over.
 */
import { D } from '../../lib/math/money.ts';
import { heightCmOf, heightInOf, weightKgOf, type BodyFields, type Sex } from '../../lib/math/body.ts';

export interface IdealWeightInput extends BodyFields, Record<string, unknown> {
  sex: Sex;
}

export const FORMULAS = [
  { id: 'robinson', name: 'Robinson (1983)', male: [52, 1.9], female: [49, 1.7] },
  { id: 'miller', name: 'Miller (1983)', male: [56.2, 1.41], female: [53.1, 1.36] },
  { id: 'devine', name: 'Devine (1974)', male: [50, 2.3], female: [45.5, 2.3] },
  { id: 'hamwi', name: 'Hamwi (1964)', male: [48, 2.7], female: [45.5, 2.2] },
] as const;

export interface IdealWeightOutput {
  results: { id: string; name: string; kg: number }[];
  minKg: number;
  maxKg: number;
  averageKg: number;
  bmiMinKg: number;
  bmiMaxKg: number;
  currentKg: number;
  heightIn: number;
  inchesOver5ft: number;
  under5ft: boolean;
}

export function idealWeightKg(heightIn: number, base: number, perInch: number): number {
  return D(base).plus(D(perInch).times(D(heightIn).minus(60))).toNumber();
}

export function computeIdealWeight(i: IdealWeightInput): IdealWeightOutput {
  const hIn = heightInOf(i);
  const results = FORMULAS.map((f) => {
    const [base, per] = i.sex === 'male' ? f.male : f.female;
    return { id: f.id, name: f.name, kg: D(idealWeightKg(hIn, base, per)).toDecimalPlaces(1).toNumber() };
  });
  const kgs = results.map((r) => r.kg);
  const m2 = D(heightCmOf(i)).div(100).pow(2);
  return {
    results,
    minKg: Math.min(...kgs),
    maxKg: Math.max(...kgs),
    averageKg: D(kgs.reduce((a, b) => a + b, 0)).div(kgs.length).toDecimalPlaces(1).toNumber(),
    bmiMinKg: m2.times(18.5).toDecimalPlaces(1).toNumber(),
    bmiMaxKg: m2.times(24.9).toDecimalPlaces(1).toNumber(),
    currentKg: weightKgOf(i),
    heightIn: hIn,
    inchesOver5ft: D(hIn).minus(60).toDecimalPlaces(1).toNumber(),
    under5ft: hIn < 60,
  };
}
