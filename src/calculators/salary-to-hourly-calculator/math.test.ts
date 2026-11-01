import { describe, expect, it } from 'vitest';
import { computeSalary, type SalaryInput } from './math.ts';

const base: SalaryInput = { amount: 75_000, period: 'year', hoursPerWeek: 40, daysPerWeek: 5, weeksPerYear: 52, ptoDays: 0 };

// Standard full-time year: 40 hours × 52 weeks = 2,080 hours (US Department of Labor / OPM convention).
describe('salary to hourly reference values', () => {
  // $75,000 ÷ 2,080 = $36.06 an hour.
  it('$75,000 a year is $36.06 an hour', () => expect(computeSalary(base).hourly).toBe(36.06));
  // $50,000 ÷ 2,080 = $24.04.
  it('$50,000 a year is $24.04 an hour', () => expect(computeSalary({ ...base, amount: 50_000 }).hourly).toBe(24.04));
  it('2,080 paid hours a year', () => expect(computeSalary(base).hoursPerYear).toBe(2_080));
  it('pay periods for $75,000', () => {
    const o = computeSalary(base);
    expect(o.monthly).toBe(6_250);
    expect(o.semimonthly).toBe(3_125);
    expect(o.biweekly).toBe(2_884.62);
    expect(o.weekly).toBe(1_442.31);
    expect(o.daily).toBe(288.46);
  });
});

describe('hourly to salary reference values', () => {
  // $25 × 40 × 52 = $52,000 a year.
  it('$25 an hour is $52,000 a year', () => expect(computeSalary({ ...base, amount: 25, period: 'hour' }).annual).toBe(52_000));
  // $20 × 2,080 = $41,600; ÷ 12 = $3,466.67 a month.
  it('$20 an hour is $41,600 a year and $3,466.67 a month', () => {
    const o = computeSalary({ ...base, amount: 20, period: 'hour' });
    expect(o.annual).toBe(41_600);
    expect(o.monthly).toBe(3_466.67);
    expect(o.biweekly).toBe(1_600);
  });
  // Part-time: $18 × 25 hours × 52 = $23,400.
  it('part-time hours', () => expect(computeSalary({ ...base, amount: 18, period: 'hour', hoursPerWeek: 25 }).annual).toBe(23_400));
  // Unpaid weeks off: $30 × 40 × 48 = $57,600.
  it('fewer paid weeks', () => expect(computeSalary({ ...base, amount: 30, period: 'hour', weeksPerYear: 48 }).annual).toBe(57_600));
});

describe('other periods and effective rate', () => {
  it('biweekly $2,000 is $52,000 a year', () => expect(computeSalary({ ...base, amount: 2_000, period: 'biweek' }).annual).toBe(52_000));
  it('semimonthly $2,500 is $60,000 a year', () => expect(computeSalary({ ...base, amount: 2_500, period: 'semimonth' }).annual).toBe(60_000));
  it('monthly $5,000 is $60,000 a year', () => expect(computeSalary({ ...base, amount: 5_000, period: 'month' }).annual).toBe(60_000));
  it('daily $200 is $52,000 a year', () => expect(computeSalary({ ...base, amount: 200, period: 'day' }).annual).toBe(52_000));
  // 25 paid days off × 8 hours = 200 hours; $75,000 ÷ 1,880 = $39.89.
  it('effective hourly rate after 25 days of paid time off', () => {
    const o = computeSalary({ ...base, ptoDays: 25 });
    expect(o.hoursWorked).toBe(1_880);
    expect(o.effectiveHourly).toBe(39.89);
  });
  it('zero pay', () => expect(computeSalary({ ...base, amount: 0 }).hourly).toBe(0));
  it('zero hours does not divide by zero', () => expect(computeSalary({ ...base, hoursPerWeek: 0 }).hourly).toBe(0));
});
