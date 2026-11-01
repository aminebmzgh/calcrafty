/**
 * Running pace: solve for pace, finish time or distance (1 mile = 1.609344 km exactly),
 * splits, and race-time predictions with Riegel's formula T2 = T1 × (D2 / D1)^1.06.
 */
import { D } from '../../lib/math/money.ts';

export const KM_PER_MILE = 1.609344;

export const RACES = {
  '5k': { label: '5K', km: 5 },
  '10k': { label: '10K', km: 10 },
  half: { label: 'Half marathon', km: 21.0975 },
  marathon: { label: 'Marathon', km: 42.195 },
} as const;
export type RaceKey = keyof typeof RACES;

export interface PaceInput extends Record<string, unknown> {
  mode: 'pace' | 'time' | 'distance';
  race: RaceKey | 'custom';
  customDistance: number;
  distanceUnit: 'mi' | 'km';
  hours: number;
  minutes: number;
  seconds: number;
  paceMin: number;
  paceSec: number;
  paceUnit: 'mi' | 'km';
}

export interface PaceOutput {
  distanceKm: number;
  distanceMi: number;
  timeSec: number;
  /** Time in hours (decimal). */
  hours: number;
  /** Seconds per kilometer and per mile. */
  paceKm: number;
  paceMi: number;
  kph: number;
  mph: number;
  predictions: { key: RaceKey; label: string; samePace: number; riegel: number }[];
  splits: { n: number; unit: 'mi' | 'km'; elapsed: number }[];
}

export const toSeconds = (h: number, m: number, s: number): number => D(h).times(3600).plus(D(m).times(60)).plus(s).toNumber();

/** "3:59:07" or "24:58" (rounded to the second). */
export function clock(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '—';
  const t = Math.round(totalSec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function riegel(t1Sec: number, d1Km: number, d2Km: number): number {
  if (d1Km <= 0) return 0;
  return D(t1Sec).times(D(d2Km).div(d1Km).pow(1.06)).toNumber();
}

export function distanceKmOf(i: PaceInput): number {
  if (i.race !== 'custom') return RACES[i.race].km;
  return i.distanceUnit === 'mi' ? D(i.customDistance).times(KM_PER_MILE).toNumber() : i.customDistance;
}

export function computePace(i: PaceInput): PaceOutput {
  const enteredPace = toSeconds(0, i.paceMin, i.paceSec);
  const paceKmFromInput = i.paceUnit === 'mi' ? D(enteredPace).div(KM_PER_MILE).toNumber() : enteredPace;
  let distanceKm = distanceKmOf(i);
  let timeSec = toSeconds(i.hours, i.minutes, i.seconds);
  if (i.mode === 'time') timeSec = D(paceKmFromInput).times(distanceKm).toNumber();
  if (i.mode === 'distance') distanceKm = paceKmFromInput > 0 ? D(timeSec).div(paceKmFromInput).toNumber() : 0;
  const paceKm = distanceKm > 0 ? D(timeSec).div(distanceKm).toNumber() : 0;
  const paceMi = D(paceKm).times(KM_PER_MILE).toNumber();
  const kph = timeSec > 0 ? D(distanceKm).div(D(timeSec).div(3600)).toNumber() : 0;
  const mph = D(kph).div(KM_PER_MILE).toNumber();
  const predictions = (Object.keys(RACES) as RaceKey[]).map((key) => ({
    key,
    label: RACES[key].label,
    samePace: D(paceKm).times(RACES[key].km).toNumber(),
    riegel: riegel(timeSec, distanceKm, RACES[key].km),
  }));
  const unit = i.distanceUnit;
  const per = unit === 'mi' ? paceMi : paceKm;
  const total = unit === 'mi' ? D(distanceKm).div(KM_PER_MILE).toNumber() : distanceKm;
  const splits: PaceOutput['splits'] = [];
  for (let n = 1; n <= Math.min(Math.floor(total), 200); n++) splits.push({ n, unit, elapsed: D(per).times(n).toNumber() });
  if (total % 1 > 0.001 && splits.length < 200) splits.push({ n: D(total).toDecimalPlaces(2).toNumber(), unit, elapsed: timeSec });
  return { distanceKm, distanceMi: D(distanceKm).div(KM_PER_MILE).toNumber(), timeSec, hours: D(timeSec).div(3600).toNumber(), paceKm, paceMi, kph, mph, predictions, splits };
}
