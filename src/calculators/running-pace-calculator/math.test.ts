import { describe, expect, it } from 'vitest';
import { clock, computePace, riegel, type PaceInput } from './math.ts';

const base: PaceInput = { mode: 'pace', race: 'marathon', customDistance: 3, distanceUnit: 'mi', hours: 4, minutes: 0, seconds: 0, paceMin: 9, paceSec: 0, paceUnit: 'mi' };

describe('pace references', () => {
  // Marathon (42.195 km = 26.2188 mi) in 4:00:00 → 14,400 s ÷ 26.2188 = 549.2 s/mi = 9:09 per mile; 341.3 s/km = 5:41 per km.
  it('4-hour marathon pace is 9:09/mi and 5:41/km', () => {
    const o = computePace(base);
    expect(clock(o.paceMi)).toBe('9:09');
    expect(clock(o.paceKm)).toBe('5:41');
  });
  // 5K in 25:00 → 300 s/km = 5:00/km, 8:03/mi, 12 km/h.
  it('25-minute 5K is 5:00/km and 12 km/h', () => {
    const o = computePace({ ...base, race: '5k', hours: 0, minutes: 25 });
    expect(clock(o.paceKm)).toBe('5:00');
    expect(clock(o.paceMi)).toBe('8:03');
    expect(o.kph).toBeCloseTo(12, 10);
  });
  // 10 minute miles for a marathon → 26.2188 × 600 s = 15,731 s = 4:22:11.
  it('finish time at 10:00/mi for a marathon is 4:22:11', () => {
    const o = computePace({ ...base, mode: 'time', paceMin: 10, paceSec: 0 });
    expect(clock(o.timeSec)).toBe('4:22:11');
  });
  // Distance: 1 hour at 6:00/km = 10 km.
  it('distance in 1 hour at 6:00/km is 10 km', () => {
    const o = computePace({ ...base, mode: 'distance', hours: 1, minutes: 0, paceMin: 6, paceSec: 0, paceUnit: 'km' });
    expect(o.distanceKm).toBeCloseTo(10, 10);
  });
});

describe('predictions and splits', () => {
  // Riegel: 5K in 25:00 → 10K = 1,500 × 2^1.06 = 3,127.5 s ≈ 52:07.
  it('Riegel 10K prediction from a 25:00 5K is 52:07', () => expect(clock(riegel(1500, 5, 10))).toBe('52:07'));
  it('splits end exactly at the finish time', () => {
    const o = computePace(base);
    expect(o.splits).toHaveLength(27);
    expect(o.splits.at(-1)!.elapsed).toBe(14_400);
  });
  it('custom distance in miles', () => expect(computePace({ ...base, race: 'custom', customDistance: 3, distanceUnit: 'mi', hours: 0, minutes: 27 }).paceMi).toBeCloseTo(540, 6));
  it('clock formatting', () => {
    expect(clock(59.6)).toBe('1:00');
    expect(clock(3600)).toBe('1:00:00');
    expect(clock(-1)).toBe('—');
  });
});
