/**
 * Discounts: sale price = price × (1 − d), or price − a fixed amount off. An optional extra
 * percentage off is applied to the already reduced price (stacked, as stores apply coupons), so
 * 25% then 10% off is 32.5% off in total, not 35%. Sales tax, if entered, is charged on the
 * discounted price. Each step is rounded to the cent, as a register does.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type DiscountType = 'percent' | 'amount';

export interface DiscountInput extends Record<string, unknown> {
  price: number;
  type: DiscountType;
  /** Percent off. */
  percentOff: number;
  /** Dollars off. */
  amountOff: number;
  /** An extra percent off applied after the first discount. */
  extraPercent: number;
  /** Sales tax rate, percent, charged on the discounted price. */
  taxRate: number;
}

export interface DiscountRow {
  percentOff: number;
  salePrice: number;
  savings: number;
}

export interface DiscountOutput {
  original: number;
  /** Price after the first discount. */
  afterFirst: number;
  salePrice: number;
  savings: number;
  /** Total discount as a percent of the original price. */
  effectivePercent: number;
  /** What simply adding the two percentages would wrongly suggest. */
  addedPercent: number;
  tax: number;
  total: number;
  table: DiscountRow[];
}

export const TABLE_PERCENTS = [10, 15, 20, 25, 30, 40, 50, 60, 70, 75];

const clampPct = (n: number) => Math.min(100, Math.max(0, n || 0));

/** Price after a percentage off, rounded to the cent. */
export function percentOff(price: number, pct: number): number {
  return cents(D(Math.max(0, price)).times(D(100).minus(clampPct(pct))).div(100)).toNumber();
}

/** Percent off implied by an original and a sale price. */
export function impliedPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return D(original).minus(sale).div(original).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/** Original price from a sale price and the percent off: sale ÷ (1 − d). */
export function originalFromSale(sale: number, pct: number): number {
  const d = clampPct(pct);
  if (d >= 100) return Infinity;
  return cents(D(sale).times(100).div(D(100).minus(d))).toNumber();
}

export function computeDiscount(i: DiscountInput): DiscountOutput {
  const original = cents(Math.max(0, i.price || 0));
  const afterFirst = i.type === 'amount' ? (() => { const r = original.minus(cents(Math.max(0, i.amountOff || 0))); return r.lt(0) ? D(0) : r; })() : D(percentOff(original.toNumber(), i.percentOff));
  const sale = D(percentOff(afterFirst.toNumber(), i.extraPercent));
  const tax = cents(sale.times(Math.max(0, i.taxRate || 0)).div(100));
  const firstPct = i.type === 'amount' ? impliedPercent(original.toNumber(), afterFirst.toNumber()) : clampPct(i.percentOff);
  return {
    original: original.toNumber(),
    afterFirst: afterFirst.toNumber(),
    salePrice: sale.toNumber(),
    savings: original.minus(sale).toNumber(),
    effectivePercent: impliedPercent(original.toNumber(), sale.toNumber()),
    addedPercent: D(firstPct).plus(clampPct(i.extraPercent)).toDecimalPlaces(2).toNumber(),
    tax: tax.toNumber(),
    total: sale.plus(tax).toNumber(),
    table: TABLE_PERCENTS.map((p) => {
      const s = percentOff(original.toNumber(), p);
      return { percentOff: p, salePrice: s, savings: original.minus(s).toNumber() };
    }),
  };
}
