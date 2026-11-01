import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { calculators, calcPath } from '../lib/registry.ts';
import { categories, categoryOrder } from '../lib/categories.ts';
import type { SearchDoc } from '../lib/search.ts';

/** The search index, built at build time and fetched by the search dialog on first open. */
export const GET: APIRoute = async () => {
  const docs: SearchDoc[] = calculators.map((c) => ({
    id: c.slug,
    title: c.name,
    description: c.intro,
    url: calcPath(c),
    kind: 'calculator',
    category: c.category,
    keywords: [c.primaryKeyword, ...c.secondaryKeywords, ...(c.synonyms ?? [])].join(' '),
  }));
  for (const g of await getCollection('guides')) {
    docs.push({ id: `guide-${g.id}`, title: g.data.title, description: g.data.intro, url: `/guides/${g.id}/`, kind: 'guide', category: g.data.category, keywords: g.data.primaryKeyword });
  }
  for (const id of categoryOrder) {
    if (!calculators.some((c) => c.category === id)) continue;
    docs.push({ id: `hub-${id}`, title: categories[id].h1, description: categories[id].intro, url: `/${id}/`, kind: 'hub', category: id, keywords: categories[id].subtopics.join(' ') });
  }
  return new Response(JSON.stringify(docs), { headers: { 'Content-Type': 'application/json' } });
};
