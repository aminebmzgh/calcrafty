import { describe, expect, it } from 'vitest';
import { computeDiscount, impliedPercent, originalFromSale, percentOff, type DiscountInput } from './math.ts';

const base: DiscountInput = { price: 80, type: 'percent', percentOff: 25, amountOff: 15, extraPercent: 0, taxRate: 0 };

describe('discount', () => {
  // $80 at 25% off: $80 × 0.75 = $60; you save $20.
  it('percent off', () => {
    const o = computeDiscount(base);
    expect(o.salePrice).toBe(60);
    expect(o.savings).toBe(20);
    expect(o.effectivePercent).toBe(25);
  });
  // Stacked: 25% off, then an extra 10% off the reduced $60 = $54, which is 32.5% off, not 35%.
  it('stacked discounts multiply', () => {
    const o = computeDiscount({ ...base, extraPercent: 10 });
    expect(o.afterFirst).toBe(60);
    expect(o.salePrice).toBe(54);
    expect(o.effectivePercent).toBe(32.5);
    expect(o.addedPercent).toBe(35);
  });
  // $15 off $80 = $65, an 18.75% discount.
  it('dollar amount off', () => {
    const o = computeDiscount({ ...base, type: 'amount' });
    expect(o.salePrice).toBe(65);
    expect(o.effectivePercent).toBe(18.75);
  });
  // Tax on the sale price: $60 × 8.25% = $4.95; total $64.95.
  it('sales tax on the discounted price', () => {
    const o = computeDiscount({ ...base, taxRate: 8.25 });
    expect(o.tax).toBe(4.95);
    expect(o.total).toBe(64.95);
  });
  // $49.99 at 30% off: 34.993 → $34.99.
  it('rounds to the cent', () => expect(percentOff(49.99, 30)).toBe(34.99));
  // A $42 sale price at 40% off came from $42 ÷ 0.6 = $70.
  it('original price from the sale price', () => {
    expect(originalFromSale(42, 40)).toBe(70);
    expect(impliedPercent(120, 90)).toBe(25);
  });
  it('a discount bigger than the price stops at zero', () => {
    expect(computeDiscount({ ...base, type: 'amount', amountOff: 100 }).salePrice).toBe(0);
    expect(computeDiscount({ ...base, percentOff: 150 }).salePrice).toBe(0);
  });
  it('table of common discounts', () => {
    const t = computeDiscount(base).table;
    expect(t.find((r) => r.percentOff === 40)).toEqual({ percentOff: 40, salePrice: 48, savings: 32 });
  });
});
