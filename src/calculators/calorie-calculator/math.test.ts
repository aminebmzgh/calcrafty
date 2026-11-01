import { describe, expect, it } from 'vitest';
import { bmrHarris, bmrKatch, bmrMifflin, computeCalories, type CalorieInput } from './math.ts';

const base: CalorieInput = { units: 'metric', heightFt: 0, heightIn: 0, heightCm: 180, weightLb: 0, weightKg: 80, sex: 'male', age: 30, activity: 'sedentary', formula: 'mifflin', bodyFat: 20, goal: 'maintain' };

describe('BMR formula references', () => {
  // Mifflin-St Jeor (1990): men 10W + 6.25H − 5A + 5 → 800 + 1,125 − 150 + 5 = 1,780.
  it('Mifflin-St Jeor, man 80 kg, 180 cm, 30 y = 1,780', () => expect(bmrMifflin('male', 80, 180, 30)).toBe(1780));
  // Women: 10W + 6.25H − 5A − 161 → 600 + 1,031.25 − 125 − 161 = 1,345.25.
  it('Mifflin-St Jeor, woman 60 kg, 165 cm, 25 y = 1,345.25', () => expect(bmrMifflin('female', 60, 165, 25)).toBe(1345.25));
  // Roza & Shizgal (1984) revised Harris-Benedict: 88.362 + 13.397×80 + 4.799×180 − 5.677×30 = 1,853.632.
  it('Harris-Benedict (revised), man = 1,853.632', () => expect(bmrHarris('male', 80, 180, 30)).toBeCloseTo(1853.632, 3));
  // Women: 447.593 + 9.247×60 + 3.098×165 − 4.330×25 = 1,405.333.
  it('Harris-Benedict (revised), woman = 1,405.333', () => expect(bmrHarris('female', 60, 165, 25)).toBeCloseTo(1405.333, 3));
  // Katch-McArdle: 370 + 21.6 × lean mass; 80 kg at 20% fat → 64 kg → 1,752.4.
  it('Katch-McArdle, 80 kg at 20% body fat = 1,752.4', () => expect(bmrKatch(80, 20)).toBeCloseTo(1752.4, 6));
});

describe('TDEE and goals', () => {
  it('TDEE = BMR × activity factor', () => {
    expect(computeCalories(base).tdee).toBe(2136); // 1,780 × 1.2
    expect(computeCalories({ ...base, activity: 'moderate' }).tdee).toBe(2759); // 1,780 × 1.55
  });
  it('1 lb a week = 500 kcal a day', () => {
    const o = computeCalories({ ...base, goal: 'lose1' });
    expect(o.target).toBe(1636);
    expect(o.dailyAdjustment).toBe(-500);
  });
  it('flags targets below the usual minimum', () => {
    const o = computeCalories({ ...base, sex: 'female', weightKg: 50, heightCm: 155, age: 60, goal: 'lose2' });
    expect(o.belowFloor).toBe(true);
  });
  it('imperial input converts exactly', () => {
    const o = computeCalories({ ...base, units: 'imperial', heightFt: 5, heightIn: 11, weightLb: 176 });
    expect(o.heightCm).toBeCloseTo(180.34, 2);
    expect(o.weightKg).toBeCloseTo(79.832, 3);
  });
});
