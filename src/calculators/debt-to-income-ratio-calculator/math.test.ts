import { describe, expect, it } from 'vitest';
import { bandOf, computeDti, LIMITS, type DtiInput } from './math.ts';

const base: DtiInput = { annualIncome: 72_000, housing: 1_500, autoLoans: 400, studentLoans: 300, creditCards: 200, otherDebts: 0, loanType: 'conventional' };

describe('DTI reference values', () => {
  // Bankrate's example: $2,400 of monthly debt on $6,000 gross monthly income → 40%.
  it('$2,400 of debt on $6,000 a month is 40%', () => {
    const o = computeDti({ ...base, housing: 1_500, autoLoans: 400, studentLoans: 300, creditCards: 200 });
    expect(o.monthlyIncome).toBe(6_000);
    expect(o.totalDebts).toBe(2_400);
    expect(o.backEnd).toBe(40);
  });
  // Front-end: $1,500 housing ÷ $6,000 = 25%.
  it('front-end ratio counts housing only', () => expect(computeDti(base).frontEnd).toBe(25));
  // $84,000 a year = $7,000 a month; $2,620 of debt → 37.43%.
  it('rounds to two decimals', () => expect(computeDti({ ...base, annualIncome: 84_000, housing: 1_800, autoLoans: 450, studentLoans: 250, creditCards: 120 }).backEnd).toBe(37.43));
});

describe('lender guidelines', () => {
  // Fannie Mae / common 28/36 rule; FHA 31/43 (HUD 4000.1); VA 41% (VA Pamphlet 26-7); USDA 29/41.
  it('encodes the program ratios', () => {
    expect(LIMITS.conventional).toMatchObject({ front: 28, back: 36 });
    expect(LIMITS.fha).toMatchObject({ front: 31, back: 43 });
    expect(LIMITS.va).toMatchObject({ front: null, back: 41 });
    expect(LIMITS.usda).toMatchObject({ front: 29, back: 41 });
  });
  it('40% fails conventional 36% but passes FHA 43%', () => {
    expect(computeDti(base).meetsBack).toBe(false);
    expect(computeDti({ ...base, loanType: 'fha' }).meetsBack).toBe(true);
  });
  it('VA has no front-end test', () => expect(computeDti({ ...base, housing: 2_500, autoLoans: 0, studentLoans: 0, creditCards: 0, loanType: 'va' }).meetsFront).toBe(true));
  // 36% of $6,000 = $2,160; minus $900 of other debts → $1,260 maximum housing; $2,400 − $2,160 = $240 to cut.
  it('maximum housing payment and reduction needed', () => {
    const o = computeDti(base);
    expect(o.maxHousing).toBe(1_260);
    expect(o.reductionNeeded).toBe(240);
  });
  it('no reduction needed when within the guideline', () => expect(computeDti({ ...base, housing: 1_000 }).reductionNeeded).toBe(0));
});

describe('bands and edge cases', () => {
  it('bands: 35% good, 36–49% manageable, 50% high', () => {
    expect(bandOf(35)).toBe('good');
    expect(bandOf(35.01)).toBe('manageable');
    expect(bandOf(49.99)).toBe('manageable');
    expect(bandOf(50)).toBe('high');
  });
  it('no debts is 0%', () => expect(computeDti({ ...base, housing: 0, autoLoans: 0, studentLoans: 0, creditCards: 0 }).backEnd).toBe(0));
  it('zero income does not divide by zero', () => {
    const o = computeDti({ ...base, annualIncome: 0 });
    expect(o.backEnd).toBe(0);
    expect(o.maxHousing).toBe(0);
  });
  it('debts above income exceed 100%', () => expect(computeDti({ ...base, annualIncome: 24_000 }).backEnd).toBe(120));
});
