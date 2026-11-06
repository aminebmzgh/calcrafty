/**
 * Federal student loan payments under the fixed-payment plans:
 * - Standard: level payments over 10 years.
 * - Graduated (estimate): 10 years, payments rising every 2 years (five steps), never less than the monthly
 *   interest and no payment more than 3 times another (34 CFR 685.208). Servicers set the exact amounts;
 *   this model uses the steepest rise the rule allows (×3^¼ per step) unless the interest floor needs less.
 * - Extended: level payments over 25 years; needs more than $30,000 in Direct Loans.
 * - Tiered Standard (loans first disbursed on or after July 1, 2026, P.L. 119-21): level payments over
 *   10, 15, 20 or 25 years for balances under $25,000, under $50,000, under $100,000, and $100,000 or more.
 * Interest is simple daily interest in reality; like servicers' estimates, this uses rate ÷ 12 per month,
 * rounded to the cent.
 */
import { annuityPayment, byYear, cents, D, monthlyRate, type AmortRow, type YearRow } from '../../lib/math/money.ts';

export type Plan = 'standard' | 'graduated' | 'extended' | 'tiered';
export const PLANS: Plan[] = ['standard', 'graduated', 'extended', 'tiered'];

export interface StudentLoanInput extends Record<string, unknown> {
  balance: number;
  interestRate: number;
  plan: Plan;
  extraMonthly: number;
}

export interface PlanResult {
  plan: Plan;
  months: number;
  firstPayment: number;
  lastPayment: number;
  totalInterest: number;
  totalPaid: number;
  eligible: boolean;
  rows: AmortRow[];
}

export interface StudentLoanOutput {
  selected: PlanResult;
  /** Selected plan without the extra payment, for savings. */
  scheduled: PlanResult;
  interestSaved: number;
  monthsSaved: number;
  /** Extra interest of the chosen plan over the 10-year Standard plan. */
  costVsStandard: number;
  /** Monthly rate as a decimal, for Show the math. */
  rate: number;
  firstInterest: number;
  tieredYears: number;
  graduatedStep: number;
  plans: PlanResult[];
  years: YearRow[];
}

export const EXTENDED_MIN_BALANCE = 30_000;

/** Tiered Standard term in years from the balance entering repayment. */
export function tieredYears(balance: number): number {
  if (balance < 25_000) return 10;
  if (balance < 50_000) return 15;
  if (balance < 100_000) return 20;
  return 25;
}

export function planMonths(plan: Plan, balance: number): number {
  if (plan === 'extended') return 300;
  if (plan === 'tiered') return tieredYears(balance) * 12;
  return 120;
}

/** Runs a schedule of scheduled payments (cents) plus extra principal; the last scheduled month clears the balance. */
function run(plan: Plan, balance: number, annualPct: number, payments: bigint[], extra: number, eligible: boolean): PlanResult {
  const rate = D(annualPct);
  const dp = rate.decimalPlaces();
  const num = BigInt(rate.times(D(10).pow(dp)).toFixed(0));
  const den = 1200n * 10n ** BigInt(dp);
  const ext = BigInt(cents(extra).times(100).toFixed(0));
  let bal = BigInt(cents(balance).times(100).toFixed(0));
  const rows: AmortRow[] = [];
  let interestSum = 0n;
  let paidSum = 0n;
  const n = payments.length;
  for (let k = 0; bal > 0n && k < n; k++) {
    const interest = (2n * bal * num + den) / (2n * den);
    let principalPart = payments[k]! - interest;
    let extraPart = ext;
    if (principalPart < 0n) principalPart = 0n;
    if (k === n - 1 || principalPart >= bal) {
      principalPart = bal;
      extraPart = 0n;
    } else if (principalPart + extraPart > bal) {
      extraPart = bal - principalPart;
    }
    bal -= principalPart + extraPart;
    interestSum += interest;
    paidSum += interest + principalPart + extraPart;
    rows.push({ period: k + 1, payment: Number(interest + principalPart) / 100, principal: Number(principalPart) / 100, interest: Number(interest) / 100, extra: Number(extraPart) / 100, balance: Number(bal) / 100 });
  }
  return {
    plan,
    months: rows.length,
    firstPayment: rows[0] ? rows[0].payment : 0,
    lastPayment: rows.at(-1) ? rows.at(-1)!.payment : 0,
    totalInterest: Number(interestSum) / 100,
    totalPaid: Number(paidSum) / 100,
    eligible,
    rows,
  };
}

