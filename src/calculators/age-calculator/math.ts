/**
 * Age: exact years, months and days between a birth date and a date (today by default),
 * totals in months, weeks, days and hours, and the next birthday.
 * Feb 29 birthdays are celebrated on Feb 28 in common years (a common convention; some places use Mar 1).
 */
import { calendarDiff, dayNumber, isLeap, longLabel, parseISO, todayISO, weekday, WEEKDAYS, type YMD } from '../../lib/math/dates.ts';

export interface AgeInput extends Record<string, unknown> {
  birth: string;
  /** ISO date, or empty for today. */
  asOf: string;
}

export interface AgeOutput {
  error: string | null;
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  totalWeeks: number;
  weeksRemainder: number;
  totalDays: number;
  totalHours: number;
  bornOn: string;
  asOfLabel: string;
  nextBirthday: string;
  daysToBirthday: number;
  nextAge: number;
  birthdayToday: boolean;
}

export function birthdayIn(birth: YMD, year: number): YMD {
  if (birth.m === 2 && birth.d === 29 && !isLeap(year)) return { y: year, m: 2, d: 28 };
  return { y: year, m: birth.m, d: birth.d };
}

export function computeAge(i: AgeInput): AgeOutput {
  const empty = { years: 0, months: 0, days: 0, totalMonths: 0, totalWeeks: 0, weeksRemainder: 0, totalDays: 0, totalHours: 0, bornOn: '', asOfLabel: '', nextBirthday: '', daysToBirthday: 0, nextAge: 0, birthdayToday: false };
  const b = parseISO(i.birth);
  const t = parseISO(i.asOf || todayISO());
  if (!b) return { ...empty, error: 'Enter a valid birth date.' };
  if (!t) return { ...empty, error: 'Enter a valid “as of” date.' };
  if (dayNumber(t) < dayNumber(b)) return { ...empty, error: 'The birth date is after the “as of” date.' };
  const diff = calendarDiff(b, t);
  const totalDays = dayNumber(t) - dayNumber(b);
  let next = birthdayIn(b, t.y);
  if (dayNumber(next) < dayNumber(t)) next = birthdayIn(b, t.y + 1);
  const daysToBirthday = dayNumber(next) - dayNumber(t);
  return {
    error: null,
    ...diff,
    totalMonths: diff.years * 12 + diff.months,
    totalWeeks: Math.floor(totalDays / 7),
    weeksRemainder: totalDays % 7,
    totalDays,
    totalHours: totalDays * 24,
    bornOn: WEEKDAYS[weekday(b)]!,
    asOfLabel: longLabel(t),
    nextBirthday: longLabel(next),
    daysToBirthday,
    nextAge: next.y - b.y,
    birthdayToday: daysToBirthday === 0,
  };
}
