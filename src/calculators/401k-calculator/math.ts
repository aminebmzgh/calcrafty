/**
 * 401(k) projection: employee deferrals (capped at the IRS limit, with age-based catch-up),
 * the employer match, salary growth and investment return, compounded monthly until retirement.
 * IRS limits are held at their 2026 values (they rise with inflation in practice, so this is conservative).
 */
import { RETIREMENT_LIMITS_2026 } from '../../data/static/tax-2026.ts';
import { cents, D } from '../../lib/math/money.ts';

export interface K401Input extends Record<string, unknown> {
  currentAge: number;
  retireAge: number;
  salary: number;
  /** Yearly raise, %. */
  salaryGrowth: number;
  /** Your contribution, % of salary. */
  contribPct: number;
  /** Employer match rate: 50 means 50 cents per dollar you contribute. */
  matchRate: number;
  /** Employer matches contributions up to this % of salary. */
  matchUpTo: number;
  balance: number;
  /** Expected annual return, %. */
  returnRate: number;
  /** Inflation, % a year, for today's-dollars figures. */
  inflation: number;
}

export interface K401Year {
  age: number;
  salary: number;
  employee: number;
  employer: number;
  balance: number;
}

export interface K401Output {
  balance: number;
  todaysDollars: number;
  employeeTotal: number;
  employerTotal: number;
  growth: number;
  /** First-year contributions. */
  firstEmployee: number;
  firstEmployer: number;
  /** Yearly employer match you miss by contributing less than the match limit (first year). */
  matchMissed: number;
  /** Years in which your contribution hit the IRS limit. */
  yearsAtLimit: number;
  years: K401Year[];
}

/** IRS employee deferral limit for a given age (2026 values). */
export function deferralLimit(age: number): number {
  const L = RETIREMENT_LIMITS_2026;
  if (age >= 60 && age <= 63) return L.elective401k + L.catchUp60to63;
  if (age >= 50) return L.elective401k + L.catchUp50;
  return L.elective401k;
}

/** Employee and employer contributions for one year. */
export function contributionsFor(salary: number, contribPct: number, matchRate: number, matchUpTo: number, age: number) {
  const wanted = D(salary).times(contribPct).div(100);
  const limit = D(deferralLimit(age));
  const employee = wanted.gt(limit) ? limit : wanted;
  const matchedPct = Math.min(contribPct, matchUpTo);
  // The match is based on the % you actually contribute, up to the match limit.
  const effectivePct = employee.div(salary || 1).times(100);
  const pctForMatch = effectivePct.lt(matchedPct) ? effectivePct : D(matchedPct);
  const employer = D(salary).times(pctForMatch).div(100).times(matchRate).div(100);
  return { employee: cents(employee), employer: cents(employer), capped: wanted.gt(limit) };
}

export function compute401k(i: K401Input): K401Output {
  const years = Math.max(0, Math.round(i.retireAge - i.currentAge));
  const r = D(i.returnRate).div(1200);
  let bal = D(Math.max(0, i.balance));
  let salary = D(Math.max(0, i.salary));
  let employeeTotal = D(0);
  let employerTotal = D(0);
  let yearsAtLimit = 0;
  const rows: K401Year[] = [];
  let first = { employee: D(0), employer: D(0) };

  for (let y = 0; y < years; y++) {
    const age = Math.round(i.currentAge) + y;
    const c = contributionsFor(salary.toNumber(), i.contribPct, i.matchRate, i.matchUpTo, age);
    if (y === 0) first = { employee: c.employee, employer: c.employer };
    if (c.capped) yearsAtLimit++;
    const monthly = c.employee.plus(c.employer).div(12);
    for (let m = 0; m < 12; m++) bal = bal.times(D(1).plus(r)).plus(monthly);
    employeeTotal = employeeTotal.plus(c.employee);
    employerTotal = employerTotal.plus(c.employer);
    rows.push({ age: age + 1, salary: cents(salary).toNumber(), employee: c.employee.toNumber(), employer: c.employer.toNumber(), balance: cents(bal).toNumber() });
    salary = salary.times(D(1).plus(D(i.salaryGrowth).div(100)));
  }

  const balance = cents(bal);
  const startBal = D(Math.max(0, i.balance));
  const missedPct = Math.max(0, i.matchUpTo - i.contribPct);
  return {
    balance: balance.toNumber(),
    todaysDollars: cents(balance.div(D(1).plus(D(i.inflation).div(100)).pow(years))).toNumber(),
    employeeTotal: cents(employeeTotal).toNumber(),
    employerTotal: cents(employerTotal).toNumber(),
    growth: cents(balance.minus(startBal).minus(employeeTotal).minus(employerTotal)).toNumber(),
    firstEmployee: first.employee.toNumber(),
    firstEmployer: first.employer.toNumber(),
    matchMissed: cents(D(Math.max(0, i.salary)).times(missedPct).div(100).times(i.matchRate).div(100)).toNumber(),
    yearsAtLimit,
    years: rows,
  };
}
