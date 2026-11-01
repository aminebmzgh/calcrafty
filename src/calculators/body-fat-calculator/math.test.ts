import { describe, expect, it } from 'vitest';
import { bmiBodyFat, categoryFor, computeBodyFat, navyBodyFat, type BodyFatInput } from './math.ts';

describe('US Navy method (Hodgdon & Beckett 1984, inch form)', () => {
  // Man, 70 in tall, neck 15 in, waist 34 in:
  // 86.010 × log10(19) − 70.041 × log10(70) + 36.76 = 17.51%.
  it('man 70/15/34 → 17.5%', () => expect(navyBodyFat('male', 70, 15, 34, 0)).toBeCloseTo(17.51, 2));
  // Woman, 64 in tall, neck 13, waist 30, hip 38:
  // 163.205 × log10(55) − 97.684 × log10(64) − 78.387 = 29.21%.
  it('woman 64/13/30/38 → 29.2%', () => expect(navyBodyFat('female', 64, 13, 30, 38)).toBeCloseTo(29.21, 2));
  it('impossible measurements return null', () => expect(navyBodyFat('male', 70, 34, 30, 0)).toBeNull());
});

describe('BMI method (Deurenberg 1991)', () => {
  // 1.20 × 25 + 0.23 × 40 − 10.8 − 5.4 = 23.0 (men); women omit −10.8 → 33.8.
  it('man, BMI 25, age 40 → 23.0%', () => expect(bmiBodyFat('male', 25, 40)).toBeCloseTo(23, 6));
  it('woman, BMI 25, age 40 → 33.8%', () => expect(bmiBodyFat('female', 25, 40)).toBeCloseTo(33.8, 6));
});

describe('categories and full calculation', () => {
  it('ACE categories', () => {
    expect(categoryFor('male', 12)).toBe('Athletes');
    expect(categoryFor('male', 20)).toBe('Average');
    expect(categoryFor('female', 22)).toBe('Fitness');
    expect(categoryFor('female', 33)).toBe('Obese');
  });
  it('metric and imperial agree', () => {
    const imp: BodyFatInput = { units: 'imperial', heightFt: 5, heightIn: 10, heightCm: 0, weightLb: 180, weightKg: 0, sex: 'male', age: 40, neckIn: 15, waistIn: 34, hipIn: 0, neckCm: 0, waistCm: 0, hipCm: 0 };
    const met: BodyFatInput = { ...imp, units: 'metric', heightCm: 177.8, weightKg: 81.6466266, neckCm: 38.1, waistCm: 86.36 };
    expect(computeBodyFat(imp).navy).toBe(17.5);
    expect(computeBodyFat(met).navy).toBe(17.5);
    expect(computeBodyFat(imp).fatKg).toBeCloseTo(14.3, 1);
  });
});
