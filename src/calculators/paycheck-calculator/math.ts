/**
 * Paycheck math: gross pay (salary or hourly), pre-tax deductions, 2026 federal income tax,
 * Social Security, Medicare (with Additional Medicare Tax) and state income tax → take-home pay.
 *
 * Federal tax is the annual liability on (gross − pre-tax deductions − standard deduction), which is
 * what default W-4 withholding (IRS Pub. 15-T percentage method, no adjustments) is designed to match.
 */
import { cents, D } from '../../lib/math/money.ts';
import { bracketTax, type BracketSlice } from '../../lib/math/tax.ts';
import { FEDERAL_BRACKETS_2026, FICA_2026, STANDARD_DEDUCTION_2026, RETIREMENT_LIMITS_2026, type FilingStatus } from '../../data/static/tax-2026.ts';
import { getState, type StateTaxSchedule } from '../../data/static/states.ts';

export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export const PERIODS: Record<PayFrequency, number> = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };

export interface PaycheckInput extends Record<string, unknown> {
  payType: 'salary' | 'hourly';
  salary: number;
  hourlyRate: number;
  hoursPerWeek: number;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  /** Traditional 401(k)/403(b) deferral, % of gross pay. Reduces income tax, not FICA. */
  retirementPct: number;
  /** Section 125 pre-tax deductions per year (health premiums, HSA via payroll). Reduce income tax and FICA. */
  preTaxAnnual: number;
  /** State slug from src/data/static/states.ts, or '' to use the flat stateRate. */
  state: string;
  /** Flat effective state income tax rate, % (used when no state is selected). */
  stateRate: number;
  /** Flat local (city/county) income tax rate on wages, %. */
  localRate: number;
}


export interface PaycheckOutput {
  periods: number;
  grossAnnual: number;
  grossPerPeriod: number;
  /** Hourly ↔ annual equivalents (52 weeks). */
  hourlyEquivalent: number;
  retirementAnnual: number;
  preTaxAnnual: number;
  federalTaxable: number;
  federalTax: number;
  federalSlices: BracketSlice[];
  marginalRate: number;
  socialSecurity: number;
  medicare: number;
  stateTax: number;
  statePayroll: number;
  localTax: number;
  totalTax: number;
  netAnnual: number;
  netPerPeriod: number;
  /** Total taxes ÷ gross, %. */
  effectiveRate: number;
  /** State income tax + state payroll taxes + local tax, per year. */
  stateAndLocal: number;
  fica: number;
  perPeriod: { federal: number; socialSecurity: number; medicare: number; state: number; retirement: number; preTax: number; other: number; stateAndLocal: number; fica: number; deductions: number };
}

export function grossAnnualOf(input: Pick<PaycheckInput, 'payType' | 'salary' | 'hourlyRate' | 'hoursPerWeek'>): number {
  return input.payType === 'hourly' ? cents(D(input.hourlyRate).times(input.hoursPerWeek).times(52)).toNumber() : cents(input.salary).toNumber();
}

/** Hourly rate for a salary at the given weekly hours (52 weeks). */
export function hourlyFromAnnual(annual: number, hoursPerWeek: number): number {
  if (hoursPerWeek <= 0) return 0;
  return cents(D(annual).div(D(hoursPerWeek).times(52))).toNumber();
}

export function socialSecurityTax(ficaWages: number): number {
  return cents(D(Math.min(Math.max(0, ficaWages), FICA_2026.socialSecurityWageBase)).times(FICA_2026.socialSecurityRate)).toNumber();
}

export function medicareTax(ficaWages: number): number {
  const w = Math.max(0, ficaWages);
  const base = D(w).times(FICA_2026.medicareRate);
  const extra = D(Math.max(0, w - FICA_2026.additionalMedicareThreshold)).times(FICA_2026.additionalMedicareRate);
  return cents(base.plus(extra)).toNumber();
}

/** Personal exemption: a fixed amount, or per person by income tier (Ohio). */
export function stateExemption(sch: StateTaxSchedule, k: 'single' | 'mfj', income: number): number {
  if (!sch.exemptionTiers) return sch.exemption[k];
  const tier = sch.exemptionTiers.find((t) => income <= t.maxIncome);
  return tier ? tier.perPerson * (k === 'mfj' ? 2 : 1) : 0;
}

