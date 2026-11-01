import type { APIRoute } from 'astro';
import { AI_CRAWLER_POLICY, AI_CRAWLERS, SITE } from '../lib/site.ts';

export const GET: APIRoute = () => {
  const aiRule = AI_CRAWLER_POLICY === 'allow' ? 'Allow: /\nDisallow: /embed/' : 'Disallow: /';
  const lines = [
    '# Calcrafty robots.txt',
    'User-agent: *',
    'Allow: /',
    'Disallow: /embed/',
    '',
    `# AI crawlers: policy = ${AI_CRAWLER_POLICY} (change AI_CRAWLER_POLICY in src/lib/site.ts)`,
    ...AI_CRAWLERS.map((bot) => `User-agent: ${bot}\n${aiRule}\n`),
    `Sitemap: ${SITE.url}/sitemap-index.xml`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
