/**
 * Keyword map check (research/keyword-map.csv):
 * - primary keywords and URLs are unique
 * - every built content page has a row
 * With --sync, rows whose page now exists are marked `built` (planned → built).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { htmlPages, isUtilityPage, report } from './lib/dist.ts';

const FILE = 'research/keyword-map.csv';
/** Trust and utility pages that don't target a keyword. */
const EXEMPT = new Set(['/about/', '/methodology/', '/privacy/', '/terms/', '/contact/', '/guides/']);

export interface KeywordRow {
  primary_keyword: string;
  secondary_keywords: string;
  intent: string;
  volume: string;
  difficulty: string;
  priority_score: string;
  url: string;
  page_type: string;
  status: string;
  data_source: string;
}

export function parseCsv(text: string): KeywordRow[] {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header!.split(',');
  return lines.map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? '').trim()])) as unknown as KeywordRow;
  });
}

const text = readFileSync(FILE, 'utf8');
const rows = parseCsv(text);
const errors: string[] = [];

const kw = new Map<string, number>();
const urls = new Map<string, number>();
rows.forEach((r, i) => {
  const line = i + 2;
  const k = r.primary_keyword.toLowerCase();
  if (!k) errors.push(`line ${line}: empty primary_keyword`);
  if (kw.has(k)) errors.push(`line ${line}: primary keyword "${k}" duplicates line ${kw.get(k)}`);
  kw.set(k, line);
  if (urls.has(r.url)) errors.push(`line ${line}: url ${r.url} duplicates line ${urls.get(r.url)}`);
  urls.set(r.url, line);
  if (!['calculate', 'learn', 'compare', 'local'].includes(r.intent)) errors.push(`line ${line}: unknown intent "${r.intent}"`);
  if (!['calculator', 'state-page', 'hub', 'guide'].includes(r.page_type)) errors.push(`line ${line}: unknown page_type "${r.page_type}"`);
  if (!['planned', 'built', 'reviewed', 'live'].includes(r.status)) errors.push(`line ${line}: unknown status "${r.status}"`);
});

if (existsSync('dist')) {
  for (const p of htmlPages()) {
    if (isUtilityPage(p.url) || EXEMPT.has(p.url) || p.url.endsWith('/states/')) continue;
    if (!urls.has(p.url)) errors.push(`built page ${p.url} has no keyword-map row`);
  }
  if (process.argv.includes('--sync')) {
    const built = new Set(htmlPages().map((p) => p.url));
    const out = text.split(/\r?\n/).map((line, i) => {
      if (i === 0 || !line) return line;
      const cells = line.split(',');
      if (built.has(cells[6]!) && cells[8] === 'planned') cells[8] = 'built';
      return cells.join(',');
    });
    writeFileSync(FILE, out.join('\n'));
    console.log('keyword map statuses synced with dist/');
  }
}

report(`Keyword map (${rows.length} rows)`, errors);
