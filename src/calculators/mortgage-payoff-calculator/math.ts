/**
 * Mortgage payoff from where you are today: the current balance, rate and principal-and-interest payment
 * (not the original loan), with extra monthly principal and a one-time lump sum now. Also solves for the
 * extra payment needed to be debt-free by a target. Interest is rounded half-up to the cent each month.
 */
import { annuityPayment, byYear, cents, D, monthlyRate, type AmortRow, type YearRow } from '../../lib/math/money.ts';

export interface PayoffInput extends Record<string, unknown> {
  balance: number;
  interestRate: number;
  /** Current monthly principal and interest (no escrow). */
  payment: number;
  extraMonthly: number;
  lumpSum: number;
  /** Target years to pay off; 0 = no target. */
  targetYears: number;
}

export interface PayoffRun {
  months: number;
  totalInterest: number;
  totalPaid: number;
  rows: AmortRow[];
  /** False when the payment doesn't cover the interest. */
  paysOff: boolean;
}

export interface ExtraScenario {
  extra: number;
  months: number;
  totalInterest: number;
  interestSaved: number;
}

export interface PayoffOutput {
  firstInterest: number;
  /** Monthly rate as a decimal, for Show the math. */
  rate: number;
  /** Principal repaid by this month's payment and extra. */
  firstPrincipal: number;
  base: PayoffRun;
  actual: PayoffRun;
  interestSaved: number;
  monthsSaved: number;
  /** Extra per month (on top of the payment, after any lump sum) to finish in targetYears; null without a target. */
  requiredExtra: number | null;
  scenarios: ExtraScenario[];
  years: YearRow[];
}

/** Longest schedule simulated: 100 years. */
export const MAX_MONTHS = 1200;

/** Pays `payment` + `extra` each month until the balance is zero; runs in exact integer cents. */
export function payoff(balance: number, annualPct: number, payment: number, extra = 0): PayoffRun {
  const rate = D(annualPct);
  const dp = rate.decimalPlaces();
  const num = BigInt(rate.times(D(10).pow(dp)).toFixed(0));
  const den = 1200n * 10n ** BigInt(dp);
  const pay = BigInt(cents(payment).times(100).toFixed(0));
  const ext = BigInt(cents(extra).times(100).toFixed(0));
  let bal = BigInt(cents(balance).times(100).toFixed(0));
  const rows: AmortRow[] = [];
  let interestSum = 0n;
  let paidSum = 0n;
  if (bal <= 0n) return { months: 0, totalInterest: 0, totalPaid: 0, rows, paysOff: true };
  const firstInterest = (2n * bal * num + den) / (2n * den);
  if (pay + ext <= firstInterest) return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity, rows, paysOff: false };
  for (let period = 1; bal > 0n && period <= MAX_MONTHS; period++) {
    const interest = (2n * bal * num + den) / (2n * den);
    let principalPart = pay - interest;
    let extraPart = ext;
    if (principalPart < 0n) {
      extraPart += principalPart;
      principalPart = 0n;
    }
    if (principalPart >= bal) {
      principalPart = bal;
      extraPart = 0n;
    } else if (principalPart + extraPart > bal) {
      extraPart = bal - principalPart;
    }
    // A remainder of less than 1% of the payment is cent rounding: like a lender's final-payment
    // adjustment, it's added to this payment instead of becoming one more tiny payment.
    const left = bal - principalPart - extraPart;
    if (left > 0n && left * 100n < pay) principalPart += left;
    bal -= principalPart + extraPart;
    interestSum += interest;
    paidSum += interest + principalPart + extraPart;
    rows.push({ period, payment: Number(interest + principalPart) / 100, principal: Number(principalPart) / 100, interest: Number(interest) / 100, extra: Number(extraPart) / 100, balance: Number(bal) / 100 });
  }
  return { months: rows.length, totalInterest: Number(interestSum) / 100, totalPaid: Number(paidSum) / 100, rows, paysOff: bal === 0n };
}

/** Extra per month needed to clear `balance` in `months`, rounded up to the cent; 0 if the payment already does. */
export function requiredExtra(balance: number, annualPct: number, payment: number, months: number): number {
  if (balance <= 0 || months <= 0) return 0;
  let need = annuityPayment(cents(balance), monthlyRate(annualPct), months).minus(payment).toDecimalPlaces(2, 0);
  if (need.lte(0)) return 0;
  // Per-month cent rounding can leave a few cents in month n + 1: nudge up until it fits.
  while (payoff(balance, annualPct, payment, need.toNumber()).months > months) need = need.plus(0.01);
  return need.toNumber();
}

/** This month's interest on the balance, rounded to the cent. */
export const monthInterest = (balance: number, annualPct: number): number => cents(D(balance).times(monthlyRate(annualPct))).toNumber();

export const SCENARIO_EXTRAS = [0, 100, 250, 500, 1000];

export function computePayoff(i: PayoffInput): PayoffOutput {
  const start = Math.max(0, cents(D(i.balance).minus(i.lumpSum)).toNumber());
  const base = payoff(i.balance, i.interestRate, i.payment);
  const actual = i.extraMonthly > 0 || i.lumpSum > 0 ? payoff(start, i.interestRate, i.payment, i.extraMonthly) : base;
  const firstInterest = cents(D(i.balance).times(monthlyRate(i.interestRate))).toNumber();
  const target = Math.round(i.targetYears * 12);
  return {
    firstInterest,
    rate: monthlyRate(i.interestRate).toNumber(),
    firstPrincipal: cents(D(i.payment).plus(i.extraMonthly).minus(firstInterest)).toNumber(),
    base,
    actual,
    interestSaved: base.paysOff && actual.paysOff ? cents(D(base.totalInterest).minus(actual.totalInterest)).toNumber() : 0,
    monthsSaved: base.paysOff && actual.paysOff ? base.months - actual.months : 0,
    requiredExtra: target > 0 ? requiredExtra(start, i.interestRate, i.payment, target) : null,
    scenarios: SCENARIO_EXTRAS.map((extra) => {
      const r = payoff(i.balance, i.interestRate, i.payment, extra);
      return { extra, months: r.months, totalInterest: r.totalInterest, interestSaved: base.paysOff && r.paysOff ? cents(D(base.totalInterest).minus(r.totalInterest)).toNumber() : 0 };
    }),
    years: byYear(actual.rows),
  };
}
