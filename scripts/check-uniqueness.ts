/**
 * State page uniqueness check: fails if any two state pages of the same calculator share
 * more than 70% of their main-content text (5-word shingles, Jaccard similarity).
 */
import { htmlPages, mainText, report } from './lib/dist.ts';

const THRESHOLD = 0.7;
const SHINGLE = 5;

export function shingles(text: string, n = SHINGLE): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9$%. ]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
}

export function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

const statePage = /^\/finance\/([^/]+)\/(?!states\/)([^/]+)\/$/;
const groups = new Map<string, { url: string; sh: Set<string> }[]>();
for (const p of htmlPages()) {
  const m = statePage.exec(p.url);
  if (!m) continue;
  const list = groups.get(m[1]!) ?? [];
  list.push({ url: p.url, sh: shingles(mainText(p.html)) });
  groups.set(m[1]!, list);
}

const errors: string[] = [];
let compared = 0;
let worst = 0;
for (const list of groups.values()) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const s = similarity(list[i]!.sh, list[j]!.sh);
      compared++;
      worst = Math.max(worst, s);
      if (s > THRESHOLD) errors.push(`${list[i]!.url} and ${list[j]!.url} are ${(s * 100).toFixed(0)}% similar (max ${THRESHOLD * 100}%)`);
    }
  }
}

report(`State page uniqueness (${compared} pairs, highest ${(worst * 100).toFixed(0)}%)`, errors);
