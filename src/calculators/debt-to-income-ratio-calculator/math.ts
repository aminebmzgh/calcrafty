/**
 * Debt-to-income (DTI) ratios: front-end (housing ÷ gross monthly income) and back-end
 * (all monthly debt payments ÷ gross monthly income), checked against common lender guidelines.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type LoanType = 'conventional' | 'fha' | 'va' | 'usda';

export interface DtiInput extends Record<string, unknown> {
  /** Gross (pre-tax) annual income. */
  annualIncome: number;
  /** Rent, or mortgage payment with property tax, insurance, PMI and HOA dues. */
  housing: number;
  autoLoans: number;
  studentLoans: number;
  /** Minimum payments on credit cards. */
  creditCards: number;
  /** Personal loans, child support, alimony and other required payments. */
  otherDebts: number;
  loanType: LoanType;
}

export interface DtiLimits {
  /** Front-end guideline, %, or null when the program has none (VA). */
  front: number | null;
  /** Back-end guideline, %. */
  back: number;
  name: string;
}

/**
 * Guideline ratios by loan program:
 * - Conventional: 28/36 rule of thumb; Fannie Mae allows up to 45% manually and 50% through Desktop Underwriter (Selling Guide B3-6-02).
 * - FHA: 31/43 (HUD Handbook 4000.1); higher ratios with compensating factors.
 * - VA: 41% back-end benchmark with a residual-income test, no front-end ratio (VA Pamphlet 26-7, ch. 4).
 * - USDA: 29/41 (HB-1-3555, ch. 11).
 */
export const LIMITS: Record<LoanType, DtiLimits> = {
  conventional: { front: 28, back: 36, name: 'Conventional' },
  fha: { front: 31, back: 43, name: 'FHA' },
  va: { front: null, back: 41, name: 'VA' },
  usda: { front: 29, back: 41, name: 'USDA' },
};

export type DtiBand = 'good' | 'manageable' | 'high';

export interface DtiOutput {
  monthlyIncome: number;
  totalDebts: number;
  /** Debt payments other than housing. */
  nonHousingDebts: number;
  /** Gross monthly income left after all debt payments (not below 0). */
  leftOver: number;
  /** Housing ÷ income, %, 2 decimals. */
  frontEnd: number;
  /** All debts ÷ income, %, 2 decimals. */
  backEnd: number;
  band: DtiBand;
  limits: DtiLimits;
  meetsFront: boolean;
  meetsBack: boolean;
  /** Largest housing payment that keeps the back-end ratio at the guideline. */
  maxHousing: number;
  /** Monthly payments to cut to reach the back-end guideline (0 if already within it). */
  reductionNeeded: number;
}

const ratio = (part: Decimal, whole: Decimal): number => (whole.gt(0) ? part.div(whole).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber() : 0);

/** 35% or less is generally seen as good, 36–49% as manageable, 50% or more as high. */
export function bandOf(backEnd: number): DtiBand {
  if (backEnd <= 35) return 'good';
  if (backEnd < 50) return 'manageable';
  return 'high';
}

export function computeDti(i: DtiInput): DtiOutput {
  const monthlyIncome = cents(D(Math.max(0, i.annualIncome)).div(12));
  const nonHousing = D(i.autoLoans).plus(i.studentLoans).plus(i.creditCards).plus(i.otherDebts);
  const totalDebts = cents(nonHousing.plus(i.housing));
  const frontEnd = ratio(D(i.housing), monthlyIncome);
  const backEnd = ratio(totalDebts, monthlyIncome);
  const limits = LIMITS[i.loanType] ?? LIMITS.conventional;
  const backAllowance = monthlyIncome.times(limits.back).div(100);
  return {
    monthlyIncome: monthlyIncome.toNumber(),
    totalDebts: totalDebts.toNumber(),
    nonHousingDebts: cents(nonHousing).toNumber(),
    leftOver: Math.max(0, cents(monthlyIncome.minus(totalDebts)).toNumber()),
    frontEnd,
    backEnd,
    band: bandOf(backEnd),
    limits,
    meetsFront: limits.front === null || frontEnd <= limits.front,
    meetsBack: backEnd <= limits.back,
    maxHousing: Math.max(0, cents(backAllowance.minus(nonHousing)).toNumber()),
    reductionNeeded: Math.max(0, cents(totalDebts.minus(backAllowance)).toNumber()),
  };
}
