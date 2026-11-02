import { describe, expect, it } from 'vitest';
import { computeRoofing, pitchFactorOf, type RoofingInput } from './math.ts';

const house: RoofingInput = { length: 40, width: 30, overhang: 12, pitch: 6, waste: 10, bundlesPerSquare: 3 };

describe('pitch factor', () => {
  // √(1 + (rise/12)²): 4/12 → 1.0541, 6/12 → 1.1180, 12/12 → 1.4142 (√2).
  it('standard pitches', () => {
    expect(pitchFactorOf(4).toDecimalPlaces(4).toNumber()).toBe(1.0541);
    expect(pitchFactorOf(6).toDecimalPlaces(4).toNumber()).toBe(1.118);
    expect(pitchFactorOf(12).toDecimalPlaces(4).toNumber()).toBe(1.4142);
  });
  it('flat roof', () => expect(pitchFactorOf(0).toNumber()).toBe(1));
});

describe('roof area and shingles', () => {
  // (40 + 2) × (30 + 2) = 1,344 sq ft × 1.118034 = 1,502.64 sq ft = 15.03 squares.
  it('area', () => {
    const o = computeRoofing(house);
    expect(o.planArea).toBe(1_344);
    expect(o.roofArea).toBe(1_502.64);
    expect(o.squares).toBe(15.03);
    expect(o.pitchDegrees).toBe(26.6);
  });
  // +10% = 16.53 squares × 3 = 49.6 → 50 bundles.
  it('waste and bundles', () => {
    const o = computeRoofing(house);
    expect(o.squaresWithWaste).toBe(16.53);
    expect(o.bundles).toBe(50);
  });
  // No overhang, 12/12 pitch: 1,200 × 1.41421 = 1,697.06 sq ft.
  it('steep roof, no overhang', () => expect(computeRoofing({ ...house, overhang: 0, pitch: 12 }).roofArea).toBe(1_697.06));
  it('nothing for zero area', () => expect(computeRoofing({ ...house, length: 0, overhang: 0 }).bundles).toBe(0));
});
