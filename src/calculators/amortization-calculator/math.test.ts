import { describe, expect, it } from 'vitest';
import { amortize } from '../../lib/math/money.ts';
import { computeAmortization, extraFor, firstPaymentDate, schedule, type AmortizationInput } from './math.ts';

const base: AmortizationInput = { amount: 200_000, interestRate: 6.5, term: 30, termUnit: 'years', startDate: '2027-01-01', extraMonthly: 0, extraYearly: 0, lumpSum: 0, lumpSumMonth: 12 };

describe('schedule', () => {
  // Standard reference: $200,000 at 6.5% for 30 years is $1,264.14 a month.
  it('reference payment and first month', () => {
    const s = schedule(200_000, 6.5, 360);
    expect(s.payment).toBe(1264.14);
    // 200,000 × 0.065 ÷ 12 = 1,083.33 interest; 1,264.14 − 1,083.33 = 180.81 principal.
    expect(s.rows[0]).toMatchObject({ interest: 1083.33, principal: 180.81 });
    expect(s.rows).toHaveLength(360);
    expect(s.rows.at(-1)!.balance).toBe(0);
  });

  it('agrees to the cent with the shared amortize() on random loans with monthly extras', () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 150; k++) {
      const P = Math.round(1_000 + rnd() * 900_000);
      const r = Math.round(rnd() * 1500) / 100;
      const n = 12 + Math.floor(rnd() * 349);
      const extra = rnd() < 0.5 ? 0 : Math.round(rnd() * 2000);
      const a = amortize(P, r, n, extra);
      const b = schedule(P, r, n, { monthly: extra, yearly: 0, lumpSum: 0, lumpSumMonth: 0 });
      expect(b.payment).toBe(a.payment);
      expect(b.totalInterest).toBe(a.totalInterest);
      expect(b.rows.length).toBe(a.months);
    }
  });

  // $1,200 at 0% over 12 months is $100 a month; $600 extra with payment 1 leaves $500, so 5 more payments.
  it('lump sum', () => {
    const s = schedule(1_200, 0, 12, { monthly: 0, yearly: 0, lumpSum: 600, lumpSumMonth: 1 });
    expect(s.rows[0]).toMatchObject({ principal: 100, extra: 600, balance: 500 });
    expect(s.rows).toHaveLength(6);
  });

  // $12,000 at 0% over 24 months is $500 a month; $1,000 extra with payment 12 leaves $5,000 → 10 more payments.
  it('yearly extra goes with every 12th payment', () => {
    const s = schedule(12_000, 0, 24, { monthly: 0, yearly: 1_000, lumpSum: 0, lumpSumMonth: 0 });
    expect(s.rows[11]).toMatchObject({ extra: 1000, balance: 5000 });
    expect(s.rows).toHaveLength(22);
  });

  it('extra never overpays the balance', () => {
    const s = schedule(1_000, 5, 12, { monthly: 0, yearly: 0, lumpSum: 5_000, lumpSumMonth: 2 });
    expect(s.rows).toHaveLength(2);
    expect(s.rows[1]!.balance).toBe(0);
    expect(s.totalPaid).toBeLessThan(1_010);
  });
});

describe('extraFor', () => {
  const x = { monthly: 50, yearly: 1_000, lumpSum: 5_000, lumpSumMonth: 24 };
  it('combines the three kinds', () => {
    expect(extraFor(1, x)).toBe(50);
    expect(extraFor(12, x)).toBe(1_050);
    expect(extraFor(24, x)).toBe(6_050);
  });
});

describe('dates', () => {
  it('defaults to the first of next month', () => expect(firstPaymentDate('', '2026-11-06')).toEqual({ y: 2026, m: 12, d: 1 }));
  it('rolls over the year', () => expect(firstPaymentDate('', '2026-12-31')).toEqual({ y: 2027, m: 1, d: 1 }));
  it('payoff date of a 30-year loan starting January 2027 is December 2056', () => {
    const o = computeAmortization(base);
    expect(o.firstDate).toBe('January 1, 2027');
    expect(o.payoffDate).toBe('December 1, 2056');
  });
});

describe('computeAmortization', () => {
  it('no extras: nothing saved', () => {
    const o = computeAmortization(base);
    expect(o.payment).toBe(1264.14);
    expect(o.interestSaved).toBe(0);
    expect(o.monthsSaved).toBe(0);
    expect(o.totalPaid).toBe(Math.round((o.totalInterest + 200_000) * 100) / 100);
  });

  it('extras save interest and months, and match amortize() for monthly-only', () => {
    const o = computeAmortization({ ...base, extraMonthly: 200 });
    const ref = amortize(200_000, 6.5, 360, 200);
    expect(o.payoffMonths).toBe(ref.months);
    expect(o.totalInterest).toBe(ref.totalInterest);
    expect(o.interestSaved).toBeGreaterThan(0);
    expect(o.monthsSaved).toBe(360 - ref.months);
  });

  it('crossover is the first payment where principal exceeds interest', () => {
    const o = computeAmortization(base);
    const row = o.rows[o.crossoverPeriod - 1]!;
    const prev = o.rows[o.crossoverPeriod - 2]!;
    expect(row.principal).toBeGreaterThan(row.interest);
    expect(prev.principal).toBeLessThanOrEqual(prev.interest);
  });

  it('milestones are in order', () => {
    const o = computeAmortization(base);
    expect(o.milestones.map((m) => m.period)).toEqual([...o.milestones.map((m) => m.period)].sort((a, b) => a - b));
    expect(o.milestones).toHaveLength(3);
  });

  it('zero loan', () => {
    const o = computeAmortization({ ...base, amount: 0 });
    expect(o.payment).toBe(0);
    expect(o.rows).toHaveLength(0);
  });
});
