import type { APIRoute } from 'astro';
import { allPages } from '../lib/pages.ts';
import { SITEMAP_GROUPS } from '../lib/sitemap.ts';
import { SITE } from '../lib/site.ts';

/** Sitemap index pointing at one sitemap per page type that has indexable pages. */
export const GET: APIRoute = async () => {
  const pages = (await allPages()).filter((p) => p.indexable);
  const entries = SITEMAP_GROUPS.map((g) => {
    const inGroup = pages.filter((p) => g.kinds.includes(p.kind));
    if (!inGroup.length) return '';
    const lastmod = inGroup.map((p) => p.lastmod).sort().at(-1);
    return `<sitemap><loc>${SITE.url}/sitemap-${g.id}.xml</loc><lastmod>${lastmod}</lastmod></sitemap>`;
  }).filter(Boolean);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</sitemapindex>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
