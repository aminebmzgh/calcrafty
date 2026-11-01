import type { AstroIntegration } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { redirects } from '../../src/data/static/redirects.ts';

const ANALYTICS_ORIGIN = 'https://cloud.umami.is';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Turns the redirect map into mod_rewrite rules (matching with or without the trailing slash). */
export function redirectRules(): string {
  const seen = new Set<string>();
  return redirects
    .map(({ from, to }) => {
      if (seen.has(from)) throw new Error(`Duplicate redirect source: ${from}`);
      seen.add(from);
      const pattern = escapeRegex(from.replace(/^\/|\/$/g, ''));
      return `RewriteRule ^${pattern}/?$ https://calcrafty.com${to} [L,R=301]`;
    })
    .join('\n  ');
}

/** Writes dist/.htaccess: the public/.htaccess template plus the generated redirect map. */
export function htaccess(): AstroIntegration {
  return {
    name: 'calcrafty-htaccess',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const file = path.join(fileURLToPath(dir), '.htaccess');
        const template = await readFile(file, 'utf8');
        const out = template
          .replace('# @@REDIRECTS@@', redirectRules())
          .replaceAll('@@ANALYTICS@@', ANALYTICS_ORIGIN);
        await writeFile(file, out);
        logger.info(`.htaccess written with ${redirects.length} redirects`);

        // deploy-manifest.json: sitemap URL -> HTML hash, used by scripts/indexnow.ts to ping only changed pages.
        const root = fileURLToPath(dir);
        const manifest: Record<string, string> = {};
        const index = path.join(root, 'sitemap-index.xml');
        if (existsSync(index)) {
          for (const [, loc] of (await readFile(index, 'utf8')).matchAll(/<loc>([^<]+)<\/loc>/g)) {
            const map = await readFile(path.join(root, new URL(loc!).pathname), 'utf8');
            for (const [, url] of map.matchAll(/<loc>([^<]+)<\/loc>/g)) {
              const p = new URL(url!).pathname;
              const html = await readFile(path.join(root, p, 'index.html'), 'utf8').catch(() => '');
              manifest[p] = createHash('sha1').update(html).digest('hex');
            }
          }
        }
        await writeFile(path.join(root, 'deploy-manifest.json'), JSON.stringify(manifest, null, 1));
      },
    },
  };
}
