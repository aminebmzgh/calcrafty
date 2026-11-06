/**
 * Temperature conversion through kelvin, using the exact definitions:
 * K = °C + 273.15, °F = °C × 9/5 + 32, °R = K × 9/5 (Rankine).
 * Also converts a temperature difference (a change of 10 °C is a change of 18 °F, with no 32 offset).
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type TempUnit = 'C' | 'F' | 'K' | 'R';

export interface TemperatureInput extends Record<string, unknown> {
  value: number;
  from: TempUnit;
  to: TempUnit;
}

export interface TempRow {
  unit: TempUnit;
  value: number;
}

export interface TemperatureOutput {
  result: number;
  kelvin: number;
  /** Below absolute zero: physically impossible. */
  belowAbsoluteZero: boolean;
  /** The same number read as a temperature difference. */
  difference: number;
  all: TempRow[];
}

export const UNITS: TempUnit[] = ['C', 'F', 'K', 'R'];
const NINE_FIFTHS = D(9).div(5);

const toKelvin = (v: Decimal, u: TempUnit): Decimal => {
  switch (u) {
    case 'C':
      return v.plus('273.15');
    case 'F':
      return v.minus(32).div(NINE_FIFTHS).plus('273.15');
    case 'K':
      return v;
    case 'R':
      return v.div(NINE_FIFTHS);
  }
};

const fromKelvin = (k: Decimal, u: TempUnit): Decimal => {
  switch (u) {
    case 'C':
      return k.minus('273.15');
    case 'F':
      return k.minus('273.15').times(NINE_FIFTHS).plus(32);
    case 'K':
      return k;
    case 'R':
      return k.times(NINE_FIFTHS);
  }
};

/** Size of one degree in kelvins. */
const DEGREE: Record<TempUnit, Decimal> = { C: D(1), K: D(1), F: D(5).div(9), R: D(5).div(9) };

const sig = (d: Decimal) => d.toDecimalPlaces(10, Decimal.ROUND_HALF_UP).toSignificantDigits(12).toNumber();

export function convertTemperature(value: number, from: TempUnit, to: TempUnit): number {
  return sig(fromKelvin(toKelvin(D(value || 0), from), to));
}

export function convertDifference(value: number, from: TempUnit, to: TempUnit): number {
  return sig(D(value || 0).times(DEGREE[from]).div(DEGREE[to]));
}

export function computeTemperature(i: TemperatureInput): TemperatureOutput {
  const k = toKelvin(D(i.value || 0), i.from);
  return {
    result: convertTemperature(i.value, i.from, i.to),
    kelvin: sig(k),
    belowAbsoluteZero: k.isNegative(),
    difference: convertDifference(i.value, i.from, i.to),
    all: UNITS.map((u) => ({ unit: u, value: sig(fromKelvin(k, u)) })),
  };
}

/** Reference temperatures (°C values exact by definition, or standard values at sea level) on three scales. */
export const REFERENCE_POINTS: [string, number][] = [
  ['Absolute zero', -273.15],
  ['Same in °C and °F', -40],
  ['Water freezes', 0],
  ['Room temperature', 20],
  ['Normal body temperature', 37],
  ['Water boils (sea level)', 100],
  ['Moderate oven', 180],
];

export function referenceTable(): { label: string; c: number; f: number; k: number }[] {
  return REFERENCE_POINTS.map(([label, c]) => ({ label, c, f: convertTemperature(c, 'C', 'F'), k: convertTemperature(c, 'C', 'K') }));
}
