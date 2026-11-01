/**
 * Credit card payoff: time and interest at a fixed payment, the payment needed for a target date,
 * and the minimum-payment path for comparison. Interest is APR ÷ 12 on the balance each month,
 * rounded to the cent; no new purchases are assumed.
 */
import { annuityPayment, cents, D, monthlyRate } from '../../lib/math/money.ts';

export interface CardInput extends Record<string, unknown> {
  balance: number;
  apr: number;
  mode: 'payment' | 'months';
  payment: number;
  months: number;
  /** Minimum payment rule: % of balance plus that month's interest, with a dollar floor. */
  minPct: number;
  minFloor: number;
}

export interface PayoffPath {
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** False if the payment never covers the interest (or takes over 50 years). */
  paysOff: boolean;
  /** Balance at the end of each month (index 0 = start). */
  balances: number[];
}

export interface CardOutput {
  monthlyPayment: number;
  plan: PayoffPath;
  minimum: PayoffPath;
  /** First month's interest at the current balance. */
  firstInterest: number;
  /** Payment needed just to stop the balance growing. */
  interestOnlyPayment: number;
  interestSaved: number;
  monthsSaved: number;
}

const MAX_MONTHS = 600;

/** Pays a card down month by month; `paymentFor` returns the payment for the current balance and interest. */
export function payoffPath(balance: number, apr: number, paymentFor: (bal: number, interest: number) => number): PayoffPath {
  const r = monthlyRate(apr);
  let bal = cents(balance);
  let interestSum = D(0);
  let paid = D(0);
  const balances = [bal.toNumber()];
  let months = 0;
  while (bal.gt(0) && months < MAX_MONTHS) {
    const interest = cents(bal.times(r));
    const due = bal.plus(interest);
    let pay = cents(paymentFor(bal.toNumber(), interest.toNumber()));
    if (pay.lte(interest) && pay.lt(due)) return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity, paysOff: false, balances };
    if (pay.gt(due)) pay = due;
    bal = due.minus(pay);
    interestSum = interestSum.plus(interest);
    paid = paid.plus(pay);
    months++;
    balances.push(bal.toNumber());
  }
  const paysOff = bal.lte(0);
  return { months: paysOff ? months : Infinity, totalInterest: paysOff ? interestSum.toNumber() : Infinity, totalPaid: paysOff ? paid.toNumber() : Infinity, paysOff, balances };
}

/** Typical issuer minimum: interest + minPct% of the balance, at least minFloor (or the full balance if smaller). */
export function minimumPayment(balance: number, interest: number, minPct: number, minFloor: number): number {
  const rule = D(balance).times(minPct).div(100).plus(interest);
  return cents(D(Math.max(rule.toNumber(), minFloor))).toNumber();
}

export function computeCardPayoff(i: CardInput): CardOutput {
  const monthlyPayment = i.mode === 'payment' ? i.payment : cents(annuityPayment(i.balance, monthlyRate(i.apr), Math.max(1, Math.round(i.months)))).toNumber();
  const plan = payoffPath(i.balance, i.apr, () => monthlyPayment);
  const minimum = payoffPath(i.balance, i.apr, (bal, interest) => minimumPayment(bal, interest, i.minPct, i.minFloor));
  const firstInterest = cents(D(i.balance).times(monthlyRate(i.apr))).toNumber();
  const both = plan.paysOff && minimum.paysOff;
  return {
    monthlyPayment,
    plan,
    minimum,
    firstInterest,
    interestOnlyPayment: cents(D(firstInterest).plus(0.01)).toNumber(),
    interestSaved: both ? cents(D(minimum.totalInterest).minus(plan.totalInterest)).toNumber() : 0,
    monthsSaved: both ? minimum.months - plan.months : 0,
  };
}
