import { describe, expect, it } from 'vitest';
import { aprFromApy, computeCd, valueAfter, type CdInput } from './math.ts';

const base: CdInput = { deposit: 10_000, apy: 5, termMonths: 12, compounding: 'monthly', taxRate: 0, inflation: 0, penaltyMonths: 3, withdrawMonth: 0 };

// APY definition (Truth in Savings Act, Regulation DD Appendix A): balance = deposit × (1 + APY)^(years).
describe('CD reference values', () => {
  it('$10,000 at 5% APY for 12 months earns $500', () => {
    const o = computeCd(base);
    expect(o.balance).toBe(10_500);
    expect(o.interest).toBe(500);
  });
  it('24 months compounds to $11,025', () => expect(computeCd({ ...base, termMonths: 24 }).balance).toBe(11_025));
  // 18 months at 4.5% APY: 10,000 × 1.045^1.5 = 10,682.54.
  it('partial years use the fractional power', () => expect(valueAfter(10_000, 4.5, 18)).toBe(10_682.54));
  // 5 years at 4.25% APY on $25,000: 25,000 × 1.0425^5 = 30,783.67.
  it('five-year CD', () => expect(valueAfter(25_000, 4.25, 60)).toBe(30_783.67));
});

describe('APY to APR', () => {
  // 12 × (1.05^(1/12) − 1) = 4.8889%; daily: 365 × (1.05^(1/365) − 1) = 4.8793%.
  it('monthly compounding', () => expect(aprFromApy(5, 12)).toBe(4.8889));
  it('daily compounding', () => expect(aprFromApy(5, 365)).toBe(4.8793));
  it('annual compounding equals the APY', () => expect(aprFromApy(5, 1)).toBe(5));
});

describe('tax, inflation and early withdrawal', () => {
  it('after-tax interest at 22%', () => expect(computeCd({ ...base, taxRate: 22 }).afterTaxInterest).toBe(390));
  // After tax 3.9% a year; with 3% inflation: 1.039 ÷ 1.03 − 1 = 0.87%.
  it('real return after tax and inflation', () => expect(computeCd({ ...base, taxRate: 22, inflation: 3 }).realReturn).toBe(0.87));
  // Cash out at month 6: interest 10,000 × (1.05^0.5 − 1) = 246.95; penalty 3 months at 4.8889% APR = 122.22.
  it('early withdrawal after 6 months with a 3-month penalty', () => {
    const e = computeCd({ ...base, withdrawMonth: 6 }).early!;
    expect(e.interestEarned).toBe(246.95);
    expect(e.penalty).toBe(122.22);
    expect(e.payout).toBe(10_124.73);
  });
  // Cash out at month 1 with a 6-month penalty: interest 40.74, penalty 244.45 → principal loss of 203.71.
  it('a penalty can eat into principal', () => {
    const e = computeCd({ ...base, withdrawMonth: 1, penaltyMonths: 6 }).early!;
    expect(e.net).toBeLessThan(0);
    expect(e.net).toBe(-203.71);
  });
  it('holding to maturity has no penalty', () => expect(computeCd({ ...base, withdrawMonth: 12 }).early).toBeNull());
  it('zero deposit', () => expect(computeCd({ ...base, deposit: 0 }).interest).toBe(0));
});
