import { describe, expect, it } from 'vitest';
import { computeWeight, convertWeight } from './math.ts';

describe('exact weight conversions', () => {
  it('1 lb = 0.45359237 kg', () => expect(convertWeight(1, 'lb', 'kg')).toBe(0.45359237));
  // 1 ÷ 0.45359237 = 2.20462262185 lb.
  it('1 kg = 2.20462262185 lb', () => expect(convertWeight(1, 'kg', 'lb')).toBe(2.20462262185));
  // 0.45359237 ÷ 16 × 1000 = 28.349523125 g.
  it('1 oz = 28.349523125 g', () => expect(convertWeight(1, 'oz', 'g')).toBe(28.349523125));
  it('1 stone = 6.35029318 kg', () => expect(convertWeight(1, 'st', 'kg')).toBe(6.35029318));
  it('1 short ton = 907.18474 kg', () => expect(convertWeight(1, 'ton', 'kg')).toBe(907.18474));
  it('1 long ton = 1,016.0469088 kg', () => expect(convertWeight(1, 'lt', 'kg')).toBe(1016.0469088));
  it('1 metric ton = 2,204.62262185 lb', () => expect(convertWeight(1, 't', 'lb')).toBe(2204.62262185));
  // 31.1034768 ÷ 28.349523125 = 1.09714285714 avoirdupois ounces.
  it('1 troy oz = 1.09714285714 oz', () => expect(convertWeight(1, 'ozt', 'oz')).toBe(1.09714285714));
  it('1 g = 1,000 mg', () => expect(convertWeight(1, 'g', 'mg')).toBe(1000));
});

describe('computeWeight', () => {
  // 70 kg = 154.323583529 lb = 154 lb 5.18 oz; = 11 st 0.3 lb.
  it('pounds and ounces, stone and pounds', () => {
    const o = computeWeight({ value: 70, from: 'kg', to: 'lb' });
    expect(o.result).toBe(154.323583529);
    expect(o.poundsOunces).toEqual({ pounds: 154, ounces: 5.18 });
    expect(o.stonePounds).toEqual({ stone: 11, pounds: 0.3 });
  });
  // 16 oz exactly is 1 lb 0 oz, not 0 lb 16 oz.
  it('whole pounds', () => expect(computeWeight({ value: 16, from: 'oz', to: 'g' }).poundsOunces).toEqual({ pounds: 1, ounces: 0 }));
  it('every unit', () => {
    const o = computeWeight({ value: 1, from: 'kg', to: 'lb' });
    expect(o.all.find((r) => r.unit === 'g')!.value).toBe(1000);
    expect(o.all).toHaveLength(10);
  });
});
