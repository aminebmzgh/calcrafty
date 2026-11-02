import { describe, expect, it } from 'vitest';
import { cansFor, computePaint, type PaintInput } from './math.ts';
import { D } from '../../lib/math/money.ts';

const room: PaintInput = { length: 14, width: 12, height: 8, doors: 1, windows: 2, coats: 2, coverage: 350, includeCeiling: false, doorArea: 21, windowArea: 15 };

describe('paintable area', () => {
  // Walls: 2 × (14 + 12) × 8 = 416 sq ft; openings 21 + 2 × 15 = 51; paintable 365.
  it('walls minus doors and windows', () => {
    const o = computePaint(room);
    expect(o.grossWallArea).toBe(416);
    expect(o.openingsArea).toBe(51);
    expect(o.wallArea).toBe(365);
    expect(o.totalArea).toBe(730);
  });
  // The ceiling adds 14 × 12 = 168 sq ft per coat.
  it('ceiling', () => {
    const o = computePaint({ ...room, includeCeiling: true });
    expect(o.ceilingArea).toBe(168);
    expect(o.areaPerCoat).toBe(533);
  });
  it('never negative', () => expect(computePaint({ ...room, doors: 40 }).wallArea).toBe(0));
});

describe('gallons to buy', () => {
  // 730 ÷ 350 = 2.0857 gallons → 2 gallons + 1 quart (0.0857 × 4 = 0.34 → 1 quart); 0.16 gal left.
  it('default room', () => {
    const o = computePaint(room);
    expect(o.gallons).toBe(2.09);
    expect(o.buyGallons).toBe(2);
    expect(o.buyQuarts).toBe(1);
    expect(o.leftoverGallons).toBe(0.16);
  });
  // With the ceiling: 1,066 ÷ 350 = 3.0457 → 3 gallons + 1 quart.
  it('with ceiling', () => {
    const o = computePaint({ ...room, includeCeiling: true });
    expect(o.gallons).toBe(3.05);
    expect([o.buyGallons, o.buyQuarts]).toEqual([3, 1]);
  });
  // 2.8 gallons would need 4 quarts → 3 gallons instead.
  it('three or more quarts become a gallon', () => expect(cansFor(D(2.8))).toEqual({ gallons: 3, quarts: 0 }));
  it('2.5 gallons is 2 gallons + 2 quarts', () => expect(cansFor(D(2.5))).toEqual({ gallons: 2, quarts: 2 }));
  it('exact gallons need no quarts', () => expect(cansFor(D(3))).toEqual({ gallons: 3, quarts: 0 }));
  it('nothing to paint', () => expect(computePaint({ ...room, coats: 0 }).buyGallons).toBe(0));
});
