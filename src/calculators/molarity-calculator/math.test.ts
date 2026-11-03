import { describe, expect, it } from 'vitest';
import { compoundMolarMass, computeMolarity, molarMassOf, type MolarityInput } from './math.ts';

const base: MolarityInput = { solveFor: 'molarity', compound: 'nacl', molarMass: 58.44, mass: 5.844, volumeMl: 500, molarity: 1 };

describe('molar masses from standard atomic weights', () => {
  // Na 22.990 + Cl 35.45 = 58.44; C6H12O6 = 72.066 + 12.096 + 95.994 = 180.156 → 180.16.
  it('NaCl and glucose', () => {
    expect(compoundMolarMass('nacl')).toBe(58.44);
    expect(compoundMolarMass('glucose')).toBe(180.16);
  });
  // NaOH 39.997 → 40.00; CaCl2 40.078 + 70.90 = 110.978 → 110.98; sucrose 342.297 → 342.30.
  it('others', () => {
    expect(compoundMolarMass('naoh')).toBe(40);
    expect(compoundMolarMass('cacl2')).toBe(110.98);
    expect(compoundMolarMass('sucrose')).toBe(342.3);
    expect(molarMassOf({ N: 1, H: 4, Cl: 1 })).toBe(53.49);
  });
  it('custom has none', () => expect(compoundMolarMass('custom')).toBeNull());
});

describe('molarity', () => {
  // 5.844 g NaCl = 0.1 mol, in 0.5 L → 0.2 M.
  it('solve for molarity', () => {
    const o = computeMolarity(base);
    expect(o.moles).toBe(0.1);
    expect(o.molarity).toBe(0.2);
    expect(o.millimoles).toBe(100);
  });
  // 1 M NaCl, 250 mL: 0.25 mol × 58.44 = 14.61 g.
  it('solve for mass', () => expect(computeMolarity({ ...base, solveFor: 'mass', volumeMl: 250 }).mass).toBe(14.61));
  // 9.008 g glucose (0.05 mol at 180.16) made up to 0.1 M needs 500 mL.
  it('solve for volume', () => expect(computeMolarity({ ...base, solveFor: 'volume', molarMass: 180.16, mass: 9.008, molarity: 0.1 }).volumeMl).toBe(500));
  it('zero volume is invalid', () => expect(computeMolarity({ ...base, volumeMl: 0 }).valid).toBe(false));
  it('zero molar mass is invalid', () => expect(computeMolarity({ ...base, molarMass: 0 }).valid).toBe(false));
});
