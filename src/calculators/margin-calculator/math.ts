/**
 * Profit margin and markup.
 *   profit = price − cost
 *   gross margin = profit ÷ price      (share of the selling price that is profit)
 *   markup       = profit ÷ cost       (how much was added on top of cost)
 * Rearranged: price = cost ÷ (1 − margin), price = cost × (1 + markup), cost = price × (1 − margin).
 * The two percentages convert directly: markup = m ÷ (1 − m), margin = k ÷ (1 + k).
 * Prices are rounded to the cent where a price is the answer; percentages are kept to 4 decimals.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export type MarginMode = 'costPrice' | 'costMargin' | 'costMarkup' | 'priceMargin';

export interface MarginInput extends Record<string, unknown> {
  mode: MarginMode;
  cost: number;
  price: number;
  /** Gross margin, percent of price. */
  margin: number;
  /** Markup, percent of cost. */
  markup: number;
  /** Units sold, for total profit. */
  units: number;
}

export interface MarginRow {
  margin: number;
  markup: number;
  price: number;
  profit: number;
}

export interface MarginOutput {
  valid: boolean;
  /** Why the inputs can't produce a result. */
  problem?: string;
  cost: number;
  price: number;
  profit: number;
  margin: number;
  markup: number;
  units: number;
  totalRevenue: number;
  totalProfit: number;
  /** Price, profit and markup for common margins at this cost. */
  table: MarginRow[];
}

export const TABLE_MARGINS = [10, 20, 25, 30, 40, 50, 60, 70];

const pct4 = (d: Decimal) => d.times(100).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();

/** Markup % that gives a margin %: k = m ÷ (1 − m). Infinity at 100% margin. */
export function marginToMarkup(marginPct: number): number {
  const m = D(marginPct).div(100);
  if (m.gte(1)) return Infinity;
  return pct4(m.div(D(1).minus(m)));
}

/** Margin % that a markup % gives: m = k ÷ (1 + k). */
export function markupToMargin(markupPct: number): number {
  const k = D(markupPct).div(100);
  if (k.lte(-1)) return -Infinity;
  return pct4(k.div(k.plus(1)));
}

/** Selling price for a cost and a target margin: cost ÷ (1 − margin). */
export function priceForMargin(cost: number, marginPct: number): number {
  const m = D(marginPct).div(100);
  if (m.gte(1)) return Infinity;
  return cents(D(cost).div(D(1).minus(m))).toNumber();
}

const invalid = (problem: string, i: MarginInput): MarginOutput => ({
  valid: false,
  problem,
  cost: 0,
  price: 0,
  profit: 0,
  margin: 0,
  markup: 0,
  units: Math.max(1, Math.round(i.units || 1)),
  totalRevenue: 0,
  totalProfit: 0,
  table: [],
});

export function computeMargin(i: MarginInput): MarginOutput {
  let cost: Decimal;
  let price: Decimal;
  const units = Math.max(1, Math.round(i.units || 1));
  switch (i.mode) {
    case 'costMargin': {
      if (i.margin >= 100) return invalid('A margin of 100% or more is impossible: it would mean the item cost nothing.', i);
      cost = D(Math.max(0, i.cost || 0));
      price = cents(cost.div(D(1).minus(D(i.margin).div(100))));
      break;
    }
    case 'costMarkup': {
      if (i.markup <= -100) return invalid('A markup of −100% or less would give a price of zero or below.', i);
      cost = D(Math.max(0, i.cost || 0));
      price = cents(cost.times(D(1).plus(D(i.markup).div(100))));
      break;
    }
    case 'priceMargin': {
      if (i.margin >= 100) return invalid('A margin of 100% or more is impossible: it would mean the item cost nothing.', i);
      price = D(Math.max(0, i.price || 0));
      cost = cents(price.times(D(1).minus(D(i.margin).div(100))));
      break;
    }
    default: {
      cost = D(Math.max(0, i.cost || 0));
      price = D(Math.max(0, i.price || 0));
    }
  }
  if (price.lte(0)) return invalid('Enter a selling price above zero.', i);
  const profit = price.minus(cost);
  const margin = pct4(profit.div(price));
  const markup = cost.gt(0) ? pct4(profit.div(cost)) : Infinity;
  const c = cost.toNumber();
  return {
    valid: true,
    cost: c,
    price: price.toNumber(),
    profit: cents(profit).toNumber(),
    margin,
    markup,
    units,
    totalRevenue: cents(price.times(units)).toNumber(),
    totalProfit: cents(profit.times(units)).toNumber(),
    table: c > 0
      ? TABLE_MARGINS.map((m) => {
          const p = priceForMargin(c, m);
          return { margin: m, markup: marginToMarkup(m), price: p, profit: cents(D(p).minus(c)).toNumber() };
        })
      : [],
  };
}
