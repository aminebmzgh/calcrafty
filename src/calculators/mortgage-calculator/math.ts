/**
 * Mortgage math: principal & interest, property tax, homeowners insurance, PMI with
 * automatic termination at 78% LTV, HOA dues, extra payments and the amortization schedule.
 */
import { amortize, byYear, cents, D, type AmortRow, type YearRow } from '../../lib/math/money.ts';

export interface MortgageInput extends Record<string, unknown> {
  homePrice: number;
  /** Down payment, as a percent of price or dollars depending on downMode. */
  downPayment: number;
  downMode: 'percent' | 'usd';
  interestRate: number;
  termYears: number;
  /** Annual property tax as % of home price. */
  propertyTaxRate: number;
  /** Annual homeowners insurance, dollars. */
  homeInsurance: number;
  /** Annual PMI as % of the original loan amount (applies when down payment < 20%). */
  pmiRate: number;
  /** Monthly HOA dues, dollars. */
  hoa: number;
  /** Extra principal each month, dollars. */
  extraMonthly: number;
}

export interface MortgageRow extends AmortRow {
  /** PMI paid this month (stored as `other` for yearly grouping). */
  other: number;
}

export interface MortgageOutput {
  loanAmount: number;
  downPaymentAmount: number;
  downPaymentPct: number;
  /** Loan-to-value at purchase, %. */
  ltv: number;
  monthlyPI: number;
  monthlyTax: number;
  monthlyInsurance: number;
  /** PMI in the first month (0 if none). */
  monthlyPMI: number;
  monthlyHOA: number;
  /** First-month total payment: P&I + tax + insurance + PMI + HOA (+ extra not included). */
  totalMonthly: number;
  /** Tax + insurance + PMI + HOA per month (everything except principal & interest). */
  monthlyNonPI: number;
  totalInterest: number;
  /** Total of all P&I payments plus extra principal. */
  totalPrincipalAndInterest: number;
  /** Lifetime cost including tax, insurance, PMI and HOA. */
  totalCost: number;
  payoffMonths: number;
  /** Number of months PMI is charged. */
  pmiMonths: number;
  pmiTotal: number;
  /** Same loan with no extra payments, for "extra payments save X". */
  baseline: { totalInterest: number; payoffMonths: number; pmiMonths: number };
  interestSaved: number;
  monthsSaved: number;
  /** When no extra payment is set: what $200/month extra would save (for the explanation). */
  extraSuggestion: { amount: number; interestSaved: number; monthsSaved: number } | null;
  schedule: MortgageRow[];
  years: YearRow[];
}

/** Monthly periodic rate (for display in Show the math). */
export const monthlyRateOf = (annualPct: number): number => D(annualPct).div(1200).toNumber();
export const paymentsOf = (years: number): number => Math.round(years * 12);

/** Down payment in dollars from either mode. */
export function downPaymentAmount(homePrice: number, value: number, mode: 'percent' | 'usd'): number {
  return mode === 'percent' ? cents(D(homePrice).times(value).div(100)).toNumber() : cents(value).toNumber();
}

/** True when the down payment exceeds the home price (validation). */
export function downPaymentTooLarge(homePrice: number, value: number, mode: 'percent' | 'usd'): boolean {
  return downPaymentAmount(homePrice, value, mode) > homePrice;
}

/** Converts a down payment value between percent and dollars (for the $ / % toggle). */
export function convertDownPayment(homePrice: number, value: number, from: 'percent' | 'usd', to: 'percent' | 'usd'): number {
  if (from === to) return value;
  if (to === 'usd') return Math.round(downPaymentAmount(homePrice, value, 'percent'));
  if (homePrice <= 0) return 0;
  return D(value).div(homePrice).times(100).toDecimalPlaces(2).toNumber();
}

/**
 * Month in which PMI stops. Under the Homeowners Protection Act (12 U.S.C. 4902), PMI on a
 * conventional loan terminates automatically when the balance is first scheduled to reach 78% of
 * the original value, and no later than the midpoint of the term. We also stop it when the actual
 * balance reaches 78% (with extra payments, that comes earlier; borrowers can request removal at 80%).
 * Returns the number of months PMI is charged (0 if the loan starts at or below 80% LTV).
 */
