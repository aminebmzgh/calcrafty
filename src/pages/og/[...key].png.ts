import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderOg, type OgInput } from '../../lib/og.ts';
import { calculators, resolvedDefaults } from '../../lib/registry.ts';
import { categories, categoryOrder } from '../../lib/categories.ts';

/** One OG image per page: /og/default.png, /og/<calculator-slug>.png, /og/guides/<slug>.png, /og/<category>.png */
export const getStaticPaths: GetStaticPaths = async () => {
  const paths: { params: { key: string }; props: OgInput }[] = [
    { params: { key: 'default' }, props: { kicker: 'Free online calculators', title: 'Calculators that show their work' } },
  ];
  for (const c of calculators) {
    const input = resolvedDefaults(c);
    const out = c.compute(input);
    paths.push({
      params: { key: c.slug },
      props: { kicker: `${categories[c.category].name} calculator`, title: c.name, value: c.ogValue(input, out), valueLabel: 'example result' },
    });
  }
  for (const id of categoryOrder) {
    paths.push({ params: { key: id }, props: { kicker: 'Calcrafty', title: categories[id].h1 } });
  }
  for (const g of await getCollection('guides')) {
    paths.push({ params: { key: `guides/${g.id}` }, props: { kicker: 'Guide', title: g.data.h1 } });
  }
  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as OgInput);
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
