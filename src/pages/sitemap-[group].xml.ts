import type { APIRoute, GetStaticPaths } from 'astro';
import { allPages } from '../lib/pages.ts';
import { SITEMAP_GROUPS, urlset } from '../lib/sitemap.ts';

/** Per-type sitemaps. Only indexable (reviewed, non-embed) pages are listed. */
export const getStaticPaths: GetStaticPaths = async () => {
  const pages = (await allPages()).filter((p) => p.indexable);
  return SITEMAP_GROUPS.map((g) => ({ params: { group: g.id }, props: { pages: pages.filter((p) => g.kinds.includes(p.kind)) } })).filter(
    (x) => x.props.pages.length > 0,
  );
};

export const GET: APIRoute = ({ props }) =>
  new Response(urlset(props.pages), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
