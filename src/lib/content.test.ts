/**
 * Content gates for every calculator's content.mdx (docs/BUILD-BRIEF.md sections 11 and 15):
 * valid frontmatter, 800–1,500 words, H2 sections, at least 3 contextual internal links, 5–8 FAQs.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const root = path.resolve('src/calculators');
const folders = readdirSync(root).filter((d) => existsSync(path.join(root, d, 'content.mdx')));

function parse(file: string) {
  const raw = readFileSync(file, 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  // Same strictness as Astro's frontmatter loader: any YAML error or warning fails the test.
  const doc = YAML.parseDocument(m[1]!, { prettyErrors: true });
  const problems = [...doc.errors, ...doc.warnings].map((e) => e.message);
  if (problems.length) throw new Error(`${file}: invalid frontmatter: ${problems.join('; ')}`);
  return { data: doc.toJS() as Record<string, unknown>, body: m[2]! };
}

function words(md: string): number {
  return md
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*|`>-]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-z0-9$]/i.test(w)).length;
}

describe('calculator content', () => {
  it('every calculator folder has content.mdx', () => {
    for (const d of readdirSync(root)) expect(existsSync(path.join(root, d, 'content.mdx')), d).toBe(true);
  });

  for (const d of folders) {
    describe(d, () => {
      const { data, body } = parse(path.join(root, d, 'content.mdx'));
      it('frontmatter is valid', () => {
        expect(['draft', 'reviewed']).toContain(data.status);
        const faq = data.faq as { q: string; a: string }[];
        expect(faq.length).toBeGreaterThanOrEqual(5);
        expect(faq.length).toBeLessThanOrEqual(8);
        for (const f of faq) {
          expect(typeof f.q).toBe('string');
          expect(typeof f.a).toBe('string');
          expect(f.a.length).toBeGreaterThan(40);
        }
      });
      it('body is 800–1,500 words', () => {
        const n = words(body);
        expect(n, `${d}: ${n} words`).toBeGreaterThanOrEqual(800);
        expect(n, `${d}: ${n} words`).toBeLessThanOrEqual(1500);
      });
      it('has H2 sections and at least 3 internal links', () => {
        expect((body.match(/^## /gm) ?? []).length).toBeGreaterThanOrEqual(4);
        const links = new Set([...body.matchAll(/\]\((\/[^)]+)\)/g)].map((m) => m[1]));
        expect(links.size, `${d} internal links`).toBeGreaterThanOrEqual(3);
      });
    });
  }
});
