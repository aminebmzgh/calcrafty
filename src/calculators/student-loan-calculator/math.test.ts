import { describe, expect, it } from 'vitest';
import { computeStudentLoan, graduatedTerms, planSchedule, tieredYears } from './math.ts';

/** Level payment by the textbook formula, in floating point (independent of the decimal code). */
const level = (P: number, apr: number, n: number) => {
  const r = apr / 1200;
  return Math.round(((P * r) / (1 - (1 + r) ** -n)) * 100) / 100;
};

describe('standard plan', () => {
  // Classic Federal Student Aid example: $10,000 at 6.8% over 10 years is $115.08 a month.
  it('$10,000 at 6.8% → $115.08', () => {
    const s = planSchedule('standard', 10_000, 6.8);
    expect(s.firstPayment).toBe(115.08);
    expect(s.months).toBe(120);
    expect(s.rows.at(-1)!.balance).toBe(0);
  });
  it('$35,000 at 6.52% matches the formula', () => expect(planSchedule('standard', 35_000, 6.52).firstPayment).toBe(level(35_000, 6.52, 120)));
});

describe('extended plan', () => {
  it('25 years, matches the formula', () => {
    const s = planSchedule('extended', 40_000, 6.52);
    expect(s.months).toBe(300);
    expect(s.firstPayment).toBe(level(40_000, 6.52, 300));
  });
  it('needs more than $30,000', () => {
    expect(planSchedule('extended', 30_000, 6.52).eligible).toBe(false);
    expect(planSchedule('extended', 30_000.01, 6.52).eligible).toBe(true);
  });
});

describe('tiered standard plan', () => {
  it('term by balance tier', () => {
    expect([24_999.99, 25_000, 49_999.99, 50_000, 99_999.99, 100_000, 300_000].map(tieredYears)).toEqual([10, 15, 15, 20, 20, 25, 25]);
  });
  it('$60,000 → 20 years, matches the formula', () => {
    const s = planSchedule('tiered', 60_000, 8.07);
    expect(s.months).toBe(240);
    expect(s.firstPayment).toBe(level(60_000, 8.07, 240));
  });
});

describe('graduated plan (estimate)', () => {
  const s = planSchedule('graduated', 35_000, 6.52);
  const payments = s.rows.map((r) => r.payment);
  it('pays off in 10 years', () => {
    expect(s.months).toBe(120);
    expect(s.rows.at(-1)!.balance).toBe(0);
  });
  it('steps up every 24 months, level within each step', () => {
    for (let k = 0; k < 5; k++) {
      const step = payments.slice(24 * k, 24 * k + 23);
      expect(new Set(step).size).toBe(1);
      if (k > 0) expect(step[0]!).toBeGreaterThan(payments[24 * k - 1]!);
    }
  });
  it('no payment is more than 3 times another (allowing the final cent adjustment)', () => {
    expect(Math.max(...payments) / Math.min(...payments)).toBeLessThanOrEqual(3.001);
  });
  it('the first payment covers the interest', () => expect(s.firstPayment).toBeGreaterThanOrEqual(35_000 * 0.0652 / 12));
  it('last payment is within a dollar of its step (rounding only)', () => expect(Math.abs(payments[119]! - payments[118]!)).toBeLessThan(1));
  it('costs more interest than standard', () => expect(s.totalInterest).toBeGreaterThan(planSchedule('standard', 35_000, 6.52).totalInterest));
  // At 15%, the steepest allowed rise would start below the interest, so the plan starts at the interest instead.
  it('interest floor at a high rate', () => {
    const t = graduatedTerms(35_000, 15);
    expect(t.first).toBe(437.5);
    expect(t.step).toBeLessThan(3 ** 0.25);
    const h = planSchedule('graduated', 35_000, 15);
    expect(h.rows.at(-1)!.balance).toBe(0);
    expect(Math.abs(h.rows[119]!.payment - h.rows[118]!.payment)).toBeLessThan(1);
  });
  it('0% interest', () => {
    const z = planSchedule('graduated', 12_000, 0);
    expect(z.totalInterest).toBe(0);
    expect(z.rows.at(-1)!.balance).toBe(0);
  });
});

describe('computeStudentLoan', () => {
  it('extra payment saves interest and months', () => {
    const o = computeStudentLoan({ balance: 35_000, interestRate: 6.52, plan: 'standard', extraMonthly: 100 });
    expect(o.monthsSaved).toBeGreaterThan(0);
    expect(o.interestSaved).toBeGreaterThan(0);
    expect(o.plans).toHaveLength(4);
  });
  it('first month interest: $35,000 × 6.52% ÷ 12 = $190.17', () => expect(computeStudentLoan({ balance: 35_000, interestRate: 6.52, plan: 'standard', extraMonthly: 0 }).firstInterest).toBe(190.17));
  it('zero balance', () => {
    const o = computeStudentLoan({ balance: 0, interestRate: 6.52, plan: 'graduated', extraMonthly: 0 });
    expect(o.selected.firstPayment).toBe(0);
  });
});
