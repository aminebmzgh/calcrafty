import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computePunnett, parseGenotype, type PunnettInput, type PunnettOutput } from './math.ts';

const validate = (s: string) => {
  const r = parseGenotype(s);
  return typeof r === 'string' ? r : null;
};
const list = (o: PunnettOutput, key: 'genotypes' | 'phenotypes') => o[key].map((r) => `${r.label} ${num(r.percent, 2)}%`).join(', ');

const config: CalculatorConfig<PunnettInput, PunnettOutput> = {
  slug: 'punnett-square-calculator',
  category: 'biology',
  subtopic: 'Genetics',
  name: 'Punnett Square Calculator',
  h1: 'Punnett Square Calculator',
  intro: 'Build the Punnett square for any one-, two- or three-gene cross and see the genotype and phenotype ratios.',
  metaTitle: 'Punnett Square Calculator: Genotype & Phenotype Ratios',
  metaDescription:
    'Make a Punnett square for monohybrid, dihybrid or trihybrid crosses, with every offspring genotype and the genotype and phenotype ratios shown.',
  primaryKeyword: 'punnett square calculator',
  secondaryKeywords: ['dihybrid cross calculator', 'monohybrid cross calculator', 'genotype calculator', 'phenotype ratio calculator'],
  synonyms: ['punnett square', 'genetics', 'dominant', 'recessive', 'alleles', '9:3:3:1', '3:1 ratio'],
  inputs: [
    { id: 'parent1', label: 'Parent 1 genotype', type: 'text', placeholder: 'e.g. Aa or AaBb', maxLength: 6, group: 'parents', helpText: 'Two letters per gene; capital = dominant allele.', e2eValue: 'AA', validate },
    { id: 'parent2', label: 'Parent 2 genotype', type: 'text', placeholder: 'e.g. Aa or aaBb', maxLength: 6, group: 'parents', validate },
  ],
  defaults: { parent1: 'Aa', parent2: 'Aa' },
  validate: (i) => {
    const o = computePunnett(i);
    return !o.valid && o.error?.startsWith('Both') ? [{ id: 'parent2', message: o.error }] : [];
  },
  compute: computePunnett,
  summarize: (_i, o) => ({
    headline: { label: 'Phenotype ratio', value: o.valid ? o.phenotypeRatio : '—', sub: o.valid ? list(o, 'phenotypes') : (o.error ?? ''), raw: o.cells },
    items: [
      { label: 'Genotype ratio', value: o.valid ? `${o.genotypeRatio} (${o.genotypes.map((g) => g.label).join(' : ')})` : '—' },
      { label: 'Genotypes', value: o.valid ? list(o, 'genotypes') : '—' },
      { label: 'Squares in the grid', value: num(o.cells, 0), raw: o.cells },
    ],
  }),
  explain: (i, o) => {
    if (!o.valid) return [o.error ?? 'Enter both parents’ genotypes.'];
    const s = [`Parent 1 (${i.parent1.trim()}) makes ${o.gametes1.length} kinds of gamete and parent 2 (${i.parent2.trim()}) makes ${o.gametes2.length}, so the square has ${num(o.cells, 0)} equally likely boxes.`];
    const top = o.phenotypes[0]!;
    s.push(`${num(top.percent, 2)}% of offspring are expected to show ${top.label} (an underscore means either allele), and the phenotype ratio is ${o.phenotypeRatio}.`);
    s.push('These are probabilities for each offspring, not guarantees: in a small family, actual counts often differ from the ratio. The calculation assumes complete dominance and genes that assort independently.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Gametes, parent 1', formula: 'one allele from each gene', substituted: i.parent1.trim(), result: o.gametes1.join(', ') || '—' },
    { label: 'Gametes, parent 2', formula: 'one allele from each gene', substituted: i.parent2.trim(), result: o.gametes2.join(', ') || '—' },
    { label: 'Combine', formula: 'every gamete of parent 1 × every gamete of parent 2', substituted: `${o.gametes1.length} × ${o.gametes2.length}`, result: `${num(o.cells, 0)} boxes` },
    { label: 'Count', formula: 'boxes with each genotype ÷ all boxes', substituted: o.genotypes.map((g) => `${g.label}: ${g.count}`).join(', '), result: o.genotypeRatio || '—' },
  ],
  answerSummary: (i, o) => `Crossing ${i.parent1} × ${i.parent2} gives a genotype ratio of ${o.genotypeRatio} (${o.genotypes.map((g) => g.label).join(' : ')}) and a phenotype ratio of ${o.phenotypeRatio}.`,
  ogValue: (_i, o) => o.phenotypeRatio,
  related: ['molarity-calculator', 'mean-median-mode-calculator', 'percentage-calculator', 'fraction-calculator', 'standard-deviation-calculator'],
  sources: [
    { title: 'NHGRI Talking Glossary of Genomic and Genetic Terms: Mendelian inheritance', url: 'https://www.genome.gov/genetics-glossary/Mendelian-Inheritance' },
    { title: 'NHGRI: Dominant', url: 'https://www.genome.gov/genetics-glossary/Dominant' },
    { title: 'NHGRI: Recessive', url: 'https://www.genome.gov/genetics-glossary/Recessive' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
