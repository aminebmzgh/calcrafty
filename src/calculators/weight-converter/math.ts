/**
 * Weight (mass) conversion through the kilogram, using exact defined factors (NIST):
 * 1 lb = 0.45359237 kg (since 1959), 1 oz = 1/16 lb, 1 stone = 14 lb, 1 short ton = 2,000 lb,
 * 1 long ton = 2,240 lb, 1 metric ton = 1,000 kg, 1 troy ounce = 31.1034768 g.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type WeightUnit = 'mg' | 'g' | 'kg' | 't' | 'oz' | 'lb' | 'st' | 'ton' | 'lt' | 'ozt';

export interface WeightInput extends Record<string, unknown> {
  value: number;
  from: WeightUnit;
  to: WeightUnit;
}

export interface WeightRow {
  unit: WeightUnit;
  value: number;
}

export interface WeightOutput {
  result: number;
  factor: number;
  kilograms: number;
  /** The weight as pounds and ounces, e.g. { pounds: 154, ounces: 5.92 }. */
  poundsOunces: { pounds: number; ounces: number };
  /** The weight as stone and pounds. */
  stonePounds: { stone: number; pounds: number };
  all: WeightRow[];
}

const LB = '0.45359237';
export const KG_PER: Record<WeightUnit, Decimal> = {
  mg: D('0.000001'),
  g: D('0.001'),
  kg: D(1),
  t: D(1000),
  oz: D(LB).div(16),
  lb: D(LB),
  st: D(LB).times(14),
  ton: D(LB).times(2000),
  lt: D(LB).times(2240),
  ozt: D('0.0311034768'),
};
export const UNITS: WeightUnit[] = ['mg', 'g', 'kg', 't', 'oz', 'lb', 'st', 'ton', 'lt', 'ozt'];

const sig = (d: Decimal) => d.toSignificantDigits(12).toNumber();

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  return sig(D(value || 0).times(KG_PER[from]).div(KG_PER[to]));
}

/** Splits a quantity of a small unit into whole big units and a rounded remainder (never "5 lb 16 oz"). */
function split(total: Decimal, per: number, dp: number): [number, number] {
  const sign = total.isNegative() ? -1 : 1;
  const abs = total.abs();
  let whole = abs.div(per).toDecimalPlaces(0, Decimal.ROUND_DOWN);
  let rest = abs.minus(whole.times(per)).toDecimalPlaces(dp, Decimal.ROUND_HALF_UP);
  if (rest.gte(per)) {
    whole = whole.plus(1);
    rest = rest.minus(per);
  }
  return [sign * whole.toNumber(), rest.toNumber()];
}

export function computeWeight(i: WeightInput): WeightOutput {
  const kg = D(i.value || 0).times(KG_PER[i.from]);
  const [pounds, ounces] = split(kg.div(KG_PER.oz), 16, 2);
  const [stone, stLb] = split(kg.div(KG_PER.lb), 14, 1);
  return {
    result: convertWeight(i.value, i.from, i.to),
    factor: convertWeight(1, i.from, i.to),
    kilograms: sig(kg),
    poundsOunces: { pounds, ounces },
    stonePounds: { stone, pounds: stLb },
    all: UNITS.map((u) => ({ unit: u, value: sig(kg.div(KG_PER[u])) })),
  };
}
