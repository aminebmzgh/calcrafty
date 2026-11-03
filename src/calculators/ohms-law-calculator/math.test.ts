import { describe, expect, it } from 'vitest';
import { computeOhms, type OhmsInput } from './math.ts';

const base: OhmsInput = { known: 'VR', voltage: 12, current: 2, resistance: 6, power: 24 };

describe("Ohm's law", () => {
  // 12 V across 6 Ω: I = 12 ÷ 6 = 2 A; P = 12² ÷ 6 = 24 W.
  it('voltage and resistance', () => {
    const o = computeOhms(base);
    expect([o.current, o.power]).toEqual([2, 24]);
  });
  // 2 A through 6 Ω: V = 12 V; P = 2² × 6 = 24 W.
  it('current and resistance', () => expect(computeOhms({ ...base, known: 'IR' })).toMatchObject({ voltage: 12, power: 24 }));
  // 12 V at 2 A: R = 6 Ω; P = 24 W.
  it('voltage and current', () => expect(computeOhms({ ...base, known: 'VI' })).toMatchObject({ resistance: 6, power: 24 }));
  // A 1,500 W heater on 120 V draws 12.5 A and has 9.6 Ω (120² ÷ 1,500).
  it('power and voltage', () => expect(computeOhms({ ...base, known: 'PV', power: 1_500, voltage: 120 })).toMatchObject({ current: 12.5, resistance: 9.6 }));
  // 60 W at 0.5 A: V = 120 V; R = 60 ÷ 0.25 = 240 Ω.
  it('power and current', () => expect(computeOhms({ ...base, known: 'PI', power: 60, current: 0.5 })).toMatchObject({ voltage: 120, resistance: 240 }));
  // 100 W in 4 Ω: I = √25 = 5 A; V = √400 = 20 V.
  it('power and resistance', () => expect(computeOhms({ ...base, known: 'PR', power: 100, resistance: 4 })).toMatchObject({ current: 5, voltage: 20 }));
  it('division by zero is flagged', () => expect(computeOhms({ ...base, resistance: 0 }).valid).toBe(false));
  it('reports the formulas used', () => expect(computeOhms(base).formulas).toEqual(['I = V ÷ R', 'P = V² ÷ R']));
});
