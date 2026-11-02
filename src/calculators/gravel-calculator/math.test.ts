import { describe, expect, it } from 'vitest';
import { computeGravel, type GravelInput } from './math.ts';

const patio: GravelInput = { length: 20, width: 10, depth: 3, extra: 10, density: 1.4, bagVolume: 0.5 };

describe('gravel', () => {
  // 20 × 10 × 3/12 = 50 ft³ = 1.85 yd³; +10% = 55 ft³ = 2.04 yd³ = 1.56 m³.
  it('volume', () => {
    const o = computeGravel(patio);
    expect(o.area).toBe(200);
    expect(o.netCubicYards).toBe(1.85);
    expect(o.cubicFeet).toBe(55);
    expect(o.cubicYards).toBe(2.04);
    expect(o.cubicMeters).toBe(1.56);
  });
  // 2.037 yd³ × 1.4 = 2.85 tons = 5,704 lb; 55 ÷ 0.5 = 110 bags.
  it('weight and bags', () => {
    const o = computeGravel(patio);
    expect(o.tons).toBe(2.85);
    expect(o.pounds).toBe(5_704);
    expect(o.bags).toBe(110);
  });
  // A 4-inch driveway base 50 × 12 ft with no extra: 200 ft³ = 7.41 yd³ × 1.5 = 11.11 tons.
  it('driveway', () => {
    const o = computeGravel({ ...patio, length: 50, width: 12, depth: 4, extra: 0, density: 1.5 });
    expect(o.cubicYards).toBe(7.41);
    expect(o.tons).toBe(11.11);
  });
  it('nothing for zero depth', () => expect(computeGravel({ ...patio, depth: 0 }).bags).toBe(0));
});
