import { describe, expect, it } from 'vitest';
import { computeLoan, convertTerm, termMonths, type LoanInput } from './math.ts';

const base: LoanInput = { amount: 10_000, interestRate: 12, term: 3, termUnit: 'years', extraMonthly: 0 };

describe('loan reference values', () => {
  // Reference: standard amortization tables (e.g. CFPB/bank loan calculators): $10,000 at 12% for 36 months → $332.14.
  it('$10,000 at 12% for 3 years is $332.14 a month', () => {
    const o = computeLoan(base);
    expect(o.payment).toBe(332.14);
    expect(o.months).toBe(36);
  });
  // Reference: $25,000 at 7% for 60 months → $495.03.
  it('$25,000 at 7% for 5 years is $495.03', () => {
    expect(computeLoan({ ...base, amount: 25_000, interestRate: 7, term: 5 }).payment).toBe(495.03);
  });
  // Reference: $5,000 at 9.99% for 24 months → $230.70.
  it('$5,000 at 9.99% for 24 months is $230.70', () => {
    expect(computeLoan({ ...base, amount: 5_000, interestRate: 9.99, term: 24, termUnit: 'months' }).payment).toBe(230.7);
  });
  // Reference: $100,000 at 5% for 10 years → $1,060.66.
  it('$100,000 at 5% for 10 years is $1,060.66', () => {
    expect(computeLoan({ ...base, amount: 100_000, interestRate: 5, term: 10 }).payment).toBe(1060.66);
  });
});

describe('loan behavior', () => {
  it('total interest is payments minus principal', () => {
    const o = computeLoan(base);
    expect(Math.abs(o.totalPaid - o.totalInterest - 10_000)).toBeLessThan(0.005);
    expect(o.totalInterest).toBeCloseTo(332.14 * 36 - 10_000, 0);
  });
  it('extra payments shorten the loan', () => {
    const o = computeLoan({ ...base, extraMonthly: 100 });
    expect(o.payoffMonths).toBeLessThan(36);
    expect(o.interestSaved).toBeGreaterThan(0);
  });
  it('0% interest splits evenly; one month pays everything plus a month of interest', () => {
    expect(computeLoan({ ...base, interestRate: 0, term: 10, termUnit: 'months' }).payment).toBe(1000);
    expect(computeLoan({ ...base, term: 1, termUnit: 'months' }).payment).toBe(10_100);
  });
  it('very large loans and extreme rates stay finite', () => {
    const o = computeLoan({ ...base, amount: 10_000_000, interestRate: 99, term: 30 });
    expect(Number.isFinite(o.payment)).toBe(true);
    expect(o.rows.at(-1)!.balance).toBe(0);
  });
  it('converts term units', () => {
    expect(termMonths(2.5, 'years')).toBe(30);
    expect(convertTerm(3, 'years', 'months')).toBe(36);
    expect(convertTerm(30, 'months', 'years')).toBe(2.5);
  });
});
