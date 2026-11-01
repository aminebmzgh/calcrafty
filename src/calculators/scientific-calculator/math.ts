/**
 * Scientific expression evaluator (no eval): a small Pratt parser over IEEE-754 doubles.
 * Precedence, lowest to highest: + −; × ÷ and implicit multiplication; unary −; ^ (right-associative);
 * postfix ! and %. So −2^2 = −4, 2^3^2 = 512 and 2π = 6.283….
 * Results are shown to 12 significant digits, which hides binary rounding noise (0.1 + 0.2 = 0.3).
 */

export interface SciInput extends Record<string, unknown> {
  expression: string;
  angle: 'deg' | 'rad';
}

export interface SciOutput {
  value: number | null;
  display: string;
  error: string | null;
  /** The expression rewritten with explicit operators and standard symbols. */
  normalized: string;
}

type Tok = { t: 'num'; v: number; s: string } | { t: 'id'; v: string } | { t: 'op'; v: string };

const CONSTANTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E };
const FUNCS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'ln', 'log', 'log2', 'sqrt', 'cbrt', 'abs', 'exp', 'floor', 'ceil', 'round'] as const;
type Fn = (typeof FUNCS)[number];

export class CalcError extends Error {}

export function tokenize(src: string): Tok[] {
  const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/√/g, 'sqrt').replace(/\*\*/g, '^');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
    if (num) {
      out.push({ t: 'num', v: Number(num[0]), s: num[0] });
      i += num[0].length;
      continue;
    }
    const id = /^([a-z][a-z0-9]*|π)/i.exec(s.slice(i));
    if (id) {
      out.push({ t: 'id', v: id[0].toLowerCase() });
      i += id[0].length;
      continue;
    }
    if ('+-*/^()!%,'.includes(c)) {
      out.push({ t: 'op', v: c });
      i++;
      continue;
    }
    throw new CalcError(`Unexpected character “${c}”.`);
  }
  return out;
}

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new CalcError('Factorial needs a whole number 0 or greater.');
  if (n > 170) throw new CalcError('Factorial is too large to display (n ≤ 170).');
  let r = 1;
  for (let k = 2; k <= n; k++) r *= k;
  return r;
}

