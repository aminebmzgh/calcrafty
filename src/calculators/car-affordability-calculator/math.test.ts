import { describe, expect, it } from 'vitest';
import { computeCarAffordability, loanFromPayment, priceFromFunds, type CarAffordInput } from './math.ts';
import { D } from '../../lib/math/money.ts';

const base: CarAffordInput = {
  annualIncome: 75_000,
  budgetPct: 10,
  runningCosts: 200,
  downPayment: 5_000,
  tradeIn: 0,
  interestRate: 7.5,
  termMonths: 48,
  salesTaxRate: 6,
  taxAfterTradeIn: true,
  fees: 500,
};

describe('loan from payment (present value of an annuity)', () => {
  // $500 a month at 6% for 48 months repays $21,290.16 (standard PV table; checked independently in floating point).
  it('$500/month at 6% for 48 months', () => expect(loanFromPayment(500, 6, 48).toDecimalPlaces(2).toNumber()).toBe(21_290.16));
  // At 0%, the loan is simply payment × months.
  it('0% interest', () => expect(loanFromPayment(400, 0, 60).toNumber()).toBe(24_000));
  it('no payment means no loan', () => expect(loanFromPayment(0, 6, 48).toNumber()).toBe(0));
});

describe('car affordability reference scenario', () => {
  // $75,000 ÷ 12 × 10% = $625 budget; − $200 running costs = $425 payment; 7.5% for 48 months → $17,577 loan.
  // Price: (17,577 + 5,000 − 500) ÷ 1.06 = $20,827.
  it('default scenario', () => {
    const o = computeCarAffordability(base);
    expect(o.monthlyBudget).toBe(625);
    expect(o.loanAmount).toBe(17_577);
    expect(o.maxPrice).toBe(20_827);
    expect(o.payment).toBeLessThanOrEqual(425);
  });
  // A $4,000 trade-in taxed after trade-in: (17,577 + 5,000 + 4,000 + 4,000 × 6% − 500) ÷ 1.06 = $24,827.
  it('trade-in reduces the taxable price', () => expect(computeCarAffordability({ ...base, tradeIn: 4_000 }).maxPrice).toBe(24_827));
  it('the price covers price + tax + fees exactly', () => {
    const price = priceFromFunds(D(20_000), { downPayment: 2_000, tradeIn: 0, salesTaxRate: 5, taxAfterTradeIn: true, fees: 0 });
    expect(price.times(1.05).toDecimalPlaces(2).toNumber()).toBe(22_000);
  });
  it('taxing the full price lowers the maximum', () => {
    const after = computeCarAffordability({ ...base, tradeIn: 4_000 }).maxPrice;
    const full = computeCarAffordability({ ...base, tradeIn: 4_000, taxAfterTradeIn: false }).maxPrice;
    expect(full).toBeLessThan(after);
  });
});

describe('edge cases', () => {
  it('running costs above the budget leave no loan', () => {
    const o = computeCarAffordability({ ...base, runningCosts: 700 });
    expect(o.loanAmount).toBe(0);
    expect(o.maxPrice).toBe(4_245); // (5,000 − 500) ÷ 1.06, rounded down
  });
  it('zero income', () => expect(computeCarAffordability({ ...base, annualIncome: 0, downPayment: 0 }).maxPrice).toBe(0));
  it('a longer term raises the price you can afford', () => expect(computeCarAffordability({ ...base, termMonths: 72 }).maxPrice).toBeGreaterThan(computeCarAffordability(base).maxPrice));
  it('down payment share of the price', () => expect(computeCarAffordability(base).downPct).toBe(24));
});
