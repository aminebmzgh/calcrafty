import { describe, expect, it } from 'vitest';
import { computeMargin, marginToMarkup, markupToMargin, priceForMargin, type MarginInput } from './math.ts';

const base: MarginInput = { mode: 'costPrice', cost: 45, price: 75, margin: 40, markup: 50, units: 1 };

describe('margin', () => {
  // Cost $45, price $75: profit $30; margin 30 ÷ 75 = 40%; markup 30 ÷ 45 = 66.6667%.
  it('margin and markup from cost and price', () => {
    const o = computeMargin(base);
    expect(o.profit).toBe(30);
    expect(o.margin).toBe(40);
    expect(o.markup).toBe(66.6667);
  });
  // Price for a 40% margin on a $45 cost: 45 ÷ 0.6 = $75.00.
  it('price from cost and margin', () => expect(computeMargin({ ...base, mode: 'costMargin', margin: 40 }).price).toBe(75));
  // $60 at 35% margin: 60 ÷ 0.65 = 92.3077 → $92.31; the realised margin on the rounded price is 32.31 ÷ 92.31 = 35.0016%.
  it('price rounds to the cent', () => {
    const o = computeMargin({ ...base, mode: 'costMargin', cost: 60, margin: 35 });
    expect(o.price).toBe(92.31);
    expect(o.profit).toBe(32.31);
    expect(o.margin).toBe(35.0016);
  });
  // 50% markup on $20: $30; margin 10 ÷ 30 = 33.3333%.
  it('price from cost and markup', () => {
    const o = computeMargin({ ...base, mode: 'costMarkup', cost: 20, markup: 50 });
    expect(o.price).toBe(30);
    expect(o.margin).toBe(33.3333);
  });
  // A $120 price at a 25% margin allows a cost of $90.
  it('maximum cost from price and margin', () => expect(computeMargin({ ...base, mode: 'priceMargin', price: 120, margin: 25 }).cost).toBe(90));
  it('margin ↔ markup conversions', () => {
    expect(marginToMarkup(50)).toBe(100);
    expect(marginToMarkup(20)).toBe(25);
    expect(marginToMarkup(30)).toBe(42.8571);
    expect(markupToMargin(25)).toBe(20);
    expect(markupToMargin(100)).toBe(50);
    expect(priceForMargin(10, 60)).toBe(25);
  });
  it('totals for units sold', () => {
    const o = computeMargin({ ...base, units: 200 });
    expect(o.totalRevenue).toBe(15000);
    expect(o.totalProfit).toBe(6000);
  });
  it('a sale below cost has a negative margin', () => {
    const o = computeMargin({ ...base, cost: 80, price: 64 });
    expect(o.profit).toBe(-16);
    expect(o.margin).toBe(-25);
    expect(o.markup).toBe(-20);
  });
  it('rejects impossible inputs', () => {
    expect(computeMargin({ ...base, mode: 'costMargin', margin: 100 }).valid).toBe(false);
    expect(computeMargin({ ...base, price: 0 }).valid).toBe(false);
  });
  it('table of common margins', () => {
    const t = computeMargin(base).table;
    expect(t.find((r) => r.margin === 25)).toEqual({ margin: 25, markup: 33.3333, price: 60, profit: 15 });
  });
});
