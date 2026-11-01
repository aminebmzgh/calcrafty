import { describe, expect, it } from 'vitest';
import { computeRentBuy, type RentBuyInput } from './math.ts';

/** A frictionless world: everything zero except what each test sets. */
const zero: RentBuyInput = {
  years: 10,
  homePrice: 120_000,
  downPct: 100,
  interestRate: 0,
  termYears: 30,
  propertyTaxRate: 0,
  homeInsurance: 0,
  maintenancePct: 0,
  hoa: 0,
  appreciation: 0,
  buyClosingPct: 0,
  sellClosingPct: 0,
  rent: 1_000,
  rentIncrease: 0,
  rentersInsurance: 0,
  investReturn: 0,
};

describe('rent vs buy references', () => {
  // Cash buyer, no costs, no growth: buying wins by exactly the rent avoided (120 × $1,000).
  it('cash purchase with no costs: advantage = total rent', () => {
    const o = computeRentBuy(zero);
    expect(o.buyerNetWorth).toBe(240_000);
    expect(o.renterNetWorth).toBe(120_000);
    expect(o.advantage).toBe(120_000);
    expect(o.totalRentCost).toBe(120_000);
  });
  // Home value compounds at the appreciation rate: 120,000 × 1.03^10 = $161,269.97.
  it('home appreciates at (1 + g)^years', () => {
    expect(computeRentBuy({ ...zero, appreciation: 3 }).homeValueEnd).toBeCloseTo(161_269.97, 1);
  });
  // The renter's invested down payment compounds at the return: 120,000 × 1.05^10 = $195,467.36 (rent 0).
  it('renter invests the upfront cost at the investment return', () => {
    expect(computeRentBuy({ ...zero, rent: 0, investReturn: 5 }).renterNetWorth).toBeCloseTo(195_467.36, 1);
  });
  // With a loan, the mortgage payment matches the standard formula: $300,000 at 6.5%/30y → $1,896.20.
  it('mortgage payment uses the standard formula', () => {
    const o = computeRentBuy({ ...zero, homePrice: 375_000, downPct: 20, interestRate: 6.5 });
    expect(o.loanAmount).toBe(300_000);
    expect(o.monthlyPI).toBe(1896.2);
  });
});

describe('rent vs buy behavior', () => {
  it('selling costs reduce the buyer’s net worth by exactly that share of the value', () => {
    const a = computeRentBuy(zero).buyerNetWorth;
    const b = computeRentBuy({ ...zero, sellClosingPct: 6 }).buyerNetWorth;
    expect(a - b).toBeCloseTo(7_200, 2);
  });
  it('finds a break-even year when buying starts behind', () => {
    const o = computeRentBuy({ ...zero, buyClosingPct: 10, sellClosingPct: 6, rent: 300 });
    expect(o.breakEvenYear).not.toBeNull();
    expect(o.years[0]!.advantage).toBeLessThan(0);
  });
  it('high rent growth favors buying; high investment returns favor renting', () => {
    const typical: RentBuyInput = { ...zero, downPct: 20, interestRate: 7, propertyTaxRate: 1, homeInsurance: 1_500, maintenancePct: 1, appreciation: 3, buyClosingPct: 3, sellClosingPct: 6, rent: 700, rentIncrease: 3, investReturn: 6 };
    const base = computeRentBuy(typical).advantage;
    expect(computeRentBuy({ ...typical, rentIncrease: 6 }).advantage).toBeGreaterThan(base);
    expect(computeRentBuy({ ...typical, investReturn: 9 }).advantage).toBeLessThan(base);
  });
  it('one-year horizon works', () => expect(computeRentBuy({ ...zero, years: 1 }).years).toHaveLength(1));
});
