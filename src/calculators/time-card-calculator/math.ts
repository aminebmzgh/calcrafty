/**
 * Time card: hours worked from start and end times, one shift per line ("Mon 8:30am - 5:15pm 30",
 * the last number being unpaid break minutes). Handles 12- and 24-hour times and overnight shifts,
 * then applies weekly overtime (FLSA: over 40 hours at 1.5×) to work out gross pay.
 */
import { cents, D } from '../../lib/math/money.ts';

export interface TimeCardInput extends Record<string, unknown> {
  shifts: string;
  rate: number;
  /** Weekly hours after which overtime applies. */
  overtimeAfter: number;
  multiplier: number;
}

export interface Shift {
  label: string;
  /** Minutes worked after breaks. */
  minutes: number;
  /** Decimal hours, 2 decimals. */
  hours: number;
  breakMinutes: number;
  overnight: boolean;
}

export interface TimeCardOutput {
  shifts: Shift[];
  invalid: string[];
  totalMinutes: number;
  /** Decimal hours, 2 decimals (8 h 15 min = 8.25). */
  totalHours: number;
  /** "40:15" style total. */
  clock: string;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

const LINE = /^(?:([A-Za-z][\w.]*)\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a|p)?\s*(?:-|–|—|to)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a|p)?(?:\s+(\d{1,3})(?:\s*min)?)?\s*$/i;

/** Minutes after midnight for an hour, minute and optional am/pm. Returns null if invalid. */
export function toMinutes(h: number, m: number, ap?: string): number | null {
  if (m > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    const pm = ap.toLowerCase().startsWith('p');
    const hour = (h % 12) + (pm ? 12 : 0);
    return hour * 60 + m;
  }
  if (h > 24 || (h === 24 && m > 0)) return null;
  return h * 60 + m;
}

export function parseShift(line: string): Shift | null {
  const x = LINE.exec(line.trim());
  if (!x) return null;
  const start = toMinutes(+x[2]!, +(x[3] ?? 0), x[4]);
  const end = toMinutes(+x[5]!, +(x[6] ?? 0), x[7]);
  if (start === null || end === null) return null;
  const overnight = end <= start;
  const span = overnight ? end + 1440 - start : end - start;
  const breakMinutes = x[8] ? +x[8] : 0;
  if (breakMinutes >= span) return null;
  const minutes = span - breakMinutes;
  return { label: x[1] ?? '', minutes, hours: D(minutes).div(60).toDecimalPlaces(2).toNumber(), breakMinutes, overnight };
}

export function clockOf(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function computeTimeCard(i: TimeCardInput): TimeCardOutput {
  const shifts: Shift[] = [];
  const invalid: string[] = [];
  for (const raw of i.shifts.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const s = parseShift(line);
    if (s) shifts.push(s);
    else invalid.push(line);
  }
  const totalMinutes = shifts.reduce((t, s) => t + s.minutes, 0);
  const hours = D(totalMinutes).div(60);
  const threshold = D(Math.max(0, i.overtimeAfter));
  const reg = hours.gt(threshold) ? threshold : hours;
  const ot = hours.gt(threshold) ? hours.minus(threshold) : D(0);
  const rate = D(Math.max(0, i.rate));
  const regularPay = cents(reg.times(rate));
  const overtimePay = cents(ot.times(rate).times(i.multiplier));
  return {
    shifts,
    invalid,
    totalMinutes,
    totalHours: hours.toDecimalPlaces(2).toNumber(),
    clock: clockOf(totalMinutes),
    regularHours: reg.toDecimalPlaces(2).toNumber(),
    overtimeHours: ot.toDecimalPlaces(2).toNumber(),
    regularPay: regularPay.toNumber(),
    overtimePay: overtimePay.toNumber(),
    totalPay: regularPay.plus(overtimePay).toNumber(),
  };
}
