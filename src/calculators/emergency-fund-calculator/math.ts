/**
 * Emergency fund: target = monthly essential expenses × months of coverage, how many months the
 * current savings already cover, and how long monthly deposits take to close the gap in a
 * savings account (interest compounded daily, deposits at the end of each month).
 */
import { effectiveMonthlyRate, monthsToTarget, requiredMonthly } from '../../lib/math/growth.ts';
import { cents, D, Decimal } from '../../lib/math/money.ts';

export interface EmergencyInput extends Record<string, unknown> {
  /** Essential monthly expenses: housing, utilities, food, insurance, transport, minimum debt payments. */
  essentials: number;
  /** Months of expenses to cover. */
  months: number;
  saved: number;
  monthlySaving: number;
  /** Savings account rate, %. */
  rate: number;
  /** Optional deadline for the "save by" figure, in months. */
  deadlineMonths: number;
}

export interface EmergencyOutput {
  target: number;
  gap: number;
  /** Savings counted toward the target (capped at the target). */
  savedTowardTarget: number;
  /** Months of expenses the current savings cover, 1 decimal. */
  coveredMonths: number;
  /** Months until the target is reached at the monthly saving (null if never within 100 years; 0 if already there). */
  monthsToGoal: number | null;
  /** Monthly saving needed to reach the target by the deadline. */
  neededForDeadline: number;
  /** Progress toward the target, % (capped at 100). */
  progress: number;
}

export function computeEmergency(i: EmergencyInput): EmergencyOutput {
  const essentials = Math.max(0, i.essentials);
  const target = cents(D(essentials).times(Math.max(0, i.months))).toNumber();
  const saved = Math.max(0, i.saved);
  const gap = Math.max(0, cents(D(target).minus(saved)).toNumber());
  const m = effectiveMonthlyRate(i.rate, 'daily');
  const months = monthsToTarget(target, saved, Math.max(0, i.monthlySaving), m);
  return {
    target,
    gap,
    savedTowardTarget: cents(D(Math.min(saved, target))).toNumber(),
    coveredMonths: essentials > 0 ? D(saved).div(essentials).toDecimalPlaces(1, Decimal.ROUND_DOWN).toNumber() : 0,
    monthsToGoal: Number.isFinite(months) ? months : null,
    neededForDeadline: requiredMonthly(target, saved, Math.max(1, Math.round(i.deadlineMonths)), m),
    progress: target > 0 ? Math.min(100, D(saved).div(target).times(100).toDecimalPlaces(0, Decimal.ROUND_DOWN).toNumber()) : 100,
  };
}
