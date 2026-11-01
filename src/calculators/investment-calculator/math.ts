/** Investment growth: starting amount, monthly contributions that can rise each year, and inflation-adjusted value. */
import { grow, type GrowthYear } from '../../lib/math/growth.ts';
import { cents, D } from '../../lib/math/money.ts';

export interface InvestmentInput extends Record<string, unknown> {
  initial: number;
  monthly: number;
  /** Expected average annual return, %. */
  returnRate: number;
  years: number;
  /** Raise the monthly contribution by this % each year. */
  contributionIncrease: number;
  /** Expected average inflation, % per year. */
  inflation: number;
}

export interface InvestmentOutput {
  balance: number;
  totalContributed: number;
  growth: number;
  /** Final balance in today's dollars. */
  realBalance: number;
  /** Balance at the end of each year in today's dollars (index 0 = start). */
  realSeries: number[];
  /** Share of the final balance that is growth, %. */
  growthShare: number;
  finalMonthly: number;
  years: GrowthYear[];
}

/** Discounts a future amount to today's dollars: amount ÷ (1 + inflation)^years. */
export function toTodaysDollars(amount: number, inflationPct: number, years: number): number {
  return cents(D(amount).div(D(inflationPct).div(100).plus(1).pow(years))).toNumber();
}

export function computeInvestment(i: InvestmentInput): InvestmentOutput {
  const g = grow({
    principal: i.initial,
    annualPct: i.returnRate,
    years: i.years,
    compounding: 'monthly',
    monthly: i.monthly,
    annualIncreasePct: i.contributionIncrease,
  });
  const growth = cents(D(g.balance).minus(g.totalContributed)).toNumber();
  return {
    balance: g.balance,
    totalContributed: g.totalContributed,
    growth,
    realBalance: toTodaysDollars(g.balance, i.inflation, i.years),
    realSeries: [i.initial, ...g.years.map((y) => toTodaysDollars(y.balance, i.inflation, y.year))],
    growthShare: g.balance > 0 ? D(growth).div(g.balance).times(100).toDecimalPlaces(1).toNumber() : 0,
    finalMonthly: cents(D(i.monthly).times(D(i.contributionIncrease).div(100).plus(1).pow(Math.max(0, Math.ceil(i.years) - 1)))).toNumber(),
    years: g.years,
  };
}
