/**
 * Fetches live data from FRED and writes src/data/live/snapshot.json.
 *
 * - Uses the FRED API when FRED_API_KEY is set, otherwise FRED's public CSV download.
 * - Every value passes a sanity range; implausible or failed fetches keep the previous value.
 * - Never exits non-zero: live data must never break the build (hard rule 7).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { LiveKey } from '../src/lib/types.ts';
import type { LiveSeries, Snapshot } from '../src/data/live/index.ts';

const SNAPSHOT = fileURLToPath(new URL('../src/data/live/snapshot.json', import.meta.url));

interface SeriesSpec {
  key: LiveKey;
  seriesId: string;
  label: string;
  source: string;
  /** Plausible range for the final value. */
  range: [number, number];
  /** 'level' uses the latest value; 'yoy' computes the 12-month % change of a monthly index. */
  transform: 'level' | 'yoy';
}

export const SERIES: SeriesSpec[] = [
  { key: 'mortgage30', seriesId: 'MORTGAGE30US', label: '30-year fixed mortgage rate', source: 'Freddie Mac', range: [1, 20], transform: 'level' },
  { key: 'mortgage15', seriesId: 'MORTGAGE15US', label: '15-year fixed mortgage rate', source: 'Freddie Mac', range: [1, 20], transform: 'level' },
  { key: 'cpiInflation', seriesId: 'CPIAUCSL', label: 'CPI-U inflation, 12-month change', source: 'U.S. Bureau of Labor Statistics', range: [-5, 20], transform: 'yoy' },
  { key: 'treasury10', seriesId: 'DGS10', label: '10-year Treasury yield', source: 'Board of Governors of the Federal Reserve System', range: [0, 20], transform: 'level' },
  { key: 'savingsRate', seriesId: 'DTB3', label: '3-month Treasury bill rate', source: 'Board of Governors of the Federal Reserve System', range: [0, 20], transform: 'level' },
  { key: 'autoLoan60', seriesId: 'RIFLPBCIANM60NM', label: '60-month new car loan rate (commercial banks)', source: 'Board of Governors of the Federal Reserve System', range: [1, 25], transform: 'level' },
  { key: 'personalLoan24', seriesId: 'TERMCBPER24NS', label: '24-month personal loan rate (commercial banks)', source: 'Board of Governors of the Federal Reserve System', range: [1, 40], transform: 'level' },
  { key: 'creditCard', seriesId: 'TERMCBCCALLNS', label: 'Credit card interest rate, all accounts (commercial banks)', source: 'Board of Governors of the Federal Reserve System', range: [5, 40], transform: 'level' },
];

type Obs = { date: string; value: number };

async function fetchObservations(seriesId: string, start: string): Promise<Obs[]> {
  const key = process.env.FRED_API_KEY;
  if (key) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${key}&file_type=json&observation_start=${start}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`FRED API ${res.status}`);
    const json = (await res.json()) as { observations: { date: string; value: string }[] };
    return json.observations
      .map((o) => ({ date: o.date, value: Number(o.value) }))
      .filter((o) => o.value === o.value && Number.isFinite(o.value));
  }
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}&cosd=${start}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`FRED CSV ${res.status}`);
  const text = await res.text();
  return text
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => {
      const [date = '', value = ''] = line.split(',');
      return { date: date.trim(), value: value.trim() === '' ? NaN : Number(value) };
    })
    .filter((o) => Number.isFinite(o.value));
}

export function computeValue(spec: SeriesSpec, obs: Obs[]): { value: number; asOf: string } {
  if (obs.length === 0) throw new Error('no observations');
  const latest = obs[obs.length - 1]!;
  if (spec.transform === 'level') return { value: latest.value, asOf: latest.date };
  // 12-month change: find the observation exactly one year before the latest.
  const d = new Date(latest.date + 'T00:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  const target = d.toISOString().slice(0, 10);
  const prior = obs.find((o) => o.date === target);
  if (!prior) throw new Error(`no observation for ${target}`);
  return { value: Math.round((latest.value / prior.value - 1) * 10000) / 100, asOf: latest.date };
}

async function main() {
  const previous = JSON.parse(await readFile(SNAPSHOT, 'utf8').catch(() => '{"series":{}}')) as Snapshot;
  const start = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
  const series = { ...previous.series } as Record<LiveKey, LiveSeries>;
  let changed = 0;

  for (const spec of SERIES) {
    try {
      const { value, asOf } = computeValue(spec, await fetchObservations(spec.seriesId, start));
      const [lo, hi] = spec.range;
      if (!(value >= lo && value <= hi)) {
        console.warn(`[data-refresh] ${spec.seriesId}: ${value} outside ${lo}–${hi}; keeping previous value`);
        continue;
      }
      series[spec.key] = {
        value,
        asOf,
        label: spec.label,
        source: spec.source,
        seriesId: spec.seriesId,
        url: `https://fred.stlouisfed.org/series/${spec.seriesId}`,
      };
      changed++;
    } catch (err) {
      console.warn(`[data-refresh] ${spec.seriesId}: ${(err as Error).message}; keeping previous value`);
    }
  }

  const snapshot: Snapshot = { generatedAt: new Date().toISOString(), series };
  await writeFile(SNAPSHOT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`[data-refresh] ${changed}/${SERIES.length} series updated${process.env.FRED_API_KEY ? ' (API)' : ' (public CSV)'}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.warn(`[data-refresh] unexpected error: ${(err as Error).message}`);
  });
}
