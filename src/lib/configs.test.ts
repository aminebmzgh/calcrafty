/**
 * Contract tests for every calculator config (fast feedback before a full build):
 * SEO field limits, uniqueness, and that the default scenario produces clean output.
 */
import { describe, expect, it } from 'vitest';
import { calculators, liveCategories, resolvedDefaults } from './registry.ts';
import { categories, categoryOrder } from './categories.ts';

const BAD = /NaN|Infinity|undefined|\[object Object\]/;

describe('calculator configs', () => {
  it('has calculators', () => expect(calculators.length).toBeGreaterThan(0));

  it('titles, descriptions and primary keywords are unique', () => {
    for (const key of ['metaTitle', 'metaDescription', 'primaryKeyword', 'h1'] as const) {
      const values = calculators.map((c) => c[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });

  for (const c of calculators) {
    describe(c.slug, () => {
      it('meets SEO limits', () => {
        expect(c.metaTitle.length, `metaTitle "${c.metaTitle}"`).toBeLessThanOrEqual(60);
        expect(c.metaDescription.length, `metaDescription (${c.metaDescription.length})`).toBeGreaterThanOrEqual(140);
        expect(c.metaDescription.length, `metaDescription (${c.metaDescription.length})`).toBeLessThanOrEqual(160);
        expect(c.h1.toLowerCase()).toContain(c.primaryKeyword.split(' ')[0]!.toLowerCase());
        expect(categories[c.category].subtopics, 'subtopic').toContain(c.subtopic);
        expect(c.sources.length).toBeGreaterThan(0);
        expect(c.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it('default scenario renders clean text', () => {
        const input = resolvedDefaults(c);
        const out = c.compute(input);
        const text = JSON.stringify([c.summarize(input, out), c.explain(input, out), c.steps(input, out), c.answerSummary(input, out), c.ogValue(input, out)]);
        expect(text).not.toMatch(BAD);
        expect(c.explain(input, out).length).toBeGreaterThan(0);
        expect(c.answerSummary(input, out).length).toBeGreaterThan(40);
      });

      it('validates its own defaults', () => {
        expect(c.validate?.(resolvedDefaults(c)) ?? []).toEqual([]);
      });
    });
  }
});

describe('categories', () => {
  it('every category is defined once, in display order', () => {
    expect(new Set(categoryOrder).size).toBe(categoryOrder.length);
    expect([...categoryOrder].sort()).toEqual(Object.keys(categories).sort());
  });

  for (const id of categoryOrder) {
    it(`${id} hub meets SEO limits`, () => {
      const c = categories[id];
      expect(c.id).toBe(id);
      expect(c.metaTitle.length, `metaTitle "${c.metaTitle}"`).toBeLessThanOrEqual(60);
      expect(c.metaDescription.length, `metaDescription (${c.metaDescription.length})`).toBeGreaterThanOrEqual(140);
      expect(c.metaDescription.length, `metaDescription (${c.metaDescription.length})`).toBeLessThanOrEqual(160);
      expect(c.subtopics.length).toBeGreaterThan(0);
      expect(c.about.length).toBeGreaterThan(0);
    });
  }

  it('only categories with calculators are live (no empty hubs)', () => {
    for (const id of categoryOrder) {
      expect(liveCategories.includes(id), id).toBe(calculators.some((c) => c.category === id));
    }
  });
});
