/** Calendar date helpers on ISO strings (YYYY-MM-DD), computed in UTC so time zones and DST never shift a day. */

export interface YMD {
  y: number;
  m: number; // 1–12
  d: number;
}

export function parseISO(s: string): YMD | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) return null;
  return { y, m: mo, d };
}

export const toISO = ({ y, m, d }: YMD): string => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export const isLeap = (y: number): boolean => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function daysInMonth(y: number, m: number): number {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]!;
}

/** Days since 1970-01-01 (UTC). */
export const dayNumber = ({ y, m, d }: YMD): number => Date.UTC(y, m - 1, d) / 86_400_000;

export const fromDayNumber = (n: number): YMD => {
  const dt = new Date(n * 86_400_000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
};

/** 0 = Sunday … 6 = Saturday. */
export const weekday = (x: YMD): number => new Date(dayNumber(x) * 86_400_000).getUTCDay();

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

export const longLabel = (x: YMD): string => `${WEEKDAYS[weekday(x)]}, ${MONTHS[x.m - 1]} ${x.d}, ${x.y}`;
export const shortLabel = (x: YMD): string => `${MONTHS[x.m - 1]} ${x.d}, ${x.y}`;

/** Today's date in the user's local calendar. */
export function todayISO(): string {
  const n = new Date();
  return toISO({ y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() });
}

/**
 * Calendar difference from a to b (a ≤ b) in years, months and days: the largest number of whole
 * months k with a + k months ≤ b (adding months clamps to the end of shorter months, so
 * Jan 31 + 1 month = Feb 28), then the remaining days. Never produces negative days.
 */
export function calendarDiff(a: YMD, b: YMD): { years: number; months: number; days: number } {
  let k = (b.y - a.y) * 12 + (b.m - a.m);
  while (k > 0 && dayNumber(addMonths(a, k)) > dayNumber(b)) k--;
  const days = dayNumber(b) - dayNumber(addMonths(a, k));
  return { years: Math.floor(k / 12), months: k % 12, days };
}

/** Adds whole months, clamping to the end of a shorter month (Jan 31 + 1 month = Feb 28/29). */
export function addMonths(x: YMD, n: number): YMD {
  const total = x.y * 12 + (x.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return { y, m, d: Math.min(x.d, daysInMonth(y, m)) };
}
