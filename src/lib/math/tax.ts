/** Progressive bracket tax (federal and state). Pure, decimal arithmetic. */
import type { Brackets } from '../../data/static/tax-2026.ts';
import { cents, D } from './money.ts';

export interface BracketSlice {
  rate: number;
  from: number;
  to: number | null;
  /** Income taxed in this bracket. */
  amount: number;
  tax: number;
}

export interface BracketResult {
  tax: number;
  marginalRate: number;
  slices: BracketSlice[];
}

/** Tax on `taxable` income under progressive brackets; returns the per-bracket breakdown. */
export function bracketTax(taxable: number, brackets: Brackets): BracketResult {
  const income = Math.max(0, taxable);
  let tax = D(0);
  let marginalRate = brackets[0]?.[1] ?? 0;
  const slices: BracketSlice[] = [];
  for (let i = 0; i < brackets.length; i++) {
    const [from, rate] = brackets[i]!;
    const to = brackets[i + 1]?.[0] ?? null;
    if (income <= from && !(i === 0 && income === 0)) break;
    const top = to === null ? income : Math.min(income, to);
    const amount = D(top).minus(from);
    if (amount.lte(0)) continue;
    const t = amount.times(rate);
    tax = tax.plus(t);
    marginalRate = rate;
    slices.push({ rate, from, to, amount: amount.toNumber(), tax: cents(t).toNumber() });
  }
  return { tax: cents(tax).toNumber(), marginalRate, slices };
}
