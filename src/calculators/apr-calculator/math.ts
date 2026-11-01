/**
 * APR math: the annual percentage rate a lender discloses under Regulation Z (12 CFR 1026.22,
 * Appendix J), for a fixed-rate loan with equal monthly payments.
 *
 * The APR is the rate r (×12) at which the present value of the payments equals the
 * amount financed: the loan amount minus prepaid finance charges (origination fees, points,
 * other required charges). It's found by solving PV(payment, r, n) = amount financed.
 */
import { annuityPayment, cents, D, Decimal, monthlyRate } from '../../lib/math/money.ts';

export type FeeMode = 'upfront' | 'financed';

export interface AprInput extends Record<string, unknown> {
  loanAmount: number;
  /** Note (contract) interest rate, %. */
  interestRate: number;
  termMonths: number;
  /** Prepaid finance charges: origination fees, discount points, other required lender charges. */
  fees: number;
  /** upfront: fees paid at closing or deducted from the proceeds; financed: added to the loan balance. */
  feeMode: FeeMode;
}

export interface AprOutput {
  /** Annual percentage rate, %, rounded to 2 decimals as lenders quote it (Reg Z tolerance is 1/8 point). */
  apr: number;
  /** APR minus the note rate, percentage points. */
  spread: number;
  payment: number;
  /** Balance the payments are calculated on. */
  principal: number;
  /** Credit actually extended to the borrower (Reg Z "amount financed"). */
  amountFinanced: number;
  totalInterest: number;
  /** Interest plus fees: the Reg Z "finance charge". */
  financeCharge: number;
  /** All payments over the term. */
  totalOfPayments: number;
}

/** Present value of n equal monthly payments at monthly rate r. */
export function presentValue(payment: number, r: number, n: number): number {
  if (r === 0) return payment * n;
  return (payment * (1 - Math.pow(1 + r, -n))) / r;
}

/**
 * Monthly rate at which PV(payment, r, n) = target. PV falls as r rises, so bisection always
 * converges. The rate is a solved quantity, not money, so double precision is ample: 100 halvings
 * of [0, 1] reach about 1e-30, far below the 0.01% the APR is rounded to.
 */
export function solveMonthlyRate(payment: number, n: number, target: number): number {
  if (payment * n <= target) return 0;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    if (presentValue(payment, mid, n) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function computeApr(i: AprInput): AprOutput {
  const n = Math.max(1, Math.round(i.termMonths));
  const fees = Math.max(0, i.fees);
  const principal = cents(i.feeMode === 'financed' ? D(i.loanAmount).plus(fees) : i.loanAmount);
  const amountFinanced = cents(i.feeMode === 'financed' ? i.loanAmount : D(i.loanAmount).minus(fees));
  const payment = cents(annuityPayment(principal, monthlyRate(i.interestRate), n));
  const totalOfPayments = cents(payment.times(n));
  const totalInterest = cents(totalOfPayments.minus(principal));
  const financeCharge = cents(totalOfPayments.minus(amountFinanced));

  // Solve with the rounded payment, as the disclosed APR is based on the actual payment schedule.
  const apr = amountFinanced.gt(0) ? D(solveMonthlyRate(payment.toNumber(), n, amountFinanced.toNumber())).times(1200) : D(0);
  const aprRounded = apr.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  return {
    apr: aprRounded,
    spread: D(aprRounded).minus(i.interestRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    payment: payment.toNumber(),
    principal: principal.toNumber(),
    amountFinanced: amountFinanced.toNumber(),
    totalInterest: totalInterest.toNumber(),
    financeCharge: financeCharge.toNumber(),
    totalOfPayments: totalOfPayments.toNumber(),
  };
}

/** Fees at or above the loan amount leave nothing financed. */
export function feesTooLarge(i: Pick<AprInput, 'loanAmount' | 'fees' | 'feeMode'>): boolean {
  return i.feeMode === 'upfront' && i.fees >= i.loanAmount;
}
