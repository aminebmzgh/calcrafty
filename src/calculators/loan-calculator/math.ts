/** Loan math: fixed-rate installment loan payment, interest and amortization, with optional extra payments. */
import { amortize, byYear, cents, D, type AmortRow, type YearRow } from '../../lib/math/money.ts';

export interface LoanInput extends Record<string, unknown> {
  amount: number;
  interestRate: number;
  term: number;
  termUnit: 'years' | 'months';
  extraMonthly: number;
}

export interface LoanOutput {
  months: number;
  payment: number;
  totalInterest: number;
  totalPaid: number;
  payoffMonths: number;
  interestSaved: number;
  monthsSaved: number;
  /** Interest as a share of the amount borrowed, %. */
  interestPct: number;
  rows: AmortRow[];
  years: YearRow[];
}

export const termMonths = (term: number, unit: 'years' | 'months'): number => Math.max(1, Math.round(unit === 'years' ? term * 12 : term));

/** Converts the term value when the years/months toggle changes. */
export function convertTerm(value: number, from: string, to: string): number {
  if (from === to) return value;
  return to === 'months' ? Math.round(value * 12) : D(value).div(12).toDecimalPlaces(2).toNumber();
}

export function computeLoan(input: LoanInput): LoanOutput {
  const months = termMonths(input.term, input.termUnit);
  const base = amortize(input.amount, input.interestRate, months);
  const actual = input.extraMonthly > 0 ? amortize(input.amount, input.interestRate, months, input.extraMonthly) : base;
  return {
    months,
    payment: base.payment,
    totalInterest: actual.totalInterest,
    totalPaid: actual.totalPaid,
    payoffMonths: actual.months,
    interestSaved: cents(D(base.totalInterest).minus(actual.totalInterest)).toNumber(),
    monthsSaved: base.months - actual.months,
    interestPct: input.amount > 0 ? D(actual.totalInterest).div(input.amount).times(100).toDecimalPlaces(1).toNumber() : 0,
    rows: actual.rows,
    years: byYear(actual.rows),
  };
}

/** Monthly rate for Show the math. */
export const monthlyRateOf = (annualPct: number): number => D(annualPct).div(1200).toNumber();
