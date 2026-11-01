import { describe, expect, it } from 'vitest';
import { computeSavingsGoal, type SavingsGoalInput } from './math.ts';

const base: SavingsGoalInput = { goal: 12_000, current: 0, mode: 'deadline', years: 1, monthly: 500, rate: 0 };

describe('savings goal references', () => {
  // With no interest, $12,000 in 12 months needs $1,000 a month.
  it('0% interest: goal ÷ months', () => expect(computeSavingsGoal(base).monthlyDeposit).toBe(1_000));
  // Sinking fund formula PMT = FV × m / ((1+m)^n − 1). $20,000 in 5 years at 4% compounded daily (monthly-equivalent rate), rounded up to the cent → $301.62.
  it('$20,000 in 5 years at 4% → $301.62 a month', () => {
    expect(computeSavingsGoal({ ...base, goal: 20_000, years: 5, rate: 4 }).monthlyDeposit).toBe(301.62);
  });
  // Existing savings reduce the deposit: $5,000 now toward $20,000 in 5 years at 4%.
  it('existing savings shrink the deposit', () => {
    expect(computeSavingsGoal({ ...base, goal: 20_000, current: 5_000, years: 5, rate: 4 }).monthlyDeposit).toBe(209.52);
  });
  // At $500/month and 0%, $12,000 takes 24 months.
  it('deposit mode: months to the goal', () => expect(computeSavingsGoal({ ...base, mode: 'deposit' }).months).toBe(24));
});

describe('savings goal edge cases', () => {
  it('already at the goal', () => {
    const o = computeSavingsGoal({ ...base, current: 15_000 });
    expect(o.monthlyDeposit).toBe(0);
    expect(o.months).toBe(0);
  });
  it('never reaches the goal with no deposits and no interest', () => {
    const o = computeSavingsGoal({ ...base, mode: 'deposit', monthly: 0 });
    expect(o.reached).toBe(false);
    expect(Number.isFinite(o.finalBalance)).toBe(true);
  });
  it('final balance meets the goal when solving for the deposit', () => {
    const o = computeSavingsGoal({ ...base, goal: 50_000, current: 3_000, years: 7, rate: 4.5 });
    expect(o.finalBalance).toBeGreaterThanOrEqual(50_000);
    expect(o.finalBalance - 50_000).toBeLessThan(5);
  });
  it('weekly equivalent', () => expect(computeSavingsGoal(base).weekly).toBe(230.77));
});
