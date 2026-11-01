/** Savings goal: the monthly deposit needed to reach a goal by a date, or the time needed at a set deposit. */
import { effectiveMonthlyRate, grow, monthsToTarget, requiredMonthly, type GrowthYear } from '../../lib/math/growth.ts';
import { cents, D } from '../../lib/math/money.ts';

export interface SavingsGoalInput extends Record<string, unknown> {
  goal: number;
  current: number;
  /** 'deadline': solve for the monthly deposit; 'deposit': solve for the time. */
  mode: 'deadline' | 'deposit';
  years: number;
  monthly: number;
  /** Annual interest rate (APY-style nominal, compounded daily). */
  rate: number;
}

export interface SavingsGoalOutput {
  /** Monthly deposit used (solved in 'deadline' mode). */
  monthlyDeposit: number;
  /** Months to reach the goal (Infinity if never within 100 years). */
  months: number;
  reached: boolean;
  totalDeposited: number;
  interestEarned: number;
  finalBalance: number;
  /** Weekly equivalent of the monthly deposit (× 12 ÷ 52). */
  weekly: number;
  years: GrowthYear[];
}

export function computeSavingsGoal(i: SavingsGoalInput): SavingsGoalOutput {
  const m = effectiveMonthlyRate(i.rate, 'daily');
  let monthlyDeposit: number;
  let months: number;
  if (i.mode === 'deadline') {
    months = Math.max(1, Math.round(i.years * 12));
    monthlyDeposit = requiredMonthly(i.goal, i.current, months, m);
    if (i.current >= i.goal) months = 0;
  } else {
    monthlyDeposit = i.monthly;
    months = monthsToTarget(i.goal, i.current, i.monthly, m);
  }
  const reached = Number.isFinite(months);
  const g = grow({ principal: i.current, annualPct: i.rate, years: reached ? months / 12 : 0, compounding: 'daily', monthly: monthlyDeposit });
  const deposited = cents(D(g.totalContributed).minus(i.current)).toNumber();
  return {
    monthlyDeposit,
    months,
    reached,
    totalDeposited: deposited,
    interestEarned: g.totalInterest,
    finalBalance: g.balance,
    weekly: cents(D(monthlyDeposit).times(12).div(52)).toNumber(),
    years: g.years,
  };
}
