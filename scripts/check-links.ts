/**
 * Internal link check of the built site:
 * - no broken internal links (every href resolves to a file in dist/)
 * - no orphans: every content page is reachable from the homepage within 3 clicks
 */
import { htmlPages, internalLinks, isUtilityPage, report, resolveInDist } from './lib/dist.ts';

const MAX_DEPTH = 3;
const errors: string[] = [];
const pages = htmlPages();
const links = new Map<string, string[]>();

for (const p of pages) {
  const out = internalLinks(p.html);
  links.set(p.url, out);
  for (const href of new Set(out)) {
    if (!resolveInDist(href)) errors.push(`${p.url} links to missing ${href}`);
    else if (!href.endsWith('/') && !/\.[a-z0-9]+$/i.test(href)) errors.push(`${p.url} links to ${href} without a trailing slash`);
  }
}

// Breadth-first crawl from the homepage.
const depth = new Map<string, number>([['/', 0]]);
const queue = ['/'];
while (queue.length) {
  const url = queue.shift()!;
  const d = depth.get(url)!;
  for (const next of links.get(url) ?? []) {
    if (!depth.has(next) && links.has(next)) {
      depth.set(next, d + 1);
      queue.push(next);
    }
  }
}
for (const p of pages) {
  if (isUtilityPage(p.url)) continue;
  const d = depth.get(p.url);
  if (d === undefined) errors.push(`${p.url} is an orphan (not reachable from the homepage)`);
  else if (d > MAX_DEPTH) errors.push(`${p.url} is ${d} clicks from the homepage (max ${MAX_DEPTH})`);
}

report(`Link check (${pages.length} pages)`, errors);
