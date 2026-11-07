import { describe, expect, it } from 'vitest';
import { computeFuel, mpgToL100, switchUnits, type FuelInput } from './math.ts';

const base: FuelInput = { units: 'us', miles: 350, mpg: 28, pricePerGallon: 3.5, km: 500, l100km: 7, pricePerLitre: 1.85, roundTrip: false, people: 1, fuel: 'gasoline' };

describe('fuel cost', () => {
  // 350 mi ÷ 28 mpg = 12.5 gal × $3.50 = $43.75; CO₂ 12.5 × 8,887 g = 111.1 kg = 244.9 lb (EPA factor).
  it('one-way trip', () => {
    const o = computeFuel(base);
    expect(o.fuelUsed).toBe(12.5);
    expect(o.cost).toBe(43.75);
    expect(o.costPerUnit).toBe(0.125);
    expect(o.co2Kg).toBe(111.1);
    expect(o.co2Lb).toBe(244.9);
  });
  // Round trip for three: 25 gal = $87.50; $29.1667 each, rounded up so the fuel is covered: $29.17.
  it('round trip split three ways', () => {
    const o = computeFuel({ ...base, roundTrip: true, people: 3 });
    expect(o.distance).toBe(700);
    expect(o.cost).toBe(87.5);
    expect(o.perPerson).toBe(29.17);
  });
  // A month of commuting: 1,200 mi at 25 mpg and $3.25 = 48 gal = $156.
  it('monthly commute', () => expect(computeFuel({ ...base, miles: 1200, mpg: 25, pricePerGallon: 3.25 }).cost).toBe(156));
  // Metric: 500 km at 7 L/100 km = 35 L × 1.85 = 64.75.
  it('metric units', () => {
    const o = computeFuel({ ...base, units: 'metric' });
    expect(o.fuelUsed).toBe(35);
    expect(o.cost).toBe(64.75);
  });
  // 100 × 3.785411784 ÷ (1.609344 × 30) = 7.8405 L/100 km.
  it('mpg to L/100 km', () => {
    expect(mpgToL100(30)).toBe(7.8405);
    expect(switchUnits('metric', base)).toEqual({ km: 563.3, l100km: 8.4, pricePerLitre: 0.925 });
  });
  // Diesel: 10 gal × 10,180 g = 101.8 kg.
  it('diesel CO₂ factor', () => expect(computeFuel({ ...base, miles: 300, mpg: 30, fuel: 'diesel' }).co2Kg).toBe(101.8));
  it('table of fuel economies', () => {
    const row = computeFuel(base).table.find((r) => r.economy === 35)!;
    // 350 ÷ 35 = 10 gal × $3.50 = $35.
    expect(row).toEqual({ economy: 35, fuelUsed: 10, cost: 35 });
  });
  it('zero fuel economy gives no cost, not infinity', () => {
    const o = computeFuel({ ...base, mpg: 0 });
    expect(o.cost).toBe(0);
    expect(Number.isFinite(o.costPerUnit)).toBe(true);
  });
});
