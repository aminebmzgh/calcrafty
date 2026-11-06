import { describe, expect, it } from 'vitest';
import { computeSquareFootage, type SquareFootageInput } from './math.ts';

const base: SquareFootageInput = { shape: 'rectangle', unit: 'ft', length: 12, width: 15, length2: 0, width2: 0, diameter: 0, base: 0, height: 0, count: 1, wastePct: 0, pricePerSqFt: 0 };

describe('shapes', () => {
  it('12 × 15 ft rectangle = 180 sq ft = 20 sq yd', () => {
    const o = computeSquareFootage(base);
    expect(o.sqft).toBe(180);
    expect(o.sqyd).toBe(20);
    expect(o.sqin).toBe(25_920);
    // 180 × 0.09290304 = 16.7225472 m².
    expect(o.sqm).toBe(16.7225472);
  });
  // L-shape: 20 × 12 plus 10 × 8 = 240 + 80 = 320 sq ft.
  it('L-shaped room', () => expect(computeSquareFootage({ ...base, shape: 'lshape', length: 20, width: 12, length2: 10, width2: 8 }).sqft).toBe(320));
  // Circle 10 ft across: π × 5² = 78.5398163397 sq ft.
  it('circle', () => expect(computeSquareFootage({ ...base, shape: 'circle', diameter: 10 }).sqft).toBeCloseTo(78.5398163397, 9));
  // Triangle: 10 × 6 ÷ 2 = 30 sq ft.
  it('triangle', () => expect(computeSquareFootage({ ...base, shape: 'triangle', base: 10, height: 6 }).sqft).toBe(30));
});

describe('units', () => {
  it('144 × 180 in = 180 sq ft', () => expect(computeSquareFootage({ ...base, unit: 'in', length: 144, width: 180 }).sqft).toBe(180));
  it('4 × 5 yd = 180 sq ft', () => expect(computeSquareFootage({ ...base, unit: 'yd', length: 4, width: 5 }).sqft).toBe(180));
  // 1 m² = 1 ÷ 0.09290304 = 10.7639104167 sq ft.
  it('1 × 1 m = 10.7639104167 sq ft', () => expect(computeSquareFootage({ ...base, unit: 'm', length: 1, width: 1 }).sqft).toBe(10.7639104167));
  it('100 × 100 cm = 1 m²', () => expect(computeSquareFootage({ ...base, unit: 'cm', length: 100, width: 100 }).sqm).toBe(1));
  // 660 × 66 ft (a furlong by a chain) is exactly one acre, 43,560 sq ft.
  it('acres', () => expect(computeSquareFootage({ ...base, length: 660, width: 66 }).acres).toBe(1));
});

describe('count, waste and cost', () => {
  it('count multiplies', () => {
    const o = computeSquareFootage({ ...base, count: 3 });
    expect(o.sqft).toBe(540);
    expect(o.eachSqft).toBe(180);
  });
  // 180 sq ft + 10% = 198 sq ft; at $4.50 = $891.00.
  it('waste and price', () => {
    const o = computeSquareFootage({ ...base, wastePct: 10, pricePerSqFt: 4.5 });
    expect(o.withWaste).toBe(198);
    expect(o.cost).toBe(891);
  });
  it('negative or empty dimensions count as zero', () => expect(computeSquareFootage({ ...base, length: -5 }).sqft).toBe(0));
  it('equivalent square', () => expect(computeSquareFootage({ ...base, length: 20, width: 20 }).squareSide).toBe(20));
});
