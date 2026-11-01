/**
 * Retirement math: savings at retirement, the nest egg needed to fund an inflation-rising income gap
 * (after Social Security) through life expectancy, how long savings last, and the monthly saving needed.
 */
import { effectiveMonthlyRate, grow, requiredMonthly, type GrowthYear } from '../../lib/math/growth.ts';
import { cents, D, Decimal } from '../../lib/math/money.ts';

export interface RetirementInput extends Record<string, unknown> {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentSavings: number;
  /** Monthly contribution, including any employer match. */
  monthly: number;
  /** Annual return before retirement, %. */
  preReturn: number;
  /** Annual return during retirement, %. */
  postReturn: number;
  /** Desired yearly retirement income in today's dollars. */
  incomeNeeded: number;
  /** Expected Social Security (or pension) per month in today's dollars. */
  socialSecurity: number;
  inflation: number;
}

export interface RetirementOutput {
  yearsToRetire: number;
  yearsInRetirement: number;
  /** Projected savings at retirement (future dollars). */
  savingsAtRetirement: number;
  savingsTodaysDollars: number;
  /** Yearly amount savings must cover, today's dollars. */
  annualGap: number;
  /** Nest egg needed at retirement (future dollars). */
  needed: number;
  neededTodaysDollars: number;
  /** Positive = surplus, negative = shortfall (future dollars). */
  surplus: number;
  onTrack: boolean;
  /** Age when savings run out (null if they last past life expectancy). */
  runsOutAge: number | null;
  /** Monthly contribution needed to reach the goal (0 if already on track). */
  requiredMonthly: number;
  /** First-year withdrawal as a % of savings at retirement. */
  withdrawalRate: number;
  years: GrowthYear[];
}

const pow = (x: Decimal, n: number) => x.pow(n);

/**
 * Present value at retirement of `n` yearly withdrawals made at the start of each year,
 * starting at `first` and rising with inflation g, discounted at return r.
 */
export function pvGrowingAnnuityDue(first: number, n: number, rPct: number, gPct: number): number {
  let pv = D(0);
  const ratio = D(gPct).div(100).plus(1).div(D(rPct).div(100).plus(1));
  let factor = D(1);
  for (let k = 0; k < n; k++) {
    pv = pv.plus(factor);
    factor = factor.times(ratio);
  }
  return cents(pv.times(first)).toNumber();
}

export function computeRetirement(i: RetirementInput): RetirementOutput {
  const yearsToRetire = Math.max(0, i.retirementAge - i.currentAge);
  const yearsInRetirement = Math.max(0, i.lifeExpectancy - i.retirementAge);
  const g = grow({ principal: i.currentSavings, annualPct: i.preReturn, years: yearsToRetire, compounding: 'monthly', monthly: i.monthly });
  const inflate = pow(D(i.inflation).div(100).plus(1), yearsToRetire);

  const annualGap = Math.max(0, cents(D(i.incomeNeeded).minus(D(i.socialSecurity).times(12))).toNumber());
  const firstWithdrawal = D(annualGap).times(inflate);
  const needed = pvGrowingAnnuityDue(firstWithdrawal.toNumber(), yearsInRetirement, i.postReturn, i.inflation);

  // Drawdown: withdraw at the start of each year, then grow; stop when the money runs out (cap 60 years).
  let bal = D(g.balance);
  let withdrawal = firstWithdrawal;
  let runsOutAge: number | null = null;
  const r = D(i.postReturn).div(100).plus(1);
  const infl = D(i.inflation).div(100).plus(1);
  for (let k = 0; k < 60 && annualGap > 0; k++) {
    if (bal.lt(withdrawal)) {
      runsOutAge = i.retirementAge + k;
      break;
    }
    bal = bal.minus(withdrawal).times(r);
    withdrawal = withdrawal.times(infl);
  }
  if (runsOutAge !== null && runsOutAge >= i.lifeExpectancy) runsOutAge = null;

  const surplus = cents(D(g.balance).minus(needed)).toNumber();
  return {
    yearsToRetire,
    yearsInRetirement,
    savingsAtRetirement: g.balance,
    savingsTodaysDollars: cents(D(g.balance).div(inflate)).toNumber(),
    annualGap,
    needed,
    neededTodaysDollars: cents(D(needed).div(inflate)).toNumber(),
    surplus,
    onTrack: surplus >= 0,
    runsOutAge,
    requiredMonthly: surplus >= 0 ? 0 : requiredMonthly(needed, i.currentSavings, yearsToRetire * 12, effectiveMonthlyRate(i.preReturn, 'monthly')),
    withdrawalRate: g.balance > 0 ? firstWithdrawal.div(g.balance).times(100).toDecimalPlaces(1).toNumber() : 0,
    years: g.years,
  };
}
