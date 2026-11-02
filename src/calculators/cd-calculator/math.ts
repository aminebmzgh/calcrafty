/**
 * Certificate of deposit math. Banks quote CDs by APY, which already includes compounding, so the
 * balance after t months is deposit × (1 + APY)^(t ÷ 12). Also: the equivalent nominal rate (APR)
 * for the compounding frequency, after-tax and after-inflation returns, and an early withdrawal
 * penalty expressed as months of simple interest at that rate (the common bank convention).
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type CdCompounding = 'daily' | 'monthly' | 'quarterly' | 'annually';

export const PERIODS: Record<CdCompounding, number> = { daily: 365, monthly: 12, quarterly: 4, annually: 1 };

export interface CdInput extends Record<string, unknown> {
  deposit: number;
  /** Annual percentage yield, %. */
  apy: number;
  termMonths: number;
  compounding: CdCompounding;
  /** Federal + state tax rate on interest, %. */
  taxRate: number;
  /** Expected inflation, % a year. */
  inflation: number;
  /** Early withdrawal penalty, in months of interest. */
  penaltyMonths: number;
  /** Month you'd cash out early (0 = hold to maturity). */
  withdrawMonth: number;
}

export interface CdOutput {
  balance: number;
  interest: number;
  /** Nominal annual rate equivalent to the APY for the compounding frequency, %, 4 decimals. */
  apr: number;
  afterTaxInterest: number;
  /** Yearly return after tax and inflation, %, 2 decimals. */
  realReturn: number;
  early: null | {
    month: number;
    interestEarned: number;
    penalty: number;
    /** What you'd walk away with. */
    payout: number;
    /** Payout − deposit (negative = the penalty ate into principal). */
    net: number;
  };
}

const growth = (apy: number, months: number): Decimal => D(1).plus(D(apy).div(100)).pow(D(months).div(12));

/** APR as a decimal fraction, unrounded: n × ((1 + APY)^(1/n) − 1). */
const aprExact = (apy: number, n: number): Decimal => D(1).plus(D(apy).div(100)).pow(D(1).div(n)).minus(1).times(n);

/** APR = n × ((1 + APY)^(1/n) − 1), as a %, 4 decimals. */
export function aprFromApy(apy: number, n: number): number {
  return aprExact(apy, n).times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();
}

/** Value of a deposit after `months` at an APY. */
export function valueAfter(deposit: number, apy: number, months: number): number {
  return cents(D(deposit).times(growth(apy, months))).toNumber();
}

export function computeCd(i: CdInput): CdOutput {
  const months = Math.max(1, Math.round(i.termMonths));
  const deposit = Math.max(0, i.deposit);
  const balance = valueAfter(deposit, i.apy, months);
  const interest = cents(D(balance).minus(deposit)).toNumber();
  const apr = aprFromApy(i.apy, PERIODS[i.compounding] ?? 365);
  const afterTaxInterest = cents(D(interest).times(D(1).minus(D(i.taxRate).div(100)))).toNumber();

  // Annualized after-tax growth, then remove inflation: (1 + after-tax yearly) ÷ (1 + inflation) − 1.
  const afterTaxYearly = deposit > 0 ? D(deposit).plus(afterTaxInterest).div(deposit).pow(D(12).div(months)).minus(1) : D(0);
  const realReturn = D(1).plus(afterTaxYearly).div(D(1).plus(D(i.inflation).div(100))).minus(1).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

  let early: CdOutput['early'] = null;
  const w = Math.round(i.withdrawMonth);
  if (w > 0 && w < months) {
    const interestEarned = cents(D(valueAfter(deposit, i.apy, w)).minus(deposit)).toNumber();
    const penalty = cents(D(deposit).times(aprExact(i.apy, PERIODS[i.compounding] ?? 365)).div(12).times(Math.max(0, i.penaltyMonths))).toNumber();
    const payout = cents(D(deposit).plus(interestEarned).minus(penalty)).toNumber();
    early = { month: w, interestEarned, penalty, payout, net: cents(D(payout).minus(deposit)).toNumber() };
  }

  return { balance, interest, apr, afterTaxInterest, realReturn, early };
}
