/**
 * Body measurement helpers shared by the health calculators: exact unit conversions
 * (1 lb = 0.45359237 kg, 1 in = 2.54 cm by international definition) and the imperial/metric switch.
 */
import { D } from './money.ts';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export type Units = 'imperial' | 'metric';
export type Sex = 'female' | 'male';

/** The measurement fields every health calculator shares. */
export interface BodyFields {
  units: Units;
  heightFt: number;
  heightIn: number;
  heightCm: number;
  weightLb: number;
  weightKg: number;
}

export const lbToKg = (lb: number): number => D(lb).times(KG_PER_LB).toNumber();
export const kgToLb = (kg: number): number => D(kg).div(KG_PER_LB).toNumber();
export const inToCm = (inches: number): number => D(inches).times(CM_PER_IN).toNumber();
export const cmToIn = (cm: number): number => D(cm).div(CM_PER_IN).toNumber();

/** Height in centimeters from whichever unit system is active. */
export function heightCmOf(b: Pick<BodyFields, 'units' | 'heightFt' | 'heightIn' | 'heightCm'>): number {
  return b.units === 'metric' ? b.heightCm : inToCm(b.heightFt * 12 + b.heightIn);
}

/** Total height in inches from whichever unit system is active. */
export function heightInOf(b: Pick<BodyFields, 'units' | 'heightFt' | 'heightIn' | 'heightCm'>): number {
  return b.units === 'metric' ? cmToIn(b.heightCm) : b.heightFt * 12 + b.heightIn;
}

/** Weight in kilograms from whichever unit system is active. */
export function weightKgOf(b: Pick<BodyFields, 'units' | 'weightLb' | 'weightKg'>): number {
  return b.units === 'metric' ? b.weightKg : lbToKg(b.weightLb);
}

const round = (n: number, dp: number) => D(n).toDecimalPlaces(dp).toNumber();

/** Values to set when the user switches unit systems, so the new fields show the same body. */
export function convertBodyUnits(to: string, b: BodyFields): Partial<BodyFields> {
  if (to === b.units) return {};
  if (to === 'metric') {
    return { heightCm: round(inToCm(b.heightFt * 12 + b.heightIn), 1), weightKg: round(lbToKg(b.weightLb), 1) };
  }
  const totalIn = cmToIn(b.heightCm);
  let ft = Math.floor(totalIn / 12);
  let inches = round(totalIn - ft * 12, 1);
  if (inches >= 12) {
    ft += 1;
    inches = 0;
  }
  return { heightFt: ft, heightIn: inches, weightLb: round(kgToLb(b.weightKg), 1) };
}

/** Formats a height for sentences: 5 ft 9 in / 175 cm. */
export function heightLabel(b: Pick<BodyFields, 'units' | 'heightFt' | 'heightIn' | 'heightCm'>): string {
  return b.units === 'metric' ? `${round(b.heightCm, 1)} cm` : `${b.heightFt} ft ${round(b.heightIn, 1)} in`;
}

/** Formats a weight in the active units. */
export function weightLabel(kg: number, units: Units, dp = 1): string {
  return units === 'metric' ? `${round(kg, dp)} kg` : `${round(kgToLb(kg), dp)} lb`;
}
