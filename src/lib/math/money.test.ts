import { describe, expect, it } from 'vitest';
import { amortize, annuityPayment, byYear, cents, monthlyRate } from './money.ts';

describe('annuityPayment', () => {
  // Reference: $300,000 at 6.5% for 30 years → $1,896.20 (docs/BUILD-BRIEF.md section 18; standard amortization tables).
  it('matches the 30-year reference payment', () => {
    expect(cents(annuityPayment(300_000, monthlyRate(6.5), 360)).toNumber()).toBe(1896.2);
  });
  // Reference: $200,000 at 4% for 30 years → $954.83 (CFPB/Freddie Mac standard example).
  it('matches a 4% 30-year reference', () => {
    expect(cents(annuityPayment(200_000, monthlyRate(4), 360)).toNumber()).toBe(954.83);
  });
  // Reference: $100,000 at 5% for 15 years → $790.79.
  it('matches a 15-year reference', () => {
    expect(cents(annuityPayment(100_000, monthlyRate(5), 180)).toNumber()).toBe(790.79);
  });
  it('handles a 0% rate as straight division', () => {
    expect(annuityPayment(12_000, 0, 12).toNumber()).toBe(1000);
  });
  it('handles a single period', () => {
    expect(cents(annuityPayment(1000, monthlyRate(12), 1)).toNumber()).toBe(1010);
  });
  it('returns 0 for a zero principal and rejects zero periods', () => {
    expect(annuityPayment(0, 0.01, 12).toNumber()).toBe(0);
    expect(() => annuityPayment(1000, 0.01, 0)).toThrow();
  });
  it('stays finite for extreme rates', () => {
    const p = annuityPayment(100_000, monthlyRate(30), 360).toNumber();
    expect(Number.isFinite(p)).toBe(true);
    expect(p).toBeGreaterThan(2500); // ≈ interest-only 2,500
  });
});

describe('amortize', () => {
  it('pays the loan off exactly in the scheduled months', () => {
    const a = amortize(300_000, 6.5, 360);
    expect(a.months).toBe(360);
    expect(a.rows.at(-1)!.balance).toBe(0);
    const principalSum = a.rows.reduce((s, r) => s + r.principal, 0);
    expect(Math.round(principalSum * 100) / 100).toBe(300_000);
    // Total interest ≈ 1,896.20 × 360 − 300,000 = 382,632 (± final-payment rounding).
    expect(Math.abs(a.totalInterest - 382_632)).toBeLessThan(5);
  });
  it('first month splits interest and principal correctly', () => {
    const r = amortize(300_000, 6.5, 360).rows[0]!;
    expect(r.interest).toBe(1625); // 300,000 × 0.065 / 12
    expect(r.principal).toBe(271.2);
  });
  it('extra payments shorten the loan and cut interest', () => {
    const base = amortize(300_000, 6.5, 360);
    const extra = amortize(300_000, 6.5, 360, 200);
    expect(extra.months).toBeLessThan(base.months);
    expect(extra.totalInterest).toBeLessThan(base.totalInterest);
    expect(extra.rows.at(-1)!.balance).toBe(0);
  });
  it('handles 0% interest', () => {
    const a = amortize(12_000, 0, 12);
    expect(a.payment).toBe(1000);
    expect(a.totalInterest).toBe(0);
    expect(a.months).toBe(12);
  });
  it('groups rows by year', () => {
    const years = byYear(amortize(300_000, 6.5, 360).rows);
    expect(years).toHaveLength(30);
    expect(years[29]!.balance).toBe(0);
  });
});

describe('amortize matches a plain Decimal reference implementation', () => {
  // Straightforward Decimal version of the same algorithm, used only to cross-check the fast integer loop.
  function reference(principal: number, annualPct: number, months: number, extra: number) {
    const P = cents(principal);
    const r = monthlyRate(annualPct);
    const pay = cents(annuityPayment(P, r, months));
    let bal = P;
    let interestSum = cents(0);
    const balances: number[] = [];
    for (let m = 1; bal.gt(0) && m <= months; m++) {
      const i = cents(bal.times(r));
      let p = pay.minus(i);
      let x = cents(extra);
      if (m === months || p.gte(bal)) {
        p = bal;
        x = cents(0);
      } else if (p.plus(x).gt(bal)) x = bal.minus(p);
      bal = bal.minus(p).minus(x);
      interestSum = interestSum.plus(i);
      balances.push(bal.toNumber());
    }
    return { balances, totalInterest: interestSum.toNumber() };
  }

  it('agrees to the cent on 300 random loans', () => {
    let seed = 42;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let k = 0; k < 300; k++) {
      const principal = Math.round(rand() * 2_000_000 * 100) / 100;
      const rate = Math.round(rand() * 30 * 1000) / 1000;
      const months = 1 + Math.floor(rand() * 480);
      const extra = rand() < 0.4 ? Math.round(rand() * 1500) : 0;
      const fast = amortize(principal, rate, months, extra);
      const ref = reference(principal, rate, months, extra);
      expect(fast.rows.map((r) => r.balance)).toEqual(ref.balances);
      expect(fast.totalInterest).toBe(ref.totalInterest);
    }
  });
});
