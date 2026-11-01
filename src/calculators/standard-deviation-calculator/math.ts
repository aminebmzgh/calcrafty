/**
 * Standard deviation (population σ and sample s) with variance, mean, standard error and the
 * intermediate steps, in exact decimal arithmetic (square roots to 30 significant digits).
 */
import { D, Decimal } from '../../lib/math/money.ts';

export interface StdDevInput extends Record<string, unknown> {
  data: string;
  /** Which result to feature. */
  kind: 'sample' | 'population';
}

export interface StdDevOutput {
  values: number[];
  invalid: string[];
  n: number;
  sum: number;
  mean: number;
  /** Sum of squared deviations from the mean. */
  ss: number;
  populationVariance: number;
  populationSd: number;
  sampleVariance: number | null;
  sampleSd: number | null;
  /** Standard error of the mean (sample SD ÷ √n). */
  standardError: number | null;
  min: number;
  max: number;
  median: number;
  deviations: { x: number; dev: number; sq: number }[];
  error: string | null;
}

/** Splits on commas, whitespace, semicolons and new lines; accepts "1,234.5"-style numbers only when separated by spaces. */
export function parseData(text: string): { values: number[]; invalid: string[] } {
  const tokens = text
    .split(/[\s;,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const values: number[] = [];
  const invalid: string[] = [];
  for (const t of tokens) {
    const n = Number(t.replace(/^\+/, '').replace(/[−–]/g, '-'));
    if (Number.isFinite(n)) values.push(n);
    else invalid.push(t);
  }
  return { values, invalid };
}

const num = (d: Decimal) => d.toDecimalPlaces(12).toNumber();

export function computeStdDev(i: StdDevInput): StdDevOutput {
  const { values, invalid } = parseData(i.data);
  const n = values.length;
  const base = { values, invalid, n, sum: 0, mean: 0, ss: 0, populationVariance: 0, populationSd: 0, sampleVariance: null, sampleSd: null, standardError: null, min: 0, max: 0, median: 0, deviations: [] };
  if (n === 0) return { ...base, error: 'Enter at least one number.' };
  const sum = values.reduce((s, x) => s.plus(x), D(0));
  const mean = sum.div(n);
  const deviations = values.map((x) => {
    const dev = D(x).minus(mean);
    return { x, dev: num(dev), sq: num(dev.times(dev)) };
  });
  const ss = values.reduce((s, x) => s.plus(D(x).minus(mean).pow(2)), D(0));
  const pv = ss.div(n);
  const sv = n > 1 ? ss.div(n - 1) : null;
  const sorted = [...values].sort((a, b) => a - b);
  const median = n % 2 ? sorted[(n - 1) / 2]! : num(D(sorted[n / 2 - 1]!).plus(sorted[n / 2]!).div(2));
  return {
    ...base,
    sum: num(sum),
    mean: num(mean),
    ss: num(ss),
    populationVariance: num(pv),
    populationSd: num(pv.sqrt()),
    sampleVariance: sv ? num(sv) : null,
    sampleSd: sv ? num(sv.sqrt()) : null,
    standardError: sv ? num(sv.sqrt().div(D(n).sqrt())) : null,
    min: sorted[0]!,
    max: sorted[n - 1]!,
    median,
    deviations,
    error: invalid.length ? `Ignored ${invalid.length} item${invalid.length === 1 ? '' : 's'} that ${invalid.length === 1 ? 'isn’t a number' : 'aren’t numbers'}: ${invalid.slice(0, 3).join(', ')}` : null,
  };
}
