/** JSON-LD builders. Every page's structured data is produced here so it stays consistent. */
import { SITE } from './site.ts';
import type { AnyCalculatorConfig } from './types.ts';
import { categories } from './categories.ts';

export type JsonLdNode = Record<string, unknown>;

export function organization(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: { '@type': 'ImageObject', url: SITE.logo, width: 512, height: 512 },
    description: SITE.description,
    email: SITE.email,
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

export function website(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: `${SITE.url}/`,
    description: SITE.description,
    publisher: { '@id': `${SITE.url}/#organization` },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/search/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbList(crumbs: Crumb[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE.url}${c.path}`,
    })),
  };
}

export function webApplication(c: AnyCalculatorConfig, path: string, name = c.name, description = c.metaDescription): JsonLdNode {
  return {
    '@type': 'WebApplication',
    name,
    url: `${SITE.url}${path}`,
    description,
    applicationCategory: categories[c.category].appCategory,
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser. Works without JavaScript for the default result.',
    isAccessibleForFree: true,
    inLanguage: 'en-US',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${SITE.url}/#organization` },
    dateModified: c.lastReviewed,
  };
}

export function faqPage(faq: { q: string; a: string }[]): JsonLdNode {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function howTo(name: string, steps: string[]): JsonLdNode {
  return {
    '@type': 'HowTo',
    name,
    step: steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
  };
}

export function article(opts: { headline: string; description: string; path: string; published: string; modified: string }): JsonLdNode {
  return {
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: `${SITE.url}${opts.path}`,
    datePublished: opts.published,
    dateModified: opts.modified,
    author: { '@id': `${SITE.url}/#organization` },
    publisher: { '@id': `${SITE.url}/#organization` },
    inLanguage: 'en-US',
  };
}

/** Wraps nodes in a single @graph document. */
export function graph(nodes: JsonLdNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}
