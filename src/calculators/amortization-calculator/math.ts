/**
 * Amortization schedule for a fixed-rate loan, with payment dates and three kinds of extra principal:
 * every month, once a year (with the 12th, 24th… payment) and a one-time lump sum with a chosen payment.
 * Interest is rounded half-up to the cent each month, as lenders do, and the last payment clears the balance.
 */
import { annuityPayment, byYear, cents, D, monthlyRate, type AmortRow, type YearRow } from '../../lib/math/money.ts';
import { addMonths, parseISO, shortLabel, todayISO, type YMD } from '../../lib/math/dates.ts';

export interface AmortizationInput extends Record<string, unknown> {
  amount: number;
  interestRate: number;
  term: number;
  termUnit: 'years' | 'months';
  /** ISO date of the first payment; empty = the first of next month. */
  startDate: string;
  extraMonthly: number;
  extraYearly: number;
  lumpSum: number;
  /** Payment number the lump sum is paid with. */
  lumpSumMonth: number;
}

export interface Milestone {
  label: string;
  period: number;
  date: string;
}

export interface AmortizationOutput {
  months: number;
  payment: number;
  totalInterest: number;
  totalPaid: number;
  payoffMonths: number;
  /** Interest and months saved by the extra payments, against the plain schedule. */
  interestSaved: number;
  monthsSaved: number;
  baseInterest: number;
  firstDate: string;
  payoffDate: string;
  basePayoffDate: string;
  /** First payment where principal is larger than interest (0 if never within the schedule). */
  crossoverPeriod: number;
  crossoverDate: string;
  milestones: Milestone[];
  rows: AmortRow[];
  years: YearRow[];
}

export const termMonths = (term: number, unit: 'years' | 'months'): number => Math.max(1, Math.round(unit === 'years' ? term * 12 : term));

export function convertTerm(value: number, from: string, to: string): number {
  if (from === to) return value;
  return to === 'months' ? Math.round(value * 12) : D(value).div(12).toDecimalPlaces(2).toNumber();
}

/** First payment date: the date entered, or the first day of next month. */
export function firstPaymentDate(startDate: string, today = todayISO()): YMD {
  const d = parseISO(startDate);
  if (d) return d;
  const t = parseISO(today)!;
  return addMonths({ y: t.y, m: t.m, d: 1 }, 1);
}

export interface Extras {
  monthly: number;
  yearly: number;
  lumpSum: number;
  lumpSumMonth: number;
}

const NONE: Extras = { monthly: 0, yearly: 0, lumpSum: 0, lumpSumMonth: 0 };

/** Extra principal paid with a given payment number. */
export function extraFor(period: number, x: Extras): number {
  let e = D(x.monthly);
  if (x.yearly > 0 && period % 12 === 0) e = e.plus(x.yearly);
  if (x.lumpSum > 0 && period === x.lumpSumMonth) e = e.plus(x.lumpSum);
  return cents(e).toNumber();
}

/** Monthly schedule in exact integer cents; the payment is fixed from the original term. */
export function schedule(principal: number, annualPct: number, months: number, x: Extras = NONE): { payment: number; rows: AmortRow[]; totalInterest: number; totalPaid: number } {
  const P = cents(principal);
  const payment = cents(annuityPayment(P, monthlyRate(annualPct), months));
  const rate = D(annualPct);
  const dp = rate.decimalPlaces();
  const num = BigInt(rate.times(D(10).pow(dp)).toFixed(0));
  const den = 1200n * 10n ** BigInt(dp);
  const pay = BigInt(payment.times(100).toFixed(0));
  const rows: AmortRow[] = [];
  let balance = BigInt(P.times(100).toFixed(0));
  let totalInterest = 0n;
  let totalPaid = 0n;
  for (let period = 1; balance > 0n && period <= months; period++) {
    const interest = (2n * balance * num + den) / (2n * den);
    let principalPart = pay - interest;
    let extraPart = BigInt(Math.round(extraFor(period, x) * 100));
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
      payment: Number(interest + principalPart) / 100,
      principal: Number(principalPart) / 100,
      interest: Number(interest) / 100,
      extra: Number(extraPart) / 100,
      balance: Number(balance) / 100,
    });
  }
  return { payment: payment.toNumber(), rows, totalInterest: Number(totalInterest) / 100, totalPaid: Number(totalPaid) / 100 };
}

export function computeAmortization(i: AmortizationInput, today = todayISO()): AmortizationOutput {
  const months = termMonths(i.term, i.termUnit);
  const x: Extras = { monthly: i.extraMonthly, yearly: i.extraYearly, lumpSum: i.lumpSum, lumpSumMonth: Math.round(i.lumpSumMonth) };
  const base = schedule(i.amount, i.interestRate, months);
  const hasExtra = x.monthly > 0 || x.yearly > 0 || (x.lumpSum > 0 && x.lumpSumMonth >= 1);
  const actual = hasExtra ? schedule(i.amount, i.interestRate, months, x) : base;
  const first = firstPaymentDate(i.startDate, today);
  const dateOf = (period: number) => shortLabel(addMonths(first, period - 1));
  const payoffMonths = actual.rows.length;

  const milestones: Milestone[] = [];
  const P = cents(i.amount).toNumber();
  for (const share of [0.75, 0.5, 0.25]) {
    const row = actual.rows.find((r) => r.balance <= P * share);
    if (row && P > 0) milestones.push({ label: `Balance below ${Math.round(share * 100)}% of the loan`, period: row.period, date: dateOf(row.period) });
  }
  const crossoverPeriod = actual.rows.find((r) => r.principal + r.extra > r.interest)?.period ?? 0;

  return {
    months,
    payment: base.payment,
    totalInterest: actual.totalInterest,
    totalPaid: actual.totalPaid,
    payoffMonths,
    interestSaved: cents(D(base.totalInterest).minus(actual.totalInterest)).toNumber(),
    monthsSaved: base.rows.length - payoffMonths,
    baseInterest: base.totalInterest,
    firstDate: dateOf(1),
    payoffDate: payoffMonths ? dateOf(payoffMonths) : dateOf(1),
    basePayoffDate: dateOf(base.rows.length || 1),
    crossoverPeriod,
    crossoverDate: crossoverPeriod ? dateOf(crossoverPeriod) : '',
    milestones,
    rows: actual.rows,
    years: byYear(actual.rows),
  };
}

export const monthlyRateOf = (annualPct: number): number => D(annualPct).div(1200).toNumber();
