import type { LiveKey } from '../../lib/types.ts';
import snapshot from './snapshot.json';

export interface LiveSeries {
  value: number;
  /** ISO date of the observation. */
  asOf: string;
  label: string;
  source: string;
  seriesId: string;
  url: string;
  /** How the value reads: a rate in percent (default) or a price in dollars per unit. */
  unit?: 'percent' | 'usd';
  /** For prices: what one unit is ("gallon", "kWh"). */
  per?: string;
}

export interface Snapshot {
  generatedAt: string;
  series: Record<LiveKey, LiveSeries>;
}

export const live = snapshot as Snapshot;

export function liveValue(key: LiveKey): LiveSeries {
  const s = live.series[key];
  if (!s) throw new Error(`Missing live series ${key} in snapshot.json`);
  return s;
}

/** "Oct 29, 2026" */
export function formatAsOf(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "7.18%" for rates, "$4.153 per gallon" for prices. */
export function formatLive(s: LiveSeries): string {
  if (s.unit === 'usd') return `$${s.value.toFixed(3)} per ${s.per ?? 'unit'}`;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(s.value)}%`;
}

/** FRED attribution line, per FRED's terms of use. */
export function fredCitation(s: LiveSeries): string {
  return `${s.source}, ${s.label} [${s.seriesId}], retrieved from FRED, Federal Reserve Bank of St. Louis`;
}