/** State income tax and payroll taxes under a state's 2026 schedule. */
export function stateTaxes(sch: StateTaxSchedule, status: FilingStatus, wages: { agi: number; fica: number; preTaxOnly: number }) {
  const k = status === 'mfj' ? 'mfj' : 'single';
  const base = sch.retirementTaxable ? wages.preTaxOnly : wages.agi;
  const taxable = Math.max(0, base - sch.standardDeduction[k] - stateExemption(sch, k, base));
  const tax = Math.max(0, cents(D(bracketTax(taxable, sch.brackets[k]).tax).minus(sch.credit[k])).toNumber());
  let payroll = D(0);
  for (const p of sch.payroll) {
    const amt = D(wages.fica).times(p.rate).div(100);
    payroll = payroll.plus(p.maxAnnual !== undefined ? capAt(amt, p.maxAnnual) : amt);
  }
  return { taxable, tax, payroll: cents(payroll).toNumber() };
}

const capAt = (a: ReturnType<typeof D>, b: number) => (a.gt(b) ? D(b) : a);

export function computePaycheck(input: PaycheckInput): PaycheckOutput {
  const periods = PERIODS[input.payFrequency];
  const gross = grossAnnualOf(input);
  const retirement = cents(Math.min(D(gross).times(input.retirementPct).div(100).toNumber(), RETIREMENT_LIMITS_2026.elective401k)).toNumber();
  const preTax = Math.min(cents(input.preTaxAnnual).toNumber(), Math.max(0, gross - retirement));
  const ficaWages = Math.max(0, gross - preTax);
  const agiWages = Math.max(0, gross - preTax - retirement);

  const federalTaxable = Math.max(0, agiWages - STANDARD_DEDUCTION_2026[input.filingStatus]);
  const fed = bracketTax(federalTaxable, FEDERAL_BRACKETS_2026[input.filingStatus]);
  const socialSecurity = socialSecurityTax(ficaWages);
  const medicare = medicareTax(ficaWages);

  const st = input.state ? getState(input.state) : undefined;
  let stateTax: number;
  let statePayroll = 0;
  if (st) {
    const t = stateTaxes(st.paycheck.schedule, input.filingStatus, { agi: agiWages, fica: ficaWages, preTaxOnly: Math.max(0, gross - preTax) });
    stateTax = t.tax;
    statePayroll = t.payroll;
  } else {
    stateTax = cents(D(agiWages).times(input.stateRate).div(100)).toNumber();
  }
  const localTax = cents(D(agiWages).times(input.localRate).div(100)).toNumber();

  const totalTax = cents(D(fed.tax).plus(socialSecurity).plus(medicare).plus(stateTax).plus(statePayroll).plus(localTax)).toNumber();
  const netAnnual = cents(D(gross).minus(totalTax).minus(retirement).minus(preTax)).toNumber();
  const per = (n: number) => cents(D(n).div(periods)).toNumber();

  return {
    periods,
    grossAnnual: gross,
    grossPerPeriod: per(gross),
    hourlyEquivalent: input.payType === 'hourly' ? input.hourlyRate : hourlyFromAnnual(gross, 40),
    retirementAnnual: retirement,
    preTaxAnnual: preTax,
    federalTaxable,
    federalTax: fed.tax,
    federalSlices: fed.slices,
    marginalRate: fed.marginalRate,
    socialSecurity,
    medicare,
    stateTax,
    statePayroll,
    localTax,
    totalTax,
    stateAndLocal: cents(D(stateTax).plus(statePayroll).plus(localTax)).toNumber(),
    fica: cents(D(socialSecurity).plus(medicare)).toNumber(),
    netAnnual,
    netPerPeriod: per(netAnnual),
    effectiveRate: gross > 0 ? D(totalTax).div(gross).times(100).toDecimalPlaces(2).toNumber() : 0,
    perPeriod: {
      federal: per(fed.tax),
      socialSecurity: per(socialSecurity),
      medicare: per(medicare),
      state: per(stateTax),
      retirement: per(retirement),
      preTax: per(preTax),
      other: per(statePayroll + localTax),
      stateAndLocal: per(stateTax + statePayroll + localTax),
      fica: per(socialSecurity + medicare),
      deductions: per(retirement + preTax),
    },
  };
}
