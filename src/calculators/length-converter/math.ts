/**
 * Length conversion through the meter, using exact defined factors (NIST): 1 in = 0.0254 m,
 * 1 ft = 0.3048 m, 1 yd = 0.9144 m, 1 mi = 1,609.344 m, 1 nautical mile = 1,852 m.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type LengthUnit = 'mm' | 'cm' | 'm' | 'km' | 'in' | 'ft' | 'yd' | 'mi' | 'nmi';

export interface LengthInput extends Record<string, unknown> {
  value: number;
  from: LengthUnit;
  to: LengthUnit;
}

export interface LengthRow {
  unit: LengthUnit;
  value: number;
}

export interface LengthOutput {
  result: number;
  /** 1 `from` = factor `to`. */
  factor: number;
  meters: number;
  /** The length as feet and inches, e.g. { feet: 5, inches: 10.87 }. */
  feetInches: { feet: number; inches: number };
  all: LengthRow[];
}

export const METERS_PER: Record<LengthUnit, string> = { mm: '0.001', cm: '0.01', m: '1', km: '1000', in: '0.0254', ft: '0.3048', yd: '0.9144', mi: '1609.344', nmi: '1852' };
export const UNITS: LengthUnit[] = ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi', 'nmi'];

const sig = (d: Decimal) => d.toSignificantDigits(12).toNumber();

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  return sig(D(value || 0).times(METERS_PER[from]).div(METERS_PER[to]));
}

export function computeLength(i: LengthInput): LengthOutput {
  const meters = D(i.value || 0).times(METERS_PER[i.from]);
  const totalInches = meters.div(METERS_PER.in);
  const sign = totalInches.isNegative() ? -1 : 1;
  const absIn = totalInches.abs();
  let feet = absIn.div(12).toDecimalPlaces(0, Decimal.ROUND_DOWN);
  let inches = absIn.minus(feet.times(12)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  if (inches.gte(12)) {
    feet = feet.plus(1);
    inches = inches.minus(12);
  }
  return {
    result: convertLength(i.value, i.from, i.to),
    factor: convertLength(1, i.from, i.to),
    meters: sig(meters),
    feetInches: { feet: sign * feet.toNumber(), inches: inches.toNumber() },
    all: UNITS.map((u) => ({ unit: u, value: sig(meters.div(METERS_PER[u])) })),
  };
}
