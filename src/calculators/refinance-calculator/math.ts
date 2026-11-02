/**
 * Mortgage refinance math: current vs new principal-and-interest payment, break-even month,
 * lifetime interest comparison (including the term-reset effect) and the net result if you
 * sell or refinance again after a chosen number of years.
 */
import { amortize, cents, D, type AmortResult } from '../../lib/math/money.ts';

export interface RefiInput extends Record<string, unknown> {
  /** Current loan balance. */
  balance: number;
  currentRate: number;
  /** Years left on the current loan. */
  yearsLeft: number;
  newRate: number;
  newTermYears: number;
  closingCosts: number;
  /** Add the closing costs to the new loan instead of paying them upfront. */
  rollCosts: boolean;
  /** How long you expect to keep the new loan, in years. */
  yearsToKeep: number;
}

export interface RefiOutput {
  currentPayment: number;
  newLoan: number;
  newPayment: number;
  /** Positive when the new payment is lower. */
  monthlySavings: number;
  /** Classic rule: upfront closing costs ÷ monthly savings, rounded up (null if the payment doesn't fall or nothing is paid upfront). */
  simpleBreakEven: number | null;
  /**
   * First month in which the refinance is ahead, counting payments, upfront costs and the balance still owed on each loan
   * (null if never within the longer of the two terms). Works when costs are rolled into the loan, too.
   */
  breakEvenMonths: number | null;
  /** Interest still to pay on the current loan. */
  currentInterest: number;
  newInterest: number;
  /** Current remaining interest − (new interest + upfront closing costs). Positive = the refinance saves money over the full term. */
  lifetimeSavings: number;
  /** Net gain after `yearsToKeep`, counting payments, upfront costs and the balance still owed. */
  savingsAtHorizon: number;
  /** Payments left on the current loan and in the new loan's term. */
  currentMonths: number;
  newMonths: number;
  /** Payoff date shift in months: positive = the new loan ends later. */
  extraMonths: number;
}

/** Total paid in the first `months` payments, and the balance left after them. */
function position(a: AmortResult, start: number, months: number): { paid: number; balance: number } {
  const rows = a.rows.slice(0, Math.max(0, months));
  const paid = rows.reduce((s, r) => s.plus(r.payment).plus(r.extra), D(0));
  const balance = months <= 0 ? start : months >= a.rows.length ? 0 : a.rows[months - 1]!.balance;
  return { paid: cents(paid).toNumber(), balance };
}

export function computeRefinance(i: RefiInput): RefiOutput {
  const remaining = Math.max(1, Math.round(i.yearsLeft * 12));
  const newMonths = Math.max(1, Math.round(i.newTermYears * 12));
  const costs = Math.max(0, i.closingCosts);
  const cur = amortize(i.balance, i.currentRate, remaining);
  const newLoan = cents(D(i.balance).plus(i.rollCosts ? costs : 0)).toNumber();
  const nxt = amortize(newLoan, i.newRate, newMonths);
  const upfront = i.rollCosts ? 0 : costs;

  const monthlySavings = cents(D(cur.payment).minus(nxt.payment)).toNumber();
  const simpleBreakEven = monthlySavings > 0 && upfront > 0 ? Math.ceil(D(upfront).div(monthlySavings).toNumber()) : null;

  // Running totals month by month: net position = (current paid + current balance) − (new paid + new balance + upfront).
  let breakEvenMonths: number | null = null;
  let paidC = D(0);
  let paidN = D(0);
  const span = Math.max(cur.rows.length, nxt.rows.length);
  for (let m = 1; m <= span; m++) {
    const rc = cur.rows[m - 1];
    const rn = nxt.rows[m - 1];
    if (rc) paidC = paidC.plus(rc.payment).plus(rc.extra);
    if (rn) paidN = paidN.plus(rn.payment).plus(rn.extra);
    const net = paidC.plus(rc ? rc.balance : 0).minus(paidN.plus(rn ? rn.balance : 0).plus(upfront));
    if (net.gte(0)) {
      breakEvenMonths = m;
      break;
    }
  }

  const horizon = Math.max(0, Math.round(i.yearsToKeep * 12));
  const c = position(cur, i.balance, horizon);
  const n = position(nxt, newLoan, horizon);
  // What each path has cost by then: payments made plus what's still owed (plus upfront costs for the refinance).
  const savingsAtHorizon = cents(D(c.paid).plus(c.balance).minus(D(n.paid).plus(n.balance).plus(upfront))).toNumber();

  return {
    currentPayment: cur.payment,
    newLoan,
    newPayment: nxt.payment,
    monthlySavings,
    simpleBreakEven,
    breakEvenMonths,
    currentInterest: cur.totalInterest,
    newInterest: nxt.totalInterest,
    // Closing costs are a cost either way: paid upfront, or repaid as principal when rolled in.
    lifetimeSavings: cents(D(cur.totalInterest).minus(nxt.totalInterest).minus(costs)).toNumber(),
    savingsAtHorizon,
    currentMonths: cur.rows.length,
    newMonths: nxt.rows.length,
    extraMonths: nxt.rows.length - cur.rows.length,
  };
}
