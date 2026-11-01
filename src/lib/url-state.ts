/**
 * Shareable URLs: calculator inputs live in the query string.
 * Only values that differ from the defaults are written, so share links stay short.
 * The canonical URL is always the clean, parameter-free path (set in SeoHead).
 */

type Value = unknown;

export function encodeValue(v: Value): string {
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number' || typeof v === 'string') return String(v);
  return JSON.stringify(v);
}

export function decodeValue(raw: string, like: Value): Value | undefined {
  if (typeof like === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof like === 'boolean') return raw === '1' || raw === 'true';
  if (typeof like === 'string') return raw;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(like) !== Array.isArray(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

/** Builds a query string of the inputs that differ from defaults. */
export function toQuery<I extends Record<string, unknown>>(input: I, defaults: I): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(defaults)) {
    const v = input[key];
    if (encodeValue(v) !== encodeValue(defaults[key])) params.set(key, encodeValue(v));
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

/** Reads known input keys from a query string, typed like the defaults. Unknown keys are ignored. */
export function fromQuery<I extends Record<string, unknown>>(search: string, defaults: I): Partial<I> {
  const params = new URLSearchParams(search);
  const out: Partial<I> = {};
  for (const key of Object.keys(defaults) as (keyof I & string)[]) {
    const raw = params.get(key);
    if (raw === null) continue;
    const v = decodeValue(raw, defaults[key]);
    if (v !== undefined) out[key] = v as I[typeof key];
  }
  return out;
}

export function shareUrl(path: string, query: string, origin = 'https://calcrafty.com'): string {
  return `${origin}${path}${query}`;
}
