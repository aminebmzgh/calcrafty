import { describe, expect, it } from 'vitest';
import { computeHeloc, creditLimitOf, type HelocInput } from './math.ts';

const base: HelocInput = { homeValue: 450_000, mortgageBalance: 250_000, maxCltv: 85, draw: 50_000, rate: 8.5, drawYears: 10, repayYears: 20 };

describe('HELOC credit limit', () => {
  // $450,000 × 85% − $250,000 = $132,500.
  it('85% combined loan-to-value', () => expect(creditLimitOf(450_000, 250_000, 85)).toBe(132_500));
  // At 80%: $360,000 − $250,000 = $110,000.
  it('80% combined loan-to-value', () => expect(creditLimitOf(450_000, 250_000, 80)).toBe(110_000));
  it('no line when the mortgage exceeds the limit', () => expect(creditLimitOf(300_000, 270_000, 85)).toBe(0));
  it('equity is value minus mortgage', () => expect(computeHeloc(base).equity).toBe(200_000));
});

describe('HELOC payments (checked with an independent float calculation)', () => {
  // Interest-only: $50,000 × 8.5% ÷ 12 = $354.17.
  it('interest-only payment during the draw period', () => expect(computeHeloc(base).interestOnlyPayment).toBe(354.17));
  // Repayment: $50,000 amortized over 240 months at 8.5% = $433.91.
  it('principal-and-interest payment in repayment', () => {
    const o = computeHeloc(base);
    expect(o.repaymentPayment).toBe(433.91);
    expect(o.paymentShock).toBe(79.74);
  });
  // 120 months × $354.17 = $42,500.40 of interest during the draw period.
  it('interest over the draw period', () => expect(computeHeloc(base).drawInterest).toBe(42_500.4));
  it('combined loan-to-value after the draw', () => expect(computeHeloc(base).cltvAfter).toBe(66.7));
  it('total interest adds both periods', () => {
    const o = computeHeloc(base);
    expect(o.totalInterest).toBeCloseTo(o.drawInterest + o.repayInterest, 2);
  });
});

describe('edge cases', () => {
  it('caps the draw at the credit limit', () => {
    const o = computeHeloc({ ...base, draw: 200_000 });
    expect(o.drawCapped).toBe(true);
    expect(o.drawUsed).toBe(132_500);
  });
  it('no draw period means repayment starts at once', () => expect(computeHeloc({ ...base, drawYears: 0 }).drawInterest).toBe(0));
  it('zero draw', () => expect(computeHeloc({ ...base, draw: 0 }).repaymentPayment).toBe(0));
  it('a higher rate raises the shock', () => expect(computeHeloc({ ...base, rate: 10 }).repaymentPayment).toBeGreaterThan(433.91));
});
