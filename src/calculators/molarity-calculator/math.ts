/**
 * Molarity (amount concentration): M = moles ÷ liters of solution, with moles = mass ÷ molar mass.
 * Solve for the molarity, the mass of solute to weigh out, or the volume of solution.
 * Molar masses of common compounds are computed from IUPAC standard atomic weights
 * (abridged): H 1.008, C 12.011, N 14.007, O 15.999, Na 22.990, Cl 35.45, K 39.098, Ca 40.078.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type SolveFor = 'molarity' | 'mass' | 'volume';

export interface MolarityInput extends Record<string, unknown> {
  solveFor: SolveFor;
  compound: string;
  /** g/mol. */
  molarMass: number;
  /** Grams of solute. */
  mass: number;
  /** Milliliters of solution. */
  volumeMl: number;
  /** mol/L. */
  molarity: number;
}

export interface MolarityOutput {
  valid: boolean;
  molarity: number;
  mass: number;
  volumeMl: number;
  /** Volume in liters. */
  liters: number;
  moles: number;
  millimoles: number;
}

const ATOMIC: Record<string, number> = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, Na: 22.99, Cl: 35.45, K: 39.098, Ca: 40.078 };

/** Molar mass from element counts, rounded to 0.01 g/mol. */
export function molarMassOf(counts: Record<string, number>): number {
  let total = D(0);
  for (const [el, n] of Object.entries(counts)) total = total.plus(D(ATOMIC[el]!).times(n));
  return total.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export const COMPOUNDS: { value: string; label: string; molarMass: number }[] = [
  { value: 'nacl', label: 'Sodium chloride, NaCl', molarMass: molarMassOf({ Na: 1, Cl: 1 }) },
  { value: 'glucose', label: 'Glucose, C₆H₁₂O₆', molarMass: molarMassOf({ C: 6, H: 12, O: 6 }) },
  { value: 'sucrose', label: 'Sucrose, C₁₂H₂₂O₁₁', molarMass: molarMassOf({ C: 12, H: 22, O: 11 }) },
  { value: 'naoh', label: 'Sodium hydroxide, NaOH', molarMass: molarMassOf({ Na: 1, O: 1, H: 1 }) },
  { value: 'hcl', label: 'Hydrogen chloride, HCl', molarMass: molarMassOf({ H: 1, Cl: 1 }) },
  { value: 'kcl', label: 'Potassium chloride, KCl', molarMass: molarMassOf({ K: 1, Cl: 1 }) },
  { value: 'cacl2', label: 'Calcium chloride, CaCl₂', molarMass: molarMassOf({ Ca: 1, Cl: 2 }) },
  { value: 'nh4cl', label: 'Ammonium chloride, NH₄Cl', molarMass: molarMassOf({ N: 1, H: 4, Cl: 1 }) },
];

/** The molar mass for a compound choice, or null for "custom". */
export function compoundMolarMass(value: string): number | null {
  return COMPOUNDS.find((c) => c.value === value)?.molarMass ?? null;
}

const sig = (d: Decimal) => d.toSignificantDigits(8).toNumber();

export function computeMolarity(i: MolarityInput): MolarityOutput {
  const mw = D(Math.max(0, i.molarMass || 0));
  const liters = D(Math.max(0, i.volumeMl || 0)).div(1000);
  const mass = D(Math.max(0, i.mass || 0));
  const M = D(Math.max(0, i.molarity || 0));
  const bad = { valid: false, molarity: 0, mass: 0, volumeMl: 0, liters: 0, moles: 0, millimoles: 0 };
  if (mw.isZero()) return bad;
  if (i.solveFor === 'molarity') {
    if (liters.isZero()) return bad;
    const mol = mass.div(mw);
    return { valid: true, molarity: sig(mol.div(liters)), mass: sig(mass), volumeMl: sig(liters.times(1000)), liters: sig(liters), moles: sig(mol), millimoles: sig(mol.times(1000)) };
  }
  if (i.solveFor === 'mass') {
    const mol = M.times(liters);
    return { valid: true, molarity: sig(M), mass: sig(mol.times(mw)), volumeMl: sig(liters.times(1000)), liters: sig(liters), moles: sig(mol), millimoles: sig(mol.times(1000)) };
  }
  if (M.isZero()) return bad;
  const mol = mass.div(mw);
  return { valid: true, molarity: sig(M), mass: sig(mass), volumeMl: sig(mol.div(M).times(1000)), liters: sig(mol.div(M)), moles: sig(mol), millimoles: sig(mol.times(1000)) };
}
