import { describe, expect, it } from 'vitest';
import { computeElectricity, wattsFrom, type ElectricityInput } from './math.ts';

const base: ElectricityInput = { powerBy: 'watts', watts: 1500, amps: 12.5, volts: 120, hoursPerDay: 5, daysPerWeek: 7, rate: 0.196, quantity: 1 };

describe('electricity cost', () => {
  // 1,500 W × 5 h = 7.5 kWh a day; × $0.196 = $1.47. A year: 2,737.5 kWh = $536.55; a month: 228.125 kWh = $44.71.
  it('space heater', () => {
    const o = computeElectricity(base);
    expect(o.kwhPerDay).toBe(7.5);
    expect(o.costPerDay).toBe(1.47);
    expect(o.kwhPerYear).toBe(2737.5);
    expect(o.costPerYear).toBe(536.55);
    expect(o.costPerMonth).toBe(44.71);
    expect(o.costPerHour).toBe(0.294);
  });
  // Virginia Cooperative Extension 2901-9014 example: computer and monitor, (120 + 150) W × 4 h × 365 days
  // ÷ 1,000 = 394 kWh × 8.5¢ = $33.51 a year.
  it('extension service worked example', () => {
    const o = computeElectricity({ ...base, watts: 270, hoursPerDay: 4, rate: 0.085 });
    expect(o.kwhPerYear).toBe(394.2);
    expect(o.costPerYear).toBe(33.51);
  });
  // A 10 W LED bulb, 8 h a day at 15¢: 0.08 kWh a day, 29.2 kWh and $4.38 a year.
  it('LED bulb', () => {
    const o = computeElectricity({ ...base, watts: 10, hoursPerDay: 8, rate: 0.15 });
    expect(o.kwhPerDay).toBe(0.08);
    expect(o.costPerYear).toBe(4.38);
  });
  // 1,000 W for 2 h on 5 days a week: 10 kWh a week, 10 × 365 ÷ 7 = 521.4286 kWh a year.
  it('days per week', () => {
    const o = computeElectricity({ ...base, watts: 1000, hoursPerDay: 2, daysPerWeek: 5 });
    expect(o.rows.find((r) => r.period === 'Week')!.kwh).toBe(10);
    expect(o.kwhPerYear).toBe(521.4286);
  });
  it('watts from amps and volts', () => {
    expect(wattsFrom(12.5, 120)).toBe(1500);
    expect(computeElectricity({ ...base, powerBy: 'amps' }).costPerYear).toBe(536.55);
  });
  // Three 60 W bulbs for 5 h: 0.9 kWh a day.
  it('several identical devices', () => expect(computeElectricity({ ...base, watts: 60, quantity: 3 }).kwhPerDay).toBe(0.9));
  it('zero and out-of-range input', () => {
    expect(computeElectricity({ ...base, watts: 0 }).costPerYear).toBe(0);
    expect(computeElectricity({ ...base, hoursPerDay: 30 }).kwhPerDay).toBe(36);
  });
});
