import { describe, expect, it } from 'vitest';
import { computeNetWorth, medianFor, MEDIANS, type NetWorthInput } from './math.ts';

const base: NetWorthInput = {
  cash: 12_000,
  investments: 25_000,
  retirement: 85_000,
  homeValue: 380_000,
  vehicles: 18_000,
  otherAssets: 5_000,
  mortgage: 290_000,
  carLoans: 14_000,
  studentLoans: 22_000,
  creditCards: 3_500,
  otherDebts: 0,
  age: 38,
};

describe('net worth', () => {
  // Assets 12,000 + 25,000 + 85,000 + 380,000 + 18,000 + 5,000 = 525,000; liabilities 329,500; net worth 195,500.
  it('assets minus liabilities', () => {
    const o = computeNetWorth(base);
    expect(o.totalAssets).toBe(525_000);
    expect(o.totalLiabilities).toBe(329_500);
    expect(o.netWorth).toBe(195_500);
  });
  it('home equity', () => expect(computeNetWorth(base).homeEquity).toBe(90_000));
  // Cash + taxable investments − card and other consumer debt: 12,000 + 25,000 − 3,500 = 33,500.
  it('liquid net worth', () => expect(computeNetWorth(base).liquidNetWorth).toBe(33_500));
  // 329,500 ÷ 525,000 = 62.8%.
  it('debt-to-asset ratio', () => expect(computeNetWorth(base).debtToAsset).toBe(62.8));
  it('negative net worth', () => expect(computeNetWorth({ ...base, homeValue: 0, mortgage: 0, retirement: 0, investments: 0, studentLoans: 80_000 }).netWorth).toBe(-62_500));
  it('no assets', () => expect(computeNetWorth({ ...base, cash: 0, investments: 0, retirement: 0, homeValue: 0, vehicles: 0, otherAssets: 0 }).debtToAsset).toBe(0));
});

describe('age-group medians (Federal Reserve SCF 2022)', () => {
  it('picks the right age band', () => {
    expect(medianFor(29).label).toBe('under 35');
    expect(medianFor(38).median).toBe(135_000);
    expect(medianFor(70).median).toBe(410_000);
    expect(medianFor(80).label).toBe('75 and older');
  });
  it('bands cover every age without gaps', () => {
    for (let a = 18; a <= 100; a++) expect(MEDIANS.some((m) => a >= m.minAge && a <= m.maxAge), String(a)).toBe(true);
  });
  it('compares with the median', () => expect(computeNetWorth(base).vsMedian).toBe(60_500));
});
