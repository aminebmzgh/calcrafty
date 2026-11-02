import { describe, expect, it } from 'vitest';
import { bagsFor, computeConcrete, pieceCubicFeet, type ConcreteInput } from './math.ts';
import { D } from '../../lib/math/money.ts';

const slab: ConcreteInput = { shape: 'slab', length: 10, width: 10, thickness: 4, footingWidth: 16, footingDepth: 8, diameter: 12, height: 4, quantity: 1, waste: 10, bagSize: '80' };

describe('concrete volume', () => {
  // 10 ft × 10 ft × 4/12 ft = 33.33 ft³ = 1.23 yd³ before waste.
  it('slab', () => {
    const o = computeConcrete(slab);
    expect(o.netCubicFeet).toBe(33.33);
    expect(o.netCubicYards).toBe(1.23);
  });
  // +10%: 36.67 ft³ = 1.36 yd³ = 1.04 m³ (× 0.028316846592).
  it('waste allowance and metric', () => {
    const o = computeConcrete(slab);
    expect(o.cubicFeet).toBe(36.67);
    expect(o.cubicYards).toBe(1.36);
    expect(o.cubicMeters).toBe(1.04);
  });
  // Ready-mix: 1.358 yd³ rounds up to the next quarter yard, 1.5.
  it('ready-mix order in quarter yards', () => expect(computeConcrete(slab).orderYards).toBe(1.5));
  // Continuous footing 20 ft long, 16 in wide, 8 in deep: 20 × 1.3333 × 0.6667 = 17.78 ft³.
  it('footing', () => expect(computeConcrete({ ...slab, shape: 'footing', length: 20, waste: 0 }).cubicFeet).toBe(17.78));
  // Round column 12 in across, 4 ft tall: π × 0.5² × 4 = 3.14 ft³.
  it('column', () => expect(computeConcrete({ ...slab, shape: 'column', waste: 0 }).cubicFeet).toBe(3.14));
  // Quantity multiplies: four columns are 12.57 ft³.
  it('quantity', () => expect(computeConcrete({ ...slab, shape: 'column', waste: 0, quantity: 4 }).cubicFeet).toBe(12.57));
});

describe('bags', () => {
  // 36.667 ft³ ÷ 0.60 = 61.1 → 62 bags of 80 lb; ÷ 0.45 = 81.5 → 82 of 60 lb; ÷ 0.30 = 122.2 → 123 of 40 lb.
  it('by size, rounded up', () => {
    const o = computeConcrete(slab);
    expect(o.bagsBySize).toEqual({ '40': 123, '60': 82, '80': 62 });
    expect(o.bags).toBe(62);
    expect(o.bagWeight).toBe(4_960);
  });
  // Exactly 6 ft³ is exactly 10 bags of 80 lb, not 11.
  it('exact multiples are not rounded up', () => expect(bagsFor(D(6), '80')).toBe(10));
  it('nothing for zero volume', () => expect(computeConcrete({ ...slab, quantity: 0 }).bags).toBe(0));
  it('piece volume ignores waste', () => expect(pieceCubicFeet(slab).toDecimalPlaces(4).toNumber()).toBe(33.3333));
});
