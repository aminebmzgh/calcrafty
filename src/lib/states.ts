/** State page wiring. Data lives in src/data/static/states.ts (Phase 6). */
import type { AnyCalculatorConfig } from './types.ts';

export interface StatePageRef {
  slug: string;
  name: string;
  description: string;
  /** ISO date the state's data refers to (e.g. tax year start). */
  dataYear: string;
}

/** State pages a calculator generates. Only states with complete, sourced data are returned. */
export function statePagesFor(c: AnyCalculatorConfig): StatePageRef[] {
  if (!c.statePages) return [];
  return [];
}
