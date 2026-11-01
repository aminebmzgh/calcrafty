/**
 * Pay conversion between hourly, daily, weekly, biweekly, semimonthly, monthly and annual
 * amounts, plus the effective hourly rate once paid time off is taken out of hours worked.
 * Gross pay only (before tax).
 */
import { cents, D, type Decimal } from '../../lib/math/money.ts';

export type PayPeriod = 'hour' | 'day' | 'week' | 'biweek' | 'semimonth' | 'month' | 'year';

export interface SalaryInput extends Record<string, unknown> {
  amount: number;
  period: PayPeriod;
  hoursPerWeek: number;
  daysPerWeek: number;
  /** Paid weeks per year: 52 for a salaried job; fewer for hourly work with unpaid weeks off. */
  weeksPerYear: number;
  /** Paid holidays and vacation days, used for the effective hourly rate. */
  ptoDays: number;
}

export interface SalaryOutput {
  hourly: number;
  daily: number;
  weekly: number;
  biweekly: number;
  semimonthly: number;
  monthly: number;
  annual: number;
  /** Paid hours per year. */
  hoursPerYear: number;
  /** Hours actually worked after paid time off. */
  hoursWorked: number;
  /** Annual pay ÷ hours actually worked. */
  effectiveHourly: number;
}

/** Annual gross pay from an amount paid per period. */
export function annualFrom(amount: number, period: PayPeriod, hoursPerWeek: number, daysPerWeek: number, weeksPerYear: number): Decimal {
  const a = D(amount);
  switch (period) {
    case 'hour':
      return a.times(hoursPerWeek).times(weeksPerYear);
    case 'day':
      return a.times(daysPerWeek).times(weeksPerYear);
    case 'week':
      return a.times(weeksPerYear);
    case 'biweek':
      return a.times(weeksPerYear).div(2);
    case 'semimonth':
      return a.times(24);
    case 'month':
      return a.times(12);
    default:
      return a;
  }
}

export function computeSalary(i: SalaryInput): SalaryOutput {
  const weeks = Math.max(1, i.weeksPerYear);
  const hours = Math.max(0, i.hoursPerWeek);
  const days = Math.max(1, i.daysPerWeek);
  const annual = annualFrom(i.amount, i.period, hours, days, weeks);
  const weekly = annual.div(weeks);
  const hoursPerYear = D(hours).times(weeks);
  const hoursPerDay = D(hours).div(days);
  const worked = hoursPerYear.minus(hoursPerDay.times(Math.max(0, i.ptoDays)));
  const hoursWorked = worked.gt(0) ? worked : D(0);
  return {
    hourly: hours > 0 ? cents(weekly.div(hours)).toNumber() : 0,
    daily: cents(weekly.div(days)).toNumber(),
    weekly: cents(weekly).toNumber(),
    biweekly: cents(weekly.times(2)).toNumber(),
    semimonthly: cents(annual.div(24)).toNumber(),
    monthly: cents(annual.div(12)).toNumber(),
    annual: cents(annual).toNumber(),
    hoursPerYear: hoursPerYear.toDecimalPlaces(2).toNumber(),
    hoursWorked: hoursWorked.toDecimalPlaces(2).toNumber(),
    effectiveHourly: hoursWorked.gt(0) ? cents(annual.div(hoursWorked)).toNumber() : 0,
  };
}
