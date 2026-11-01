/**
 * Fraction arithmetic on mixed numbers with exact integers (BigInt), plus the steps a student would write:
 * convert to improper fractions, find the least common denominator, operate, then simplify by the GCD.
 */

export type Op = '+' | '-' | '*' | '/';

export interface FractionInput extends Record<string, unknown> {
  w1: number;
  n1: number;
  d1: number;
  op: Op;
  w2: number;
  n2: number;
  d2: number;
}

export interface Fraction {
  n: bigint;
  d: bigint;
}

export interface FractionOutput {
  error: string | null;
  a: Fraction;
  b: Fraction;
  /** Unsimplified result. */
  raw: Fraction;
  /** Simplified result (denominator positive). */
  result: Fraction;
  gcd: bigint;
  lcd: bigint | null;
  mixed: { sign: '' | '−'; whole: bigint; n: bigint; d: bigint };
  decimal: number;
  /** Plain-text steps. */
  steps: { label: string; text: string }[];
}

const abs = (x: bigint) => (x < 0n ? -x : x);

export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}

export const lcm = (a: bigint, b: bigint): bigint => (abs(a) / gcd(a, b)) * abs(b);

export function simplify(f: Fraction): Fraction {
  if (f.d === 0n) throw new RangeError('zero denominator');
  const g = gcd(f.n, f.d);
  const sign = f.d < 0n ? -1n : 1n;
  return { n: (sign * f.n) / g, d: (sign * f.d) / g };
}

/** Mixed number → improper fraction. The sign of the whole part applies to the fraction part too (−1 1/2 = −3/2). */
export function improper(whole: number, n: number, d: number): Fraction {
  const W = BigInt(Math.trunc(whole));
  const N = BigInt(Math.trunc(n));
  const Dd = BigInt(Math.trunc(d));
  const negative = W < 0n || (W === 0n && N < 0n);
  const top = abs(W) * Dd + abs(N);
  return { n: negative ? -top : top, d: Dd };
}

export const fmt = (f: Fraction) => `${f.n < 0n ? '−' : ''}${abs(f.n)}/${f.d}`;

/** "5/12", or just "3" for whole numbers. */
export const resultLabel = (f: Fraction): string => (f.d === 1n ? `${f.n < 0n ? '−' : ''}${abs(f.n)}` : fmt(f));

export function toMixed(f: Fraction): FractionOutput['mixed'] {
  const sign = f.n < 0n ? '−' : '';
  const n = abs(f.n);
  return { sign, whole: n / f.d, n: n % f.d, d: f.d };
}

export function mixedLabel(m: FractionOutput['mixed']): string {
  if (m.n === 0n) return `${m.sign}${m.whole}`;
  return m.whole === 0n ? `${m.sign}${m.n}/${m.d}` : `${m.sign}${m.whole} ${m.n}/${m.d}`;
}

export function computeFraction(i: FractionInput): FractionOutput {
  const empty: Fraction = { n: 0n, d: 1n };
  const fail = (error: string): FractionOutput => ({ error, a: empty, b: empty, raw: empty, result: empty, gcd: 1n, lcd: null, mixed: toMixed(empty), decimal: 0, steps: [] });
  if (![i.w1, i.n1, i.d1, i.w2, i.n2, i.d2].every((x) => Number.isInteger(x))) return fail('Use whole numbers for each part of the fractions.');
  if (i.d1 === 0 || i.d2 === 0) return fail('A denominator can’t be zero.');
  const a = improper(i.w1, i.n1, i.d1);
  const b = improper(i.w2, i.n2, i.d2);
  const steps: FractionOutput['steps'] = [];
  if (i.w1 !== 0 || i.w2 !== 0) steps.push({ label: 'Convert to improper fractions', text: `${fmt(a)} and ${fmt(b)}` });

  let raw: Fraction;
  let lcd: bigint | null = null;
  if (i.op === '+' || i.op === '-') {
    lcd = lcm(a.d, b.d);
    const an = a.n * (lcd / a.d);
    const bn = b.n * (lcd / b.d);
    steps.push({ label: 'Find the least common denominator', text: `LCD(${a.d}, ${b.d}) = ${lcd}` });
    steps.push({ label: 'Rewrite with the common denominator', text: `${an}/${lcd} ${i.op === '+' ? '+' : '−'} ${bn}/${lcd}` });
    raw = { n: i.op === '+' ? an + bn : an - bn, d: lcd };
    steps.push({ label: i.op === '+' ? 'Add the numerators' : 'Subtract the numerators', text: `${fmt(raw)}` });
  } else if (i.op === '*') {
    raw = { n: a.n * b.n, d: a.d * b.d };
    steps.push({ label: 'Multiply numerators and denominators', text: `(${a.n} × ${b.n}) / (${a.d} × ${b.d}) = ${fmt(raw)}` });
  } else {
    if (b.n === 0n) return fail('You can’t divide by zero.');
    raw = { n: a.n * b.d, d: a.d * b.n };
    steps.push({ label: 'Multiply by the reciprocal', text: `${fmt(a)} × ${b.d}/${b.n} = ${fmt(simplifySign(raw))}` });
  }
  const g = gcd(raw.n, raw.d);
  const result = simplify(raw);
  if (g > 1n) steps.push({ label: 'Simplify by the greatest common divisor', text: `GCD = ${g}: ${fmt(simplifySign(raw))} = ${fmt(result)}` });
  const mixed = toMixed(result);
  if (abs(result.n) >= result.d && mixed.n !== 0n) steps.push({ label: 'Write as a mixed number', text: mixedLabel(mixed) });
  return { error: null, a, b, raw, result, gcd: g, lcd, mixed, decimal: Number(result.n) / Number(result.d), steps };
}

function simplifySign(f: Fraction): Fraction {
  return f.d < 0n ? { n: -f.n, d: -f.d } : f;
}
