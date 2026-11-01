import { describe, expect, it } from 'vitest';
import { computeFraction, fmt, mixedLabel, resultLabel, type FractionInput } from './math.ts';

const f = (w1: number, n1: number, d1: number, op: FractionInput['op'], w2: number, n2: number, d2: number) => computeFraction({ w1, n1, d1, op, w2, n2, d2 });

describe('fraction arithmetic references', () => {
  it('1/2 + 1/3 = 5/6 (LCD 6)', () => {
    const o = f(0, 1, 2, '+', 0, 1, 3);
    expect(fmt(o.result)).toBe('5/6');
    expect(o.lcd).toBe(6n);
  });
  it('3/4 − 1/6 = 7/12', () => expect(fmt(f(0, 3, 4, '-', 0, 1, 6).result)).toBe('7/12'));
  it('2/3 × 9/4 = 3/2 = 1 1/2', () => {
    const o = f(0, 2, 3, '*', 0, 9, 4);
    expect(fmt(o.result)).toBe('3/2');
    expect(mixedLabel(o.mixed)).toBe('1 1/2');
    expect(o.gcd).toBe(6n);
  });
  it('5/8 ÷ 1/4 = 5/2', () => expect(fmt(f(0, 5, 8, '/', 0, 1, 4).result)).toBe('5/2'));
  it('1 1/2 + 2 2/3 = 4 1/6', () => expect(mixedLabel(f(1, 1, 2, '+', 2, 2, 3).mixed)).toBe('4 1/6'));
});

describe('fraction edge cases', () => {
  it('negative mixed numbers: −1 1/2 + 1/4 = −1 1/4', () => expect(mixedLabel(f(-1, 1, 2, '+', 0, 1, 4).mixed)).toBe('−1 1/4'));
  it('results that are whole numbers', () => expect(mixedLabel(f(0, 1, 2, '+', 0, 1, 2).mixed)).toBe('1'));
  it('zero denominators and division by zero are errors', () => {
    expect(f(0, 1, 0, '+', 0, 1, 2).error).not.toBeNull();
    expect(f(0, 1, 2, '/', 0, 0, 5).error).not.toBeNull();
  });
  it('negative denominators normalize', () => expect(fmt(f(0, 1, -2, '+', 0, 0, 1).result)).toBe('−1/2'));
  it('very large values stay exact', () => expect(fmt(f(0, 999_999_937, 1_000_000_007, '*', 0, 1_000_000_007, 999_999_937).result)).toBe('1/1'));
  it('result label never mangles denominators', () => {
    expect(resultLabel(f(0, 1, 4, '+', 0, 1, 6).result)).toBe('5/12');
    expect(resultLabel(f(0, 1, 2, '+', 0, 1, 2).result)).toBe('1');
  });
  it('decimal value', () => expect(f(0, 1, 3, '+', 0, 1, 6).decimal).toBe(0.5));
});
