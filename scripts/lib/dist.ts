/** Helpers for scripts that validate the built site in dist/. Dependency-free on purpose. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const DIST = path.resolve('dist');

export interface BuiltPage {
  /** Root-relative URL path, e.g. /finance/mortgage-calculator/ */
  url: string;
  file: string;
  html: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

export function ensureDist(): void {
  if (!existsSync(DIST)) {
    console.error('dist/ not found. Run `npm run build` first.');
    process.exit(1);
  }
}

export function htmlPages(): BuiltPage[] {
  ensureDist();
  return walk(DIST)
    .filter((f) => f.endsWith('.html'))
    .map((file) => {
      const rel = path.relative(DIST, file).split(path.sep).join('/');
      const url = rel === 'index.html' ? '/' : rel.endsWith('/index.html') ? `/${rel.slice(0, -'index.html'.length)}` : `/${rel}`;
      return { url, file, html: readFileSync(file, 'utf8') };
    })
    .sort((a, b) => a.url.localeCompare(b.url));
}

export function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

export function title(html: string): string | null {
  const m = /<title>([\s\S]*?)<\/title>/.exec(html);
  return m ? decode(m[1]!.trim()) : null;
}

export function meta(html: string, name: string): string | null {
  const re = new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`, 'i');
  const m = re.exec(html);
  return m ? decode(m[1]!) : null;
}

export function canonical(html: string): string | null {
  const m = /<link rel="canonical" href="([^"]*)"/.exec(html);
  return m ? m[1]! : null;
}

export function isNoindex(html: string): boolean {
  return /<meta name="robots" content="[^"]*noindex/.test(html);
}

export function h1Count(html: string): number {
  return (html.match(/<h1[\s>]/g) ?? []).length;
}

export function jsonLdBlocks(html: string): string[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
}

/** Internal hrefs (root-relative), without query or hash. */
export function internalLinks(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    const href = decode(m[1]!);
    if (href.startsWith('/') && !href.startsWith('//')) out.push(href.split(/[?#]/)[0]!);
    else if (href.startsWith('https://calcrafty.com/')) out.push(href.slice('https://calcrafty.com'.length).split(/[?#]/)[0]!);
  }
  return out;
}

/** Resolves a URL path to a file in dist, or null if it doesn't exist. */
export function resolveInDist(urlPath: string): string | null {
  const clean = decodeURIComponent(urlPath);
  const candidates = clean.endsWith('/') ? [path.join(DIST, clean, 'index.html')] : [path.join(DIST, clean), path.join(DIST, clean, 'index.html')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

/** Visible text of the <main> element, tags and scripts stripped. */
export function mainText(html: string): string {
  const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? html;
  return decode(
    main
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

export function sitemapUrls(): string[] {
  const index = path.join(DIST, 'sitemap-index.xml');
  if (!existsSync(index)) return [];
  const maps = [...readFileSync(index, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  const urls: string[] = [];
  for (const loc of maps) {
    const file = path.join(DIST, new URL(loc).pathname);
    if (!existsSync(file)) throw new Error(`Sitemap index points at missing ${loc}`);
    urls.push(...[...readFileSync(file, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!));
  }
  return urls;
}

/** Pages that are not content pages and are exempt from SEO/keyword checks. */
export function isUtilityPage(url: string): boolean {
  return url === '/404.html' || url.startsWith('/embed/') || url === '/search/' || url === '/offline/';
}

export function report(name: string, errors: string[]): void {
  if (errors.length) {
    console.error(`✗ ${name}: ${errors.length} problem(s)`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ ${name}`);
}
