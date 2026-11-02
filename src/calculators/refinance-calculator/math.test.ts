import { describe, expect, it } from 'vitest';
import { computeRefinance, type RefiInput } from './math.ts';

// Reference scenario: a $350,000, 30-year loan at 7.5% taken 5 years ago has $331,161.09 left over 300 payments.
// All values below were reproduced with an independent floating-point amortization (cents rounded monthly).
const dana: RefiInput = { balance: 331_161.09, currentRate: 7.5, yearsLeft: 25, newRate: 6.5, newTermYears: 30, closingCosts: 7_000, rollCosts: false, yearsToKeep: 5 };

describe('refinance reference values', () => {
  it('current and new payments', () => {
    const o = computeRefinance(dana);
    expect(o.currentPayment).toBe(2_447.25);
    expect(o.newPayment).toBe(2_093.16);
    expect(o.monthlySavings).toBe(354.09);
  });
  // Classic break-even: $7,000 ÷ $354.09 = 19.8 → 20 months.
  it('classic break-even (costs ÷ savings)', () => expect(computeRefinance(dana).simpleBreakEven).toBe(20));
  // Counting the slower principal paydown of a new 30-year loan, the refinance is only ahead from month 27.
  it('true break-even including balances', () => expect(computeRefinance(dana).breakEvenMonths).toBe(27));
  // Remaining interest $403,014.93 vs $422,380.11 + $7,000: the 30-year refinance costs $26,365.18 more in total.
  it('term reset costs more over the life of the loan', () => {
    const o = computeRefinance(dana);
    expect(o.currentInterest).toBe(403_014.93);
    expect(o.newInterest).toBe(422_380.11);
    expect(o.lifetimeSavings).toBe(-26_365.18);
    expect(o.extraMonths).toBe(60);
  });
  // Keeping the same 25-year payoff date: payment $2,236.02, lifetime saving $56,367.48.
  it('matching the remaining term saves money', () => {
    const o = computeRefinance({ ...dana, newTermYears: 25 });
    expect(o.newPayment).toBe(2_236.02);
    expect(o.lifetimeSavings).toBe(56_367.48);
    expect(o.simpleBreakEven).toBe(34);
    expect(o.breakEvenMonths).toBe(26);
    expect(o.extraMonths).toBe(0);
  });
  // Selling after 5 years: payments plus balance owed favor the refinance by $8,024.68.
  it('net result after 5 years', () => expect(computeRefinance(dana).savingsAtHorizon).toBe(8_024.68));
});

describe('rolled-in costs and edge cases', () => {
  it('rolling costs into the loan raises the balance and the payment', () => {
    const o = computeRefinance({ ...dana, rollCosts: true });
    expect(o.newLoan).toBe(338_161.09);
    expect(o.newPayment).toBe(2_137.41);
    expect(o.simpleBreakEven).toBeNull();
    expect(o.breakEvenMonths).toBe(31);
  });
  it('a higher new rate never breaks even on payment', () => {
    const o = computeRefinance({ ...dana, newRate: 8, newTermYears: 25 });
    expect(o.monthlySavings).toBeLessThan(0);
    expect(o.simpleBreakEven).toBeNull();
  });
  it('no closing costs and a lower rate: ahead from the first month', () => expect(computeRefinance({ ...dana, closingCosts: 0, newTermYears: 25 }).breakEvenMonths).toBe(1));
  it('same rate and term with no costs changes nothing', () => {
    const o = computeRefinance({ ...dana, newRate: 7.5, newTermYears: 25, closingCosts: 0 });
    expect(o.monthlySavings).toBe(0);
    expect(o.lifetimeSavings).toBe(0);
  });
});
