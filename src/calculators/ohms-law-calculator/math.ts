/**
 * Ohm's law and electrical power: from any two of voltage (V), current (I), resistance (R) and
 * power (P), find the other two with V = I × R and P = V × I (and their rearrangements).
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type KnownPair = 'VI' | 'VR' | 'IR' | 'PV' | 'PI' | 'PR';

export interface OhmsInput extends Record<string, unknown> {
  known: KnownPair;
  /** Volts. */
  voltage: number;
  /** Amperes. */
  current: number;
  /** Ohms. */
  resistance: number;
  /** Watts. */
  power: number;
}

export interface OhmsOutput {
  /** False when the inputs can't produce a result (e.g. dividing by zero). */
  valid: boolean;
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  /** The formulas used for the two unknowns. */
  formulas: [string, string];
}

const round = (d: Decimal) => d.toSignificantDigits(10).toNumber();
const FORMULAS: Record<KnownPair, [string, string]> = {
  VI: ['R = V ÷ I', 'P = V × I'],
  VR: ['I = V ÷ R', 'P = V² ÷ R'],
  IR: ['V = I × R', 'P = I² × R'],
  PV: ['I = P ÷ V', 'R = V² ÷ P'],
  PI: ['V = P ÷ I', 'R = P ÷ I²'],
  PR: ['I = √(P ÷ R)', 'V = √(P × R)'],
};

export function computeOhms(i: OhmsInput): OhmsOutput {
  const v = D(Math.max(0, i.voltage || 0));
  const a = D(Math.max(0, i.current || 0));
  const r = D(Math.max(0, i.resistance || 0));
  const p = D(Math.max(0, i.power || 0));
  let V = D(0);
  let I = D(0);
  let R = D(0);
  let P = D(0);
  let valid = true;
  switch (i.known) {
    case 'VI':
      V = v; I = a; P = v.times(a);
      if (a.isZero()) valid = false; else R = v.div(a);
      break;
    case 'VR':
      V = v; R = r;
      if (r.isZero()) valid = false; else { I = v.div(r); P = v.pow(2).div(r); }
      break;
    case 'IR':
      I = a; R = r; V = a.times(r); P = a.pow(2).times(r);
      break;
    case 'PV':
      P = p; V = v;
      if (v.isZero() || p.isZero()) valid = false; else { I = p.div(v); R = v.pow(2).div(p); }
      break;
    case 'PI':
      P = p; I = a;
      if (a.isZero()) valid = false; else { V = p.div(a); R = p.div(a.pow(2)); }
      break;
    case 'PR':
      P = p; R = r;
      if (r.isZero()) valid = false; else { I = p.div(r).sqrt(); V = p.times(r).sqrt(); }
      break;
  }
  return { valid, voltage: round(V), current: round(I), resistance: round(R), power: round(P), formulas: FORMULAS[i.known] };
}
