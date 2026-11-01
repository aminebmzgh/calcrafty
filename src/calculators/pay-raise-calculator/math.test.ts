import { describe, expect, it } from 'vitest';
import { computeRaise, convertRaise, periodsPerYear, type RaiseInput } from './math.ts';

const base: RaiseInput = { currentPay: 40_000, period: 'year', hoursPerWeek: 40, raise: 4, raiseMode: 'percent', inflation: 0 };

describe('pay raise reference values', () => {
  // 4% on $40,000: $40,000 + $1,600 = $41,600.
  it('4% raise on $40,000 is $41,600', () => {
    const o = computeRaise(base);
    expect(o.newPay).toBe(41_600);
    expect(o.annualIncrease).toBe(1_600);
  });
  // $40,000 → $42,000 is (42,000 − 40,000) ÷ 40,000 = 5%.
  it('a $2,000 raise on $40,000 is 5%', () => expect(computeRaise({ ...base, raise: 2_000, raiseMode: 'usd' }).raisePct).toBe(5));
  // Hourly: $20 + $1.50 = $21.50 (7.5%); × 2,080 = $44,720 a year, $3,120 more.
  it('hourly raise annualized', () => {
    const o = computeRaise({ ...base, currentPay: 20, period: 'hour', raise: 1.5, raiseMode: 'usd' });
    expect(o.newPay).toBe(21.5);
    expect(o.raisePct).toBe(7.5);
    expect(o.newAnnual).toBe(44_720);
    expect(o.annualIncrease).toBe(3_120);
  });
  // $60,000 with a 4% raise: $2,400 a year, $200 a month, $92.31 per biweekly paycheck.
  it('per-paycheck difference', () => {
    const o = computeRaise({ ...base, currentPay: 60_000 });
    expect(o.monthlyIncrease).toBe(200);
    expect(o.biweeklyIncrease).toBe(92.31);
  });
});

describe('real raise after inflation (Fisher relation)', () => {
  // (1.05 ÷ 1.03) − 1 = 1.94%.
  it('5% raise with 3% inflation is a 1.94% real raise', () => expect(computeRaise({ ...base, raise: 5, inflation: 3 }).realRaisePct).toBe(1.94));
  // (1.02 ÷ 1.04) − 1 = −1.92%: a pay cut in real terms.
  it('a raise below inflation is a real pay cut', () => expect(computeRaise({ ...base, raise: 2, inflation: 4 }).realRaisePct).toBe(-1.92));
  // $41,600 ÷ 1.03 − $40,000 = $388.35 in today's dollars.
  it('real annual increase', () => expect(computeRaise({ ...base, inflation: 3 }).realAnnualIncrease).toBe(388.35));
  // $60,000 with a 4% raise and 3% inflation: $1,800 keeps up with prices, $600 is ahead.
  it('splits the raise into keeping up and getting ahead', () => {
    const o = computeRaise({ ...base, currentPay: 60_000, inflation: 3 });
    expect(o.keepUpPortion).toBe(1_800);
    expect(o.aheadPortion).toBe(600);
    const low = computeRaise({ ...base, raise: 2, inflation: 4 });
    expect(low.keepUpPortion).toBe(800);
    expect(low.aheadPortion).toBe(0);
  });
  it('no inflation means the real raise equals the raise', () => expect(computeRaise(base).realRaisePct).toBe(4));
});

describe('conversions and edge cases', () => {
  it('converts the raise between % and $', () => {
    expect(convertRaise(60_000, 4, 'percent', 'usd')).toBe(2_400);
    expect(convertRaise(60_000, 2_400, 'usd', 'percent')).toBe(4);
    expect(convertRaise(0, 2_400, 'usd', 'percent')).toBe(0);
  });
  it('periods per year', () => {
    expect(periodsPerYear('hour', 40)).toBe(2_080);
    expect(periodsPerYear('biweek', 40)).toBe(26);
    expect(periodsPerYear('month', 40)).toBe(12);
  });
  it('zero current pay', () => expect(computeRaise({ ...base, currentPay: 0 }).raisePct).toBe(0));
  it('a pay cut (negative raise)', () => expect(computeRaise({ ...base, raise: -5 }).newPay).toBe(38_000));
});
