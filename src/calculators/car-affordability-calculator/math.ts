/**
 * Car affordability: from a monthly car budget (a share of gross income, minus insurance and
 * running costs) to the largest loan the payment supports, then to the highest vehicle price
 * once the down payment, trade-in, sales tax and fees are accounted for.
 */
import { amortize, cents, D, Decimal, monthlyRate } from '../../lib/math/money.ts';

export interface CarAffordInput extends Record<string, unknown> {
  /** Gross annual income. */
  annualIncome: number;
  /** Share of gross monthly income for all car costs, % (the 20/4/10 guideline uses 10%). */
  budgetPct: number;
  /** Insurance, fuel and maintenance per month, paid out of the same budget. */
  runningCosts: number;
  downPayment: number;
  /** Trade-in value net of any loan payoff. */
  tradeIn: number;
  interestRate: number;
  termMonths: number;
  salesTaxRate: number;
  /** Most states tax only the price minus the trade-in. */
  taxAfterTradeIn: boolean;
  /** Title, registration and dealer fees. */
  fees: number;
}

export interface CarAffordOutput {
  /** Total monthly car budget. */
  monthlyBudget: number;
  /** Budget left for the loan payment after running costs. */
  available: number;
  /** The loan payment (at most `available`). */
  payment: number;
  loanAmount: number;
  maxPrice: number;
  salesTax: number;
  totalInterest: number;
  /** Down payment + trade-in. */
  upfront: number;
  /** Down payment + trade-in as a share of the price, %. */
  downPct: number;
  /** Down payment + trade-in + all loan payments. */
  totalCost: number;
}

/** Largest loan a monthly payment repays over n months at an annual rate (present value of an annuity). */
export function loanFromPayment(payment: number, annualPct: number, months: number): Decimal {
  if (payment <= 0 || months <= 0) return D(0);
  const r = monthlyRate(annualPct);
  if (r.isZero()) return D(payment).times(months);
  return D(payment).times(D(1).minus(D(1).plus(r).pow(-months))).div(r);
}

/**
 * Highest price the loan, down payment and trade-in cover:
 * price + tax + fees = loan + down payment + trade-in, where tax = (price − trade-in) × t
 * (or price × t where the full price is taxed).
 */
export function priceFromFunds(loan: Decimal, i: Pick<CarAffordInput, 'downPayment' | 'tradeIn' | 'salesTaxRate' | 'taxAfterTradeIn' | 'fees'>): Decimal {
  const t = D(i.salesTaxRate).div(100);
  const funds = loan.plus(i.downPayment).plus(i.tradeIn).minus(i.fees).plus(i.taxAfterTradeIn ? D(i.tradeIn).times(t) : 0);
  const price = funds.div(D(1).plus(t));
  return price.gt(0) ? price : D(0);
}

export function computeCarAffordability(i: CarAffordInput): CarAffordOutput {
  const n = Math.max(1, Math.round(i.termMonths));
  const monthlyBudget = cents(D(Math.max(0, i.annualIncome)).div(12).times(i.budgetPct).div(100));
  const left = cents(monthlyBudget.minus(i.runningCosts));
  const pay = left.gt(0) ? left : D(0);
  // Round the loan down to whole dollars so the payment never exceeds the budget.
  const loanAmount = loanFromPayment(pay.toNumber(), i.interestRate, n).toDecimalPlaces(0, Decimal.ROUND_DOWN);
  const maxPrice = priceFromFunds(loanAmount, i).toDecimalPlaces(0, Decimal.ROUND_DOWN);
  const taxBase = i.taxAfterTradeIn ? maxPrice.minus(i.tradeIn) : maxPrice;
  const salesTax = cents(taxBase.gt(0) ? taxBase.times(i.salesTaxRate).div(100) : 0);
  const a = amortize(loanAmount.toNumber(), i.interestRate, n);
  const upfront = D(i.downPayment).plus(i.tradeIn);
  return {
    monthlyBudget: monthlyBudget.toNumber(),
    available: pay.toNumber(),
    payment: a.payment,
    loanAmount: loanAmount.toNumber(),
    maxPrice: maxPrice.toNumber(),
    salesTax: salesTax.toNumber(),
    totalInterest: a.totalInterest,
    upfront: cents(upfront).toNumber(),
    downPct: maxPrice.gt(0) ? upfront.div(maxPrice).times(100).toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber() : 0,
    totalCost: cents(upfront.plus(a.totalPaid)).toNumber(),
  };
}
