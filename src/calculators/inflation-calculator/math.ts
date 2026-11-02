/**
 * Inflation math. Past: value in another year = amount × CPI(to) ÷ CPI(from), using annual CPI-U averages
 * (and the latest monthly index for the current year). Future: amount × (1 + rate)^years.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';
import { CPI_ANNUAL, CPI_FIRST_YEAR, CPI_LAST_YEAR, CPI_LATEST } from './cpi.ts';

export type InflationMode = 'past' | 'future';

export interface InflationInput extends Record<string, unknown> {
  mode: InflationMode;
  amount: number;
  fromYear: number;
  toYear: number;
  /** Expected yearly inflation for projections, %. */
  rate: number;
  years: number;
}

export interface InflationOutput {
  /** The equivalent amount (past mode) or the future cost of today's amount (future mode). */
  value: number;
  /** What `amount` will buy in the future, in today's dollars (future mode). */
  todaysValue: number;
  /** Total change in prices, %. */
  cumulative: number;
  /** Average yearly inflation over the period, %. */
  averageRate: number;
  cpiFrom: number;
  cpiTo: number;
  /** Years between the two dates. */
  span: number;
  /** Label of the end point: a year, or the latest month for the current year. */
  toLabel: string;
  /** What $1 at the start buys at the end, in start-year dollars. */
  purchasingPower: number;
}

/** The current year uses the latest monthly CPI in the snapshot. */
export const CURRENT_YEAR = CPI_LAST_YEAR + 1;
export const MIN_YEAR = CPI_FIRST_YEAR;

export function cpiFor(year: number): number | null {
  if (year === CURRENT_YEAR) return CPI_LATEST.value;
  return CPI_ANNUAL[year] ?? null;
}

const pct2 = (x: Decimal) => x.times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

export function computeInflation(i: InflationInput): InflationOutput {
  const amount = Math.max(0, i.amount);
  if (i.mode === 'future') {
    const years = Math.max(0, i.years);
    const factor = D(1).plus(D(i.rate).div(100)).pow(years);
    return {
      value: cents(D(amount).times(factor)).toNumber(),
      todaysValue: cents(D(amount).div(factor)).toNumber(),
      cumulative: pct2(factor.minus(1)),
      averageRate: i.rate,
      cpiFrom: 0,
      cpiTo: 0,
      span: years,
      toLabel: `in ${years} years`,
      purchasingPower: D(1).div(factor).toDecimalPlaces(4).toNumber(),
    };
  }
  const from = cpiFor(Math.round(i.fromYear)) ?? cpiFor(MIN_YEAR)!;
  const to = cpiFor(Math.round(i.toYear)) ?? CPI_LATEST.value;
  const ratio = D(to).div(from);
  const span = Math.round(i.toYear) - Math.round(i.fromYear);
  // Average yearly inflation, always measured from the earlier year to the later one.
  const forward = span >= 0 ? ratio : D(1).div(ratio);
  const averageRate = span === 0 ? 0 : pct2(forward.pow(D(1).div(Math.abs(span))).minus(1));
  return {
    value: cents(D(amount).times(ratio)).toNumber(),
    todaysValue: amount,
    cumulative: pct2(ratio.minus(1)),
    averageRate,
    cpiFrom: from,
    cpiTo: to,
    span,
    toLabel: Math.round(i.toYear) === CURRENT_YEAR ? `${CURRENT_YEAR} (${CPI_LATEST.month})` : String(Math.round(i.toYear)),
    purchasingPower: D(from).div(to).toDecimalPlaces(4).toNumber(),
  };
}

export function yearOutOfRange(year: number): boolean {
  return cpiFor(Math.round(year)) === null;
}

/** What `amount` from each decade year (1920, 1930, …) is worth in `toYear`. */
export function decadeTable(amount: number, toYear: number): { year: number; value: number }[] {
  const to = cpiFor(toYear);
  if (to === null) return [];
  const rows: { year: number; value: number }[] = [];
  for (let y = 1920; y < toYear; y += 10) {
    const from = cpiFor(y);
    if (from !== null) rows.push({ year: y, value: cents(D(amount).times(to).div(from)).toNumber() });
  }
  return rows;
}
