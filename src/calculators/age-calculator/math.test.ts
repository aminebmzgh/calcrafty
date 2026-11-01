import { describe, expect, it } from 'vitest';
import { computeAge } from './math.ts';
import { calendarDiff, parseISO, addMonths } from '../../lib/math/dates.ts';

const age = (birth: string, asOf: string) => computeAge({ birth, asOf });

describe('age references', () => {
  // May 15, 1990 → Nov 1, 2026: 36 years (May 15, 2026), 5 months (Oct 15), 17 days (Oct has 31 days).
  it('36 years, 5 months, 17 days', () => {
    const o = age('1990-05-15', '2026-11-01');
    expect([o.years, o.months, o.days]).toEqual([36, 5, 17]);
  });
  // Total days uses the real calendar, including leap days: 1990-05-15 → 2026-11-01 = 13,319 days.
  it('total days 13,319 and weeks', () => {
    const o = age('1990-05-15', '2026-11-01');
    expect(o.totalDays).toBe(13_319);
    expect(o.totalWeeks).toBe(1902);
    expect(o.weeksRemainder).toBe(5);
  });
  // Born on a Tuesday: May 15, 1990 was a Tuesday.
  it('day of the week born', () => expect(age('1990-05-15', '2026-11-01').bornOn).toBe('Tuesday'));
  it('next birthday and countdown', () => {
    const o = age('1990-05-15', '2026-11-01');
    expect(o.nextBirthday).toBe('Saturday, May 15, 2027');
    expect(o.daysToBirthday).toBe(195);
    expect(o.nextAge).toBe(37);
  });
});

describe('edge cases', () => {
  it('leap-day birthdays turn a year older on Feb 28 in common years', () => {
    const o = age('2000-02-29', '2026-02-28');
    expect([o.years, o.months, o.days]).toEqual([26, 0, 0]);
    expect(age('2000-02-29', '2026-02-27').years).toBe(25);
    expect(o.birthdayToday).toBe(true);
  });
  it('birthday today', () => expect(age('2000-11-01', '2026-11-01').birthdayToday).toBe(true));
  it('end-of-month borrow: Jan 31 → Mar 1 (non-leap) = 1 month 1 day', () => expect(calendarDiff(parseISO('2025-01-31')!, parseISO('2025-03-01')!)).toEqual({ years: 0, months: 1, days: 1 }));
  it('errors instead of negative ages', () => {
    expect(age('2030-01-01', '2026-11-01').error).not.toBeNull();
    expect(age('2026-02-30', '2026-11-01').error).not.toBeNull();
  });
  it('same day is age 0', () => expect(age('2026-11-01', '2026-11-01').totalDays).toBe(0));
  it('addMonths clamps to month end', () => expect(addMonths(parseISO('2024-01-31')!, 1)).toEqual({ y: 2024, m: 2, d: 29 }));
});
