import type { APIRoute } from 'astro';
import { allPages } from '../lib/pages.ts';
import { SITE } from '../lib/site.ts';

/** /llms.txt: site summary plus reviewed calculators and guides (https://llmstxt.org). */
export const GET: APIRoute = async () => {
  const pages = (await allPages()).filter((p) => p.indexable);
  const section = (title: string, kinds: string[]) => {
    const items = pages.filter((p) => kinds.includes(p.kind));
    if (!items.length) return [];
    return [`## ${title}`, '', ...items.map((p) => `- [${p.title}](${SITE.url}${p.path}): ${p.description}`), ''];
  };
  const body = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    'Every calculator shows its formula, substitutes the user’s numbers step by step, and cites its sources. Live defaults (mortgage rates, inflation, Treasury yields) come from FRED and show an "as of" date. Content is reviewed by a person before it is indexed.',
    '',
    ...section('Calculators', ['calculator']),
    ...section('State calculators', ['state', 'state-index']),
    ...section('Guides', ['guide']),
    ...section('Site', ['core', 'hub']),
  ];
  return new Response(body.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
