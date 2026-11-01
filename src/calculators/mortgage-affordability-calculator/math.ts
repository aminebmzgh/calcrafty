/**
 * Mortgage affordability: the highest home price whose full monthly payment (P&I, property tax,
 * insurance, PMI, HOA) fits within both debt-to-income limits (front-end and back-end ratios).
 */
import { annuityPayment, cents, D, monthlyRate } from '../../lib/math/money.ts';

export interface AffordabilityInput extends Record<string, unknown> {
  annualIncome: number;
  /** Other monthly debt payments: car, student loans, card minimums, child support. */
  monthlyDebts: number;
  downPayment: number;
  interestRate: number;
  termYears: number;
  propertyTaxRate: number;
  homeInsurance: number;
  hoa: number;
  pmiRate: number;
  /** Max housing payment as % of gross monthly income. */
  frontRatio: number;
  /** Max total debt payments as % of gross monthly income. */
  backRatio: number;
}

export interface PaymentParts {
  pi: number;
  tax: number;
  insurance: number;
  pmi: number;
  hoa: number;
  /** Everything except principal & interest. */
  nonPI: number;
  total: number;
}

export interface AffordabilityOutput {
  maxPrice: number;
  loanAmount: number;
  payment: PaymentParts;
  /** Max housing payment allowed by each rule. */
  frontLimit: number;
  backLimit: number;
  /** The binding limit: the lower of the two. */
  housingLimit: number;
  /** Room left under the back-end limit when the front-end limit binds. */
  headroom: number;
  /** Which rule sets the limit. */
  limitedBy: 'front' | 'back' | 'none';
  /** Resulting ratios at the max price, %. */
  frontDti: number;
  backDti: number;
  /** Other debts as % of income. */
  otherDti: number;
  downPaymentPct: number;
  monthlyIncome: number;
}

export function paymentFor(price: number, i: AffordabilityInput): PaymentParts {
  const loan = Math.max(0, price - i.downPayment);
  const pi = loan > 0 ? cents(annuityPayment(loan, monthlyRate(i.interestRate), Math.round(i.termYears * 12))).toNumber() : 0;
  const tax = cents(D(price).times(i.propertyTaxRate).div(1200)).toNumber();
  const insurance = cents(D(i.homeInsurance).div(12)).toNumber();
  const pmi = price > 0 && loan / price > 0.8 ? cents(D(loan).times(i.pmiRate).div(1200)).toNumber() : 0;
  const hoa = cents(i.hoa).toNumber();
  const nonPI = cents(D(tax).plus(insurance).plus(pmi).plus(hoa)).toNumber();
  return { pi, tax, insurance, pmi, hoa, nonPI, total: cents(D(pi).plus(nonPI)).toNumber() };
}

export function computeAffordability(i: AffordabilityInput): AffordabilityOutput {
  const monthlyIncome = cents(D(i.annualIncome).div(12)).toNumber();
  const frontLimit = cents(D(monthlyIncome).times(i.frontRatio).div(100)).toNumber();
  const backLimit = Math.max(0, cents(D(monthlyIncome).times(i.backRatio).div(100).minus(i.monthlyDebts)).toNumber());
  const limit = Math.min(frontLimit, backLimit);

  // The payment rises with price, so bisect for the highest whole-dollar price within the limit.
  let lo = 0;
  let hi = Math.max(i.downPayment, 1) + 100_000_000;
  if (paymentFor(lo, i).total > limit) hi = 0;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (paymentFor(mid, i).total <= limit) lo = mid;
    else hi = mid;
  }
  const maxPrice = lo;
  const payment = paymentFor(maxPrice, i);
  const pct = (n: number) => (monthlyIncome > 0 ? D(n).div(monthlyIncome).times(100).toDecimalPlaces(1).toNumber() : 0);
  return {
    maxPrice,
    loanAmount: Math.max(0, maxPrice - i.downPayment),
    payment,
    frontLimit,
    backLimit,
    housingLimit: limit,
    headroom: Math.max(0, cents(D(backLimit).minus(frontLimit)).toNumber()),
    limitedBy: limit <= 0 ? 'none' : frontLimit <= backLimit ? 'front' : 'back',
    frontDti: pct(payment.total),
    backDti: pct(payment.total + i.monthlyDebts),
    otherDti: pct(i.monthlyDebts),
    downPaymentPct: maxPrice > 0 ? D(Math.min(i.downPayment, maxPrice)).div(maxPrice).times(100).toDecimalPlaces(1).toNumber() : 0,
    monthlyIncome,
  };
}
