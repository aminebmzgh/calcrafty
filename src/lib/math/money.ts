/**
 * Shared money math (pure functions, decimal arithmetic). Used by calculators' math.ts files.
 * Round only for display or where lenders round (payments and monthly interest to the cent).
 */
import Decimal from 'decimal.js-light';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };
export type Num = Decimal | number | string;

export const D = (n: Num): Decimal => (n instanceof Decimal ? n : new Decimal(n));

/** Round to cents, half up (how US lenders round). */
export const cents = (n: Num): Decimal => D(n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

/** Monthly rate as a decimal from an annual percentage rate: 6.5 → 0.0054166… */
export const monthlyRate = (annualPct: Num): Decimal => D(annualPct).div(1200);

/**
 * Level payment that repays `principal` over `n` periods at periodic rate `r`:
 *   M = P · r(1+r)^n / ((1+r)^n − 1),  or P / n when r = 0.
 * Returned unrounded; callers round to cents where a lender would.
 */
export function annuityPayment(principal: Num, r: Num, n: number): Decimal {
  const P = D(principal);
  const rate = D(r);
  if (n <= 0) throw new RangeError('number of periods must be positive');
  if (P.lte(0)) return D(0);
  if (rate.isZero()) return P.div(n);
  const f = rate.plus(1).pow(n);
  return P.times(rate).times(f).div(f.minus(1));
}

export interface AmortRow {
  /** 1-based period number. */
  period: number;
  payment: number;
  principal: number;
  interest: number;
  extra: number;
  balance: number;
}

export interface AmortResult {
  rows: AmortRow[];
  /** Scheduled payment (principal + interest), rounded to cents. */
  payment: number;
  totalInterest: number;
  totalPaid: number;
  months: number;
}

/**
 * Monthly amortization schedule with optional extra principal each month.
 * Interest is rounded to the cent each month; the final payment is reduced to clear the balance exactly.
 */
export function amortize(principal: Num, annualPct: Num, months: number, extraMonthly: Num = 0): AmortResult {
  const P = cents(principal);
  const payment = cents(annuityPayment(P, monthlyRate(annualPct), months));
  // The loop runs in exact integer cents (BigInt) with the monthly rate held as an exact fraction
  // num/den, so every month's interest is rounded half-up to the cent exactly as with Decimal,
  // but without allocating Decimal objects per row (keeps hydration fast on slow phones).
  const rate = D(annualPct);
  const dp = rate.decimalPlaces();
  const num = BigInt(rate.times(D(10).pow(dp)).toFixed(0));
  const den = 1200n * 10n ** BigInt(dp);
  const pay = toCents(payment);
  const extra = toCents(cents(extraMonthly));
  const rows: AmortRow[] = [];
  let balance = toCents(P);
  let totalInterest = 0n;
  let totalPaid = 0n;
  for (let period = 1; balance > 0n && period <= months; period++) {
    const interest = (2n * balance * num + den) / (2n * den);
    let principalPart = pay - interest;
    let extraPart = extra;
    // Last scheduled period: pay whatever remains (absorbs cent rounding).
    if (period === months || principalPart >= balance) {
      principalPart = balance;
      extraPart = 0n;
    } else if (principalPart + extraPart > balance) {
      extraPart = balance - principalPart;
    }
    balance -= principalPart + extraPart;
    totalInterest += interest;
    totalPaid += interest + principalPart + extraPart;
    rows.push({
      period,
      payment: fromCents(interest + principalPart),
      principal: fromCents(principalPart),
      interest: fromCents(interest),
      extra: fromCents(extraPart),
      balance: fromCents(balance),
    });
  }
  return { rows, payment: payment.toNumber(), totalInterest: fromCents(totalInterest), totalPaid: fromCents(totalPaid), months: rows.length };
}

const toCents = (d: Decimal): bigint => BigInt(d.times(100).toFixed(0));
const fromCents = (c: bigint): number => Number(c) / 100;

export interface YearRow {
  year: number;
  principal: number;
  interest: number;
  extra: number;
  /** Additional per-row amounts (e.g. PMI) summed by year. */
  other: number;
  balance: number;
}

/** Sums a monthly schedule into years (year 1 = periods 1–12). */
export function byYear(rows: (AmortRow & { other?: number })[]): YearRow[] {
  const years: YearRow[] = [];
  for (const row of rows) {
    const y = Math.ceil(row.period / 12);
    let yr = years[y - 1];
    if (!yr) {
      yr = { year: y, principal: 0, interest: 0, extra: 0, other: 0, balance: 0 };
      years[y - 1] = yr;
    }
    // Rows hold whole cents, so summing in integer cents is exact.
    yr.principal = (Math.round(yr.principal * 100) + Math.round(row.principal * 100)) / 100;
    yr.interest = (Math.round(yr.interest * 100) + Math.round(row.interest * 100)) / 100;
    yr.extra = (Math.round(yr.extra * 100) + Math.round(row.extra * 100)) / 100;
    yr.other = (Math.round(yr.other * 100) + Math.round((row.other ?? 0) * 100)) / 100;
    yr.balance = row.balance;
  }
  return years;
}
