/**
 * Debt payoff: snowball (smallest balance first) vs avalanche (highest APR first).
 * Every month each debt accrues APR ÷ 12 interest (rounded to the cent) and gets its minimum;
 * the extra payment plus minimums freed by paid-off debts go to the target debt (rollover).
 * The total monthly budget stays constant until everything is paid.
 */
import { cents, D, Decimal, monthlyRate } from '../../lib/math/money.ts';

export interface Debt {
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
}

export interface DebtInput extends Record<string, unknown> {
  debts: Debt[];
  extra: number;
}

export type Strategy = 'avalanche' | 'snowball';

export interface StrategyResult {
  strategy: Strategy;
  paysOff: boolean;
  months: number;
  totalInterest: number;
  totalPaid: number;
  /** Debts in the order they're paid off, with the month each is cleared. */
  order: { name: string; month: number; interest: number }[];
  /** Total balance at the end of each month (index 0 = start). */
  balances: number[];
}

export interface DebtOutput {
  totalBalance: number;
  monthlyBudget: number;
  avalanche: StrategyResult;
  snowball: StrategyResult;
  /** Paying minimums only, no extra and no rollover. */
  minimumsOnly: StrategyResult;
  /** Avalanche interest saving over snowball (≥ 0). */
  avalancheSavings: number;
  best: Strategy;
}

const MAX_MONTHS = 600;
const minD = (a: Decimal, b: Decimal): Decimal => (a.lt(b) ? a : b);

export function priority(debts: Debt[], strategy: Strategy): number[] {
  return debts
    .map((d, i) => ({ d, i }))
    .sort((a, b) => (strategy === 'avalanche' ? b.d.apr - a.d.apr || a.d.balance - b.d.balance : a.d.balance - b.d.balance || b.d.apr - a.d.apr))
    .map((x) => x.i);
}

export function simulate(debts: Debt[], extra: number, strategy: Strategy, rollover = true): StrategyResult {
  const bal: Decimal[] = debts.map((d) => cents(Math.max(0, d.balance)));
  const rate = debts.map((d) => monthlyRate(d.apr));
  const mins = debts.map((d) => cents(Math.max(0, d.minPayment)));
  const interestBy = debts.map(() => D(0));
  const order: StrategyResult['order'] = [];
  const targets = priority(debts, strategy);
  const budget = mins.reduce((s, m) => s.plus(m), D(0)).plus(cents(Math.max(0, extra)));
  const balances = [bal.reduce((s, b) => s.plus(b), D(0)).toNumber()];
  let totalInterest = D(0);
  let totalPaid = D(0);
  let month = 0;

  const done = bal.map((b) => b.lte(0));

  while (bal.some((b) => b.gt(0)) && month < MAX_MONTHS) {
    month++;
    // Interest accrues on every open balance.
    for (let i = 0; i < debts.length; i++) {
      if (bal[i]!.lte(0)) continue;
      const interest = cents(bal[i]!.times(rate[i]!));
      bal[i] = bal[i]!.plus(interest);
      interestBy[i] = interestBy[i]!.plus(interest);
      totalInterest = totalInterest.plus(interest);
    }
    // Minimums first.
    let available = rollover ? budget : budget.minus(cents(Math.max(0, extra)));
    for (let i = 0; i < debts.length; i++) {
      if (bal[i]!.lte(0)) continue;
      const pay = minD(mins[i]!, bal[i]!);
      bal[i] = bal[i]!.minus(pay);
      available = available.minus(pay);
      totalPaid = totalPaid.plus(pay);
    }
    // Then everything left goes to targets in priority order.
    if (rollover) {
      for (const t of targets) {
        if (available.lte(0)) break;
        if (bal[t]!.lte(0)) continue;
        const pay = minD(available, bal[t]!);
        bal[t] = bal[t]!.minus(pay);
        available = available.minus(pay);
        totalPaid = totalPaid.plus(pay);
      }
    }
    for (let i = 0; i < debts.length; i++) {
      if (!done[i] && bal[i]!.lte(0)) {
        done[i] = true;
        order.push({ name: debts[i]!.name, month, interest: cents(interestBy[i]!).toNumber() });
      }
    }
    balances.push(bal.reduce((s, b) => s.plus(b), D(0)).toNumber());
    // Stop if the balance is not falling (payments don't cover interest).
    if (month > 1 && balances[month]! >= balances[month - 1]! && balances[month]! > 0) {
      return { strategy, paysOff: false, months: Infinity, totalInterest: Infinity, totalPaid: Infinity, order, balances };
    }
  }
  const paysOff = bal.every((b) => b.lte(0));
  return {
    strategy,
    paysOff,
    months: paysOff ? month : Infinity,
    totalInterest: paysOff ? cents(totalInterest).toNumber() : Infinity,
    totalPaid: paysOff ? cents(totalPaid).toNumber() : Infinity,
    order,
    balances,
  };
}

export function computeDebtPayoff(i: DebtInput): DebtOutput {
  const debts = i.debts.filter((d) => d.balance > 0);
  const avalanche = simulate(debts, i.extra, 'avalanche');
  const snowball = simulate(debts, i.extra, 'snowball');
  const minimumsOnly = simulate(debts, 0, 'avalanche', false);
  const both = avalanche.paysOff && snowball.paysOff;
  return {
    totalBalance: cents(debts.reduce((s, d) => s.plus(d.balance), D(0))).toNumber(),
    monthlyBudget: cents(debts.reduce((s, d) => s.plus(d.minPayment), D(0)).plus(Math.max(0, i.extra))).toNumber(),
    avalanche,
    snowball,
    minimumsOnly,
    avalancheSavings: both ? Math.max(0, cents(D(snowball.totalInterest).minus(avalanche.totalInterest)).toNumber()) : 0,
    best: both && snowball.totalInterest < avalanche.totalInterest ? 'snowball' : 'avalanche',
  };
}
