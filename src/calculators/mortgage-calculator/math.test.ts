import { describe, expect, it } from 'vitest';
import { computeMortgage, convertDownPayment, downPaymentAmount, type MortgageInput } from './math.ts';

const base: MortgageInput = {
  homePrice: 375_000,
  downPayment: 20,
  downMode: 'percent',
  interestRate: 6.5,
  termYears: 30,
  propertyTaxRate: 0,
  homeInsurance: 0,
  pmiRate: 0,
  hoa: 0,
  extraMonthly: 0,
};

describe('mortgage reference values', () => {
  // Reference: $300,000 loan at 6.5% for 30 years → $1,896.20 P&I (brief section 18).
  it('$300,000 at 6.5% for 30 years is $1,896.20', () => {
    const out = computeMortgage(base);
    expect(out.loanAmount).toBe(300_000);
    expect(out.monthlyPI).toBe(1896.2);
    expect(out.payoffMonths).toBe(360);
  });
  // Reference: $200,000 at 4% for 30 years → $954.83 (standard amortization table).
  it('$200,000 at 4% for 30 years is $954.83', () => {
    const out = computeMortgage({ ...base, homePrice: 250_000, interestRate: 4 });
    expect(out.loanAmount).toBe(200_000);
    expect(out.monthlyPI).toBe(954.83);
  });
  // Reference: $250,000 at 7% for 15 years → $2,247.07.
  it('$250,000 at 7% for 15 years is $2,247.07', () => {
    const out = computeMortgage({ ...base, homePrice: 312_500, interestRate: 7, termYears: 15 });
    expect(out.monthlyPI).toBe(2247.07);
  });
  // Reference: $400,000 at 3% for 30 years → $1,686.42.
  it('$400,000 at 3% for 30 years is $1,686.42', () => {
    const out = computeMortgage({ ...base, homePrice: 500_000, interestRate: 3 });
    expect(out.monthlyPI).toBe(1686.42);
  });
});

describe('escrow, HOA and totals', () => {
  it('adds tax, insurance and HOA to the monthly total', () => {
    const out = computeMortgage({ ...base, propertyTaxRate: 1.2, homeInsurance: 1800, hoa: 50 });
    expect(out.monthlyTax).toBe(375); // 375,000 × 1.2% / 12
    expect(out.monthlyInsurance).toBe(150);
    expect(out.totalMonthly).toBe(1896.2 + 375 + 150 + 50);
  });
});

describe('PMI', () => {
  const pmi: MortgageInput = { ...base, homePrice: 400_000, downPayment: 10, pmiRate: 0.6 };
  it('is charged when the down payment is under 20%', () => {
    const out = computeMortgage(pmi);
    expect(out.loanAmount).toBe(360_000);
    expect(out.monthlyPMI).toBe(180); // 360,000 × 0.6% / 12
    expect(out.pmiMonths).toBeGreaterThan(0);
  });
  it('stops automatically when the balance first reaches 78% of the original value', () => {
    const out = computeMortgage(pmi);
    const threshold = 400_000 * 0.78;
    const lastPmiRow = out.schedule[out.pmiMonths - 1]!;
    const prevBalance = out.pmiMonths > 1 ? out.schedule[out.pmiMonths - 2]!.balance : out.loanAmount;
    expect(prevBalance).toBeGreaterThan(threshold);
    expect(lastPmiRow.balance).toBeLessThanOrEqual(threshold);
    expect(out.schedule[out.pmiMonths]!.other).toBe(0);
    expect(out.pmiTotal).toBe(180 * out.pmiMonths);
  });
  it('ends sooner with extra payments', () => {
    const plain = computeMortgage(pmi);
    const extra = computeMortgage({ ...pmi, extraMonthly: 500 });
    expect(extra.pmiMonths).toBeLessThan(plain.pmiMonths);
  });
  it('is not charged at 20% down or more', () => {
    expect(computeMortgage({ ...base, pmiRate: 0.6 }).pmiMonths).toBe(0);
  });
});

describe('extra payments', () => {
  it('save interest and months versus the baseline', () => {
    const out = computeMortgage({ ...base, extraMonthly: 200 });
    expect(out.payoffMonths).toBeLessThan(360);
    expect(out.interestSaved).toBeGreaterThan(50_000);
    expect(out.monthsSaved).toBe(360 - out.payoffMonths);
    expect(out.baseline.payoffMonths).toBe(360);
  });
});

describe('edge cases', () => {
  it('0% interest divides the loan evenly', () => {
    const out = computeMortgage({ ...base, interestRate: 0 });
    expect(out.monthlyPI).toBe(833.33);
    expect(out.totalInterest).toBe(0);
    expect(out.schedule.at(-1)!.balance).toBe(0);
  });
  it('a 100% down payment means no loan', () => {
    const out = computeMortgage({ ...base, downPayment: 100 });
    expect(out.loanAmount).toBe(0);
    expect(out.monthlyPI).toBe(0);
    expect(Number.isFinite(out.totalMonthly)).toBe(true);
  });
  it('a dollar down payment larger than the price is capped', () => {
    const out = computeMortgage({ ...base, downPayment: 1_000_000, downMode: 'usd' });
    expect(out.loanAmount).toBe(0);
  });
  it('a 1-year term and an extreme rate stay finite', () => {
    const out = computeMortgage({ ...base, termYears: 1, interestRate: 25 });
    expect(out.payoffMonths).toBe(12);
    expect(Number.isFinite(out.monthlyPI)).toBe(true);
  });
  it('very large values stay exact to the cent', () => {
    const out = computeMortgage({ ...base, homePrice: 50_000_000, downPayment: 0 });
    expect(out.monthlyPI).toBe(316_034.01);
  });
});

describe('down payment conversion', () => {
  it('converts between percent and dollars', () => {
    expect(downPaymentAmount(400_000, 20, 'percent')).toBe(80_000);
    expect(convertDownPayment(400_000, 20, 'percent', 'usd')).toBe(80_000);
    expect(convertDownPayment(400_000, 80_000, 'usd', 'percent')).toBe(20);
    expect(convertDownPayment(0, 5000, 'usd', 'percent')).toBe(0);
  });
});
