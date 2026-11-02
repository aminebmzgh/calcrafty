import { describe, expect, it } from 'vitest';
import { clockOf, computeTimeCard, parseShift, toMinutes, type TimeCardInput } from './math.ts';

const week = ['Mon 8:30am - 5:15pm 30', 'Tue 8:30am - 5:15pm 30', 'Wed 8:30am - 6:00pm 30', 'Thu 8:30am - 5:15pm 30', 'Fri 8:30am - 4:00pm 30'].join('\n');
const base: TimeCardInput = { shifts: week, rate: 22, overtimeAfter: 40, multiplier: 1.5 };

describe('parsing shifts', () => {
  // 8:30am to 5:15pm = 8 h 45 min; minus a 30-minute break = 8 h 15 min = 495 minutes.
  it('12-hour times with a break', () => expect(parseShift('Mon 8:30am - 5:15pm 30')!.minutes).toBe(495));
  it('24-hour times', () => expect(parseShift('07:00 - 15:30')!.minutes).toBe(510));
  it('"to" and short am/pm forms', () => expect(parseShift('9a to 5p 60')!.minutes).toBe(420));
  // Overnight: 10:00pm to 6:30am = 8 h 30 min.
  it('overnight shifts', () => {
    const s = parseShift('Sat 10pm - 6:30am')!;
    expect(s.overnight).toBe(true);
    expect(s.minutes).toBe(510);
  });
  it('12am is midnight and 12pm is noon', () => {
    expect(toMinutes(12, 0, 'am')).toBe(0);
    expect(toMinutes(12, 0, 'pm')).toBe(720);
  });
  it('rejects nonsense', () => {
    expect(parseShift('hello')).toBeNull();
    expect(parseShift('13pm - 5pm')).toBeNull();
    expect(parseShift('9:75 - 17:00')).toBeNull();
    expect(parseShift('9:00 - 10:00 90')).toBeNull();
  });
  it('formats hours and minutes', () => expect(clockOf(2_415)).toBe('40:15'));
});

describe('weekly totals and pay', () => {
  // 495 × 3 + 540 (Wed, 9 h after break) + 420 (Fri, 7 h) = 2,445 minutes = 40.75 hours.
  it('adds up the week', () => {
    const o = computeTimeCard(base);
    expect(o.totalMinutes).toBe(2_445);
    expect(o.totalHours).toBe(40.75);
    expect(o.clock).toBe('40:45');
  });
  // 40 × $22 + 0.75 × $33 = $880 + $24.75 = $904.75.
  it('weekly overtime after 40 hours', () => {
    const o = computeTimeCard(base);
    expect(o.overtimeHours).toBe(0.75);
    expect(o.totalPay).toBe(904.75);
  });
  it('lists lines it could not read', () => expect(computeTimeCard({ ...base, shifts: `${week}\nlunch` }).invalid).toEqual(['lunch']));
  it('empty time card', () => expect(computeTimeCard({ ...base, shifts: '' }).totalPay).toBe(0));
});
