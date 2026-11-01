/**
 * The calculator registry. Calculators are discovered from src/calculators/<slug>/config.ts,
 * so adding a calculator never requires editing this file (hard rule 4).
 */
import type { AnyCalculatorConfig, Category } from './types.ts';
import { liveValue } from '../data/live/index.ts';

const modules = import.meta.glob<{ default: AnyCalculatorConfig }>('../calculators/*/config.ts', { eager: true });

function load(): AnyCalculatorConfig[] {
  const list: AnyCalculatorConfig[] = [];
  for (const [file, mod] of Object.entries(modules)) {
    const folder = file.split('/').at(-2);
    const config = mod.default;
    if (!config) throw new Error(`${file} has no default export`);
    if (config.slug !== folder) throw new Error(`${file}: slug "${config.slug}" must match its folder "${folder}"`);
    list.push(config);
  }
  const slugs = new Set(list.map((c) => c.slug));
  for (const c of list) {
    for (const r of c.related) {
      if (!slugs.has(r)) console.warn(`[registry] ${c.slug}: related calculator "${r}" does not exist yet (skipped)`);
      if (r === c.slug) throw new Error(`${c.slug}: lists itself as related`);
    }
    for (const input of c.inputs) {
      if (!(input.id in c.defaults)) throw new Error(`${c.slug}: input "${input.id}" has no default`);
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export const calculators: AnyCalculatorConfig[] = load();

export function getCalculator(slug: string): AnyCalculatorConfig {
  const c = calculators.find((x) => x.slug === slug);
  if (!c) throw new Error(`Unknown calculator: ${slug}`);
  return c;
}

/** Related calculators that exist, in the config order. */
export function relatedOf(c: AnyCalculatorConfig): AnyCalculatorConfig[] {
  return c.related.map((s: string) => calculators.find((x) => x.slug === s)).filter((x): x is AnyCalculatorConfig => !!x);
}

export function byCategory(category: Category): AnyCalculatorConfig[] {
  return calculators.filter((c) => c.category === category);
}

export function calcPath(c: Pick<AnyCalculatorConfig, 'category' | 'slug'>): string {
  return `/${c.category}/${c.slug}/`;
}

/** Config defaults with live values (today's rates) merged in. */
export function resolvedDefaults<I extends Record<string, unknown>>(c: { defaults: I; inputs: AnyCalculatorConfig['inputs'] }): I {
  const d: Record<string, unknown> = { ...c.defaults };
  for (const input of c.inputs) {
    if (input.type === 'number' && input.liveDefault) d[input.id] = liveValue(input.liveDefault).value;
  }
  return d as I;
}
