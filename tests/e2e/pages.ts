/** Page lists for e2e tests, read from the built site so new pages are covered automatically. */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name === 'index.html' || name === '404.html') out.push(p);
  }
  return out;
}

export function builtUrls(): string[] {
  const dist = path.resolve('dist');
  return walk(dist)
    .map((f) => '/' + path.relative(dist, f).split(path.sep).join('/').replace(/index\.html$/, ''))
    .sort();
}

/** Calculator pages: /<category>/<slug>/, where <slug> is a folder in src/calculators. */
export function calculatorUrls(): string[] {
  const slugs = new Set(readdirSync(path.resolve('src/calculators')));
  return builtUrls().filter((u) => {
    const m = u.match(/^\/([^/]+)\/([^/]+)\/$/);
    return !!m && m[1] !== 'embed' && slugs.has(m[2]!);
  });
}

/** One representative URL per page type, for expensive checks. */
export function pageTypeSamples(): string[] {
  const urls = builtUrls();
  const pick = (re: RegExp) => urls.find((u) => re.test(u));
  return [
    '/',
    pick(/^\/(finance|health|math|everyday)\/$/),
    pick(/^\/(finance|health|math|everyday)\/[^/]+\/$/),
    pick(/^\/finance\/[^/]+\/states\/$/),
    pick(/^\/finance\/[^/]+\/(?!states\/)[^/]+\/$/),
    pick(/^\/guides\/[^/]+\/$/),
    pick(/^\/embed\/[^/]+\/$/),
    '/about/',
    '/search/',
    '/404.html',
  ].filter((u): u is string => !!u);
}
