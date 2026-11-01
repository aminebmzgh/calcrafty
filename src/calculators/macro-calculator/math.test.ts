import { describe, expect, it } from 'vitest';
import { computeMacros, splitMacros, type MacroInput } from './math.ts';

describe('macro split references (Atwater: 4/4/9 kcal per gram)', () => {
  // 2,000 kcal at 25/50/25 → protein 500 kcal = 125 g, carbs 1,000 kcal = 250 g, fat 500 kcal = 55.6 → 56 g.
  it('2,000 kcal balanced', () => {
    const m = splitMacros(2000, 25, 50, 25);
    expect([m.protein.grams, m.carbs.grams, m.fat.grams]).toEqual([125, 250, 56]);
  });
  // 2,000 kcal keto 20/5/75 → 100 g protein, 25 g carbs, 1,500/9 = 166.7 → 167 g fat.
  it('2,000 kcal keto', () => {
    const m = splitMacros(2000, 20, 5, 75);
    expect([m.protein.grams, m.carbs.grams, m.fat.grams]).toEqual([100, 25, 167]);
  });
  // 1,800 kcal at 30/40/30 → 135 g, 180 g, 60 g.
  it('1,800 kcal 30/40/30', () => {
    const m = splitMacros(1800, 30, 40, 30);
    expect([m.protein.grams, m.carbs.grams, m.fat.grams]).toEqual([135, 180, 60]);
  });
  // 0 kcal → 0 g everywhere.
  it('zero calories', () => expect(splitMacros(0, 30, 40, 30).fat.grams).toBe(0));
});

describe('macro calculator', () => {
  const base: MacroInput = { units: 'metric', heightFt: 0, heightIn: 0, heightCm: 180, weightLb: 0, weightKg: 80, sex: 'male', age: 30, activity: 'sedentary', goal: 'maintain', preset: 'balanced', customProtein: 30, customCarbs: 40, customFat: 30, meals: 3 };
  it('uses the calorie calculator’s TDEE (1,780 × 1.2 = 2,136)', () => {
    const o = computeMacros(base);
    expect(o.calories).toBe(2136);
    expect(o.protein.grams).toBe(134); // 2,136 × 25% ÷ 4 = 133.5 → 134
  });
  it('per meal and per kg', () => {
    const o = computeMacros(base);
    expect(o.perMeal.protein).toBe(45);
    expect(o.proteinPerKg).toBe(1.7);
  });
  it('custom split must total 100%', () => expect(computeMacros({ ...base, preset: 'custom', customProtein: 40 }).splitTotal).toBe(110));
});
