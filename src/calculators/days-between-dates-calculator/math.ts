/**
 * Days between two dates: calendar days (optionally counting the end date), weeks, calendar
 * months/years, and business days (Mon–Fri), optionally excluding US federal holidays
 * (5 U.S.C. 6103, observed: Saturday → Friday, Sunday → Monday).
 */
import { calendarDiff, dayNumber, fromDayNumber, longLabel, parseISO, toISO, weekday, type YMD } from '../../lib/math/dates.ts';

export interface DaysInput extends Record<string, unknown> {
  start: string;
  end: string;
  includeEnd: boolean;
  excludeHolidays: boolean;
}

export interface DaysOutput {
  error: string | null;
  days: number;
  weeks: number;
  weekRemainder: number;
  years: number;
  months: number;
  monthDays: number;
  businessDays: number;
  weekendDays: number;
  holidays: { date: string; name: string }[];
  startLabel: string;
  endLabel: string;
  reversed: boolean;
}

function nthWeekday(y: number, m: number, dow: number, n: number): YMD {
  const first = weekday({ y, m, d: 1 });
  return { y, m, d: 1 + ((dow - first + 7) % 7) + (n - 1) * 7 };
}

function lastWeekday(y: number, m: number, dow: number): YMD {
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const wd = weekday({ y, m, d: lastDay });
  return { y, m, d: lastDay - ((wd - dow + 7) % 7) };
}

function observed(x: YMD): YMD {
  const wd = weekday(x);
  return wd === 6 ? fromDayNumber(dayNumber(x) - 1) : wd === 0 ? fromDayNumber(dayNumber(x) + 1) : x;
}

/** US federal holidays observed in a given year (observed dates may fall in the neighboring year). */
export function federalHolidays(y: number): { date: YMD; name: string }[] {
  const list: { date: YMD; name: string }[] = [
    { date: observed({ y, m: 1, d: 1 }), name: 'New Year’s Day' },
    { date: nthWeekday(y, 1, 1, 3), name: 'Martin Luther King Jr. Day' },
    { date: nthWeekday(y, 2, 1, 3), name: 'Washington’s Birthday' },
    { date: lastWeekday(y, 5, 1), name: 'Memorial Day' },
    { date: observed({ y, m: 7, d: 4 }), name: 'Independence Day' },
    { date: nthWeekday(y, 9, 1, 1), name: 'Labor Day' },
    { date: nthWeekday(y, 10, 1, 2), name: 'Columbus Day' },
    { date: observed({ y, m: 11, d: 11 }), name: 'Veterans Day' },
    { date: nthWeekday(y, 11, 4, 4), name: 'Thanksgiving Day' },
    { date: observed({ y, m: 12, d: 25 }), name: 'Christmas Day' },
  ];
  if (y >= 2021) list.push({ date: observed({ y, m: 6, d: 19 }), name: 'Juneteenth National Independence Day' });
  return list;
}

export function computeDays(i: DaysInput): DaysOutput {
  const base = { days: 0, weeks: 0, weekRemainder: 0, years: 0, months: 0, monthDays: 0, businessDays: 0, weekendDays: 0, holidays: [], startLabel: '', endLabel: '', reversed: false };
  let a = parseISO(i.start);
  let b = parseISO(i.end);
  if (!a || !b) return { ...base, error: 'Enter two valid dates.' };
  const reversed = dayNumber(b) < dayNumber(a);
  if (reversed) [a, b] = [b, a];
  const startN = dayNumber(a);
  const endN = dayNumber(b);
  const lastCounted = i.includeEnd ? endN : endN - 1;
  const days = lastCounted - startN + 1;

  const holidaySet = new Map<number, string>();
  if (i.excludeHolidays) {
    for (let y = a.y - 1; y <= b.y + 1; y++) for (const h of federalHolidays(y)) holidaySet.set(dayNumber(h.date), h.name);
  }
  let business = 0;
  let weekend = 0;
  const holidays: DaysOutput['holidays'] = [];
  for (let n = startN; n <= lastCounted; n++) {
    const wd = new Date(n * 86_400_000).getUTCDay();
    if (wd === 0 || wd === 6) weekend++;
    else if (holidaySet.has(n)) holidays.push({ date: toISO(fromDayNumber(n)), name: holidaySet.get(n)! });
    else business++;
  }
  const cal = calendarDiff(a, i.includeEnd ? fromDayNumber(endN + 1) : b);
  return {
    error: null,
    days: Math.max(0, days),
    weeks: Math.floor(Math.max(0, days) / 7),
    weekRemainder: Math.max(0, days) % 7,
    years: cal.years,
    months: cal.months,
    monthDays: cal.days,
    businessDays: business,
    weekendDays: weekend,
    holidays,
    startLabel: longLabel(a),
    endLabel: longLabel(b),
    reversed,
  };
}
