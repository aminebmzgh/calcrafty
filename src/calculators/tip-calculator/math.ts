/**
 * Tip and bill split: tip = bill × tip %, total = bill + tip, divided between the people paying.
 * Optionally each person's share is rounded up to the next whole dollar, with the extra going to
 * the tip. Also a table of common tip percentages for the same bill.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export interface TipInput extends Record<string, unknown> {
  bill: number;
  tipPercent: number;
  people: number;
  roundUp: boolean;
}

export interface TipRow {
  percent: number;
  tip: number;
  total: number;
  perPerson: number;
}

export interface TipOutput {
  /** Tip at the chosen % before any rounding up. */
  baseTip: number;
  tip: number;
  total: number;
  perPerson: number;
  tipPerPerson: number;
  /** The tip as a % of the bill after any rounding up. */
  effectivePercent: number;
  people: number;
  table: TipRow[];
}

export const COMMON_PERCENTS = [10, 15, 18, 20, 22, 25];

function split(bill: Decimal, pct: number, people: number, roundUp: boolean) {
  const rawTip = cents(bill.times(Math.max(0, pct)).div(100));
  let perPerson = bill.plus(rawTip).div(people);
  perPerson = roundUp ? perPerson.toDecimalPlaces(6).toDecimalPlaces(0, Decimal.ROUND_UP) : perPerson.toDecimalPlaces(2, Decimal.ROUND_UP);
  const total = roundUp ? perPerson.times(people) : bill.plus(rawTip);
  const tip = total.minus(bill);
  return { tip: cents(tip), total: cents(total), perPerson: cents(perPerson) };
}

export function computeTip(i: TipInput): TipOutput {
  const bill = D(Math.max(0, i.bill || 0));
  const people = Math.max(1, Math.round(i.people || 1));
  const s = split(bill, i.tipPercent, people, i.roundUp);
  return {
    baseTip: cents(bill.times(Math.max(0, i.tipPercent || 0)).div(100)).toNumber(),
    tip: s.tip.toNumber(),
    total: s.total.toNumber(),
    perPerson: s.perPerson.toNumber(),
    tipPerPerson: cents(s.tip.div(people)).toNumber(),
    effectivePercent: bill.gt(0) ? s.tip.div(bill).times(100).toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber() : 0,
    people,
    table: COMMON_PERCENTS.map((p) => {
      const r = split(bill, p, people, false);
      return { percent: p, tip: r.tip.toNumber(), total: r.total.toNumber(), perPerson: r.perPerson.toNumber() };
    }),
  };
}
