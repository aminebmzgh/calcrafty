import { describe, expect, it } from 'vitest';
import { computePunnett, parseGenotype } from './math.ts';

describe('parsing genotypes', () => {
  it('splits genes', () => expect(parseGenotype('AaBb')).toEqual(['Aa', 'Bb']));
  it('ignores spaces', () => expect(parseGenotype('Aa Bb')).toEqual(['Aa', 'Bb']));
  it('rejects mixed letters', () => expect(typeof parseGenotype('AB')).toBe('string'));
  it('rejects odd lengths', () => expect(typeof parseGenotype('Aab')).toBe('string'));
  it('rejects more than three genes', () => expect(typeof parseGenotype('AaBbCcDd')).toBe('string'));
});

describe('monohybrid cross', () => {
  // Aa × Aa: 1 AA : 2 Aa : 1 aa, phenotypes 3 dominant : 1 recessive.
  it('Aa × Aa', () => {
    const o = computePunnett({ parent1: 'Aa', parent2: 'Aa' });
    expect(o.grid).toEqual([['AA', 'Aa'], ['Aa', 'aa']]);
    expect(o.genotypes.map((g) => [g.label, g.count])).toEqual([['AA', 1], ['Aa', 2], ['aa', 1]]);
    expect(o.genotypeRatio).toBe('1 : 2 : 1');
    expect(o.phenotypes.map((g) => [g.label, g.percent])).toEqual([['A_', 75], ['aa', 25]]);
    expect(o.phenotypeRatio).toBe('3 : 1');
  });
  // Test cross Aa × aa: 1 Aa : 1 aa.
  it('test cross', () => {
    const o = computePunnett({ parent1: 'Aa', parent2: 'aa' });
    expect(o.genotypes.map((g) => g.percent)).toEqual([50, 50]);
    expect(o.phenotypeRatio).toBe('1 : 1');
  });
  // AA × aa: every offspring Aa.
  it('homozygous parents', () => expect(computePunnett({ parent1: 'AA', parent2: 'aa' }).genotypes).toEqual([{ label: 'Aa', count: 4, percent: 100 }]));
  it('writes the dominant allele first', () => expect(computePunnett({ parent1: 'aA', parent2: 'aa' }).grid[1]![0]).toBe('Aa'));
});

describe('dihybrid and trihybrid crosses', () => {
  // AaBb × AaBb: 16 cells, phenotypes 9 : 3 : 3 : 1; 9 genotypes.
  it('9 : 3 : 3 : 1', () => {
    const o = computePunnett({ parent1: 'AaBb', parent2: 'AaBb' });
    expect(o.cells).toBe(16);
    expect(o.gametes1).toEqual(['AB', 'Ab', 'aB', 'ab']);
    expect(o.phenotypes.map((p) => [p.label, p.count])).toEqual([['A_ B_', 9], ['A_ bb', 3], ['aa B_', 3], ['aa bb', 1]]);
    expect(o.phenotypeRatio).toBe('9 : 3 : 3 : 1');
    expect(o.genotypes.length).toBe(9);
    expect(o.genotypeRatio).toBe('1 : 2 : 1 : 2 : 4 : 2 : 1 : 2 : 1');
    expect(o.genotypes.find((g) => g.label === 'AaBb')!.count).toBe(4);
  });
  // AaBbCc × AaBbCc: 64 cells; 27/64 show all three dominant traits.
  it('trihybrid', () => {
    const o = computePunnett({ parent1: 'AaBbCc', parent2: 'AaBbCc' });
    expect(o.cells).toBe(64);
    expect(o.phenotypes[0]).toEqual({ label: 'A_ B_ C_', count: 27, percent: 42.19 });
    expect(o.genotypes.length).toBe(27);
  });
  it('genes must match', () => expect(computePunnett({ parent1: 'AaBb', parent2: 'Aa' }).valid).toBe(false));
});
