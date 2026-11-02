import { describe, expect, it } from 'vitest';
import { computeOvertime, splitHours, type OvertimeInput } from './math.ts';

const base: OvertimeInput = { rate: 25, rule: 'federal', weekHours: 50, dayHours: 10, days: 5, multiplier: 1.5 };

describe('federal overtime (FLSA, 29 U.S.C. 207)', () => {
  // 40 × $25 + 10 × $37.50 = $1,000 + $375 = $1,375.
  it('50 hours at $25', () => {
    const o = computeOvertime(base);
    expect(o.overtimeHours).toBe(10);
    expect(o.weeklyPay).toBe(1_375);
    expect(o.annualPay).toBe(71_500);
  });
  it('no overtime at 40 hours or less', () => expect(computeOvertime({ ...base, weekHours: 38 }).overtimePay).toBe(0));
  // 1,375 ÷ 50 = $27.50 average per hour.
  it('average hourly rate', () => expect(computeOvertime(base).averageRate).toBe(27.5));
});

describe('California overtime (Labor Code § 510)', () => {
  const ca = (o: Partial<OvertimeInput>) => computeOvertime({ ...base, rule: 'california', ...o });
  // Five 10-hour days at $20: 8 regular + 2 OT each day → 40 regular, 10 OT: $800 + $300 = $1,100.
  it('daily overtime after 8 hours', () => {
    const o = ca({ rate: 20, dayHours: 10, days: 5 });
    expect(o.regularHours).toBe(40);
    expect(o.overtimeHours).toBe(10);
    expect(o.weeklyPay).toBe(1_100);
  });
  // One 14-hour day: 8 regular, 4 OT, 2 double time.
  it('double time after 12 hours', () => {
    const s = splitHours({ rule: 'california', weekHours: 0, dayHours: 14, days: 1 });
    expect([s.reg.toNumber(), s.ot.toNumber(), s.dt.toNumber()]).toEqual([8, 4, 2]);
  });
  // Six 9-hour days: daily OT 6, regular 48 → 40 regular + 8 weekly OT = 14 OT.
  it('weekly overtime without double counting', () => {
    const o = ca({ dayHours: 9, days: 6 });
    expect(o.regularHours).toBe(40);
    expect(o.overtimeHours).toBe(14);
    expect(o.totalHours).toBe(54);
  });
  // Seven 8-hour days: days 1–6 give 48 regular → 40 + 8 OT; day 7 is all OT → 16 OT.
  it('seventh consecutive day', () => {
    const o = ca({ dayHours: 8, days: 7 });
    expect(o.overtimeHours).toBe(16);
    expect(o.doubleHours).toBe(0);
  });
  // Seventh day of 10 hours: 8 OT + 2 double time on that day.
  it('seventh day beyond 8 hours is double time', () => expect(ca({ dayHours: 10, days: 7 }).doubleHours).toBe(2));
});
