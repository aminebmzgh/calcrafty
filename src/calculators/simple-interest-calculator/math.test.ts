import { describe, expect, it } from 'vitest';
import { computeSimple, yearsOf, type SimpleInput } from './math.ts';

const base: SimpleInput = { solveFor: 'interest', principal: 5_000, rate: 4, time: 3, timeUnit: 'years', interest: 0, dayCount: '365' };

// I = P × r × t (standard simple interest formula).
describe('simple interest reference values', () => {
  // $5,000 at 4% for 3 years: I = 5,000 × 0.04 × 3 = $600; A = $5,600.
  it('$5,000 at 4% for 3 years', () => {
    const o = computeSimple(base);
    expect(o.interest).toBe(600);
    expect(o.total).toBe(5_600);
  });
  // 18 months = 1.5 years: 5,000 × 0.04 × 1.5 = $300.
  it('months', () => expect(computeSimple({ ...base, time: 18, timeUnit: 'months' }).interest).toBe(300));
  // 90 days on $10,000 at 5%: actual/365 = $123.29; actual/360 (banker's rule) = $125.00.
  it('days with actual/365 and actual/360', () => {
    expect(computeSimple({ ...base, principal: 10_000, rate: 5, time: 90, timeUnit: 'days' }).interest).toBe(123.29);
    expect(computeSimple({ ...base, principal: 10_000, rate: 5, time: 90, timeUnit: 'days', dayCount: '360' }).interest).toBe(125);
  });
});

describe('solving for other variables', () => {
  // P = I ÷ (r × t): $300 ÷ (0.06 × 2.5) = $2,000.
  it('principal', () => expect(computeSimple({ ...base, solveFor: 'principal', interest: 300, rate: 6, time: 2.5 }).principal).toBe(2_000));
  // r = I ÷ (P × t): $150 ÷ ($2,000 × 2) = 3.75%.
  it('rate', () => expect(computeSimple({ ...base, solveFor: 'rate', principal: 2_000, interest: 150, time: 2 }).rate).toBe(3.75));
  // t = I ÷ (P × r): $100 ÷ ($1,000 × 0.05) = 2 years.
  it('time', () => expect(computeSimple({ ...base, solveFor: 'time', principal: 1_000, rate: 5, interest: 100 }).years).toBe(2));
  it('impossible inputs are flagged', () => {
    expect(computeSimple({ ...base, solveFor: 'time', rate: 0, interest: 100 }).valid).toBe(false);
    expect(computeSimple({ ...base, solveFor: 'rate', principal: 0, interest: 100 }).valid).toBe(false);
    expect(computeSimple({ ...base, solveFor: 'principal', time: 0, interest: 100 }).valid).toBe(false);
  });
  it('converts time units', () => {
    expect(yearsOf(6, 'months', '365').toNumber()).toBe(0.5);
    expect(yearsOf(73, 'days', '365').toNumber()).toBe(0.2);
  });
  it('zero rate earns nothing', () => expect(computeSimple({ ...base, rate: 0 }).interest).toBe(0));
});
