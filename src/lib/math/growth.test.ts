import { describe, expect, it } from 'vitest';
import { apy, effectiveMonthlyRate, grow, monthsToTarget, requiredMonthly } from './growth.ts';

describe('compound growth reference values', () => {
  // Reference: A = P(1 + r/n)^(nt). $10,000 at 5% for 10 years (SEC Investor.gov compound interest formula).
  it('annual compounding: $16,288.95', () => {
    expect(grow({ principal: 10_000, annualPct: 5, years: 10, compounding: 'annually' }).balance).toBe(16_288.95);
  });
  it('monthly compounding: $16,470.09', () => {
    expect(grow({ principal: 10_000, annualPct: 5, years: 10, compounding: 'monthly' }).balance).toBe(16_470.09);
  });
  it('daily compounding (365): $16,486.65', () => {
    expect(grow({ principal: 10_000, annualPct: 5, years: 10, compounding: 'daily' }).balance).toBe(16_486.65);
  });
  it('continuous compounding (Pe^rt): $16,487.21', () => {
    expect(grow({ principal: 10_000, annualPct: 5, years: 10, compounding: 'continuously' }).balance).toBe(16_487.21);
  });
  // Reference: future value of an ordinary annuity, 100 × ((1.005^120 − 1) / 0.005) = $16,387.93.
  it('monthly contributions, end of month: $16,387.93', () => {
    const g = grow({ principal: 0, annualPct: 6, years: 10, compounding: 'monthly', monthly: 100 });
    expect(g.balance).toBe(16_387.93);
    expect(g.totalContributed).toBe(12_000);
    expect(g.totalInterest).toBe(4_387.93);
  });
  // Annuity due = ordinary annuity × (1 + r): 16,387.93 × 1.005 = $16,469.87.
  it('start-of-month contributions: $16,469.87', () => {
    expect(grow({ principal: 0, annualPct: 6, years: 10, compounding: 'monthly', monthly: 100, startOfMonth: true }).balance).toBe(16_469.87);
  });
});

describe('rates', () => {
  it('APY of 5% compounded monthly is 5.1162%', () => expect(apy(5, 'monthly')).toBe(5.1162));
  it('APY of 5% compounded annually is 5%', () => expect(apy(5, 'annually')).toBe(5));
  it('0% rate means no growth', () => {
    expect(effectiveMonthlyRate(0, 'daily').toNumber()).toBe(0);
    expect(grow({ principal: 1000, annualPct: 0, years: 5, compounding: 'monthly', monthly: 10 }).balance).toBe(1600);
  });
});

describe('goals', () => {
  // Required payment to reach $16,387.93 from $0 at 0.5%/month in 120 months is $100.
  it('required monthly contribution inverts the annuity formula', () => {
    expect(requiredMonthly(16_387.93, 0, 120, effectiveMonthlyRate(6, 'monthly'))).toBe(100);
    expect(requiredMonthly(1_200, 0, 12, effectiveMonthlyRate(0, 'monthly'))).toBe(100);
    expect(requiredMonthly(1_000, 5_000, 12, effectiveMonthlyRate(3, 'monthly'))).toBe(0);
  });
  it('months to a target', () => {
    expect(monthsToTarget(1_200, 0, 100, effectiveMonthlyRate(0, 'monthly'))).toBe(12);
    expect(monthsToTarget(1_000, 0, 0, effectiveMonthlyRate(0, 'monthly'))).toBe(Infinity);
  });
  it('yearly rows add up', () => {
    const g = grow({ principal: 1_000, annualPct: 7, years: 3, compounding: 'monthly', monthly: 50, annualIncreasePct: 10 });
    expect(g.years).toHaveLength(3);
    expect(g.years[1]!.contributions).toBe(660);
    expect(g.years.at(-1)!.balance).toBe(g.balance);
  });
});
