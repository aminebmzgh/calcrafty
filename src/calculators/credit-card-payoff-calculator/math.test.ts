import { describe, expect, it } from 'vitest';
import { computeCardPayoff, minimumPayment, type CardInput } from './math.ts';

const base: CardInput = { balance: 5_000, apr: 18, mode: 'payment', payment: 200, months: 24, minPct: 1, minFloor: 25 };

/** Independent float reference: same algorithm with plain numbers and cent rounding. */
function reference(balance: number, apr: number, pay: number) {
  let b = balance;
  let interest = 0;
  let n = 0;
  while (b > 0.001 && n < 600) {
    const i = Math.round(b * (apr / 1200) * 100) / 100;
    const p = Math.min(pay, b + i);
    b = Math.round((b + i - p) * 100) / 100;
    interest += i;
    n++;
  }
  return { n, interest: Math.round(interest * 100) / 100 };
}

describe('credit card payoff references', () => {
  // Closed form: n = −ln(1 − rB/P) / ln(1 + r) = −ln(0.625)/ln(1.015) = 31.6 → 32 payments.
  it('$5,000 at 18% paying $200 a month takes 32 months', () => {
    const o = computeCardPayoff(base);
    expect(o.plan.months).toBe(32);
    expect(o.plan.totalInterest).toBe(reference(5_000, 18, 200).interest);
  });
  // $3,000 at 24.99% paying $150: n = −ln(1 − 0.020825 × 20)/ln(1.020825) = 26.14 → 27 payments.
  it('$3,000 at 24.99% paying $150 a month takes 27 months', () => {
    const o = computeCardPayoff({ ...base, balance: 3_000, apr: 24.99, payment: 150 });
    expect(o.plan.months).toBe(27);
    expect(o.plan.totalInterest).toBe(reference(3_000, 24.99, 150).interest);
  });
  // Target-date mode uses the amortization payment: $5,000 at 18% over 24 months → $249.62.
  it('payment to clear $5,000 at 18% in 24 months is $249.62', () => {
    const o = computeCardPayoff({ ...base, mode: 'months', months: 24 });
    expect(o.monthlyPayment).toBe(249.62);
    expect(o.plan.months).toBe(24);
  });
  // First month's interest: $5,000 × 18% ÷ 12 = $75.
  it('first month interest is $75', () => expect(computeCardPayoff(base).firstInterest).toBe(75));
});

describe('credit card edge cases', () => {
  it('a payment at or below the interest never pays off', () => {
    const o = computeCardPayoff({ ...base, payment: 75 });
    expect(o.plan.paysOff).toBe(false);
    expect(o.plan.months).toBe(Infinity);
  });
  it('0% APR divides evenly', () => expect(computeCardPayoff({ ...base, apr: 0, payment: 500 }).plan.months).toBe(10));
  it('minimum payments take far longer and cost more', () => {
    const o = computeCardPayoff(base);
    expect(o.minimum.paysOff).toBe(true);
    expect(o.minimum.months).toBeGreaterThan(o.plan.months);
    expect(o.interestSaved).toBeGreaterThan(0);
  });
  it('minimum payment rule: 1% + interest, $25 floor', () => {
    expect(minimumPayment(5_000, 75, 1, 25)).toBe(125);
    expect(minimumPayment(500, 7.5, 1, 25)).toBe(25);
  });
  it('a payment above the balance pays off in one month', () => {
    const o = computeCardPayoff({ ...base, payment: 10_000 });
    expect(o.plan.months).toBe(1);
    expect(o.plan.totalPaid).toBe(5_075);
  });
});
