import { describe, expect, it } from 'vitest';
import { computeBmi, categoryOf, type BmiInput } from './math.ts';

const imp = (ft: number, inch: number, lb: number): BmiInput => ({ units: 'imperial', heightFt: ft, heightIn: inch, heightCm: 0, weightLb: lb, weightKg: 0 });
const met = (cm: number, kg: number): BmiInput => ({ units: 'metric', heightFt: 0, heightIn: 0, heightCm: cm, weightLb: 0, weightKg: kg });

describe('BMI references (CDC "About adult BMI" worked examples)', () => {
  // CDC: weight 150 lb, height 5'5" (65") → 703 × 150 / 65² = 24.96 → 25.0.
  it('150 lb at 5 ft 5 in → 25.0', () => expect(computeBmi(imp(5, 5, 150)).bmiRounded).toBe(25));
  // CDC metric: 68 kg, 165 cm → 68 / 1.65² = 24.98 → 25.0.
  it('68 kg at 165 cm → 25.0', () => expect(computeBmi(met(165, 68)).bmiRounded).toBe(25));
  // NIH: 180 lb at 5 ft 10 in → 25.8.
  it('180 lb at 5 ft 10 in → 25.8', () => expect(computeBmi(imp(5, 10, 180)).bmiRounded).toBe(25.8));
  // 70 kg at 1.75 m → 22.857 → 22.9.
  it('70 kg at 175 cm → 22.9', () => expect(computeBmi(met(175, 70)).bmiRounded).toBe(22.9));
});

describe('BMI categories (CDC adult)', () => {
  it('boundaries', () => {
    expect(categoryOf(18.4)).toBe('Underweight');
    expect(categoryOf(18.5)).toBe('Healthy weight');
    expect(categoryOf(24.9)).toBe('Healthy weight');
    expect(categoryOf(25)).toBe('Overweight');
    expect(categoryOf(30)).toBe('Obesity class 1');
    expect(categoryOf(35)).toBe('Obesity class 2');
    expect(categoryOf(40)).toBe('Obesity class 3');
  });
  it('healthy range for 175 cm is 56.7–76.3 kg', () => {
    const o = computeBmi(met(175, 90));
    expect(o.healthyMinKg).toBe(56.7);
    expect(o.healthyMaxKg).toBe(76.3);
    expect(o.toHealthyKg).toBe(13.7);
  });
  it('underweight needs to gain', () => expect(computeBmi(met(175, 50)).toHealthyKg).toBeLessThan(0));
  it('zero height does not divide by zero', () => expect(computeBmi(met(0, 70)).bmi).toBe(0));
});
