import { describe, expect, it } from 'vitest';
import { computeCompound, type CompoundInput } from './math.ts';

const base: CompoundInput = { principal: 10_000, monthly: 0, rate: 5, years: 10, compounding: 'annually', timing: 'end' };

describe('compound interest references (A = P(1 + r/n)^(nt))', () => {
  it('$10,000 at 5% compounded annually for 10 years → $16,288.95', () => expect(computeCompound(base).balance).toBe(16_288.95));
  it('compounded monthly → $16,470.09', () => expect(computeCompound({ ...base, compounding: 'monthly' }).balance).toBe(16_470.09));
  it('compounded quarterly → $16,436.19', () => expect(computeCompound({ ...base, compounding: 'quarterly' }).balance).toBe(16_436.19));
  // $1,000 at 3% compounded daily for 1 year → $1,030.45.
  it('$1,000 at 3% compounded daily for 1 year → $1,030.45', () => expect(computeCompound({ ...base, principal: 1_000, rate: 3, years: 1, compounding: 'daily' }).balance).toBe(1_030.45));
});

describe('details', () => {
  it('interest = balance − contributions', () => {
    const o = computeCompound({ ...base, monthly: 200, compounding: 'monthly' });
    expect(o.totalContributed).toBe(10_000 + 200 * 120);
    expect(o.totalInterest).toBeCloseTo(o.balance - o.totalContributed, 2);
  });
  it('doubling time at 7.2% annual is about 10 years', () => expect(computeCompound({ ...base, rate: 7.2 }).doublingYears).toBe(10));
  it('0% rate has no doubling time and no interest', () => {
    const o = computeCompound({ ...base, rate: 0 });
    expect(o.doublingYears).toBeNull();
    expect(o.totalInterest).toBe(0);
  });
  it('one-year horizon and very large balances stay finite', () => {
    expect(computeCompound({ ...base, years: 1 }).balance).toBe(10_500);
    expect(Number.isFinite(computeCompound({ ...base, principal: 1e9, rate: 30, years: 50 }).balance)).toBe(true);
  });
});
