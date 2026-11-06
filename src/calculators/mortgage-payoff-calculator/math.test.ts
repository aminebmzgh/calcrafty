import { describe, expect, it } from 'vitest';
import { amortize } from '../../lib/math/money.ts';
import { computePayoff, payoff, requiredExtra, type PayoffInput } from './math.ts';

const base: PayoffInput = { balance: 250_000, interestRate: 6.5, payment: 1_800, extraMonthly: 0, lumpSum: 0, targetYears: 0 };

describe('payoff', () => {
  // A new $200,000 loan at 6.5% paid at its scheduled $1,264.14 ends in exactly 360 months,
  // with the same interest as the shared amortization schedule.
  it('matches a scheduled 30-year loan', () => {
    const ref = amortize(200_000, 6.5, 360);
    const r = payoff(200_000, 6.5, 1264.14);
    expect(r.months).toBe(360);
    expect(r.totalInterest).toBe(ref.totalInterest);
  });

  it('matches amortize() with extra payments on random loans', () => {
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 100; k++) {
      const P = Math.round(10_000 + rnd() * 900_000);
      const r = Math.round(100 + rnd() * 1000) / 100;
      const n = 120 + Math.floor(rnd() * 241);
      const extra = Math.round(50 + rnd() * 2000);
      const ref = amortize(P, r, n, extra);
      const got = payoff(P, r, ref.payment, extra);
      // When amortize() ends with a tiny payment (under 1% of the payment), payoff() folds it into
      // the month before, saving that last month's few cents of interest.
      const last = ref.rows.at(-1)!;
      if (last.principal + last.extra < ref.payment / 100) {
        expect(got.months).toBe(ref.months - 1);
        expect(ref.totalInterest - got.totalInterest).toBeLessThan(1);
      } else {
        expect(got.months).toBe(ref.months);
        expect(got.totalInterest).toBe(ref.totalInterest);
      }
    }
  });

  // At exactly the scheduled payment, a 25-year $250,000 loan at 8% leaves a few cents after
  // payment 300 from rounding; it's added to payment 300 instead of making a 301st payment.
  it('folds a cent-rounding remainder into the last payment', () => {
    const ref = amortize(250_000, 8, 300);
    const r = payoff(250_000, 8, ref.payment);
    expect(r.months).toBe(300);
    expect(r.rows.at(-1)!.balance).toBe(0);
  });

  // $1,000 at 12%: first month's interest is $10.00, so a $10 payment never pays it down.
  it('flags a payment that does not cover the interest', () => {
    expect(payoff(1_000, 12, 10).paysOff).toBe(false);
    expect(payoff(1_000, 12, 10.01).paysOff).toBe(true);
  });

  // 0%: $12,000 at $1,000 a month is 12 payments, or 8 with $500 extra.
  it('0% interest', () => {
    expect(payoff(12_000, 0, 1_000).months).toBe(12);
    expect(payoff(12_000, 0, 1_000, 500).months).toBe(8);
  });

  it('zero balance', () => expect(payoff(0, 6, 1_000).months).toBe(0));
});

describe('requiredExtra', () => {
  // 15-year payment on $200,000 at 6.5% is $1,742.21, so about $478 on top of the 30-year $1,264.14.
  it('15-year target on a 30-year loan', () => {
    const x = requiredExtra(200_000, 6.5, 1264.14, 180);
    expect(x).toBeGreaterThanOrEqual(478.07);
    expect(x).toBeLessThan(478.2);
    expect(payoff(200_000, 6.5, 1264.14, x).months).toBeLessThanOrEqual(180);
    expect(payoff(200_000, 6.5, 1264.14, x - 0.05).months).toBeGreaterThan(180);
  });

  it('0 when the payment already beats the target', () => expect(requiredExtra(100_000, 5, 5_000, 120)).toBe(0));

  // 0%: $12,000 in 6 months needs $2,000 a month, i.e. $1,000 on top of $1,000.
  it('0% interest', () => expect(requiredExtra(12_000, 0, 1_000, 6)).toBe(1_000));
});

describe('computePayoff', () => {
  it('no extra: nothing saved, scenarios start at $0', () => {
    const o = computePayoff(base);
    expect(o.interestSaved).toBe(0);
    expect(o.scenarios[0]!.months).toBe(o.base.months);
    expect(o.requiredExtra).toBeNull();
  });

  it('extra and lump sum both shorten the loan', () => {
    const extra = computePayoff({ ...base, extraMonthly: 300 });
    const lump = computePayoff({ ...base, lumpSum: 20_000 });
    expect(extra.monthsSaved).toBeGreaterThan(0);
    expect(lump.monthsSaved).toBeGreaterThan(0);
    // The lump sum comes off the balance before the first payment.
    expect(lump.actual.rows[0]!.interest).toBe(Math.round(230_000 * 0.065 / 12 * 100) / 100);
  });

  it('first month interest: $250,000 × 6.5% ÷ 12 = $1,354.17', () => expect(computePayoff(base).firstInterest).toBe(1354.17));

  it('scenario savings grow with the extra payment', () => {
    const s = computePayoff(base).scenarios.map((x) => x.interestSaved);
    expect(s).toEqual([...s].sort((a, b) => a - b));
  });

  it('target applies after the lump sum', () => {
    const o = computePayoff({ ...base, lumpSum: 50_000, targetYears: 10 });
    expect(o.requiredExtra).toBe(requiredExtra(200_000, 6.5, 1_800, 120));
  });
});
