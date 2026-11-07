import { describe, expect, it } from 'vitest';
import { computePythagoras, radical, simplifyRoot, type PythagorasInput } from './math.ts';

const base: PythagorasInput = { solve: 'c', a: 7, b: 10, c: 13 };

describe('pythagorean theorem', () => {
  // 3-4-5: c = √25 = 5; area 6; perimeter 12; angle A = atan(3/4) = 36.869898°.
  it('3-4-5 triangle', () => {
    const o = computePythagoras({ ...base, a: 3, b: 4 });
    expect(o.c).toBe(5);
    expect(o.exact).toBe('5');
    expect(o.triple).toBe(true);
    expect(o.area).toBe(6);
    expect(o.perimeter).toBe(12);
    expect(o.angleA).toBeCloseTo(36.869898, 5);
    expect(o.angleB).toBeCloseTo(53.130102, 5);
  });
  // a = 7, b = 10: c = √149 = 12.2065556157.
  it('hypotenuse that is not a whole number', () => {
    const o = computePythagoras(base);
    expect(o.squared).toBe(149);
    expect(o.c).toBeCloseTo(12.2065556157, 9);
    expect(o.exact).toBe('√149');
    expect(o.triple).toBe(false);
    expect(o.area).toBe(35);
    expect(o.angleA).toBeCloseTo(34.99202, 5);
  });
  // Missing leg: c = 10, b = 6 → a = √(100 − 36) = 8.
  it('solve for leg a', () => expect(computePythagoras({ solve: 'a', a: 0, b: 6, c: 10 }).a).toBe(8));
  // c = 13, a = 5 → b = 12.
  it('solve for leg b', () => expect(computePythagoras({ solve: 'b', a: 5, b: 0, c: 13 }).b).toBe(12));
  // A 20 ft ladder with its foot 5 ft from the wall reaches √(400 − 25) = √375 = 5√15 = 19.3649 ft.
  it('ladder against a wall', () => {
    const o = computePythagoras({ solve: 'a', a: 0, b: 5, c: 20 });
    expect(o.a).toBeCloseTo(19.364916731, 8);
    expect(o.exact).toBe('5√15');
    expect(o.angleA).toBeCloseTo(75.522488, 5);
  });
  // Isosceles right triangle: legs 5 → c = 5√2 = 7.0710678119.
  it('isosceles right triangle', () => {
    const o = computePythagoras({ ...base, a: 5, b: 5 });
    expect(o.c).toBeCloseTo(7.0710678119, 9);
    expect(o.exact).toBe('5√2');
    expect(o.angleA).toBe(45);
  });
  it('decimal inputs have no exact radical form', () => {
    const o = computePythagoras({ ...base, a: 1.5, b: 2 });
    expect(o.c).toBe(2.5);
    expect(o.exact).toBeNull();
  });
  it('simplifies square roots', () => {
    expect(simplifyRoot(72)).toEqual([6, 2]);
    expect(radical(50)).toBe('5√2');
    expect(radical(149)).toBe('√149');
    expect(radical(144)).toBe('12');
  });
  it('rejects impossible triangles', () => {
    expect(computePythagoras({ solve: 'a', a: 0, b: 12, c: 10 }).valid).toBe(false);
    expect(computePythagoras({ solve: 'b', a: 10, b: 0, c: 10 }).valid).toBe(false);
    expect(computePythagoras({ ...base, a: 0 }).valid).toBe(false);
  });
});
