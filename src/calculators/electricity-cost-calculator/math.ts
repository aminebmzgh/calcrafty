/**
 * Electricity cost of a device:
 *   kWh per day   = watts × hours per day ÷ 1,000
 *   days per year = days used per week × 365 ÷ 7
 *   cost          = kWh × price per kWh
 * Watts can also come from amps × volts. Months are a twelfth of a year. Costs round to the cent
 * for display only; energy is kept unrounded.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type PowerInput = 'watts' | 'amps';

export interface ElectricityInput extends Record<string, unknown> {
  powerBy: PowerInput;
  watts: number;
  amps: number;
  volts: number;
  hoursPerDay: number;
  daysPerWeek: number;
  /** Dollars per kWh. */
  rate: number;
  /** How many identical devices. */
  quantity: number;
}

export interface CostRow {
  period: 'Hour' | 'Day' | 'Week' | 'Month' | 'Year';
  kwh: number;
  cost: number;
}

export interface ElectricityOutput {
  watts: number;
  kwhPerDay: number;
  kwhPerYear: number;
  costPerHour: number;
  costPerDay: number;
  costPerMonth: number;
  costPerYear: number;
  rows: CostRow[];
}

const kwh4 = (d: Decimal) => d.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();

/** Watts from amps and volts (resistive load; motors draw a little less real power). */
export function wattsFrom(amps: number, volts: number): number {
  return D(Math.max(0, amps || 0)).times(Math.max(0, volts || 0)).toNumber();
}

export function computeElectricity(i: ElectricityInput): ElectricityOutput {
  const qty = Math.max(1, Math.round(i.quantity || 1));
  const w = D(i.powerBy === 'amps' ? wattsFrom(i.amps, i.volts) : Math.max(0, i.watts || 0)).times(qty);
  const hours = D(Math.min(24, Math.max(0, i.hoursPerDay || 0)));
  const daysPerWeek = D(Math.min(7, Math.max(0, i.daysPerWeek || 0)));
  const rate = D(Math.max(0, i.rate || 0));
  const kwhPerHour = w.div(1000);
  // Average day across the week, so per-day, per-week, per-month and per-year all agree.
  const kwhPerUseDay = kwhPerHour.times(hours);
  const kwhPerYear = kwhPerUseDay.times(daysPerWeek).times(365).div(7);
  const kwhPerWeek = kwhPerUseDay.times(daysPerWeek);
  const kwhPerMonth = kwhPerYear.div(12);
  const row = (period: CostRow['period'], k: Decimal): CostRow => ({ period, kwh: kwh4(k), cost: cents(k.times(rate)).toNumber() });
  const rows = [row('Hour', kwhPerHour), row('Day', kwhPerUseDay), row('Week', kwhPerWeek), row('Month', kwhPerMonth), row('Year', kwhPerYear)];
  return {
    watts: w.toNumber(),
    kwhPerDay: kwh4(kwhPerUseDay),
    kwhPerYear: kwh4(kwhPerYear),
    costPerHour: kwhPerHour.times(rate).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    costPerDay: rows[1]!.cost,
    costPerMonth: rows[3]!.cost,
    costPerYear: rows[4]!.cost,
    rows,
  };
}
