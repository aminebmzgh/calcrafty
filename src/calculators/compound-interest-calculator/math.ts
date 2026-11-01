/** Compound interest: a starting balance plus optional monthly deposits, at any compounding frequency. */
import { apy, effectiveMonthlyRate, grow, type Compounding, type GrowthYear } from '../../lib/math/growth.ts';
import { D } from '../../lib/math/money.ts';

export interface CompoundInput extends Record<string, unknown> {
  principal: number;
  monthly: number;
  rate: number;
  years: number;
  compounding: Compounding;
  timing: 'end' | 'start';
}

export interface CompoundOutput {
  balance: number;
  totalContributed: number;
  totalInterest: number;
  apy: number;
  /** Effective monthly rate as a decimal (for Show the math). */
  monthlyRate: number;
  /** Interest earned in the final year. */
  lastYearInterest: number;
  /** Years for the starting balance to double at this rate (exact, not the Rule of 72). */
  doublingYears: number | null;
  years: GrowthYear[];
}

export function computeCompound(i: CompoundInput): CompoundOutput {
  const g = grow({ principal: i.principal, annualPct: i.rate, years: i.years, compounding: i.compounding, monthly: i.monthly, startOfMonth: i.timing === 'start' });
  const m = effectiveMonthlyRate(i.rate, i.compounding);
  const doubling = m.gt(0) ? D(2).ln().div(m.plus(1).ln()).div(12).toDecimalPlaces(1).toNumber() : null;
  return {
    ...g,
    apy: apy(i.rate, i.compounding),
    monthlyRate: m.toNumber(),
    lastYearInterest: g.years.at(-1)?.interest ?? 0,
    doublingYears: doubling,
  };
}
