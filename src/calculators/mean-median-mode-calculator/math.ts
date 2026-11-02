/**
 * Measures of center and spread for a list of numbers: mean, median, mode(s), range, sum, count,
 * minimum and maximum. Uses exact decimal arithmetic so sums like 0.1 + 0.2 come out right.
 */
import { D, Decimal } from '../../lib/math/money.ts';
import { parseData } from '../standard-deviation-calculator/math.ts';

export interface MmmInput extends Record<string, unknown> {
  data: string;
}

export interface MmmOutput {
  count: number;
  sum: number;
  mean: number;
  median: number;
  /** All values that occur most often; empty when every value occurs once. */
  modes: number[];
  modeCount: number;
  min: number;
  max: number;
  range: number;
  sorted: number[];
  invalid: string[];
}

const round = (x: Decimal) => x.toDecimalPlaces(10, Decimal.ROUND_HALF_UP).toNumber();

export function medianOf(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 ? sorted[mid]! : round(D(sorted[mid - 1]!).plus(sorted[mid]!).div(2));
}

export function modesOf(values: number[]): { modes: number[]; count: number } {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const top = Math.max(0, ...counts.values());
  if (top <= 1) return { modes: [], count: top };
  return { modes: [...counts.entries()].filter(([, c]) => c === top).map(([v]) => v).sort((a, b) => a - b), count: top };
}

export function computeMmm(i: MmmInput): MmmOutput {
  const { values, invalid } = parseData(i.data);
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const sum = values.reduce((s, v) => s.plus(v), D(0));
  const { modes, count } = modesOf(values);
  return {
    count: n,
    sum: round(sum),
    mean: n ? round(sum.div(n)) : 0,
    median: medianOf(sorted),
    modes,
    modeCount: count,
    min: n ? sorted[0]! : 0,
    max: n ? sorted[n - 1]! : 0,
    range: n ? round(D(sorted[n - 1]!).minus(sorted[0]!)) : 0,
    sorted,
    invalid,
  };
}
