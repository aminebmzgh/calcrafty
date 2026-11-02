import { describe, expect, it } from 'vitest';
import { computeMmm, medianOf, modesOf } from './math.ts';

describe('mean, median, mode (textbook examples)', () => {
  // 2, 4, 4, 5, 7, 9: sum 31, mean 31 ÷ 6 = 5.1666666667, median (4 + 5) ÷ 2 = 4.5, mode 4, range 7.
  it('six values', () => {
    const o = computeMmm({ data: '2, 4, 4, 5, 7, 9' });
    expect(o.count).toBe(6);
    expect(o.sum).toBe(31);
    expect(o.mean).toBe(5.1666666667);
    expect(o.median).toBe(4.5);
    expect(o.modes).toEqual([4]);
    expect(o.range).toBe(7);
  });
  // Odd count: median is the middle value of 3, 1, 4, 1, 5 → sorted 1, 1, 3, 4, 5 → 3.
  it('odd count median', () => expect(computeMmm({ data: '3 1 4 1 5' }).median).toBe(3));
  it('two modes (bimodal)', () => expect(modesOf([1, 2, 2, 3, 3, 4]).modes).toEqual([2, 3]));
  it('no mode when every value is unique', () => expect(modesOf([1, 2, 3]).modes).toEqual([]));
  it('exact decimals: 0.1 + 0.2', () => expect(computeMmm({ data: '0.1 0.2' }).sum).toBe(0.3));
  it('negative values', () => {
    const o = computeMmm({ data: '-5, 0, 5, 10' });
    expect(o.mean).toBe(2.5);
    expect(o.median).toBe(2.5);
    expect(o.min).toBe(-5);
  });
  it('a single value', () => {
    const o = computeMmm({ data: '42' });
    expect([o.mean, o.median, o.range]).toEqual([42, 42, 0]);
  });
  it('empty input', () => expect(computeMmm({ data: '' }).count).toBe(0));
  it('median of an empty list', () => expect(medianOf([])).toBe(0));
});
