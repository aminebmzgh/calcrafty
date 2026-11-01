import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use an ISO date: YYYY-MM-DD');

const faq = z
  .array(z.object({ q: z.string().min(10), a: z.string().min(40) }))
  .min(5, 'At least 5 FAQ entries')
  .max(8, 'At most 8 FAQ entries');

/**
 * Review fields. Only a human sets `status: reviewed` (hard rule 6).
 * Draft pages are noindex and excluded from the sitemap.
 */
const review = {
  status: z.enum(['draft', 'reviewed']),
  reviewedBy: z.string().optional(),
  lastReviewed: isoDate.optional(),
};

/** One MDX file per calculator: src/calculators/<slug>/content.mdx. The entry id is the slug. */
const calculators = defineCollection({
  loader: glob({
    pattern: '*/content.mdx',
    base: './src/calculators',
    generateId: ({ entry }) => entry.split('/')[0]!,
  }),
  schema: z.object({
    ...review,
    faq,
    /** Optional HowTo schema steps ("How to use this calculator"). */
    howTo: z.array(z.string()).optional(),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './src/content/guides' }),
  schema: z.object({
    ...review,
    title: z.string(),
    h1: z.string(),
    intro: z.string(),
    metaTitle: z.string().max(60),
    metaDescription: z.string().min(140).max(160),
    primaryKeyword: z.string(),
    category: z.enum(['finance', 'health', 'math', 'everyday']),
    /** Calculator slugs this guide links to and is linked from. */
    calculators: z.array(z.string()).min(1),
    faq: faq.optional(),
    published: isoDate,
  }),
});

export const collections = { calculators, guides };
