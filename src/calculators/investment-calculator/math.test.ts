import { describe, expect, it } from 'vitest';
import { computeInvestment, toTodaysDollars, type InvestmentInput } from './math.ts';

const base: InvestmentInput = { initial: 10_000, monthly: 0, returnRate: 6, years: 10, contributionIncrease: 0, inflation: 0 };

describe('investment references', () => {
  // A = P(1 + r/12)^(12t): $10,000 at 6% compounded monthly for 10 years → $18,193.97.
  it('lump sum: $18,193.97', () => expect(computeInvestment(base).balance).toBe(18_193.97));
  // FV of $500/month at 7% monthly for 30 years: 500 × ((1+0.07/12)^360 − 1)/(0.07/12) → $609,985.50.
  it('$500 a month for 30 years at 7%: $609,985.50', () => expect(computeInvestment({ ...base, initial: 0, monthly: 500, returnRate: 7, years: 30 }).balance).toBe(609_985.5));
  // Present value: $100,000 in 10 years at 3% inflation = 100,000 / 1.03^10 → $74,409.39.
  it('today’s dollars: $74,409.39', () => expect(toTodaysDollars(100_000, 3, 10)).toBe(74_409.39));
  // $1,000 at 0% for 5 years stays $1,000 and $100/month adds $6,000.
  it('0% return just adds contributions', () => expect(computeInvestment({ ...base, initial: 1_000, monthly: 100, returnRate: 0, years: 5 }).balance).toBe(7_000));
});

describe('investment details', () => {
  it('contribution increases compound yearly', () => {
    const o = computeInvestment({ ...base, initial: 0, monthly: 100, returnRate: 0, years: 3, contributionIncrease: 10 });
    expect(o.totalContributed).toBe(1_200 + 1_320 + 1_452);
    expect(o.finalMonthly).toBe(121);
  });
  it('real balance is lower than nominal when inflation is positive', () => {
    const o = computeInvestment({ ...base, inflation: 3 });
    expect(o.realBalance).toBeLessThan(o.balance);
    expect(o.realSeries).toHaveLength(11);
  });
  it('growth share and a 1-year horizon', () => {
    const o = computeInvestment({ ...base, years: 1, returnRate: 12 });
    expect(o.balance).toBe(11_268.25);
    expect(o.growthShare).toBeCloseTo(11.3, 1);
  });
});
