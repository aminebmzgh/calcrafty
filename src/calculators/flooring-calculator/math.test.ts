import { describe, expect, it } from 'vitest';
import { computeFlooring, type FlooringInput } from './math.ts';

const room: FlooringInput = { length: 15, width: 12, extraArea: 0, waste: 10, boxCoverage: 20, price: 3.5 };

describe('flooring', () => {
  // 15 × 12 = 180 sq ft; +10% = 198; ÷ 20 = 9.9 → 10 boxes = 200 sq ft; × $3.50 = $700.
  it('default room', () => {
    const o = computeFlooring(room);
    expect(o.area).toBe(180);
    expect(o.areaWithWaste).toBe(198);
    expect(o.boxes).toBe(10);
    expect(o.purchasedArea).toBe(200);
    expect(o.cost).toBe(700);
    // $700 ÷ 180 sq ft of floor = $3.89 per sq ft covered.
    expect(o.costPerFloorSqFt).toBe(3.89);
  });
  // A 6 sq ft closet: 186 × 1.1 = 204.6 → 11 boxes.
  it('extra area', () => expect(computeFlooring({ ...room, extraArea: 6 }).boxes).toBe(11));
  // Diagonal or herringbone layouts: 15% waste → 207 sq ft → 11 boxes.
  it('higher waste for diagonal layouts', () => {
    const o = computeFlooring({ ...room, waste: 15 });
    expect(o.areaWithWaste).toBe(207);
    expect(o.boxes).toBe(11);
  });
  // 200 sq ft exactly fills 10 boxes, not 11.
  it('exact fits are not rounded up', () => expect(computeFlooring({ ...room, length: 20, width: 10, waste: 0 }).boxes).toBe(10));
  it('empty room', () => expect(computeFlooring({ ...room, length: 0 }).boxes).toBe(0));
});
