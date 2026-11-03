import { describe, expect, it } from 'vitest';
import { computeCarCo2, tonsFor, type CarCo2Input } from './math.ts';

const base: CarCo2Input = { milesPerYear: 11_500, mpg: 25, fuel: 'gasoline', fuelPrice: 3.2 };

describe('car CO2', () => {
  // EPA check: 11,500 mi ÷ 22.2 mpg = 518.0 gal × 8,887 g = 4.60 t, the EPA "typical vehicle" figure.
  it('reproduces the EPA typical vehicle', () => expect(tonsFor(11_500, 22.2, 'gasoline').toDecimalPlaces(2).toNumber()).toBe(4.6));
  // 11,500 ÷ 25 = 460 gal × 8,887 g = 4,088 kg = 4.09 t; 355 g per mile; 89% of typical.
  it('default car', () => {
    const o = computeCarCo2(base);
    expect(o.gallons).toBe(460);
    expect(o.kg).toBe(4_088);
    expect(o.tons).toBe(4.09);
    expect(o.gramsPerMile).toBe(355);
    expect(o.vsTypical).toBe(89);
    expect(o.kgPerMonth).toBe(341);
  });
  // 4,088.02 kg ÷ 0.45359237 = 9,013 lb; 460 gal × $3.20 = $1,472.
  it('pounds and fuel cost', () => {
    const o = computeCarCo2(base);
    expect(o.pounds).toBe(9_013);
    expect(o.fuelCost).toBe(1_472);
  });
  // At 35 mpg: 328.6 gal × 8,887 = 2.92 t.
  it('ten more mpg', () => expect(computeCarCo2(base).tonsAtPlus10Mpg).toBe(2.92));
  // Diesel at 30 mpg: 383.3 gal × 10,180 g = 3.90 t.
  it('diesel', () => expect(computeCarCo2({ ...base, fuel: 'diesel', mpg: 30 }).tons).toBe(3.9));
  it('zero mpg is invalid', () => expect(computeCarCo2({ ...base, mpg: 0 }).valid).toBe(false));
});
