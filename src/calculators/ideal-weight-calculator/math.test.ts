import { describe, expect, it } from 'vitest';
import { computeIdealWeight, type IdealWeightInput } from './math.ts';

const person = (sex: 'male' | 'female', ft: number, inch: number): IdealWeightInput => ({ units: 'imperial', heightFt: ft, heightIn: inch, heightCm: 0, weightLb: 170, weightKg: 0, sex });
const kg = (o: ReturnType<typeof computeIdealWeight>, id: string) => o.results.find((r) => r.id === id)!.kg;

describe('ideal weight references (published formulas)', () => {
  // Man, 5 ft 10 in (10 in over 5 ft): Robinson 52 + 19 = 71.0; Miller 56.2 + 14.1 = 70.3; Devine 50 + 23 = 73.0; Hamwi 48 + 27 = 75.0.
  it('man at 5 ft 10 in', () => {
    const o = computeIdealWeight(person('male', 5, 10));
    expect([kg(o, 'robinson'), kg(o, 'miller'), kg(o, 'devine'), kg(o, 'hamwi')]).toEqual([71, 70.3, 73, 75]);
  });
  // Woman, 5 ft 4 in (4 in over): Robinson 49 + 6.8 = 55.8; Miller 53.1 + 5.44 = 58.5; Devine 45.5 + 9.2 = 54.7; Hamwi 45.5 + 8.8 = 54.3.
  it('woman at 5 ft 4 in', () => {
    const o = computeIdealWeight(person('female', 5, 4));
    expect([kg(o, 'robinson'), kg(o, 'miller'), kg(o, 'devine'), kg(o, 'hamwi')]).toEqual([55.8, 58.5, 54.7, 54.3]);
  });
  // At exactly 5 ft every formula returns its base.
  it('at exactly 5 ft each formula returns its base value', () => {
    const o = computeIdealWeight(person('male', 5, 0));
    expect([kg(o, 'robinson'), kg(o, 'miller'), kg(o, 'devine'), kg(o, 'hamwi')]).toEqual([52, 56.2, 50, 48]);
  });
  // Metric: 180 cm = 70.866 in → Devine man 50 + 2.3 × 10.866 = 74.99 → 75.0.
  it('metric height converts exactly', () => {
    const o = computeIdealWeight({ ...person('male', 0, 0), units: 'metric', heightCm: 180, weightKg: 80 });
    expect(kg(o, 'devine')).toBe(75);
  });
});

describe('ideal weight summary', () => {
  it('range, average and BMI range', () => {
    const o = computeIdealWeight(person('male', 5, 10));
    expect(o.minKg).toBe(70.3);
    expect(o.maxKg).toBe(75);
    expect(o.averageKg).toBe(72.3);
    expect(o.bmiMinKg).toBe(58.5);
    expect(o.bmiMaxKg).toBe(78.7);
  });
  it('flags heights under 5 ft', () => expect(computeIdealWeight(person('female', 4, 10)).under5ft).toBe(true));
});
