/**
 * Punnett square for one to three genes with complete dominance. Each parent's genotype is a
 * sequence of allele pairs such as "Aa" or "AaBb"; each pair is one gene, written with the same
 * letter (upper case = dominant allele). Gametes are every combination of one allele per gene, each
 * equally likely (independent assortment); offspring genotypes and phenotypes are counted over the
 * full grid of gamete pairings.
 */

export interface PunnettInput extends Record<string, unknown> {
  parent1: string;
  parent2: string;
}

export interface Ratio {
  label: string;
  count: number;
  /** Share of offspring, %, 2 decimals. */
  percent: number;
}

export interface PunnettOutput {
  valid: boolean;
  error: string | null;
  genes: number;
  /** Gametes of parent 1 (rows) and parent 2 (columns). */
  gametes1: string[];
  gametes2: string[];
  /** grid[row][col] is the offspring genotype. */
  grid: string[][];
  cells: number;
  genotypes: Ratio[];
  phenotypes: Ratio[];
  /** e.g. "1 : 2 : 1". */
  genotypeRatio: string;
  phenotypeRatio: string;
}

/** Splits "AaBb" into ["Aa", "Bb"]; returns an error message if it isn't valid. */
export function parseGenotype(raw: string): string[] | string {
  const s = (raw ?? '').replace(/\s+/g, '');
  if (!s) return 'Enter a genotype such as Aa or AaBb.';
  if (!/^[A-Za-z]+$/.test(s)) return 'Use letters only, such as Aa or AaBb.';
  if (s.length % 2) return 'Each gene needs two alleles, such as Aa.';
  const pairs: string[] = [];
  for (let k = 0; k < s.length; k += 2) {
    const pair = s.slice(k, k + 2);
    if (pair[0]!.toLowerCase() !== pair[1]!.toLowerCase()) return `"${pair}" mixes two genes; write each gene as two forms of one letter, such as Aa.`;
    pairs.push(pair);
  }
  const letters = pairs.map((p) => p[0]!.toLowerCase());
  if (new Set(letters).size !== letters.length) return 'Each gene should use a different letter.';
  if (pairs.length > 3) return 'Up to three genes are supported.';
  return pairs;
}

/** Puts the dominant allele first: "aA" → "Aa". */
const normPair = (a: string, b: string) => (a === a.toUpperCase() || b !== b.toUpperCase() ? a + b : b + a);

function gametesOf(pairs: string[]): string[] {
  let out = [''];
  for (const p of pairs) out = out.flatMap((g) => [g + p[0], g + p[1]]);
  return out;
}

function offspring(g1: string, g2: string): string {
  let s = '';
  for (let k = 0; k < g1.length; k++) s += normPair(g1[k]!, g2[k]!);
  return s;
}

function phenotypeOf(genotype: string): string {
  const parts: string[] = [];
  for (let k = 0; k < genotype.length; k += 2) {
    const L = genotype[k]!.toUpperCase();
    const dominant = genotype[k] === L || genotype[k + 1] === L;
    parts.push(dominant ? `${L}_` : `${L.toLowerCase()}${L.toLowerCase()}`);
  }
  return parts.join(' ');
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

function ratiosOf(labels: string[], order: (a: string, b: string) => number): Ratio[] {
  const counts = new Map<string, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => order(a[0], b[0]))
    .map(([label, count]) => ({ label, count, percent: Math.round((count / labels.length) * 10_000) / 100 }));
}

const ratioText = (r: Ratio[]) => {
  const g = r.reduce((acc, x) => gcd(acc, x.count), 0) || 1;
  return r.map((x) => x.count / g).join(' : ');
};

/** Dominant-first ordering for labels like "AA", "Aa", "aa" or "A_ bb". */
const dominantFirst = (a: string, b: string) => {
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    if (a[k] === b[k]) continue;
    const ua = a[k] === a[k]!.toUpperCase() && a[k] !== '_';
    const ub = b[k] === b[k]!.toUpperCase() && b[k] !== '_';
    if (ua !== ub) return ua ? -1 : 1;
    return a[k]!.localeCompare(b[k]!);
  }
  return a.length - b.length;
};

export function computePunnett(i: PunnettInput): PunnettOutput {
  const empty = { genes: 0, gametes1: [], gametes2: [], grid: [], cells: 0, genotypes: [], phenotypes: [], genotypeRatio: '', phenotypeRatio: '' };
  const p1 = parseGenotype(i.parent1);
  const p2 = parseGenotype(i.parent2);
  if (typeof p1 === 'string') return { valid: false, error: `Parent 1: ${p1}`, ...empty };
  if (typeof p2 === 'string') return { valid: false, error: `Parent 2: ${p2}`, ...empty };
  const genes1 = p1.map((p) => p[0]!.toLowerCase()).join('');
  const genes2 = p2.map((p) => p[0]!.toLowerCase()).join('');
  if (genes1 !== genes2) return { valid: false, error: 'Both parents need the same genes in the same order, such as AaBb × aaBb.', ...empty };
  const gametes1 = gametesOf(p1);
  const gametes2 = gametesOf(p2);
  const grid = gametes1.map((a) => gametes2.map((b) => offspring(a, b)));
  const all = grid.flat();
  const genotypes = ratiosOf(all, dominantFirst);
  const phenotypes = ratiosOf(all.map(phenotypeOf), dominantFirst);
  return {
    valid: true,
    error: null,
    genes: p1.length,
    gametes1,
    gametes2,
    grid,
    cells: all.length,
    genotypes,
    phenotypes,
    genotypeRatio: ratioText(genotypes),
    phenotypeRatio: ratioText(phenotypes),
  };
}
