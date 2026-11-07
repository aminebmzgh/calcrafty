/**
 * Pythagorean theorem for a right triangle with legs a and b and hypotenuse c: a² + b² = c².
 *   c = √(a² + b²),  a = √(c² − b²),  b = √(c² − a²)
 * Also the two acute angles (A = atan(a ÷ b), opposite side a; B = 90° − A), the area (a × b ÷ 2)
 * and the perimeter. When the squared value is a whole number, the exact answer is given in
 * simplified radical form (√72 = 6√2). Square roots use 30-digit decimal arithmetic.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type Unknown = 'a' | 'b' | 'c';

export interface PythagorasInput extends Record<string, unknown> {
  solve: Unknown;
  a: number;
  b: number;
  c: number;
}

export interface PythagorasOutput {
  valid: boolean;
  problem?: string;
  a: number;
  b: number;
  c: number;
  /** The squared value under the root for the unknown side (a² + b², c² − b² or c² − a²). */
  squared: number;
  /** Exact form of the unknown side, e.g. "√149", "6√2" or "13"; null when inputs aren't whole numbers. */
  exact: string | null;
  /** Angle opposite side a, degrees. */
  angleA: number;
  /** Angle opposite side b, degrees. */
  angleB: number;
  area: number;
  perimeter: number;
  /** All three sides are whole numbers (a Pythagorean triple). */
  triple: boolean;
}

const sig = (d: Decimal) => d.toSignificantDigits(12).toNumber();

/** Simplified radical form of √n for a positive whole number n: returns [k, m] with √n = k√m. */
export function simplifyRoot(n: number): [number, number] {
  let k = 1;
  let m = n;
  for (let f = 2; f * f <= m; f++) {
    while (m % (f * f) === 0) {
      m /= f * f;
      k *= f;
    }
  }
  return [k, m];
}

export function radical(n: number): string {
  const [k, m] = simplifyRoot(n);
  if (m === 1) return String(k);
  return k === 1 ? `√${m}` : `${k}√${m}`;
}

const fail = (problem: string): PythagorasOutput => ({ valid: false, problem, a: 0, b: 0, c: 0, squared: 0, exact: null, angleA: 0, angleB: 0, area: 0, perimeter: 0, triple: false });

export function computePythagoras(i: PythagorasInput): PythagorasOutput {
  const a = D(Math.max(0, i.a || 0));
  const b = D(Math.max(0, i.b || 0));
  const c = D(Math.max(0, i.c || 0));
  let A = a;
  let B = b;
  let C = c;
  let squared: Decimal;
  if (i.solve === 'c') {
    if (a.lte(0) || b.lte(0)) return fail('Enter both legs, a and b, as positive numbers.');
    squared = a.pow(2).plus(b.pow(2));
    C = squared.sqrt();
  } else {
    const known = i.solve === 'a' ? b : a;
    if (c.lte(0) || known.lte(0)) return fail('Enter the hypotenuse and the other leg as positive numbers.');
    if (c.lte(known)) return fail('The hypotenuse (c) must be longer than either leg.');
    squared = c.pow(2).minus(known.pow(2));
    if (i.solve === 'a') A = squared.sqrt();
    else B = squared.sqrt();
  }
  const inputsWhole = [i.a, i.b, i.c].filter((_, k) => ['a', 'b', 'c'][k] !== i.solve).every((n) => Number.isInteger(n));
  const sq = squared.toNumber();
  const exact = inputsWhole && Number.isInteger(sq) && sq <= 1e12 ? radical(sq) : null;
  const angleA = (Math.atan2(A.toNumber(), B.toNumber()) * 180) / Math.PI;
  const out = {
    valid: true,
    a: sig(A),
    b: sig(B),
    c: sig(C),
    squared: sig(squared),
    exact,
    angleA: Math.round(angleA * 1e6) / 1e6,
    angleB: Math.round((90 - angleA) * 1e6) / 1e6,
    area: sig(A.times(B).div(2)),
    perimeter: sig(A.plus(B).plus(C)),
    triple: false,
  };
  out.triple = [out.a, out.b, out.c].every((n) => Number.isInteger(n));
  return out;
}
