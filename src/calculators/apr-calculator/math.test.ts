import { describe, expect, it } from 'vitest';
import { computeApr, feesTooLarge, presentValue, solveMonthlyRate, type AprInput } from './math.ts';

const base: AprInput = { loanAmount: 20_000, interestRate: 7, termMonths: 60, fees: 600, feeMode: 'upfront' };

// Reference values: APR solved independently with Newton's method on the same payment schedule
// (Regulation Z, 12 CFR 1026 Appendix J: the rate at which the payments' present value equals the amount financed).
describe('APR reference values (Reg Z actuarial method)', () => {
  // $5,000 over 36 months at 12% with no fees: payment $166.07, APR 12.00% (APR equals the note rate without fees).
  it('no fees: APR equals the note rate', () => {
    const o = computeApr({ loanAmount: 5_000, interestRate: 12, termMonths: 36, fees: 0, feeMode: 'upfront' });
    expect(o.payment).toBe(166.07);
    expect(o.apr).toBe(12);
    expect(o.financeCharge).toBe(978.52);
  });
  // $20,000 at 7% for 60 months with a $600 fee paid upfront: payment $396.02, amount financed $19,400, APR 8.29%.
  it('$600 fee paid upfront on $20,000 at 7%', () => {
    const o = computeApr(base);
    expect(o.payment).toBe(396.02);
    expect(o.amountFinanced).toBe(19_400);
    expect(o.financeCharge).toBe(4_361.2);
    expect(o.apr).toBe(8.29);
    expect(o.spread).toBe(1.29);
  });
  // The same fee rolled into the loan: payment $407.90 on $20,600, amount financed $20,000, APR 8.25%.
  it('$600 fee financed into the loan', () => {
    const o = computeApr({ ...base, feeMode: 'financed' });
    expect(o.principal).toBe(20_600);
    expect(o.payment).toBe(407.9);
    expect(o.amountFinanced).toBe(20_000);
    expect(o.apr).toBe(8.25);
  });
  // $300,000 mortgage at 6.5% for 30 years with $6,000 in points and fees: payment $1,896.20, APR 6.70%.
  it('30-year mortgage with 2% in points and fees', () => {
    const o = computeApr({ loanAmount: 300_000, interestRate: 6.5, termMonths: 360, fees: 6_000, feeMode: 'upfront' });
    expect(o.payment).toBe(1_896.2);
    expect(o.apr).toBe(6.7);
  });
  // $15,000 personal loan at 9.99% for 36 months with a 5% ($750) origination fee: APR 13.55%.
  it('personal loan with a 5% origination fee', () => expect(computeApr({ loanAmount: 15_000, interestRate: 9.99, termMonths: 36, fees: 750, feeMode: 'upfront' }).apr).toBe(13.55));
});

describe('edge cases', () => {
  // 0% loan with a $300 fee: $10,000 over 12 months, payment $833.33, APR 5.66%.
  it('a 0% loan with fees still has an APR', () => {
    const o = computeApr({ loanAmount: 10_000, interestRate: 0, termMonths: 12, fees: 300, feeMode: 'upfront' });
    expect(o.payment).toBe(833.33);
    expect(o.apr).toBe(5.66);
  });
  it('0% and no fees gives a 0% APR', () => expect(computeApr({ loanAmount: 10_000, interestRate: 0, termMonths: 12, fees: 0, feeMode: 'upfront' }).apr).toBe(0));
  it('a single payment', () => {
    const o = computeApr({ loanAmount: 1_000, interestRate: 12, termMonths: 1, fees: 0, feeMode: 'upfront' });
    expect(o.payment).toBe(1_010);
    expect(o.apr).toBe(12);
  });
  it('very large loans', () => expect(computeApr({ loanAmount: 5_000_000, interestRate: 6, termMonths: 360, fees: 50_000, feeMode: 'upfront' }).apr).toBeGreaterThan(6));
  it('flags fees that swallow the loan', () => {
    expect(feesTooLarge({ loanAmount: 1_000, fees: 1_000, feeMode: 'upfront' })).toBe(true);
    expect(feesTooLarge({ loanAmount: 1_000, fees: 1_000, feeMode: 'financed' })).toBe(false);
    expect(computeApr({ ...base, fees: 20_000 }).apr).toBe(0);
  });
  it('higher fees always mean a higher APR', () => expect(computeApr({ ...base, fees: 1_200 }).apr).toBeGreaterThan(computeApr(base).apr));
  it('present value and the rate solve are inverses', () => {
    const r = solveMonthlyRate(500, 48, presentValue(500, 0.005, 48));
    expect(r).toBeCloseTo(0.005, 10);
  });
});
