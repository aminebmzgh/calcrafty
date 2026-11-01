import { describe, expect, it } from 'vitest';
import { computePercent, percentChange, percentOf, whatPercent, type PercentInput } from './math.ts';

const base: PercentInput = { mode: 'of', ofPct: 15, ofValue: 80, part: 30, whole: 120, from: 50, to: 65, price: 120, offPct: 30, base: 200, upPct: 8 };

describe('percentage references', () => {
  it('15% of 80 = 12', () => expect(percentOf(15, 80)).toBe(12));
  it('30 is 25% of 120', () => expect(whatPercent(30, 120)).toBe(25));
  it('50 → 65 is a 30% increase; 80 → 60 is a 25% decrease', () => {
    expect(percentChange(50, 65)).toBe(30);
    expect(percentChange(80, 60)).toBe(-25);
  });
  it('$120 with 30% off is $84, saving $36', () => {
    const o = computePercent({ ...base, mode: 'off' });
    expect(o.result).toBe(84);
    expect(o.difference).toBe(36);
  });
  it('200 increased by 8% is 216', () => expect(computePercent({ ...base, mode: 'increase' }).result).toBe(216));
});

describe('percentage edge cases', () => {
  it('decimal-exact: 0.1% of 0.3 = 0.0003, 33% of 3 = 0.99', () => {
    expect(percentOf(0.1, 0.3)).toBe(0.0003);
    expect(percentOf(33, 3)).toBe(0.99);
  });
  it('division by zero returns an error, not NaN', () => {
    expect(computePercent({ ...base, mode: 'whatPercent', whole: 0 }).error).not.toBeNull();
    expect(computePercent({ ...base, mode: 'change', from: 0 }).result).toBeNull();
  });
  it('change from a negative number uses its absolute value', () => expect(percentChange(-50, -25)).toBe(50));
  it('negative and over-100 percentages', () => {
    expect(percentOf(150, 40)).toBe(60);
    expect(percentOf(-10, 50)).toBe(-5);
  });
});
