/**
 * Overtime pay. Federal (FLSA): 1.5 × the regular rate for hours over 40 in a workweek.
 * California (Labor Code § 510): 1.5 × for hours over 8 in a day or 40 in a week, 2 × over 12 in a day,
 * and on the seventh consecutive workday 1.5 × for the first 8 hours and 2 × after that.
 * Assumes the same number of hours each day worked.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type OvertimeRule = 'federal' | 'california';

export interface OvertimeInput extends Record<string, unknown> {
  rate: number;
  rule: OvertimeRule;
  /** Total hours in the workweek (federal). */
  weekHours: number;
  /** Hours per day and days worked (California). */
  dayHours: number;
  days: number;
  /** Overtime multiplier (1.5 under federal and California law; some contracts pay more). */
  multiplier: number;
}

export interface OvertimeOutput {
  regularHours: number;
  overtimeHours: number;
  doubleHours: number;
  regularPay: number;
  overtimePay: number;
  doublePay: number;
  weeklyPay: number;
  /** Weekly pay × 52. */
  annualPay: number;
  /** Weekly pay ÷ total hours. */
  averageRate: number;
  totalHours: number;
  /** Overtime + double-time hours. */
  premiumHours: number;
}

/** Splits a week into regular, overtime and double-time hours. */
export function splitHours(i: Pick<OvertimeInput, 'rule' | 'weekHours' | 'dayHours' | 'days'>): { reg: Decimal; ot: Decimal; dt: Decimal } {
  if (i.rule === 'federal') {
    const h = D(Math.max(0, i.weekHours));
    return { reg: h.gt(40) ? D(40) : h, ot: h.gt(40) ? h.minus(40) : D(0), dt: D(0) };
  }
  const d = D(Math.max(0, Math.min(24, i.dayHours)));
  const n = Math.max(0, Math.min(7, Math.round(i.days)));
  let reg = D(0);
  let ot = D(0);
  let dt = D(0);
  for (let day = 1; day <= n; day++) {
    if (day === 7) {
      // Seventh consecutive day: first 8 hours at 1.5×, the rest at 2×.
      ot = ot.plus(d.gt(8) ? 8 : d);
      dt = dt.plus(d.gt(8) ? d.minus(8) : 0);
    } else {
      reg = reg.plus(d.gt(8) ? 8 : d);
      ot = ot.plus(d.gt(12) ? 4 : d.gt(8) ? d.minus(8) : 0);
      dt = dt.plus(d.gt(12) ? d.minus(12) : 0);
    }
  }
  // Regular hours beyond 40 in the week are overtime too (without double counting daily overtime).
  if (reg.gt(40)) {
    ot = ot.plus(reg.minus(40));
    reg = D(40);
  }
  return { reg, ot, dt };
}

export function computeOvertime(i: OvertimeInput): OvertimeOutput {
  const rate = D(Math.max(0, i.rate));
  const { reg, ot, dt } = splitHours(i);
  const regularPay = cents(reg.times(rate));
  const overtimePay = cents(ot.times(rate).times(i.multiplier));
  const doublePay = cents(dt.times(rate).times(2));
  const weekly = regularPay.plus(overtimePay).plus(doublePay);
  const total = reg.plus(ot).plus(dt);
  return {
    regularHours: reg.toNumber(),
    overtimeHours: ot.toNumber(),
    doubleHours: dt.toNumber(),
    regularPay: regularPay.toNumber(),
    overtimePay: overtimePay.toNumber(),
    doublePay: doublePay.toNumber(),
    weeklyPay: weekly.toNumber(),
    annualPay: cents(weekly.times(52)).toNumber(),
    averageRate: total.gt(0) ? cents(weekly.div(total)).toNumber() : 0,
    totalHours: total.toNumber(),
    premiumHours: ot.plus(dt).toNumber(),
  };
}
