/** Percentages in exact decimal arithmetic: X% of Y, X is what % of Y, percent change, discounts and increases. */
import { D } from '../../lib/math/money.ts';

export type PercentMode = 'of' | 'whatPercent' | 'change' | 'off' | 'increase';

export interface PercentInput extends Record<string, unknown> {
  mode: PercentMode;
  ofPct: number;
  ofValue: number;
  part: number;
  whole: number;
  from: number;
  to: number;
  price: number;
  offPct: number;
  base: number;
  upPct: number;
}

export interface PercentOutput {
  /** The main answer (a number or a percentage, depending on the mode). */
  result: number | null;
  /** Secondary numbers: the amount saved / the difference, etc. */
  difference: number | null;
  isPercent: boolean;
  /** Error to show instead of a result (e.g. division by zero). */
  error: string | null;
}

const n = (x: unknown) => D(x as number);
const round = (x: ReturnType<typeof D>) => x.toDecimalPlaces(10).toNumber();

export function percentOf(pct: number, value: number): number {
  return round(n(pct).times(value).div(100));
}

export function whatPercent(part: number, whole: number): number | null {
  return whole === 0 ? null : round(n(part).div(whole).times(100));
}

export function percentChange(from: number, to: number): number | null {
  return from === 0 ? null : round(n(to).minus(from).div(Math.abs(from)).times(100));
}

export function computePercent(i: PercentInput): PercentOutput {
  switch (i.mode) {
    case 'of':
      return { result: percentOf(i.ofPct, i.ofValue), difference: round(n(i.ofValue).minus(percentOf(i.ofPct, i.ofValue))), isPercent: false, error: null };
    case 'whatPercent': {
      const r = whatPercent(i.part, i.whole);
      return { result: r, difference: null, isPercent: true, error: r === null ? 'The whole can’t be zero.' : null };
    }
    case 'change': {
      const r = percentChange(i.from, i.to);
      return { result: r, difference: round(n(i.to).minus(i.from)), isPercent: true, error: r === null ? 'Percent change from zero is undefined.' : null };
    }
    case 'off': {
      const saved = percentOf(i.offPct, i.price);
      return { result: round(n(i.price).minus(saved)), difference: saved, isPercent: false, error: null };
    }
    case 'increase': {
      const added = percentOf(i.upPct, i.base);
      return { result: round(n(i.base).plus(added)), difference: added, isPercent: false, error: null };
    }
  }
}
