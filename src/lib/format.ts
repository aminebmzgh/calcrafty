/**
 * Display formatting and friendly input parsing. No calculator math lives here.
 * Every formatter returns "—" instead of ever showing NaN or Infinity.
 */
import type { NumberUnit } from './types.ts';

const DASH = '—';

function finite(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** $1,896 (or $1,896.20 with cents). Negative values render as −$1,896. */
export function usd(n: number | null | undefined, cents = false): string {
  if (!finite(n)) return DASH;
  const v = Object.is(n, -0) ? 0 : n;
  return (cents ? usd2 : usd0).format(v).replace('-', '−');
}

/** $1.2M / $350K for compact chart axes. */
export function usdCompact(n: number): string {
  if (!finite(n)) return DASH;
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e9) return `${sign}$${trim(a / 1e9)}B`;
  if (a >= 1e6) return `${sign}$${trim(a / 1e6)}M`;
  if (a >= 1e3) return `${sign}$${trim(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}

function trim(n: number): string {
  return n >= 100 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, '');
}

/** 6.5% — up to `digits` decimals, trailing zeros removed. */
export function pct(n: number | null | undefined, digits = 2): string {
  if (!finite(n)) return DASH;
  return `${num(n, digits)}%`;
}

/** 1,234.5 — up to `digits` decimals, trailing zeros removed. */
export function num(n: number | null | undefined, digits = 2): string {
  if (!finite(n)) return DASH;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(Object.is(n, -0) ? 0 : n).replace('-', '−');
}

/** Fixed decimals: 24.20 */
export function fixed(n: number | null | undefined, digits: number): string {
  if (!finite(n)) return DASH;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n).replace('-', '−');
}

/** "30 years", "1 year", "6 years 4 months" from a month count. */
export function duration(months: number): string {
  if (!finite(months)) return DASH;
  const m = Math.round(months);
  const y = Math.floor(m / 12);
  const r = m % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} year${y === 1 ? '' : 's'}`);
  if (r) parts.push(`${r} month${r === 1 ? '' : 's'}`);
  return parts.length ? parts.join(' ') : '0 months';
}

const unitSuffix: Partial<Record<NumberUnit, string>> = {
  years: 'years',
  months: 'months',
  days: 'days',
  hours: 'hours',
  lbs: 'lb',
  kg: 'kg',
  cm: 'cm',
  in: 'in',
  ft: 'ft',
  km: 'km',
  mi: 'mi',
};

/** Value formatted for an input field (no currency symbol; the field shows it as an adornment). */
export function formatInputValue(n: number, unit: NumberUnit, step: number): string {
  if (!finite(n)) return '';
  const decimals = Math.max(0, Math.min(6, decimalPlaces(step)));
  if (unit === 'usd') return new Intl.NumberFormat('en-US', { maximumFractionDigits: Math.max(decimals, n % 1 ? 2 : 0) }).format(n);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: Math.max(decimals, 3), useGrouping: unit === 'count' || unit === 'none' }).format(n);
}

function decimalPlaces(step: number): number {
  const s = String(step);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

export function unitLabel(unit: NumberUnit): string {
  return unitSuffix[unit] ?? '';
}

/**
 * Parses friendly user input: "300,000", "300k", "$300000", "1.2m", "6.5%", " 42 ".
 * Returns null for anything that isn't a finite number.
 */
export function parseFriendly(raw: string): number | null {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().toLowerCase().replace(/[\s,$€£_]/g, '').replace(/^\+/, '').replace(/[−–]/g, '-');
  if (s.endsWith('%')) s = s.slice(0, -1);
  let mult = 1;
  const m = /^(-?\d*\.?\d+)\s*(k|m|mm|b|bn)?$/.exec(s);
  if (!m) return null;
  const suffix = m[2];
  if (suffix === 'k') mult = 1e3;
  else if (suffix === 'm' || suffix === 'mm') mult = 1e6;
  else if (suffix === 'b' || suffix === 'bn') mult = 1e9;
  const n = Number(m[1]) * mult;
  return Number.isFinite(n) ? n : null;
}

/** "Oct 29, 2026" from an ISO date. */
export function longDate(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
