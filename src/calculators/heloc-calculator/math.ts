/**
 * Home equity line of credit (HELOC) math: available credit from the combined loan-to-value
 * limit, interest-only payments during the draw period, the amortized payment once repayment
 * starts (the "payment shock"), and total interest over the life of the line.
 */
import { amortize, cents, D, Decimal } from '../../lib/math/money.ts';

export interface HelocInput extends Record<string, unknown> {
  homeValue: number;
  mortgageBalance: number;
  /** Maximum combined loan-to-value the lender allows, %. */
  maxCltv: number;
  /** Amount you plan to draw. */
  draw: number;
  /** HELOC interest rate, %. Usually variable: prime plus a margin. */
  rate: number;
  drawYears: number;
  repayYears: number;
}

export interface HelocOutput {
  equity: number;
  /** Largest line the CLTV limit allows. */
  creditLimit: number;
  /** The draw used in the calculation (capped at the credit limit). */
  drawUsed: number;
  drawCapped: boolean;
  /** Combined loan-to-value after the draw, %. */
  cltvAfter: number;
  /** Monthly interest-only payment during the draw period. */
  interestOnlyPayment: number;
  /** Monthly principal-and-interest payment once repayment starts. */
  repaymentPayment: number;
  /** Increase when the draw period ends. */
  paymentShock: number;
  drawInterest: number;
  repayInterest: number;
  totalInterest: number;
  /** Amount borrowed plus all interest. */
  totalRepaid: number;
  drawMonths: number;
  repayMonths: number;
}

export function creditLimitOf(homeValue: number, mortgageBalance: number, maxCltv: number): number {
  const limit = D(homeValue).times(maxCltv).div(100).minus(mortgageBalance);
  return limit.gt(0) ? cents(limit).toNumber() : 0;
}

export function computeHeloc(i: HelocInput): HelocOutput {
  const equity = Math.max(0, cents(D(i.homeValue).minus(i.mortgageBalance)).toNumber());
  const creditLimit = creditLimitOf(i.homeValue, i.mortgageBalance, i.maxCltv);
  const drawUsed = Math.min(Math.max(0, i.draw), creditLimit);
  const drawMonths = Math.max(0, Math.round(i.drawYears * 12));
  const repayMonths = Math.max(1, Math.round(i.repayYears * 12));

  const interestOnly = cents(D(drawUsed).times(i.rate).div(1200));
  const drawInterest = cents(interestOnly.times(drawMonths));
  const repay = amortize(drawUsed, i.rate, repayMonths);
  const cltvAfter = i.homeValue > 0 ? D(i.mortgageBalance).plus(drawUsed).div(i.homeValue).times(100).toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber() : 0;

  return {
    equity,
    creditLimit,
    drawUsed,
    drawCapped: i.draw > creditLimit,
    cltvAfter,
    interestOnlyPayment: interestOnly.toNumber(),
    repaymentPayment: repay.payment,
    paymentShock: cents(D(repay.payment).minus(interestOnly)).toNumber(),
    drawInterest: drawInterest.toNumber(),
    repayInterest: repay.totalInterest,
    totalInterest: cents(drawInterest.plus(repay.totalInterest)).toNumber(),
    totalRepaid: cents(drawInterest.plus(repay.totalInterest).plus(drawUsed)).toNumber(),
    drawMonths,
    repayMonths,
  };
}
