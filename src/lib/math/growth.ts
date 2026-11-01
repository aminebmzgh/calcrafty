/**
 * Shared growth math for savings and investments (pure, decimal arithmetic).
 * Balances are stepped monthly; any compounding frequency is converted to its exactly
 * equivalent monthly rate, so monthly contributions combine correctly with e.g. daily compounding.
 */
import { cents, D, Decimal, type Num } from './money.ts';

export type Compounding = 'daily' | 'monthly' | 'quarterly' | 'semiannually' | 'annually' | 'continuously';

export const PERIODS_PER_YEAR: Record<Exclude<Compounding, 'continuously'>, number> = {
  daily: 365,
  monthly: 12,
  quarterly: 4,
  semiannually: 2,
  annually: 1,
};

/** Effective monthly growth rate equivalent to `annualPct` nominal compounded `compounding`. */
export function effectiveMonthlyRate(annualPct: Num, compounding: Compounding): Decimal {
  const r = D(annualPct).div(100);
  if (r.isZero()) return D(0);
  if (compounding === 'continuously') return r.div(12).exp().minus(1);
  const k = PERIODS_PER_YEAR[compounding];
  if (k === 12) return r.div(12);
  // (1 + r/k)^(k/12) − 1, via exp/ln for the fractional power.
  return r.div(k).plus(1).ln().times(k).div(12).exp().minus(1);
}

/** Annual percentage yield (APY) for a nominal rate and compounding frequency, %. */
export function apy(annualPct: Num, compounding: Compounding): number {
  const m = effectiveMonthlyRate(annualPct, compounding);
  return m.plus(1).pow(12).minus(1).times(100).toDecimalPlaces(4).toNumber();
}

export interface GrowthYear {
  year: number;
  /** Contributions made during the year (excluding the starting balance). */
  contributions: number;
  interest: number;
  /** Total contributed so far, including the starting balance. */
  totalContributed: number;
  /** Cumulative growth so far: balance − total contributed. */
  totalGrowth: number;
  balance: number;
}

export interface GrowthResult {
  balance: number;
  totalContributed: number;
  totalInterest: number;
  years: GrowthYear[];
}

export interface GrowthOptions {
  principal: Num;
  annualPct: Num;
  years: number;
  compounding: Compounding;
  /** Contribution each month (negative = withdrawal). */
  monthly?: Num;
  /** Contributions at the start of each month (annuity due) instead of the end. */
  startOfMonth?: boolean;
  /** Increase the monthly contribution by this % at the start of each new year. */
  annualIncreasePct?: Num;
  /** Stop when the balance would fall below zero (withdrawals). */
  floorAtZero?: boolean;
}

/** Month-by-month growth with yearly rows. Rounds only for output. */
export function grow(opts: GrowthOptions): GrowthResult {
  const months = Math.max(0, Math.round(opts.years * 12));
  const m = effectiveMonthlyRate(opts.annualPct, opts.compounding);
  const increase = D(opts.annualIncreasePct ?? 0).div(100).plus(1);
  let contribution = D(opts.monthly ?? 0);
  let balance = D(opts.principal);
  let totalContributed = D(opts.principal);
  let yearContrib = D(0);
  let yearInterest = D(0);
  const years: GrowthYear[] = [];

  for (let i = 1; i <= months; i++) {
    if (i > 1 && (i - 1) % 12 === 0) contribution = contribution.times(increase);
    if (opts.startOfMonth) {
      balance = balance.plus(contribution);
      const interest = balance.times(m);
      balance = balance.plus(interest);
      yearInterest = yearInterest.plus(interest);
    } else {
      const interest = balance.times(m);
      balance = balance.plus(interest).plus(contribution);
      yearInterest = yearInterest.plus(interest);
    }
    if (opts.floorAtZero && balance.lt(0)) balance = D(0);
    yearContrib = yearContrib.plus(contribution);
    totalContributed = totalContributed.plus(contribution);
    if (i % 12 === 0 || i === months) {
      years.push({
        year: Math.ceil(i / 12),
        contributions: cents(yearContrib).toNumber(),
        interest: cents(yearInterest).toNumber(),
        totalContributed: cents(totalContributed).toNumber(),
        totalGrowth: cents(balance.minus(totalContributed)).toNumber(),
        balance: cents(balance).toNumber(),
      });
      yearContrib = D(0);
      yearInterest = D(0);
    }
  }
  const finalBalance = cents(balance);
  return {
    balance: finalBalance.toNumber(),
    totalContributed: cents(totalContributed).toNumber(),
    totalInterest: cents(finalBalance.minus(totalContributed)).toNumber(),
    years,
  };
}

/**
 * Level monthly contribution (end of month) needed to grow `principal` to `target` in `months`
 * at monthly rate m:  PMT = (target − P(1+m)^n) × m / ((1+m)^n − 1).
 */
export function requiredMonthly(target: Num, principal: Num, months: number, m: Decimal): number {
  if (months <= 0) return 0;
  const f = m.plus(1).pow(months);
  const gap = D(target).minus(D(principal).times(f));
  if (gap.lte(0)) return 0;
  // Round up to the cent so paying this amount always reaches the target.
  const pmt = m.isZero() ? gap.div(months) : gap.times(m).div(f.minus(1));
  return pmt.toDecimalPlaces(2, Decimal.ROUND_UP).toNumber();
}

/** Months until the balance reaches `target` (Infinity if it never does within 100 years). */
export function monthsToTarget(target: Num, principal: Num, monthly: Num, m: Decimal): number {
  let bal = D(principal);
  const goal = D(target);
  if (bal.gte(goal)) return 0;
  for (let i = 1; i <= 1200; i++) {
    bal = bal.plus(bal.times(m)).plus(monthly);
    if (bal.gte(goal)) return i;
  }
  return Infinity;
}
