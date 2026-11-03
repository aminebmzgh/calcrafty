/**
 * Recipe scaling: every ingredient quantity × (new servings ÷ original servings). Quantities at the
 * start of a line can be whole numbers, decimals, fractions (1/3), mixed numbers (1 1/2) or the
 * common fraction characters (½ ¼ ¾ ⅓ ⅔ ⅛). Scaled amounts are shown as kitchen fractions:
 * the nearest eighth, or a sixth, third or two-thirds when that is closer.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export interface RecipeInput extends Record<string, unknown> {
  servings: number;
  newServings: number;
  ingredients: string;
}

export interface ScaledLine {
  original: string;
  /** Null for lines without a leading quantity (e.g. "salt to taste"). */
  quantity: number | null;
  scaled: number | null;
  /** Kitchen-friendly amount, e.g. "2 1/4". */
  display: string | null;
  /** The rest of the line after the quantity, e.g. "cups flour". */
  rest: string;
  /** True when the kitchen fraction differs noticeably (over 5%) from the exact amount. */
  approximate: boolean;
}

export interface RecipeOutput {
  factor: number;
  lines: ScaledLine[];
  scaledCount: number;
}

const UNICODE: Record<string, number> = { '½': 1 / 2, '¼': 1 / 4, '¾': 3 / 4, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8 };
const U = Object.keys(UNICODE).join('');
const QTY = new RegExp(`^\\s*(?:(\\d+)\\s+(\\d+)\\s*/\\s*(\\d+)|(\\d+)\\s*([${U}])|(\\d+)\\s*/\\s*(\\d+)|([${U}])|(\\d+(?:\\.\\d+)?|\\.\\d+))(?![\\d/])\\s*(.*)$`);

/** Splits "1 1/2 cups flour" into 1.5 and "cups flour"; null if there is no leading quantity. */
export function parseQuantity(line: string): { quantity: number; rest: string } | null {
  const m = QTY.exec(line);
  if (!m) return null;
  let q: number;
  if (m[1]) q = +m[1] + +m[2]! / +m[3]!;
  else if (m[4]) q = +m[4] + UNICODE[m[5]!]!;
  else if (m[6]) q = +m[6] / +m[7]!;
  else if (m[8]) q = UNICODE[m[8]]!;
  else q = +m[9]!;
  if (!Number.isFinite(q)) return null;
  return { quantity: q, rest: (m[10] ?? '').trim() };
}

const CANDIDATES: [number, string][] = [
  [0, ''], [1 / 8, '1/8'], [1 / 6, '1/6'], [1 / 4, '1/4'], [1 / 3, '1/3'], [3 / 8, '3/8'], [1 / 2, '1/2'],
  [5 / 8, '5/8'], [2 / 3, '2/3'], [3 / 4, '3/4'], [7 / 8, '7/8'], [1, ''],
];

/** Formats a quantity as a kitchen fraction: "2 1/4", "1/3", "3". */
export function kitchenFraction(x: number): { text: string; value: number } {
  if (x <= 0) return { text: '0', value: 0 };
  let whole = Math.floor(x);
  const frac = x - whole;
  let best = CANDIDATES[0]!;
  for (const c of CANDIDATES) if (Math.abs(c[0] - frac) < Math.abs(best[0] - frac) - 1e-12) best = c;
  if (best[0] === 1) {
    whole += 1;
    best = CANDIDATES[0]!;
  }
  if (whole === 0 && best[0] === 0) return { text: kitchenFraction(1 / 8).text, value: 1 / 8 }; // never round a real amount down to nothing
  const text = whole === 0 ? best[1] : best[1] ? `${whole} ${best[1]}` : String(whole);
  return { text, value: whole + best[0] };
}

export function computeRecipe(i: RecipeInput): RecipeOutput {
  const from = Math.max(0, i.servings || 0);
  const to = Math.max(0, i.newServings || 0);
  const factor = from > 0 ? D(to).div(from) : D(1);
  const lines: ScaledLine[] = [];
  for (const raw of (i.ingredients ?? '').split(/\r?\n/)) {
    const original = raw.trim();
    if (!original) continue;
    const p = parseQuantity(original);
    if (!p) {
      lines.push({ original, quantity: null, scaled: null, display: null, rest: original, approximate: false });
      continue;
    }
    const scaled = D(p.quantity).times(factor).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();
    const kf = kitchenFraction(scaled);
    lines.push({ original, quantity: p.quantity, scaled, display: kf.text, rest: p.rest, approximate: scaled > 0 && Math.abs(kf.value - scaled) / scaled > 0.05 });
  }
  return { factor: factor.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(), lines, scaledCount: lines.filter((l) => l.quantity !== null).length };
}
