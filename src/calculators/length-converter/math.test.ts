import { describe, expect, it } from 'vitest';
import { computeLength, convertLength } from './math.ts';

describe('exact length conversions', () => {
  it('6 ft = 1.8288 m', () => expect(convertLength(6, 'ft', 'm')).toBe(1.8288));
  it('1 in = 2.54 cm', () => expect(convertLength(1, 'in', 'cm')).toBe(2.54));
  it('1 mi = 1.609344 km', () => expect(convertLength(1, 'mi', 'km')).toBe(1.609344));
  it('1 m = 3.28083989501 ft', () => expect(convertLength(1, 'm', 'ft')).toBe(3.28083989501));
  it('1 nautical mile = 1.15077944802 mi', () => expect(convertLength(1, 'nmi', 'mi')).toBe(1.15077944802));
  it('1 km = 0.621371192237 mi', () => expect(convertLength(1, 'km', 'mi')).toBe(0.621371192237));
  it('100 yd = 91.44 m', () => expect(convertLength(100, 'yd', 'm')).toBe(91.44));
});

describe('computeLength', () => {
  // 1.8 m = 70.866 in = 5 ft 10.87 in.
  it('feet and inches', () => expect(computeLength({ value: 1.8, from: 'm', to: 'ft' }).feetInches).toEqual({ feet: 5, inches: 10.87 }));
  // 6 ft exactly is 6 ft 0 in, not 5 ft 12 in.
  it('whole feet', () => expect(computeLength({ value: 6, from: 'ft', to: 'm' }).feetInches).toEqual({ feet: 6, inches: 0 }));
  it('every unit', () => {
    const o = computeLength({ value: 1, from: 'km', to: 'mi' });
    expect(o.all.find((r) => r.unit === 'm')!.value).toBe(1000);
    expect(o.all.find((r) => r.unit === 'ft')!.value).toBe(3280.83989501);
    expect(o.factor).toBe(0.621371192237);
  });
});
