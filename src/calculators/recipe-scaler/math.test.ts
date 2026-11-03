import { describe, expect, it } from 'vitest';
import { computeRecipe, kitchenFraction, parseQuantity } from './math.ts';

describe('reading quantities', () => {
  it('whole number', () => expect(parseQuantity('3 eggs')).toEqual({ quantity: 3, rest: 'eggs' }));
  it('mixed number', () => expect(parseQuantity('1 1/2 tsp salt')).toEqual({ quantity: 1.5, rest: 'tsp salt' }));
  it('fraction', () => expect(parseQuantity('1/3 cup sugar')!.quantity).toBeCloseTo(1 / 3, 10));
  it('decimal', () => expect(parseQuantity('0.75 cup milk')).toEqual({ quantity: 0.75, rest: 'cup milk' }));
  it('unicode fraction', () => expect(parseQuantity('½ cup butter')).toEqual({ quantity: 0.5, rest: 'cup butter' }));
  it('whole plus unicode', () => expect(parseQuantity('2½ cups flour')).toEqual({ quantity: 2.5, rest: 'cups flour' }));
  it('no quantity', () => expect(parseQuantity('salt to taste')).toBeNull());
});

describe('kitchen fractions', () => {
  it('2.25 → 2 1/4', () => expect(kitchenFraction(2.25).text).toBe('2 1/4'));
  // Half of 1/3 cup is 1/6 cup (2 tbsp + 2 tsp).
  it('sixths', () => expect(kitchenFraction(1 / 6).text).toBe('1/6'));
  it('0.5 → 1/2', () => expect(kitchenFraction(0.5).text).toBe('1/2'));
  // 1/3 × 1.5 = 0.5 exactly; 2/3 × 1.5 = 1.
  it('thirds', () => expect(kitchenFraction(0.6667).text).toBe('2/3'));
  it('rounds up to the next whole', () => expect(kitchenFraction(2.96).text).toBe('3'));
  it('never rounds to nothing', () => expect(kitchenFraction(0.03).text).toBe('1/8'));
});

describe('scaling a recipe from 4 to 6 servings (× 1.5)', () => {
  const o = computeRecipe({ servings: 4, newServings: 6, ingredients: '2 cups flour\n1 1/2 tsp salt\n3 eggs\n1/3 cup sugar\nsalt to taste' });
  it('factor', () => expect(o.factor).toBe(1.5));
  // 2 → 3; 1.5 → 2.25 = 2 1/4; 3 → 4.5 = 4 1/2; 1/3 → 0.5 = 1/2.
  it('scaled amounts', () => expect(o.lines.map((l) => l.display)).toEqual(['3', '2 1/4', '4 1/2', '1/2', null]));
  it('lines without quantities are kept', () => expect(o.lines[4]!.rest).toBe('salt to taste'));
  it('counts scaled lines', () => expect(o.scaledCount).toBe(4));
});

describe('halving and odd factors', () => {
  // 3 eggs ÷ 2 = 1.5; 3/4 cup ÷ 2 = 3/8.
  it('halving', () => expect(computeRecipe({ servings: 8, newServings: 4, ingredients: '3 eggs\n3/4 cup milk' }).lines.map((l) => l.display)).toEqual(['1 1/2', '3/8']));
  // 1 cup × 5/4 = 1.25 = 1 1/4 exactly; 1 tsp × 5/3 = 1.6667 → 1 2/3.
  it('odd factors', () => expect(computeRecipe({ servings: 3, newServings: 5, ingredients: '1 tsp vanilla' }).lines[0]!.display).toBe('1 2/3'));
  // 1 tsp × 0.7 = 0.7 → 2/3 (closer than 3/4; 4.8% off), not flagged.
  it('nearest fraction within 5%', () => {
    const l = computeRecipe({ servings: 10, newServings: 7, ingredients: '1 tsp yeast' }).lines[0]!;
    expect([l.display, l.approximate]).toEqual(['2/3', false]);
  });
  // 1 tsp × 0.06 = 0.06 → 1/8 (more than double): flagged as approximate.
  it('flags approximations', () => {
    const l = computeRecipe({ servings: 50, newServings: 3, ingredients: '1 tsp yeast' }).lines[0]!;
    expect([l.display, l.approximate]).toEqual(['1/8', true]);
  });
});
