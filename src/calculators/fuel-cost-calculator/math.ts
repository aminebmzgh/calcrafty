/**
 * Fuel cost of a trip:
 *   gallons = miles ÷ mpg            (or litres = km × L/100 km ÷ 100 for metric)
 *   cost    = gallons × price per gallon
 * A round trip doubles the distance; the cost can be split between passengers. CO₂ uses the EPA's
 * 8,887 g of CO₂ per gallon of gasoline and 10,180 g per gallon of diesel (1 gallon = 3.785411784 L).
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type Units = 'us' | 'metric';
export type Fuel = 'gasoline' | 'diesel';

export interface FuelInput extends Record<string, unknown> {
  units: Units;
  /** One-way distance, US units. */
  miles: number;
  mpg: number;
  pricePerGallon: number;
  /** One-way distance, metric units. */
  km: number;
  /** Litres per 100 km. */
  l100km: number;
  pricePerLitre: number;
  roundTrip: boolean;
  people: number;
  fuel: Fuel;
}

export interface FuelOutput {
  /** Total distance driven, in the chosen unit. */
  distance: number;
  /** Fuel used, gallons (US) or litres (metric). */
  fuelUsed: number;
  cost: number;
  perPerson: number;
  /** Cost per mile or per kilometre. */
  costPerUnit: number;
  co2Lb: number;
  co2Kg: number;
  people: number;
  /** Cost of the same trip at other fuel economies (US mpg or L/100 km). */
  table: { economy: number; fuelUsed: number; cost: number }[];
}

export const LITRES_PER_GALLON = 3.785411784;
export const CO2_GRAMS_PER_GALLON: Record<Fuel, number> = { gasoline: 8_887, diesel: 10_180 };
const LB_PER_KG = D(1).div(0.45359237);
export const MPG_TABLE = [15, 20, 25, 30, 35, 40, 50];
export const L100_TABLE = [4, 5, 6, 7, 8, 10, 12];

/** Fuel used for a distance: miles ÷ mpg, or km × L/100 km ÷ 100. */
export function fuelFor(units: Units, distance: number, economy: number): Decimal {
  const d = D(Math.max(0, distance || 0));
  const e = Math.max(0, economy || 0);
  if (e === 0) return D(0);
  return units === 'metric' ? d.times(e).div(100) : d.div(e);
}

/** Convert mpg (US) to litres per 100 km: 235.214583 ÷ mpg. */
export function mpgToL100(mpg: number): number {
  if (mpg <= 0) return 0;
  return D(100).times(LITRES_PER_GALLON).div(D(1.609344).times(mpg)).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();
}

const round = (n: number, dp: number) => D(n).toDecimalPlaces(dp, Decimal.ROUND_HALF_UP).toNumber();

/** Values for the other unit system when the toggle changes, so the trip stays the same. */
export function switchUnits(to: Units, i: FuelInput): Partial<FuelInput> {
  if (to === 'metric') {
    return { km: round(D(i.miles || 0).times(1.609344).toNumber(), 1), l100km: round(mpgToL100(i.mpg || 0), 1), pricePerLitre: round(D(i.pricePerGallon || 0).div(LITRES_PER_GALLON).toNumber(), 3) };
  }
  return { miles: round(D(i.km || 0).div(1.609344).toNumber(), 1), mpg: round(i.l100km > 0 ? D(100).times(LITRES_PER_GALLON).div(D(1.609344).times(i.l100km)).toNumber() : 0, 1), pricePerGallon: round(D(i.pricePerLitre || 0).times(LITRES_PER_GALLON).toNumber(), 3) };
}

export function computeFuel(i: FuelInput): FuelOutput {
  const metric = i.units === 'metric';
  const oneWay = Math.max(0, (metric ? i.km : i.miles) || 0);
  const economy = metric ? i.l100km : i.mpg;
  const distance = i.roundTrip ? oneWay * 2 : oneWay;
  const people = Math.max(1, Math.round(i.people || 1));
  const price = D(Math.max(0, (metric ? i.pricePerLitre : i.pricePerGallon) || 0));
  const used = fuelFor(i.units, distance, economy);
  const cost = cents(used.times(price));
  const gallons = i.units === 'metric' ? used.div(LITRES_PER_GALLON) : used;
  const kg = gallons.times(CO2_GRAMS_PER_GALLON[i.fuel] ?? CO2_GRAMS_PER_GALLON.gasoline).div(1000);
  const table = (i.units === 'metric' ? L100_TABLE : MPG_TABLE).map((e) => {
    const f = fuelFor(i.units, distance, e);
    return { economy: e, fuelUsed: f.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(), cost: cents(f.times(price)).toNumber() };
  });
  return {
    distance,
    fuelUsed: used.toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toNumber(),
    cost: cost.toNumber(),
    perPerson: cost.div(people).toDecimalPlaces(2, Decimal.ROUND_UP).toNumber(),
    costPerUnit: distance > 0 ? used.times(price).div(distance).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber() : 0,
    co2Lb: kg.times(LB_PER_KG).toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber(),
    co2Kg: kg.toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber(),
    people,
    table,
  };
}
