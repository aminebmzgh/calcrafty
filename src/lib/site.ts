/** Site-wide constants: one place for entity information (consistent everywhere, for GEO). */
export const SITE = {
  name: 'Calcrafty',
  url: 'https://calcrafty.com',
  description:
    'Calcrafty builds free online calculators for money, health, math and everyday questions, with live data, plain-English answers and the math shown step by step.',
  email: 'hello@calcrafty.com',
  /** The person behind the site (About page and Organization schema). */
  founder: { name: 'Amine Boumazzoughe', jobTitle: 'Banker' },
  logo: 'https://calcrafty.com/icons/icon-512.png',
  /** Official profiles; add URLs once they exist. */
  sameAs: [] as string[],
  locale: 'en_US',
};

/**
 * AI crawler policy for robots.txt. Default: allow. Set to 'disallow' to block
 * all listed AI crawlers with one change.
 */
export const AI_CRAWLER_POLICY: 'allow' | 'disallow' = 'allow';
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'Meta-ExternalAgent',
  'Amazonbot',
  'DuckAssistBot',
];

/** Monetization switch (off by default). Set ADS_ENABLED=true at build time to turn ad slots on. */
export const ADS_ENABLED = import.meta.env.ADS_ENABLED === 'true' || import.meta.env.PUBLIC_ADS_ENABLED === 'true';

/** Umami website ID, injected at build time from the ANALYTICS_ID secret. Empty = no analytics. */
export const ANALYTICS_ID: string = import.meta.env.PUBLIC_ANALYTICS_ID ?? '';
export const ANALYTICS_SRC = 'https://cloud.umami.is/script.js';
