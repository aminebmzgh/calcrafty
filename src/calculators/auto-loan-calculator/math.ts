/**
 * Auto loan math: amount financed from price, sales tax, fees, down payment and trade-in
 * (including negative equity), then the standard amortized payment.
 */
import { amortize, byYear, cents, D, type AmortRow, type YearRow } from '../../lib/math/money.ts';

export interface AutoLoanInput extends Record<string, unknown> {
  price: number;
  downPayment: number;
  tradeInValue: number;
  /** Payoff still owed on the trade-in (rolled into the new loan if it exceeds the trade-in value). */
  tradeInOwed: number;
  salesTaxRate: number;
  /** Most states tax only the price minus the trade-in value. */
  taxAfterTradeIn: boolean;
  /** Title, registration and dealer documentation fees. */
  fees: number;
  interestRate: number;
  termMonths: number;
}

export interface AutoLoanOutput {
  salesTax: number;
  netTradeIn: number;
  amountFinanced: number;
  payment: number;
  totalInterest: number;
  totalPaid: number;
  /** Down payment + all loan payments. */
  totalCost: number;
  negativeEquity: number;
  rows: AmortRow[];
  years: YearRow[];
}

export function salesTaxOf(i: Pick<AutoLoanInput, 'price' | 'tradeInValue' | 'salesTaxRate' | 'taxAfterTradeIn'>): number {
  const base = i.taxAfterTradeIn ? Math.max(0, i.price - i.tradeInValue) : i.price;
  return cents(D(base).times(i.salesTaxRate).div(100)).toNumber();
}

export function computeAutoLoan(i: AutoLoanInput): AutoLoanOutput {
  const salesTax = salesTaxOf(i);
  const netTradeIn = cents(D(i.tradeInValue).minus(i.tradeInOwed)).toNumber();
  const amountFinanced = Math.max(0, cents(D(i.price).plus(salesTax).plus(i.fees).minus(i.downPayment).minus(netTradeIn)).toNumber());
  const a = amortize(amountFinanced, i.interestRate, Math.max(1, Math.round(i.termMonths)));
  return {
    salesTax,
    netTradeIn,
    amountFinanced,
    payment: a.payment,
    totalInterest: a.totalInterest,
    totalPaid: a.totalPaid,
    totalCost: cents(D(a.totalPaid).plus(i.downPayment)).toNumber(),
    negativeEquity: netTradeIn < 0 ? -netTradeIn : 0,
    rows: a.rows,
    years: byYear(a.rows),
  };
}
