/**
 * Pay raise math: new pay from a percentage or dollar raise, the annual and per-paycheck
 * difference, and the real (inflation-adjusted) raise: (1 + raise) ÷ (1 + inflation) − 1.
 * Gross pay only (before tax).
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type RaisePeriod = 'hour' | 'biweek' | 'month' | 'year';
export type RaiseMode = 'percent' | 'usd';

export interface RaiseInput extends Record<string, unknown> {
  currentPay: number;
  period: RaisePeriod;
  /** Hours per week, for hourly pay. */
  hoursPerWeek: number;
  /** The raise: a percentage, or dollars per pay period, depending on raiseMode. */
  raise: number;
  raiseMode: RaiseMode;
  /** Inflation over the past year, %. */
  inflation: number;
}

export interface RaiseOutput {
  newPay: number;
  /** Increase per pay period (per hour, per paycheck, per month or per year). */
  increase: number;
  raisePct: number;
  currentAnnual: number;
  newAnnual: number;
  annualIncrease: number;
  monthlyIncrease: number;
  biweeklyIncrease: number;
  /** Raise after inflation, %. */
  realRaisePct: number;
  /** The extra annual pay in last year's dollars. */
  realAnnualIncrease: number;
  /** Part of the annual raise needed just to keep up with inflation (current pay × inflation, capped at the raise). */
  keepUpPortion: number;
  /** The rest of the annual raise: more than inflation took away. */
  aheadPortion: number;
}

export function periodsPerYear(period: RaisePeriod, hoursPerWeek: number): number {
  if (period === 'hour') return Math.max(0, hoursPerWeek) * 52;
  if (period === 'biweek') return 26;
  if (period === 'month') return 12;
  return 1;
}

/** Dollar raise per period from a percentage, or the percentage from dollars. */
export function raiseAmount(currentPay: number, raise: number, mode: RaiseMode): Decimal {
  return mode === 'percent' ? D(currentPay).times(raise).div(100) : D(raise);
}

/** Converts the raise field between % and $ (keeps the same raise). */
export function convertRaise(currentPay: number, value: number, from: RaiseMode, to: RaiseMode): number {
  if (from === to) return value;
  if (to === 'usd') return cents(raiseAmount(currentPay, value, 'percent')).toNumber();
  if (currentPay <= 0) return 0;
  return D(value).div(currentPay).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export function computeRaise(i: RaiseInput): RaiseOutput {
  const per = periodsPerYear(i.period, i.hoursPerWeek);
  const increase = raiseAmount(i.currentPay, i.raise, i.raiseMode);
  const current = D(Math.max(0, i.currentPay));
  const next = current.plus(increase);
  const raiseFrac = current.gt(0) ? increase.div(current) : D(0);
  const currentAnnual = current.times(per);
  const newAnnual = next.times(per);
  const annualIncrease = newAnnual.minus(currentAnnual);
  const inflationFrac = D(i.inflation).div(100);
  const realFrac = D(1).plus(raiseFrac).div(D(1).plus(inflationFrac)).minus(1);
  const needed = currentAnnual.times(inflationFrac);
  const keepUp = annualIncrease.lte(0) || needed.lte(0) ? D(0) : needed.gt(annualIncrease) ? annualIncrease : needed;
  return {
    newPay: cents(next).toNumber(),
    increase: cents(increase).toNumber(),
    raisePct: raiseFrac.times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    currentAnnual: cents(currentAnnual).toNumber(),
    newAnnual: cents(newAnnual).toNumber(),
    annualIncrease: cents(annualIncrease).toNumber(),
    monthlyIncrease: cents(annualIncrease.div(12)).toNumber(),
    biweeklyIncrease: cents(annualIncrease.div(26)).toNumber(),
    realRaisePct: realFrac.times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    realAnnualIncrease: cents(newAnnual.div(D(1).plus(inflationFrac)).minus(currentAnnual)).toNumber(),
    keepUpPortion: cents(keepUp).toNumber(),
    aheadPortion: annualIncrease.gt(0) ? cents(annualIncrease.minus(keepUp)).toNumber() : 0,
  };
}
