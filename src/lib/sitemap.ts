import type { PageEntry, PageKind } from './pages.ts';
import { SITE } from './site.ts';

export const SITEMAP_GROUPS: { id: string; kinds: PageKind[] }[] = [
  { id: 'pages', kinds: ['core', 'hub'] },
  { id: 'calculators', kinds: ['calculator'] },
  { id: 'states', kinds: ['state', 'state-index'] },
  { id: 'guides', kinds: ['guide'] },
];

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function urlset(pages: PageEntry[]): string {
  const body = pages.map((p) => `<url><loc>${esc(SITE.url + p.path)}</loc><lastmod>${p.lastmod}</lastmod></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>\n`;
}
