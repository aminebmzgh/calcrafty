import { describe, expect, it } from 'vitest';
import { computeStdDev, parseData } from './math.ts';

const sd = (data: string) => computeStdDev({ data, kind: 'sample' });

describe('standard deviation references', () => {
  // Classic textbook set (e.g. Wikipedia "Standard deviation"): 2, 4, 4, 4, 5, 5, 7, 9 → mean 5, σ = 2.
  it('2,4,4,4,5,5,7,9: mean 5, population σ 2, sample s = √(32/7)', () => {
    const o = sd('2, 4, 4, 4, 5, 5, 7, 9');
    expect(o.mean).toBe(5);
    expect(o.populationSd).toBe(2);
    expect(o.sampleSd).toBeCloseTo(Math.sqrt(32 / 7), 12);
  });
  // 1..5 → population variance 2, sample variance 2.5.
  it('1 to 5: variances 2 and 2.5', () => {
    const o = sd('1 2 3 4 5');
    expect(o.populationVariance).toBe(2);
    expect(o.sampleVariance).toBe(2.5);
    expect(o.sampleSd).toBeCloseTo(1.58113883008, 10);
  });
  // NIST StRD "Lew" style check with decimals: 0.1, 0.2, 0.3 → mean 0.2, s = 0.1 exactly.
  it('decimals are exact: 0.1, 0.2, 0.3 → s = 0.1', () => {
    const o = sd('0.1\n0.2\n0.3');
    expect(o.mean).toBe(0.2);
    expect(o.sampleSd).toBe(0.1);
  });
  // Standard error = s / √n: for 1..5, 1.5811 / 2.2361 = 0.7071.
  it('standard error of the mean', () => expect(sd('1 2 3 4 5').standardError).toBeCloseTo(0.70710678, 7));
});

describe('edge cases', () => {
  it('single value: σ = 0, sample undefined', () => {
    const o = sd('42');
    expect(o.populationSd).toBe(0);
    expect(o.sampleSd).toBeNull();
  });
  it('empty input is an error, not NaN', () => expect(sd('   ').error).not.toBeNull());
  it('ignores non-numbers and reports them', () => {
    const o = sd('3, x, 5; 7');
    expect(o.values).toEqual([3, 5, 7]);
    expect(o.error).toContain('x');
  });
  it('negative numbers, median and range', () => {
    const o = sd('−3 -1 4 10');
    expect(o.values).toEqual([-3, -1, 4, 10]);
    expect(o.median).toBe(1.5);
    expect([o.min, o.max]).toEqual([-3, 10]);
  });
  it('large values keep precision (shifted data has the same SD)', () => {
    expect(sd('1000000001 1000000002 1000000003').sampleSd).toBe(1);
  });
  it('parseData splits on commas, spaces, semicolons and new lines', () => expect(parseData('1,2 3;4\n5').values).toEqual([1, 2, 3, 4, 5]));
});
