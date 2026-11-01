import { describe, expect, it } from 'vitest';
import { computeAutoLoan, salesTaxOf, type AutoLoanInput } from './math.ts';

const plain: AutoLoanInput = {
  price: 30_000,
  downPayment: 0,
  tradeInValue: 0,
  tradeInOwed: 0,
  salesTaxRate: 0,
  taxAfterTradeIn: true,
  fees: 0,
  interestRate: 6,
  termMonths: 60,
};

describe('auto loan reference payments (standard amortization tables)', () => {
  // $30,000 at 6% for 60 months → $579.98.
  it('$30,000 at 6% for 60 months', () => expect(computeAutoLoan(plain).payment).toBe(579.98));
  // $25,000 at 4% for 48 months → $564.48.
  it('$25,000 at 4% for 48 months', () => expect(computeAutoLoan({ ...plain, price: 25_000, interestRate: 4, termMonths: 48 }).payment).toBe(564.48));
  // $40,000 at 7.5% for 72 months → $691.60.
  it('$40,000 at 7.5% for 72 months', () => expect(computeAutoLoan({ ...plain, price: 40_000, interestRate: 7.5, termMonths: 72 }).payment).toBe(691.6));
  // $20,000 at 0% for 36 months → $555.56 (0% dealer financing).
  it('$20,000 at 0% for 36 months', () => expect(computeAutoLoan({ ...plain, price: 20_000, interestRate: 0, termMonths: 36 }).payment).toBe(555.56));
});

describe('amount financed', () => {
  const deal: AutoLoanInput = { ...plain, price: 35_000, downPayment: 4_000, tradeInValue: 8_000, tradeInOwed: 3_000, salesTaxRate: 6.25, fees: 500 };
  it('taxes the price minus the trade-in where states allow it', () => {
    expect(salesTaxOf(deal)).toBe(1_687.5); // (35,000 − 8,000) × 6.25%
    expect(salesTaxOf({ ...deal, taxAfterTradeIn: false })).toBe(2_187.5);
  });
  it('price + tax + fees − down − net trade-in', () => {
    const o = computeAutoLoan(deal);
    expect(o.netTradeIn).toBe(5_000);
    expect(o.amountFinanced).toBe(35_000 + 1_687.5 + 500 - 4_000 - 5_000);
  });
  it('rolls negative equity into the loan', () => {
    const o = computeAutoLoan({ ...deal, tradeInOwed: 11_000 });
    expect(o.negativeEquity).toBe(3_000);
    expect(o.amountFinanced).toBe(35_000 + 1_687.5 + 500 - 4_000 + 3_000);
  });
  it('a down payment above the cost means nothing to finance', () => {
    const o = computeAutoLoan({ ...plain, downPayment: 40_000 });
    expect(o.amountFinanced).toBe(0);
    expect(o.payment).toBe(0);
  });
  it('total cost includes the down payment', () => {
    const o = computeAutoLoan({ ...plain, downPayment: 5_000 });
    expect(o.totalCost).toBeCloseTo(o.totalPaid + 5_000, 2);
  });
});
