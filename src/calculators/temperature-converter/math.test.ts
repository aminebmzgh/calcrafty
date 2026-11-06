import { describe, expect, it } from 'vitest';
import { computeTemperature, convertDifference, convertTemperature, referenceTable } from './math.ts';

describe('fixed points', () => {
  it('water freezes: 0 °C = 32 °F = 273.15 K = 491.67 °R', () => {
    expect(convertTemperature(0, 'C', 'F')).toBe(32);
    expect(convertTemperature(0, 'C', 'K')).toBe(273.15);
    expect(convertTemperature(0, 'C', 'R')).toBe(491.67);
  });
  it('water boils at sea level: 100 °C = 212 °F', () => expect(convertTemperature(100, 'C', 'F')).toBe(212));
  it('−40 is the same in °C and °F', () => expect(convertTemperature(-40, 'F', 'C')).toBe(-40));
  it('absolute zero: 0 K = −273.15 °C = −459.67 °F', () => {
    expect(convertTemperature(0, 'K', 'C')).toBe(-273.15);
    expect(convertTemperature(0, 'K', 'F')).toBe(-459.67);
  });
  // (98.6 − 32) × 5/9 = 37 exactly.
  it('body temperature: 98.6 °F = 37 °C', () => expect(convertTemperature(98.6, 'F', 'C')).toBe(37));
  // 350 °F oven: (350 − 32) × 5/9 = 176.666… °C.
  it('350 °F = 176.666666667 °C', () => expect(convertTemperature(350, 'F', 'C')).toBe(176.666666667));
  // The intermediate is rounded to 12 significant digits, so the round trip is exact to ~1e-9.
  it('round trip', () => expect(convertTemperature(convertTemperature(72, 'F', 'K'), 'K', 'F')).toBeCloseTo(72, 6));
});

describe('differences', () => {
  it('a 10 °C rise is an 18 °F rise', () => expect(convertDifference(10, 'C', 'F')).toBe(18));
  it('1 K difference = 1 °C difference', () => expect(convertDifference(1, 'K', 'C')).toBe(1));
  it('9 °F difference = 5 K', () => expect(convertDifference(9, 'F', 'K')).toBe(5));
});

describe('computeTemperature', () => {
  it('flags temperatures below absolute zero', () => {
    expect(computeTemperature({ value: -500, from: 'F', to: 'C' }).belowAbsoluteZero).toBe(true);
    expect(computeTemperature({ value: -459.67, from: 'F', to: 'C' }).belowAbsoluteZero).toBe(false);
  });
  it('every unit', () => {
    const o = computeTemperature({ value: 20, from: 'C', to: 'F' });
    expect(o.all).toEqual([
      { unit: 'C', value: 20 },
      { unit: 'F', value: 68 },
      { unit: 'K', value: 293.15 },
      { unit: 'R', value: 527.67 },
    ]);
  });
});

describe('reference table', () => {
  it('converts each point', () => {
    const t = referenceTable();
    expect(t.find((r) => r.label === 'Normal body temperature')).toEqual({ label: 'Normal body temperature', c: 37, f: 98.6, k: 310.15 });
    expect(t.find((r) => r.label === 'Moderate oven')!.f).toBe(356);
  });
});
