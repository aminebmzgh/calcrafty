/**
 * Byte budgets per page (docs/BUILD-BRIEF.md section 16), measured on dist/:
 * - first-party JS loaded at startup (module scripts + their static imports), gzipped < 35 KB
 * - CSS (inline <style> + linked stylesheets), gzipped < 20 KB
 * Lazily imported chunks (search dialog, etc.) are not counted: they load on demand.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { DIST, htmlPages, report } from './lib/dist.ts';

const JS_BUDGET = 35 * 1024;
const CSS_BUDGET = 20 * 1024;

const gz = (s: string | Buffer) => gzipSync(s, { level: 9 }).length;
const cache = new Map<string, string>();
function read(file: string): string {
  if (!cache.has(file)) cache.set(file, readFileSync(file, 'utf8'));
  return cache.get(file)!;
}

/** Static import graph of a JS file (dynamic import() is excluded). */
function staticGraph(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file) || !existsSync(file)) return seen;
  seen.add(file);
  const src = read(file);
  for (const m of src.matchAll(/(?:^|[;\s}])import\s*(?:[^'"()]*?from\s*)?["']([^"']+)["']/g)) {
    const spec = m[1]!;
    if (spec.startsWith('.') || spec.startsWith('/')) {
      const next = spec.startsWith('/') ? path.join(DIST, spec) : path.resolve(path.dirname(file), spec);
      staticGraph(next, seen);
    }
  }
  return seen;
}

const errors: string[] = [];
let maxJs = 0;
let maxCss = 0;
for (const p of htmlPages()) {
  const files = new Set<string>();
  for (const m of p.html.matchAll(/<script type="module" src="([^"]+)"/g)) staticGraph(path.join(DIST, m[1]!), files);
  for (const m of p.html.matchAll(/<link rel="modulepreload" href="([^"]+)"/g)) staticGraph(path.join(DIST, m[1]!), files);
  let inlineJs = '';
  for (const m of p.html.matchAll(/<script(?: type="module")?>([\s\S]*?)<\/script>/g)) inlineJs += m[1];
  const js = [...files].reduce((sum, f) => sum + gz(read(f)), 0) + (inlineJs ? gz(inlineJs) : 0);

  let css = '';
  for (const m of p.html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += m[1];
  for (const m of p.html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) css += read(path.join(DIST, m[1]!));
  const cssSize = css ? gz(css) : 0;

  maxJs = Math.max(maxJs, js);
  maxCss = Math.max(maxCss, cssSize);
  if (js > JS_BUDGET) errors.push(`${p.url}: JS ${(js / 1024).toFixed(1)} KB gz (budget 35 KB)`);
  if (cssSize > CSS_BUDGET) errors.push(`${p.url}: CSS ${(cssSize / 1024).toFixed(1)} KB gz (budget 20 KB)`);
}

report(`Budgets (max JS ${(maxJs / 1024).toFixed(1)} KB gz, max CSS ${(maxCss / 1024).toFixed(1)} KB gz)`, errors);
