/**
 * SEO validation of the built site (fails CI on any problem):
 * unique titles/descriptions/canonicals, length limits, a single H1, valid JSON-LD,
 * parameter-free self canonicals, and a sitemap that lists exactly the indexable pages.
 */
import { canonical, h1Count, htmlPages, isNoindex, isUtilityPage, jsonLdBlocks, meta, report, sitemapUrls, title } from './lib/dist.ts';

const SITE = 'https://calcrafty.com';
const errors: string[] = [];
const pages = htmlPages();
const seen = { title: new Map<string, string>(), description: new Map<string, string>(), canonical: new Map<string, string>() };

function unique(kind: keyof typeof seen, value: string, url: string) {
  const prev = seen[kind].get(value);
  if (prev) errors.push(`${url}: duplicate ${kind} (also on ${prev}): "${value}"`);
  else seen[kind].set(value, url);
}

const REQUIRED_TYPES: Record<string, string[]> = {
  calculator: ['WebApplication', 'FAQPage', 'BreadcrumbList', 'Organization', 'WebSite'],
};

for (const p of pages) {
  const t = title(p.html);
  const d = meta(p.html, 'description');
  const c = canonical(p.html);

  if (!t) errors.push(`${p.url}: missing <title>`);
  else {
    if (t.length > 60) errors.push(`${p.url}: title is ${t.length} chars (max 60): "${t}"`);
    unique('title', t, p.url);
  }
  if (!d) errors.push(`${p.url}: missing meta description`);
  else {
    if (d.length < 140 || d.length > 160) errors.push(`${p.url}: description is ${d.length} chars (140–160): "${d}"`);
    unique('description', d, p.url);
  }
  if (!c) errors.push(`${p.url}: missing canonical`);
  else {
    if (c.includes('?') || c.includes('#')) errors.push(`${p.url}: canonical has parameters: ${c}`);
    if (!c.startsWith(SITE + '/')) errors.push(`${p.url}: canonical must use ${SITE}: ${c}`);
    if (p.url !== '/404.html' && c !== SITE + p.url) errors.push(`${p.url}: canonical is not self-referencing: ${c}`);
    unique('canonical', c, p.url);
  }
  if (!p.url.startsWith('/embed/') && h1Count(p.html) !== 1) errors.push(`${p.url}: has ${h1Count(p.html)} <h1> elements (need exactly 1)`);
  if (p.url.startsWith('/embed/') && !isNoindex(p.html)) errors.push(`${p.url}: embed pages must be noindex`);

  const types = new Set<string>();
  for (const block of jsonLdBlocks(p.html)) {
    try {
      const json = JSON.parse(block) as { '@context'?: string; '@graph'?: { '@type': string }[] };
      if (json['@context'] !== 'https://schema.org') errors.push(`${p.url}: JSON-LD missing @context`);
      for (const node of json['@graph'] ?? []) {
        if (!node['@type']) errors.push(`${p.url}: JSON-LD node without @type`);
        types.add(node['@type']);
      }
    } catch (e) {
      errors.push(`${p.url}: invalid JSON-LD: ${(e as Error).message}`);
    }
  }
  if (!isUtilityPage(p.url) && !types.has('Organization')) errors.push(`${p.url}: missing Organization schema`);
  const kind = /^\/(finance|health|math|everyday)\/[^/]+\/$/.test(p.url) ? 'calculator' : null;
  if (kind) for (const t2 of REQUIRED_TYPES[kind]!) if (!types.has(t2)) errors.push(`${p.url}: missing ${t2} schema`);
}

// Sitemap: every listed URL exists and is indexable; every indexable content page is listed.
const inSitemap = new Set(sitemapUrls());
const byUrl = new Map(pages.map((p) => [SITE + p.url, p]));
for (const u of inSitemap) {
  const p = byUrl.get(u);
  if (!p) errors.push(`sitemap lists ${u}, which was not built`);
  else if (isNoindex(p.html)) errors.push(`sitemap lists noindex page ${u}`);
}
for (const p of pages) {
  if (isUtilityPage(p.url) || isNoindex(p.html)) continue;
  if (!inSitemap.has(SITE + p.url)) errors.push(`${p.url}: indexable but missing from the sitemap`);
}

report(`SEO validation (${pages.length} pages, ${inSitemap.size} in sitemap)`, errors);