/** Present value factor of the five 24-month steps for a first payment of 1 and step ratio g. */
function gradFactor(r: number, g: number): number {
  const v = 1 / (1 + r);
  const a24 = r === 0 ? 24 : (1 - v ** 24) / r;
  let s = 0;
  for (let k = 0; k < 5; k++) s += g ** k * a24 * v ** (24 * k);
  return s;
}

/** Graduated plan: first payment and step ratio. */
export function graduatedTerms(balance: number, annualPct: number): { first: number; step: number } {
  const r = annualPct / 1200;
  const floor = cents(D(balance).times(monthlyRate(annualPct))).toNumber();
  const g = 3 ** 0.25;
  let first = balance / gradFactor(r, g);
  if (first >= floor) return { first: cents(first).toNumber(), step: g };
  // Interest floor binds: start at the interest and solve for a gentler rise.
  first = floor;
  let lo = 1;
  let hi = g;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (first * gradFactor(r, mid) < balance) lo = mid;
    else hi = mid;
  }
  return { first, step: hi };
}

export function planSchedule(plan: Plan, balance: number, annualPct: number, extra = 0): PlanResult {
  const months = planMonths(plan, balance);
  const eligible = plan !== 'extended' || balance > EXTENDED_MIN_BALANCE;
  if (balance <= 0) return run(plan, 0, annualPct, [], 0, eligible);
  let payments: bigint[];
  if (plan === 'graduated') {
    const { first, step } = graduatedTerms(balance, annualPct);
    payments = Array.from({ length: 96 }, (_, k) => BigInt(cents(D(first).times(D(step).pow(Math.floor(k / 24)))).times(100).toFixed(0)));
    // The last step is the level payment that clears what's left after 8 years, so cent rounding in
    // the earlier steps doesn't pile up in the final month.
    const left = run(plan, balance, annualPct, [...payments, 0n], 0, eligible).rows[95]?.balance ?? 0;
    const last = left > 0 ? BigInt(cents(annuityPayment(left, monthlyRate(annualPct), 24)).times(100).toFixed(0)) : 0n;
    payments.push(...Array.from({ length: 24 }, () => last));
  } else {
    const p = BigInt(cents(annuityPayment(cents(balance), monthlyRate(annualPct), months)).times(100).toFixed(0));
    payments = Array.from({ length: months }, () => p);
  }
  return run(plan, balance, annualPct, payments, extra, eligible);
}

export function computeStudentLoan(i: StudentLoanInput): StudentLoanOutput {
  const plans = PLANS.map((p) => planSchedule(p, i.balance, i.interestRate));
  const scheduled = plans.find((p) => p.plan === i.plan)!;
  const selected = i.extraMonthly > 0 ? planSchedule(i.plan, i.balance, i.interestRate, i.extraMonthly) : scheduled;
  return {
    selected,
    scheduled,
    interestSaved: cents(D(scheduled.totalInterest).minus(selected.totalInterest)).toNumber(),
    monthsSaved: scheduled.months - selected.months,
    costVsStandard: cents(D(scheduled.totalInterest).minus(plans[0]!.totalInterest)).toNumber(),
    rate: monthlyRate(i.interestRate).toNumber(),
    firstInterest: cents(D(i.balance).times(monthlyRate(i.interestRate))).toNumber(),
    tieredYears: tieredYears(i.balance),
    graduatedStep: graduatedTerms(Math.max(i.balance, 1), i.interestRate).step,
    plans,
    years: byYear(selected.rows),
  };
}
