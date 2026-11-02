/**
 * Net worth = total assets − total liabilities, with liquid net worth, debt-to-asset ratio and a
 * comparison with the median for the household's age group (Federal Reserve Survey of Consumer Finances 2022).
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export interface NetWorthInput extends Record<string, unknown> {
  cash: number;
  investments: number;
  retirement: number;
  homeValue: number;
  vehicles: number;
  otherAssets: number;
  mortgage: number;
  carLoans: number;
  studentLoans: number;
  creditCards: number;
  otherDebts: number;
  age: number;
}

/**
 * Median net worth by age of the family head, 2022 Survey of Consumer Finances (2022 dollars), rounded.
 * Secondary sources report these to within about 0.3% of each other; figures here are rounded to the nearest $1,000.
 */
export const MEDIANS: { label: string; minAge: number; maxAge: number; median: number }[] = [
  { label: 'under 35', minAge: 0, maxAge: 34, median: 39_000 },
  { label: '35 to 44', minAge: 35, maxAge: 44, median: 135_000 },
  { label: '45 to 54', minAge: 45, maxAge: 54, median: 247_000 },
  { label: '55 to 64', minAge: 55, maxAge: 64, median: 364_000 },
  { label: '65 to 74', minAge: 65, maxAge: 74, median: 410_000 },
  { label: '75 and older', minAge: 75, maxAge: 200, median: 335_000 },
];

export interface NetWorthOutput {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  /** Cash + investments − credit card and other non-housing, non-vehicle debts. */
  liquidNetWorth: number;
  /** Home value − mortgage. */
  homeEquity: number;
  /** Liabilities ÷ assets, %. */
  debtToAsset: number;
  ageGroup: string;
  ageMedian: number;
  /** Net worth − age-group median. */
  vsMedian: number;
  /** Grouped totals for the chart. */
  assetGroups: { label: string; value: number }[];
  debtGroups: { label: string; value: number }[];
}

export function medianFor(age: number) {
  return MEDIANS.find((m) => age >= m.minAge && age <= m.maxAge) ?? MEDIANS[0]!;
}

export function computeNetWorth(i: NetWorthInput): NetWorthOutput {
  const n = (x: number) => D(Math.max(0, x));
  const assets = n(i.cash).plus(n(i.investments)).plus(n(i.retirement)).plus(n(i.homeValue)).plus(n(i.vehicles)).plus(n(i.otherAssets));
  const liabilities = n(i.mortgage).plus(n(i.carLoans)).plus(n(i.studentLoans)).plus(n(i.creditCards)).plus(n(i.otherDebts));
  const net = assets.minus(liabilities);
  const m = medianFor(Math.round(i.age));
  return {
    totalAssets: cents(assets).toNumber(),
    totalLiabilities: cents(liabilities).toNumber(),
    netWorth: cents(net).toNumber(),
    liquidNetWorth: cents(n(i.cash).plus(n(i.investments)).minus(n(i.creditCards)).minus(n(i.otherDebts))).toNumber(),
    homeEquity: cents(n(i.homeValue).minus(n(i.mortgage))).toNumber(),
    debtToAsset: assets.gt(0) ? liabilities.div(assets).times(100).toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber() : 0,
    ageGroup: m.label,
    ageMedian: m.median,
    vsMedian: cents(net.minus(m.median)).toNumber(),
    assetGroups: [
      { label: 'Cash', value: cents(n(i.cash)).toNumber() },
      { label: 'Investments and retirement', value: cents(n(i.investments).plus(n(i.retirement))).toNumber() },
      { label: 'Home', value: cents(n(i.homeValue)).toNumber() },
      { label: 'Vehicles and other', value: cents(n(i.vehicles).plus(n(i.otherAssets))).toNumber() },
    ],
    debtGroups: [
      { label: 'Mortgage', value: cents(n(i.mortgage)).toNumber() },
      { label: 'Car and student loans', value: cents(n(i.carLoans).plus(n(i.studentLoans))).toNumber() },
      { label: 'Cards and other', value: cents(n(i.creditCards).plus(n(i.otherDebts))).toNumber() },
    ],
  };
}
