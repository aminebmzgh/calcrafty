import { describe, expect, it } from 'vitest';
import { convertBodyUnits, heightCmOf, kgToLb, lbToKg, weightKgOf } from './body.ts';

describe('unit conversions (NIST exact definitions)', () => {
  it('1 lb = 0.45359237 kg', () => expect(lbToKg(1)).toBe(0.45359237));
  it('100 kg = 220.462 lb', () => expect(kgToLb(100)).toBeCloseTo(220.4623, 4));
  it('5 ft 9 in = 175.26 cm', () => expect(heightCmOf({ units: 'imperial', heightFt: 5, heightIn: 9, heightCm: 0 })).toBe(175.26));
  it('metric passes through', () => expect(weightKgOf({ units: 'metric', weightLb: 0, weightKg: 70 })).toBe(70));
});

describe('switching units', () => {
  const imp = { units: 'imperial' as const, heightFt: 5, heightIn: 9, heightCm: 0, weightLb: 170, weightKg: 0 };
  it('imperial → metric', () => expect(convertBodyUnits('metric', imp)).toEqual({ heightCm: 175.3, weightKg: 77.1 }));
  it('metric → imperial', () => expect(convertBodyUnits('imperial', { ...imp, units: 'metric', heightCm: 180, weightKg: 80 })).toEqual({ heightFt: 5, heightIn: 10.9, weightLb: 176.4 }));
  it('no-op when units match', () => expect(convertBodyUnits('imperial', imp)).toEqual({}));
});
