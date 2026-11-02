import { describe, expect, it } from 'vitest';
import { compute401k, contributionsFor, deferralLimit, type K401Input } from './math.ts';

const base: K401Input = { currentAge: 30, retireAge: 67, salary: 70_000, salaryGrowth: 3, contribPct: 6, matchRate: 50, matchUpTo: 6, balance: 20_000, returnRate: 6.5, inflation: 3 };

describe('2026 IRS limits (Notice 2025-67)', () => {
  it('base limit $24,500', () => expect(deferralLimit(35)).toBe(24_500));
  it('age 50+ catch-up adds $8,000', () => expect(deferralLimit(55)).toBe(32_500));
  it('ages 60–63 catch-up adds $11,250', () => {
    expect(deferralLimit(61)).toBe(35_750);
    expect(deferralLimit(64)).toBe(32_500);
  });
});

describe('contributions and match', () => {
  // 10% of $100,000 = $10,000; 100% match on up to 4% = $4,000.
  it('match is capped at the match limit', () => {
    const c = contributionsFor(100_000, 10, 100, 4, 40);
    expect(c.employee.toNumber()).toBe(10_000);
    expect(c.employer.toNumber()).toBe(4_000);
  });
  // 15% of $300,000 = $45,000, capped at $24,500; the match is on 6% of pay: $18,000 × 50% = $9,000.
  it('employee deferral is capped at the IRS limit', () => {
    const c = contributionsFor(300_000, 15, 50, 6, 45);
    expect(c.employee.toNumber()).toBe(24_500);
    expect(c.employer.toNumber()).toBe(9_000);
    expect(c.capped).toBe(true);
  });
  // Contributing 3% when the employer matches 100% up to 5% leaves 2% × $60,000 = $1,200 a year unclaimed.
  it('match left on the table', () => {
    const o = compute401k({ ...base, currentAge: 35, retireAge: 45, salary: 60_000, salaryGrowth: 0, contribPct: 3, matchRate: 100, matchUpTo: 5, returnRate: 0, balance: 0 });
    expect(o.matchMissed).toBe(1_200);
    expect(o.firstEmployer).toBe(1_800);
  });
});

describe('projection (checked with an independent floating-point model)', () => {
  // 30 to 67, $70,000 rising 3%, 6% + 50% match up to 6%, $20,000 start, 6.5% return, monthly compounding.
  it('reference projection', () => {
    const o = compute401k(base);
    expect(o.balance).toBe(1_628_469.9);
    expect(o.employeeTotal).toBe(277_931.75);
    expect(o.employerTotal).toBe(138_965.86);
    expect(o.firstEmployee).toBe(4_200);
    expect(o.firstEmployer).toBe(2_100);
  });
  it('growth is the balance minus the money put in', () => {
    const o = compute401k(base);
    expect(o.growth).toBeCloseTo(o.balance - 20_000 - o.employeeTotal - o.employerTotal, 2);
  });
  it('0% return just adds up contributions', () => {
    const o = compute401k({ ...base, currentAge: 35, retireAge: 45, salary: 60_000, salaryGrowth: 0, contribPct: 5, matchRate: 100, matchUpTo: 5, returnRate: 0, balance: 0 });
    expect(o.balance).toBe(60_000);
  });
  it('counts the years at the IRS limit', () => expect(compute401k({ ...base, salary: 300_000, contribPct: 15, salaryGrowth: 0, currentAge: 45, retireAge: 46 }).yearsAtLimit).toBe(1));
  it('no years to go', () => expect(compute401k({ ...base, retireAge: 30 }).balance).toBe(20_000));
});
