import { describe, expect, it } from 'vitest';
import { computeDays, federalHolidays } from './math.ts';
import { toISO } from '../../lib/math/dates.ts';

const days = (start: string, end: string, includeEnd = false, excludeHolidays = false) => computeDays({ start, end, includeEnd, excludeHolidays });

describe('days between dates references', () => {
  it('Jan 1 → Dec 31, 2026 is 364 days (365 counting the end date)', () => {
    expect(days('2026-01-01', '2026-12-31').days).toBe(364);
    expect(days('2026-01-01', '2026-12-31', true).days).toBe(365);
  });
  it('a leap year has 366 days: Jan 1, 2028 → Jan 1, 2029', () => expect(days('2028-01-01', '2029-01-01').days).toBe(366));
  it('2026 has 261 weekdays', () => expect(days('2026-01-01', '2026-12-31', true).businessDays).toBe(261));
  // 2026 federal holidays that fall on weekdays (observed): all 11, so 261 − 11 = 250 working days.
  it('2026 has 250 federal working days', () => {
    const o = days('2026-01-01', '2026-12-31', true, true);
    expect(o.holidays).toHaveLength(11);
    expect(o.businessDays).toBe(250);
  });
});

describe('federal holiday rules (5 U.S.C. 6103)', () => {
  const iso = (y: number, name: string) => toISO(federalHolidays(y).find((h) => h.name.startsWith(name))!.date);
  it('2026 dates', () => {
    expect(iso(2026, 'Martin')).toBe('2026-01-19');
    expect(iso(2026, 'Memorial')).toBe('2026-05-25');
    expect(iso(2026, 'Thanksgiving')).toBe('2026-11-26');
    expect(iso(2026, 'Independence')).toBe('2026-07-03'); // July 4, 2026 is a Saturday → observed Friday
  });
  it('Sunday holidays move to Monday: July 4, 2027 (Sunday) → July 5', () => expect(iso(2027, 'Independence')).toBe('2027-07-05'));
  it('New Year’s Day 2028 falls on Saturday → observed Friday, Dec 31, 2027', () => expect(iso(2028, 'New Year')).toBe('2027-12-31'));
});

describe('edge cases', () => {
  it('reversed dates are swapped and flagged', () => {
    const o = days('2026-12-31', '2026-01-01');
    expect(o.days).toBe(364);
    expect(o.reversed).toBe(true);
  });
  it('same date: 0 days, or 1 counting the end date', () => {
    expect(days('2026-11-02', '2026-11-02').days).toBe(0);
    expect(days('2026-11-02', '2026-11-02', true).days).toBe(1);
  });
  it('weeks and months', () => {
    const o = days('2026-01-15', '2026-03-20');
    expect(o.days).toBe(64);
    expect([o.weeks, o.weekRemainder]).toEqual([9, 1]);
    expect([o.months, o.monthDays]).toEqual([2, 5]);
  });
  it('invalid dates return an error', () => expect(days('2026-13-01', '2026-01-01').error).not.toBeNull());
});
