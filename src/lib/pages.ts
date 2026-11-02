/**
 * The page inventory: every URL the site builds, with indexability and lastmod.
 * Sitemaps, llms.txt and the search index are generated from this list.
 */
import { getCollection } from 'astro:content';
import { calculators, calcPath, liveCategories } from './registry.ts';
import { categories } from './categories.ts';
import { live } from '../data/live/index.ts';
import { statePagesFor } from './states.ts';

export type PageKind = 'core' | 'hub' | 'calculator' | 'guide' | 'state' | 'state-index';

export interface PageEntry {
  path: string;
  title: string;
  description: string;
  kind: PageKind;
  indexable: boolean;
  lastmod: string;
}

/** Trust and core pages, always indexable. */
export const CORE_PAGES: { path: string; title: string; description: string }[] = [
  { path: '/', title: 'Calcrafty', description: 'Free online calculators for money, health, math and everyday questions.' },
  { path: '/guides/', title: 'Guides', description: 'In-depth guides that pair with Calcrafty calculators.' },
  { path: '/about/', title: 'About Calcrafty', description: 'Who builds Calcrafty and why.' },
  { path: '/methodology/', title: 'Methodology', description: 'How Calcrafty verifies its calculations and data.' },
  { path: '/privacy/', title: 'Privacy Policy', description: 'What Calcrafty collects (very little) and why.' },
  { path: '/terms/', title: 'Terms of Use', description: 'The terms for using Calcrafty.' },
  { path: '/contact/', title: 'Contact', description: 'How to reach the Calcrafty team.' },
];

/** ISO date of the most recent live-data observation. */
function dataAsOf(): string {
  const dates = Object.values(live.series).map((s) => s.asOf);
  return dates.sort().at(-1) ?? live.generatedAt.slice(0, 10);
}

function latest(...dates: (string | undefined)[]): string {
  return dates.filter((d): d is string => !!d).sort().at(-1)!;
}

export async function allPages(): Promise<PageEntry[]> {
  const content = await getCollection('calculators');
  const guides = await getCollection('guides');
  const statusOf = new Map(content.map((e) => [e.id, e.data]));
  const siteLastmod = latest(dataAsOf(), ...calculators.map((c) => c.lastReviewed));
  const pages: PageEntry[] = CORE_PAGES.map((p) => ({ ...p, kind: 'core', indexable: true, lastmod: siteLastmod }));

  for (const id of liveCategories) {
    const cat = categories[id];
    const inCat = calculators.filter((c) => c.category === id);
    pages.push({
      path: `/${id}/`,
      title: cat.h1,
      description: cat.metaDescription,
      kind: 'hub',
      // A hub is indexable once at least one of its calculators has been reviewed (no hubs of drafts only).
      indexable: inCat.some((c) => statusOf.get(c.slug)?.status === 'reviewed'),
      lastmod: inCat.length ? latest(...inCat.map((c) => c.lastReviewed)) : siteLastmod,
    });
  }

  for (const c of calculators) {
    const data = statusOf.get(c.slug);
    const reviewed = data?.status === 'reviewed';
    const usesLive = c.inputs.some((i: { type: string; liveDefault?: string }) => i.type === 'number' && i.liveDefault);
    const lastmod = latest(data?.lastReviewed, c.lastReviewed, usesLive ? dataAsOf() : undefined);
    pages.push({ path: calcPath(c), title: c.name, description: c.metaDescription, kind: 'calculator', indexable: reviewed, lastmod });

    // State pages inherit the parent calculator's review status.
    const states = statePagesFor(c);
    if (states.length) {
      pages.push({
        path: `${calcPath(c)}states/`,
        title: `${c.name} by State`,
        description: `${c.name} for every state with local data.`,
        kind: 'state-index',
        indexable: reviewed,
        lastmod,
      });
      for (const s of states) {
        pages.push({ path: `${calcPath(c)}${s.slug}/`, title: `${c.name}: ${s.name}`, description: s.description, kind: 'state', indexable: reviewed, lastmod: latest(lastmod, s.dataYear) });
      }
    }
  }

  for (const g of guides) {
    pages.push({
      path: `/guides/${g.id}/`,
      title: g.data.title,
      description: g.data.metaDescription,
      kind: 'guide',
      indexable: g.data.status === 'reviewed',
      lastmod: g.data.lastReviewed ?? g.data.published,
    });
  }

  return pages;
}
