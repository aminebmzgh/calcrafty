import { describe, expect, it } from 'vitest';
import { computeTip, type TipInput } from './math.ts';

const base: TipInput = { bill: 85, tipPercent: 18, people: 2, roundUp: false };

describe('tip', () => {
  // $85 × 18% = $15.30; total $100.30; $50.15 each; $7.65 tip each.
  it('default bill', () => {
    const o = computeTip(base);
    expect(o.tip).toBe(15.3);
    expect(o.total).toBe(100.3);
    expect(o.perPerson).toBe(50.15);
    expect(o.tipPerPerson).toBe(7.65);
    expect(o.effectivePercent).toBe(18);
  });
  // Rounding each share up: $50.15 → $51 each, total $102, tip $17 = 20.0%.
  it('round up each share', () => {
    const o = computeTip({ ...base, roundUp: true });
    expect(o.perPerson).toBe(51);
    expect(o.total).toBe(102);
    expect(o.tip).toBe(17);
    expect(o.effectivePercent).toBe(20);
  });
  // $100 split 3 ways at 20%: $120 ÷ 3 = $40 exactly.
  it('three people', () => expect(computeTip({ ...base, bill: 100, tipPercent: 20, people: 3 }).perPerson).toBe(40));
  // $50 at 15% = $57.50 ÷ 3 = $19.1667, rounded up to the cent so the bill is covered: $19.17.
  it('uneven split rounds up to the cent', () => expect(computeTip({ ...base, bill: 50, tipPercent: 15, people: 3 }).perPerson).toBe(19.17));
  it('table of common percentages', () => {
    const t = computeTip(base).table;
    expect(t.map((r) => r.percent)).toEqual([10, 15, 18, 20, 22, 25]);
    // 20% of $85 = $17; total $102; $51 each.
    expect(t.find((r) => r.percent === 20)).toEqual({ percent: 20, tip: 17, total: 102, perPerson: 51 });
  });
  it('at least one person', () => expect(computeTip({ ...base, people: 0 }).people).toBe(1));
});
