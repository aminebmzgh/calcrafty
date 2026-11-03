/**
 * Tailpipe CO2 from driving: gallons of fuel = miles ÷ mpg, and CO2 = gallons × the EPA emission
 * factor (8,887 g per gallon of gasoline, 10,180 g per gallon of diesel). Compared with the EPA's
 * typical passenger vehicle: about 4.6 metric tons a year (22.2 mpg, 11,500 miles).
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type Fuel = 'gasoline' | 'diesel';

export interface CarCo2Input extends Record<string, unknown> {
  milesPerYear: number;
  mpg: number;
  fuel: Fuel;
  /** Fuel price, $ per gallon (for the cost figure). */
  fuelPrice: number;
}

export interface CarCo2Output {
  valid: boolean;
  gallons: number;
  /** Metric tons of CO2 a year. */
  tons: number;
  kg: number;
  /** Pounds of CO2 a year. */
  pounds: number;
  gramsPerMile: number;
  /** Tons a month. */
  kgPerMonth: number;
  fuelCost: number;
  /** Compared with the EPA typical vehicle, % (100 = the same). */
  vsTypical: number;
  /** CO2 at +10 mpg, metric tons, for the "better fuel economy" comparison. */
  tonsAtPlus10Mpg: number;
}

export const GRAMS_PER_GALLON: Record<Fuel, number> = { gasoline: 8_887, diesel: 10_180 };
export const TYPICAL_TONS = 4.6;
const LB_PER_KG = D(1).div(0.45359237);

export function tonsFor(miles: number, mpg: number, fuel: Fuel): Decimal {
  if (mpg <= 0) return D(0);
  return D(Math.max(0, miles)).div(mpg).times(GRAMS_PER_GALLON[fuel]).div(1_000_000);
}

export function computeCarCo2(i: CarCo2Input): CarCo2Output {
  const miles = Math.max(0, i.milesPerYear || 0);
  const mpg = Math.max(0, i.mpg || 0);
  if (mpg <= 0) return { valid: false, gallons: 0, tons: 0, kg: 0, pounds: 0, gramsPerMile: 0, kgPerMonth: 0, fuelCost: 0, vsTypical: 0, tonsAtPlus10Mpg: 0 };
  const gallons = D(miles).div(mpg);
  const tons = tonsFor(miles, mpg, i.fuel);
  const kg = tons.times(1000);
  return {
    valid: true,
    gallons: gallons.toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber(),
    tons: tons.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    kg: kg.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    pounds: kg.times(LB_PER_KG).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    gramsPerMile: D(GRAMS_PER_GALLON[i.fuel]).div(mpg).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    kgPerMonth: kg.div(12).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    fuelCost: gallons.times(Math.max(0, i.fuelPrice || 0)).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    vsTypical: tons.div(TYPICAL_TONS).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    tonsAtPlus10Mpg: tonsFor(miles, mpg + 10, i.fuel).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
  };
}
