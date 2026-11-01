/** State page wiring: which states a calculator gets pages for, and the per-state SEO text. */
import type { AnyCalculatorConfig } from './types.ts';
import { STATES, STATE_DATA_YEAR, type StateInfo } from '../data/static/states.ts';

export interface StatePageRef {
  slug: string;
  name: string;
  description: string;
  /** ISO date the state's data refers to. */
  dataYear: string;
}

/** Pick the first candidate between 140 and 160 characters (meta description rule). */
export function fitDescription(candidates: string[]): string {
  const ok = candidates.find((c) => c.length >= 140 && c.length <= 160);
  if (!ok) throw new Error(`No description fits 140–160 chars: ${candidates.map((c) => `${c.length}: ${c}`).join(' | ')}`);
  return ok;
}

export function stateTitle(kind: 'mortgage' | 'paycheck', s: StateInfo): string {
  const options =
    kind === 'mortgage'
      ? [`${s.name} Mortgage Calculator with Taxes | Calcrafty`, `${s.name} Mortgage Calculator | Calcrafty`]
      : [`${s.name} Paycheck Calculator 2026 | Calcrafty`, `${s.name} Paycheck Calculator`];
  return options.find((t) => t.length <= 60)!;
}

export function stateDescription(kind: 'mortgage' | 'paycheck', s: StateInfo): string {
  if (kind === 'mortgage') {
    return fitDescription([
      `Estimate a ${s.name} mortgage payment with ${s.mortgage.county} property tax (${s.mortgage.propertyTaxRate}%), ${s.name}’s average home insurance and this week’s mortgage rate, plus PMI.`,
      `Estimate your ${s.name} mortgage payment with local property tax (${s.mortgage.propertyTaxRate}% in ${s.mortgage.county}), average insurance and this week’s rate, plus PMI and HOA.`,
      `Calculate a ${s.name} mortgage payment with ${s.mortgage.county} property taxes, ${s.name} homeowners insurance costs and this week’s average rate, with PMI and an amortization schedule.`,
      `${s.name} mortgage calculator: monthly payment with local property tax, average ${s.abbr} home insurance and this week’s rate, plus PMI, HOA and a full amortization schedule.`,
    ]);
  }
  return fitDescription(
    s.paycheck.noIncomeTax
      ? [
          `Calculate take-home pay in ${s.name} for 2026. ${s.name} has no state income tax, so see exactly what federal tax, Social Security and Medicare take from each paycheck.`,
          `${s.name} paycheck calculator for 2026: there’s no state income tax, so see what federal income tax, Social Security, Medicare and 401(k) take from your paycheck.`,
        ]
      : [
          `Calculate 2026 take-home pay in ${s.name} after federal tax, ${s.name} state income tax, Social Security, Medicare and payroll deductions, for salary or hourly pay.`,
          `${s.name} paycheck calculator for 2026: take-home pay after federal and ${s.name} income tax, Social Security, Medicare and 401(k), from a salary or hourly wage.`,
          `${s.name} paycheck calculator 2026: see take-home pay after federal and state income tax, Social Security, Medicare and 401(k), for any salary or hourly wage.`,
          `${s.name} paycheck calculator 2026: take-home pay after federal and state income tax, Social Security, Medicare and 401(k), for any salary or hourly wage.`,
        ],
  );
}

/** State pages a calculator generates. Only states with complete, sourced data are listed in STATES. */
export function statePagesFor(c: AnyCalculatorConfig): StatePageRef[] {
  const kind = c.statePages?.kind;
  if (!kind) return [];
  return STATES.map((s) => ({ slug: s.slug, name: s.name, description: stateDescription(kind, s), dataYear: STATE_DATA_YEAR }));
}

/** 3–5 other states to link to (neighbors in the list, wrapping around). */
export function relatedStates(slug: string, n = 4): StateInfo[] {
  const i = STATES.findIndex((s) => s.slug === slug);
  return Array.from({ length: n }, (_, k) => STATES[(i + k + 1) % STATES.length]!);
}
