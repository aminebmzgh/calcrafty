/**
 * Simple interest: I = P × r × t and A = P × (1 + r × t), solved for any one of interest, principal,
 * rate or time. Time can be in years, months or days; days use an actual/365 or actual/360 day count.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type SolveFor = 'interest' | 'principal' | 'rate' | 'time';
export type TimeUnit = 'years' | 'months' | 'days';
export type DayCount = '365' | '360';

export interface SimpleInput extends Record<string, unknown> {
  solveFor: SolveFor;
  principal: number;
  /** Annual rate, %. */
  rate: number;
  time: number;
  timeUnit: TimeUnit;
  /** Interest amount (used when solving for principal, rate or time). */
  interest: number;
  dayCount: DayCount;
}

export interface SimpleOutput {
  principal: number;
  rate: number;
  /** Time in years. */
  years: number;
  interest: number;
  total: number;
  /** False when the inputs can't produce an answer (e.g. a zero rate when solving for time). */
  valid: boolean;
}

/** Converts the time input to years. */
export function yearsOf(time: number, unit: TimeUnit, dayCount: DayCount): Decimal {
  if (unit === 'months') return D(time).div(12);
  if (unit === 'days') return D(time).div(dayCount === '360' ? 360 : 365);
  return D(time);
}

export function computeSimple(i: SimpleInput): SimpleOutput {
  const t = yearsOf(Math.max(0, i.time), i.timeUnit, i.dayCount);
  const r = D(i.rate).div(100);
  let P = D(Math.max(0, i.principal));
  let R = r;
  let T = t;
  let I: Decimal;
  let valid = true;

  switch (i.solveFor) {
    case 'principal':
      I = D(i.interest);
      if (r.isZero() || t.isZero()) valid = false;
      P = valid ? I.div(r.times(t)) : D(0);
      break;
    case 'rate':
      I = D(i.interest);
      if (P.isZero() || t.isZero()) valid = false;
      R = valid ? I.div(P.times(t)) : D(0);
      break;
    case 'time':
      I = D(i.interest);
      if (P.isZero() || r.isZero()) valid = false;
      T = valid ? I.div(P.times(r)) : D(0);
      break;
    default:
      I = P.times(r).times(t);
  }

  return {
    principal: cents(P).toNumber(),
    rate: R.times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    years: T.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    interest: cents(I).toNumber(),
    total: cents(P.plus(I)).toNumber(),
    valid,
  };
}
