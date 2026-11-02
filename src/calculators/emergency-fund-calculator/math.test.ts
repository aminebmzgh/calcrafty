import { describe, expect, it } from 'vitest';
import { computeEmergency, type EmergencyInput } from './math.ts';

const base: EmergencyInput = { essentials: 3_500, months: 6, saved: 2_000, monthlySaving: 400, rate: 0, deadlineMonths: 24 };

describe('emergency fund target', () => {
  // 6 months × $3,500 = $21,000; gap after $2,000 saved = $19,000.
  it('target and gap', () => {
    const o = computeEmergency(base);
    expect(o.target).toBe(21_000);
    expect(o.gap).toBe(19_000);
  });
  // $2,000 ÷ $3,500 = 0.57 months, shown as 0.5 (rounded down so coverage is never overstated).
  it('months already covered', () => expect(computeEmergency(base).coveredMonths).toBe(0.5));
  it('progress', () => expect(computeEmergency(base).progress).toBe(9));
});

describe('time to reach the goal', () => {
  // At 0%, $19,000 ÷ $400 = 47.5 → 48 months.
  it('without interest', () => expect(computeEmergency(base).monthsToGoal).toBe(48));
  // Interest shortens it: at 4% compounded daily it takes 44 months (checked month by month in floating point).
  it('with interest', () => expect(computeEmergency({ ...base, rate: 4 }).monthsToGoal).toBe(44));
  // To finish in 24 months at 0%: $19,000 ÷ 24 = $791.67 (rounded up).
  it('monthly saving needed for a deadline', () => expect(computeEmergency(base).neededForDeadline).toBe(791.67));
  it('never reached with no saving', () => expect(computeEmergency({ ...base, monthlySaving: 0 }).monthsToGoal).toBeNull());
  it('already funded', () => {
    const o = computeEmergency({ ...base, saved: 25_000 });
    expect(o.gap).toBe(0);
    expect(o.monthsToGoal).toBe(0);
    expect(o.progress).toBe(100);
  });
});
