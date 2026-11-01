import { describe, expect, it } from 'vitest';
import { computeAffordability, paymentFor, type AffordabilityInput } from './math.ts';

const bare: AffordabilityInput = {
  annualIncome: 120_000,
  monthlyDebts: 0,
  downPayment: 60_000,
  interestRate: 6.5,
  termYears: 30,
  propertyTaxRate: 0,
  homeInsurance: 0,
  hoa: 0,
  pmiRate: 0,
  frontRatio: 28,
  backRatio: 36,
};

describe('affordability references', () => {
  // 28% of $10,000/month = $2,800. At 6.5%/30y, $1 of loan costs 0.00632068/month,
  // so the max loan is 2,800 / 0.00632068 ≈ $442,989 and the price ≈ $502,989.
  it('front-end 28% rule with no escrow', () => {
    const o = computeAffordability(bare);
    expect(o.frontLimit).toBe(2_800);
    expect(o.limitedBy).toBe('front');
    expect(o.maxPrice).toBeGreaterThan(502_980);
    expect(o.maxPrice).toBeLessThan(503_000);
    expect(o.payment.total).toBeLessThanOrEqual(2_800);
    expect(paymentFor(o.maxPrice + 1, bare).total).toBeGreaterThan(2_800);
  });
  // Back-end: 36% × 10,000 − 1,200 debts = $2,400, which is below $2,800, so it binds.
  it('back-end 36% rule binds when debts are high', () => {
    const o = computeAffordability({ ...bare, monthlyDebts: 1_200 });
    expect(o.backLimit).toBe(2_400);
    expect(o.limitedBy).toBe('back');
    expect(o.payment.total).toBeLessThanOrEqual(2_400);
  });
  // With 0% interest, $2,800 × 360 = $1,008,000 of loan (+$1 still rounds to a $2,800.00 payment).
  it('0% interest: limit × months', () => {
    const o = computeAffordability({ ...bare, interestRate: 0 });
    expect(o.loanAmount).toBeGreaterThanOrEqual(1_008_000);
    expect(o.loanAmount).toBeLessThanOrEqual(1_008_001);
    expect(o.payment.total).toBe(2_800);
  });
  it('escrow costs reduce the affordable price', () => {
    const a = computeAffordability(bare).maxPrice;
    const b = computeAffordability({ ...bare, propertyTaxRate: 1.2, homeInsurance: 2_000, hoa: 100 }).maxPrice;
    expect(b).toBeLessThan(a);
  });
});

describe('affordability edge cases', () => {
  it('PMI applies under 20% down', () => {
    const o = computeAffordability({ ...bare, downPayment: 20_000, pmiRate: 0.6 });
    expect(o.payment.pmi).toBeGreaterThan(0);
  });
  it('debts above the back-end limit leave no room for a mortgage (cash purchase only)', () => {
    const o = computeAffordability({ ...bare, monthlyDebts: 5_000 });
    expect(o.limitedBy).toBe('none');
    expect(o.loanAmount).toBe(0);
    expect(o.maxPrice).toBeLessThanOrEqual(60_000);
    expect(computeAffordability({ ...bare, monthlyDebts: 5_000, homeInsurance: 1_200 }).maxPrice).toBe(0);
  });
  it('zero income', () => {
    const o = computeAffordability({ ...bare, annualIncome: 0, downPayment: 0 });
    expect(o.maxPrice).toBe(0);
    expect(o.frontDti).toBe(0);
  });
});
