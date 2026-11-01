import { describe, expect, it } from 'vitest';
import { bracketTax } from '../../lib/math/tax.ts';
import { FEDERAL_BRACKETS_2026 } from '../../data/static/tax-2026.ts';
import { computePaycheck, hourlyFromAnnual, medicareTax, socialSecurityTax, type PaycheckInput } from './math.ts';

const base: PaycheckInput = {
  payType: 'salary',
  salary: 75_000,
  hourlyRate: 25,
  hoursPerWeek: 40,
  payFrequency: 'biweekly',
  filingStatus: 'single',
  retirementPct: 0,
  preTaxAnnual: 0,
  stateRate: 0,
};

describe('2026 federal brackets: tax at each threshold equals Rev. Proc. 2025-32 tables', () => {
  // Reference: Rev. Proc. 2025-32, section 4.01, Tables 1–3 ("$X plus N% of the excess over $Y").
  it('single', () => {
    const b = FEDERAL_BRACKETS_2026.single;
    expect(bracketTax(12_400, b).tax).toBe(1_240);
    expect(bracketTax(50_400, b).tax).toBe(5_800);
    expect(bracketTax(105_700, b).tax).toBe(17_966);
    expect(bracketTax(201_775, b).tax).toBe(41_024);
  });
  it('married filing jointly', () => {
    const b = FEDERAL_BRACKETS_2026.mfj;
    expect(bracketTax(24_800, b).tax).toBe(2_480);
    expect(bracketTax(100_800, b).tax).toBe(11_600);
    expect(bracketTax(211_400, b).tax).toBe(35_932);
    expect(bracketTax(403_550, b).tax).toBe(82_048);
    expect(bracketTax(512_450, b).tax).toBe(116_896);
    expect(bracketTax(768_700, b).tax).toBe(206_583.5);
  });
  it('head of household', () => {
    const b = FEDERAL_BRACKETS_2026.hoh;
    expect(bracketTax(17_700, b).tax).toBe(1_770);
    expect(bracketTax(67_450, b).tax).toBe(7_740);
    expect(bracketTax(105_700, b).tax).toBe(16_155);
    expect(bracketTax(201_750, b).tax).toBe(39_207);
    expect(bracketTax(256_200, b).tax).toBe(56_631);
    expect(bracketTax(640_600, b).tax).toBe(191_171);
  });
  it('reports the marginal rate and handles zero income', () => {
    expect(bracketTax(60_000, FEDERAL_BRACKETS_2026.single).marginalRate).toBe(0.22);
    expect(bracketTax(0, FEDERAL_BRACKETS_2026.single).tax).toBe(0);
    expect(bracketTax(-500, FEDERAL_BRACKETS_2026.single).tax).toBe(0);
  });
});

describe('FICA', () => {
  // Reference: SSA 2026 wage base $184,500 × 6.2% = $11,439 maximum Social Security tax.
  it('caps Social Security at the 2026 wage base', () => {
    expect(socialSecurityTax(300_000)).toBe(11_439);
    expect(socialSecurityTax(50_000)).toBe(3_100);
  });
  // Reference: IRS Additional Medicare Tax, 0.9% withheld on wages over $200,000.
  it('adds the Additional Medicare Tax above $200,000', () => {
    expect(medicareTax(100_000)).toBe(1_450);
    expect(medicareTax(250_000)).toBe(3_625 + 450);
  });
});

describe('paycheck', () => {
  it('$75,000 single, biweekly', () => {
    const o = computePaycheck(base);
    // Taxable 75,000 − 16,100 = 58,900 → 5,800 + 22% × 8,500 = 7,670.
    expect(o.federalTaxable).toBe(58_900);
    expect(o.federalTax).toBe(7_670);
    expect(o.socialSecurity).toBe(4_650);
    expect(o.medicare).toBe(1_087.5);
    expect(o.netAnnual).toBe(75_000 - 7_670 - 4_650 - 1_087.5);
    expect(o.grossPerPeriod).toBe(2_884.62);
    expect(o.periods).toBe(26);
  });
  it('401(k) lowers income tax but not FICA; section 125 lowers both', () => {
    const k = computePaycheck({ ...base, retirementPct: 10 });
    expect(k.retirementAnnual).toBe(7_500);
    expect(k.federalTaxable).toBe(51_400);
    expect(k.socialSecurity).toBe(4_650);
    const h = computePaycheck({ ...base, preTaxAnnual: 3_000 });
    expect(h.federalTaxable).toBe(55_900);
    expect(h.socialSecurity).toBe(4_464);
  });
  it('caps the 401(k) deferral at the 2026 limit of $24,500', () => {
    expect(computePaycheck({ ...base, salary: 400_000, retirementPct: 50 }).retirementAnnual).toBe(24_500);
  });
  it('converts hourly pay to annual', () => {
    const o = computePaycheck({ ...base, payType: 'hourly', hourlyRate: 25, hoursPerWeek: 40 });
    expect(o.grossAnnual).toBe(52_000);
    expect(hourlyFromAnnual(52_000, 40)).toBe(25);
  });
  it('applies a flat state rate to wages after pre-tax deductions', () => {
    expect(computePaycheck({ ...base, stateRate: 5 }).stateTax).toBe(3_750);
  });
  it('uses the standard deduction for each filing status', () => {
    expect(computePaycheck({ ...base, filingStatus: 'mfj' }).federalTaxable).toBe(42_800);
    expect(computePaycheck({ ...base, filingStatus: 'hoh' }).federalTaxable).toBe(50_850);
  });
  it('handles zero and very low income', () => {
    const z = computePaycheck({ ...base, salary: 0 });
    expect(z.netAnnual).toBe(0);
    expect(z.effectiveRate).toBe(0);
    expect(computePaycheck({ ...base, salary: 10_000 }).federalTax).toBe(0);
  });
});