export function evaluate(expression: string, angle: 'deg' | 'rad' = 'deg'): { value: number; normalized: string } {
  const toks = tokenize(expression);
  if (!toks.length) throw new CalcError('Enter an expression, such as 2^10 or sin(30).');
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const toRad = (x: number) => (angle === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angle === 'deg' ? (x * 180) / Math.PI : x);
  /** Exact trig at multiples of 30°/45° in degree mode, to avoid sin(180) = 1.2e-16. */
  const trig = (f: 'sin' | 'cos' | 'tan', x: number) => {
    const r = f === 'sin' ? Math.sin(toRad(x)) : f === 'cos' ? Math.cos(toRad(x)) : Math.tan(toRad(x));
    if (angle === 'deg') {
      if (f === 'tan' && Math.abs(((x % 180) + 180) % 180 - 90) < 1e-12) throw new CalcError(`tan(${x}°) is undefined.`);
      if (Math.abs(r) < 1e-12) return 0;
    }
    return r;
  };
  const apply = (fn: Fn, x: number): number => {
    switch (fn) {
      case 'sin':
      case 'cos':
      case 'tan':
        return trig(fn, x);
      case 'asin':
      case 'acos':
        if (x < -1 || x > 1) throw new CalcError(`${fn} needs a value between −1 and 1.`);
        return fromRad(fn === 'asin' ? Math.asin(x) : Math.acos(x));
      case 'atan':
        return fromRad(Math.atan(x));
      case 'sinh':
        return Math.sinh(x);
      case 'cosh':
        return Math.cosh(x);
      case 'tanh':
        return Math.tanh(x);
      case 'ln':
      case 'log':
      case 'log2':
        if (x <= 0) throw new CalcError('Logarithms need a positive number.');
        return fn === 'ln' ? Math.log(x) : fn === 'log' ? Math.log10(x) : Math.log2(x);
      case 'sqrt':
        if (x < 0) throw new CalcError('The square root of a negative number isn’t a real number.');
        return Math.sqrt(x);
      case 'cbrt':
        return Math.cbrt(x);
      case 'abs':
        return Math.abs(x);
      case 'exp':
        return Math.exp(x);
      case 'floor':
        return Math.floor(x);
      case 'ceil':
        return Math.ceil(x);
      case 'round':
        return Math.round(x);
    }
  };

  const BP: Record<string, number> = { '+': 10, '-': 10, '*': 20, '/': 20, '^': 40 };
  const startsPrimary = (t: Tok | undefined) => !!t && (t.t === 'num' || t.t === 'id' || (t.t === 'op' && t.v === '('));

  function nud(): [number, string] {
    const t = next();
    if (!t) throw new CalcError('The expression ends too early.');
    if (t.t === 'num') return [t.v, t.s];
    if (t.t === 'op' && t.v === '(') {
      const [v, s] = expr(0);
      const c = next();
      if (!c || c.t !== 'op' || c.v !== ')') throw new CalcError('A closing parenthesis “)” is missing.');
      return [v, `(${s})`];
    }
    if (t.t === 'op' && (t.v === '-' || t.v === '+')) {
      const [v, s] = expr(30);
      return t.v === '-' ? [-v, `−${s}`] : [v, s];
    }
    if (t.t === 'id') {
      if (t.v in CONSTANTS) return [CONSTANTS[t.v]!, t.v === 'pi' ? 'π' : t.v];
      if ((FUNCS as readonly string[]).includes(t.v)) {
        const o = next();
        if (!o || o.t !== 'op' || o.v !== '(') throw new CalcError(`Use parentheses after ${t.v}, like ${t.v}(30).`);
        const [v, s] = expr(0);
        const c = next();
        if (!c || c.t !== 'op' || c.v !== ')') throw new CalcError('A closing parenthesis “)” is missing.');
        return [apply(t.v as Fn, v), `${t.v}(${s})`];
      }
      throw new CalcError(`Unknown name “${t.v}”.`);
    }
    throw new CalcError(`Unexpected “${t.v}”.`);
  }

  function expr(rbp: number): [number, string] {
    let [left, ls] = nud();
    for (;;) {
      const t = peek();
      if (t?.t === 'op' && (t.v === '!' || t.v === '%')) {
        if (50 <= rbp) break;
        next();
        if (t.v === '!') {
          left = factorial(left);
          ls = `${ls}!`;
        } else {
          left = left / 100;
          ls = `${ls}%`;
        }
        continue;
      }
      // Implicit multiplication: 2π, 3(4), (1+2)(3+4), 2sin(30).
      if (startsPrimary(t)) {
        if (20 <= rbp) break;
        const [r, rs] = expr(20);
        left = left * r;
        ls = `${ls} × ${rs}`;
        continue;
      }
      if (!t || t.t !== 'op' || !(t.v in BP)) break;
      const bp = BP[t.v]!;
      if (bp <= rbp) break;
      next();
      // ^ is right-associative: parse the right side with a slightly lower binding power.
      const [r, rs] = expr(t.v === '^' ? bp - 1 : bp);
      const sym = t.v === '*' ? '×' : t.v === '/' ? '÷' : t.v === '-' ? '−' : t.v;
      if (t.v === '/' && r === 0) throw new CalcError('Division by zero is undefined.');
      if (t.v === '^' && left < 0 && !Number.isInteger(r)) throw new CalcError('A negative number to a fractional power isn’t a real number. Try cbrt() for cube roots.');
      left = t.v === '+' ? left + r : t.v === '-' ? left - r : t.v === '*' ? left * r : t.v === '/' ? left / r : left ** r;
      ls = `${ls} ${sym} ${rs}`;
    }
    return [left, ls];
  }

  const [value, normalized] = expr(0);
  if (p < toks.length) {
    const t = toks[p]!;
    throw new CalcError(t.t === 'op' && t.v === ')' ? 'There’s an extra closing parenthesis “)”.' : `Unexpected “${t.t === 'num' ? t.s : t.v}”.`);
  }
  if (!Number.isFinite(value)) throw new CalcError('The result is too large to display.');
  return { value, normalized };
}

/** 12 significant digits, trailing zeros removed, exponent form for very large or small values. */
export function formatResult(x: number): string {
  if (x === 0 || Object.is(x, -0)) return '0';
  const abs = Math.abs(x);
  if (abs >= 1e15 || abs < 1e-9) return x.toPrecision(12).replace(/\.?0+e/, 'e').replace('-', '−');
  const s = Number(x.toPrecision(12)).toString();
  return s.replace('-', '−');
}

export function computeScientific(i: SciInput): SciOutput {
  try {
    const { value, normalized } = evaluate(i.expression, i.angle);
    return { value, display: formatResult(value), error: null, normalized };
  } catch (e) {
    const msg = e instanceof CalcError ? e.message : 'That expression couldn’t be calculated.';
    return { value: null, display: '—', error: msg, normalized: '' };
  }
}
