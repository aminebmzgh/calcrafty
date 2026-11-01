import { describe, expect, it } from 'vitest';
import { computeDebtPayoff, simulate, type Debt } from './math.ts';

/** Independent float implementation of the same rules, for cross-checking. */
function reference(debts: Debt[], extra: number, order: number[]) {
  const bal = debts.map((d) => d.balance);
  const budget = debts.reduce((s, d) => s + d.minPayment, 0) + extra;
  let interest = 0;
  let month = 0;
  while (bal.some((b) => b > 0.004) && month < 600) {
    month++;
    for (let i = 0; i < bal.length; i++) {
      if (bal[i]! <= 0) continue;
      const int = Math.round(bal[i]! * (debts[i]!.apr / 1200) * 100) / 100;
      bal[i] = Math.round((bal[i]! + int) * 100) / 100;
      interest += int;
    }
    let avail = budget;
    for (let i = 0; i < bal.length; i++) {
      if (bal[i]! <= 0) continue;
      const p = Math.min(debts[i]!.minPayment, bal[i]!);
      bal[i] = Math.round((bal[i]! - p) * 100) / 100;
      avail = Math.round((avail - p) * 100) / 100;
    }
    for (const t of order) {
      if (avail <= 0) break;
      if (bal[t]! <= 0) continue;
      const p = Math.min(avail, bal[t]!);
      bal[t] = Math.round((bal[t]! - p) * 100) / 100;
      avail = Math.round((avail - p) * 100) / 100;
    }
  }
  return { month, interest: Math.round(interest * 100) / 100 };
}

const twoDebts: Debt[] = [
  { name: 'Store card', balance: 1_000, apr: 10, minPayment: 50 },
  { name: 'Credit card', balance: 5_000, apr: 25, minPayment: 150 },
];

describe('debt payoff references', () => {
  // A single debt matches the credit card payoff reference: $5,000 at 18%, $200/month → 32 months.
  it('one debt behaves like a single card payoff', () => {
    const r = simulate([{ name: 'Card', balance: 5_000, apr: 18, minPayment: 200 }], 0, 'avalanche');
    expect(r.months).toBe(32);
  });
  it('snowball targets the smallest balance; avalanche the highest APR', () => {
    const debts: Debt[] = [
      { name: 'High rate', balance: 3_000, apr: 24, minPayment: 90 },
      { name: 'Small balance', balance: 2_000, apr: 8, minPayment: 60 },
    ];
    const o = computeDebtPayoff({ debts, extra: 300 });
    const month = (r: typeof o.avalanche, name: string) => r.order.find((x) => x.name === name)!.month;
    expect(o.snowball.order[0]!.name).toBe('Small balance');
    expect(o.avalanche.order[0]!.name).toBe('High rate');
    expect(month(o.avalanche, 'High rate')).toBeLessThan(month(o.snowball, 'High rate'));
    expect(o.avalanche.totalInterest).toBeLessThan(o.snowball.totalInterest);
  });
  it('matches an independent float simulation (avalanche and snowball)', () => {
    const o = computeDebtPayoff({ debts: twoDebts, extra: 100 });
    const av = reference(twoDebts, 100, [1, 0]);
    const sn = reference(twoDebts, 100, [0, 1]);
    expect(o.avalanche.months).toBe(av.month);
    // Float rounding of half-cents can differ by a few cents; Decimal is the exact one.
    expect(Math.abs(o.avalanche.totalInterest - av.interest)).toBeLessThan(0.1);
    expect(o.snowball.months).toBe(sn.month);
    expect(Math.abs(o.snowball.totalInterest - sn.interest)).toBeLessThan(0.1);
  });
  it('the monthly budget is the sum of minimums plus extra', () => {
    expect(computeDebtPayoff({ debts: twoDebts, extra: 100 }).monthlyBudget).toBe(300);
  });
});

describe('debt payoff properties and edge cases', () => {
  it('avalanche never pays more interest than snowball (200 random debt sets)', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 200; k++) {
      const debts: Debt[] = Array.from({ length: 2 + Math.floor(rand() * 4) }, (_, j) => {
        const balance = Math.round(500 + rand() * 20_000);
        const apr = Math.round(rand() * 30 * 10) / 10;
        return { name: `D${j}`, balance, apr, minPayment: Math.max(25, Math.round(balance * (apr / 1200) + balance * 0.02)) };
      });
      const o = computeDebtPayoff({ debts, extra: Math.round(rand() * 500) });
      if (o.avalanche.paysOff && o.snowball.paysOff) expect(o.avalanche.totalInterest).toBeLessThanOrEqual(o.snowball.totalInterest + 0.01);
    }
  });
  it('extra payments beat minimums only', () => {
    const o = computeDebtPayoff({ debts: twoDebts, extra: 100 });
    expect(o.minimumsOnly.totalInterest).toBeGreaterThan(o.avalanche.totalInterest);
  });
  it('payments below the interest never pay off', () => {
    const o = computeDebtPayoff({ debts: [{ name: 'X', balance: 10_000, apr: 30, minPayment: 100 }], extra: 0 });
    expect(o.avalanche.paysOff).toBe(false);
  });
  it('ignores empty debts and handles none', () => {
    expect(computeDebtPayoff({ debts: [{ name: 'Zero', balance: 0, apr: 10, minPayment: 25 }], extra: 0 }).totalBalance).toBe(0);
    expect(computeDebtPayoff({ debts: [], extra: 100 }).avalanche.months).toBe(0);
  });
});
