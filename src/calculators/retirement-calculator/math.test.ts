import { describe, expect, it } from 'vitest';
import { computeRetirement, pvGrowingAnnuityDue, type RetirementInput } from './math.ts';

const base: RetirementInput = {
  currentAge: 35,
  retirementAge: 65,
  lifeExpectancy: 90,
  currentSavings: 50_000,
  monthly: 800,
  preReturn: 6,
  postReturn: 4,
  incomeNeeded: 60_000,
  socialSecurity: 2_000,
  inflation: 0,
};

describe('retirement references', () => {
  // Present value of a level annuity due with no growth or return is simply payment × years.
  it('0% return and 0% inflation: need = gap × years', () => {
    expect(pvGrowingAnnuityDue(36_000, 25, 0, 0)).toBe(900_000);
  });
  // Closed form for a growing annuity due: P × (1 − q^N) / (1 − q), q = (1+g)/(1+r).
  // P = 40,000, N = 25, r = 5%, g = 2.5%.
  it('growing annuity due matches the closed-form formula', () => {
    const q = 1.025 / 1.05;
    const closed = (40_000 * (1 - q ** 25)) / (1 - q);
    expect(pvGrowingAnnuityDue(40_000, 25, 5, 2.5)).toBeCloseTo(closed, 1);
  });
  // Level annuity due at r: P × (1 − (1+r)^−N) / r × (1+r). $50,000 × 20 years at 4% → $706,696.97.
  it('level annuity due at 4% for 20 years', () => {
    expect(pvGrowingAnnuityDue(50_000, 20, 4, 0)).toBeCloseTo(706_696.97, 1);
  });
  // Savings growth uses the shared engine: $50,000 at 6% monthly for 30 years + $800/month.
  it('savings at retirement = FV of lump sum + FV of monthly annuity', () => {
    const m = 0.005;
    const fv = 50_000 * (1 + m) ** 360 + (800 * ((1 + m) ** 360 - 1)) / m;
    expect(computeRetirement(base).savingsAtRetirement).toBeCloseTo(fv, 0);
  });
});

describe('retirement behavior', () => {
  it('Social Security reduces the gap', () => {
    expect(computeRetirement(base).annualGap).toBe(36_000);
    expect(computeRetirement({ ...base, socialSecurity: 6_000 }).annualGap).toBe(0);
  });
  it('flags a shortfall and the monthly saving that fixes it', () => {
    const o = computeRetirement({ ...base, monthly: 100, currentSavings: 0 });
    expect(o.onTrack).toBe(false);
    expect(o.requiredMonthly).toBeGreaterThan(100);
    const fixed = computeRetirement({ ...base, monthly: o.requiredMonthly + 1, currentSavings: 0 });
    expect(fixed.onTrack).toBe(true);
  });
  it('reports when savings run out', () => {
    const o = computeRetirement({ ...base, monthly: 0, currentSavings: 50_000 });
    expect(o.runsOutAge).not.toBeNull();
    expect(o.runsOutAge!).toBeLessThan(90);
    expect(computeRetirement({ ...base, monthly: 3_000 }).runsOutAge).toBeNull();
  });
  it('handles retiring now and inflation', () => {
    const now = computeRetirement({ ...base, currentAge: 65 });
    expect(now.yearsToRetire).toBe(0);
    expect(now.savingsAtRetirement).toBe(50_000);
    const infl = computeRetirement({ ...base, inflation: 3 });
    expect(infl.needed).toBeGreaterThan(computeRetirement(base).needed);
    expect(infl.savingsTodaysDollars).toBeLessThan(infl.savingsAtRetirement);
  });
});