export function pmiMonths(homePrice: number, loanAmount: number, scheduled: AmortRow[], actual: AmortRow[]): number {
  if (homePrice <= 0 || D(loanAmount).div(homePrice).lte(0.8)) return 0;
  // Exact integer comparison: balance ≤ 78% of price  ⇔  balance¢ × 100 ≤ price¢ × 78.
  const priceCents78 = Math.round(homePrice * 100) * 78;
  const midpoint = Math.ceil(scheduled.length / 2);
  // Balance at the start of month m is the previous row's ending balance.
  const firstAtOrBelow = (rows: AmortRow[]) => {
    const i = rows.findIndex((r) => Math.round(r.balance * 100) * 100 <= priceCents78);
    return i === -1 ? rows.length : i + 1;
  };
  return Math.min(firstAtOrBelow(scheduled), firstAtOrBelow(actual), midpoint, actual.length);
}

export const SUGGESTED_EXTRA = 200;

function suggestion(loan: number, rate: number, months: number, extra: number, scheduled: ReturnType<typeof amortize>) {
  if (extra > 0 || loan <= 0 || months <= 1) return null;
  const alt = amortize(loan, rate, months, SUGGESTED_EXTRA);
  return { amount: SUGGESTED_EXTRA, interestSaved: cents(D(scheduled.totalInterest).minus(alt.totalInterest)).toNumber(), monthsSaved: scheduled.months - alt.months };
}

export function computeMortgage(input: MortgageInput): MortgageOutput {
  const { homePrice, interestRate, termYears, propertyTaxRate, homeInsurance, pmiRate, hoa, extraMonthly } = input;
  const months = Math.round(termYears * 12);
  const down = Math.min(downPaymentAmount(homePrice, input.downPayment, input.downMode), homePrice);
  const loanAmount = cents(D(homePrice).minus(down)).toNumber();

  const scheduled = amortize(loanAmount, interestRate, months);
  const actual = extraMonthly > 0 ? amortize(loanAmount, interestRate, months, extraMonthly) : scheduled;

  const monthlyTax = cents(D(homePrice).times(propertyTaxRate).div(100).div(12)).toNumber();
  const monthlyInsurance = cents(D(homeInsurance).div(12)).toNumber();
  const pmiMonthly = cents(D(loanAmount).times(pmiRate).div(100).div(12)).toNumber();
  const pmiN = pmiRate > 0 ? pmiMonths(homePrice, loanAmount, scheduled.rows, actual.rows) : 0;
  const basePmiN = pmiRate > 0 ? pmiMonths(homePrice, loanAmount, scheduled.rows, scheduled.rows) : 0;
  const monthlyHOA = cents(hoa).toNumber();

  const schedule: MortgageRow[] = actual.rows.map((r) => ({ ...r, other: r.period <= pmiN ? pmiMonthly : 0 }));
  const pmiTotal = cents(D(pmiMonthly).times(pmiN)).toNumber();
  const monthlyPMI = pmiN > 0 ? pmiMonthly : 0;
  const totalMonthly = cents(D(scheduled.payment).plus(monthlyTax).plus(monthlyInsurance).plus(monthlyPMI).plus(monthlyHOA)).toNumber();
  const escrowAndHoa = D(monthlyTax).plus(monthlyInsurance).plus(monthlyHOA).times(actual.months);
  const totalCost = cents(D(actual.totalPaid).plus(escrowAndHoa).plus(pmiTotal)).toNumber();

  return {
    loanAmount,
    downPaymentAmount: down,
    downPaymentPct: homePrice > 0 ? D(down).div(homePrice).times(100).toDecimalPlaces(2).toNumber() : 0,
    ltv: homePrice > 0 ? D(loanAmount).div(homePrice).times(100).toDecimalPlaces(2).toNumber() : 0,
    monthlyPI: scheduled.payment,
    monthlyTax,
    monthlyInsurance,
    monthlyPMI,
    monthlyHOA,
    totalMonthly,
    monthlyNonPI: cents(D(totalMonthly).minus(scheduled.payment)).toNumber(),
    totalInterest: cents(actual.totalInterest).toNumber(),
    totalPrincipalAndInterest: cents(actual.totalPaid).toNumber(),
    totalCost,
    payoffMonths: actual.months,
    pmiMonths: pmiN,
    pmiTotal,
    baseline: { totalInterest: cents(scheduled.totalInterest).toNumber(), payoffMonths: scheduled.months, pmiMonths: basePmiN },
    interestSaved: cents(D(scheduled.totalInterest).minus(actual.totalInterest)).toNumber(),
    monthsSaved: scheduled.months - actual.months,
    extraSuggestion: suggestion(loanAmount, interestRate, months, extraMonthly, scheduled),
    schedule,
    years: byYear(schedule),
  };
}
