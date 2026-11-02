import { describe, expect, it } from 'vitest';
import { computeInflation, cpiFor, CURRENT_YEAR, decadeTable, yearOutOfRange, type InflationInput } from './math.ts';
import { CPI_ANNUAL, CPI_LATEST } from './cpi.ts';

const base: InflationInput = { mode: 'past', amount: 100, fromYear: 2000, toYear: 2024, rate: 3, years: 10 };

describe('CPI data (BLS CPI-U annual averages)', () => {
  // Published BLS annual averages, 1982–84 = 100.
  it('matches published annual averages', () => {
    expect(CPI_ANNUAL[1913]).toBe(9.883);
    expect(CPI_ANNUAL[1980]).toBe(82.408);
    expect(CPI_ANNUAL[2000]).toBe(172.2);
    expect(CPI_ANNUAL[2020]).toBe(258.811);
    expect(CPI_ANNUAL[2023]).toBe(304.702);
    expect(CPI_ANNUAL[2024]).toBe(313.689);
  });
  it('every year from 1913 is present and positive', () => {
    for (let y = 1913; y < CURRENT_YEAR; y++) expect(CPI_ANNUAL[y], String(y)).toBeGreaterThan(0);
  });
  it('the current year uses the latest monthly index', () => expect(cpiFor(CURRENT_YEAR)).toBe(CPI_LATEST.value));
  it('years outside the data are flagged', () => {
    expect(yearOutOfRange(1900)).toBe(true);
    expect(yearOutOfRange(CURRENT_YEAR + 1)).toBe(true);
    expect(yearOutOfRange(1990)).toBe(false);
  });
});

describe('past inflation', () => {
  // $100 in 2000 = 100 × 313.689 ÷ 172.2 = $182.17 in 2024.
  it('$100 from 2000 to 2024', () => {
    const o = computeInflation(base);
    expect(o.value).toBe(182.17);
    expect(o.cumulative).toBe(82.17);
  });
  // Average yearly rate: (313.689 ÷ 172.2)^(1/24) − 1 = 2.53%.
  it('average yearly inflation', () => expect(computeInflation(base).averageRate).toBe(2.53));
  // $1 in 1913 = 313.689 ÷ 9.883 = $31.74 in 2024.
  it('$1 from 1913', () => expect(computeInflation({ ...base, amount: 1, fromYear: 1913 }).value).toBe(31.74));
  it('going backwards gives the earlier-dollar value', () => expect(computeInflation({ ...base, fromYear: 2024, toYear: 2000 }).value).toBe(54.9));
  it('backwards still reports a positive average rate', () => expect(computeInflation({ ...base, fromYear: 2024, toYear: 2000 }).averageRate).toBe(2.53));
  it('same year is unchanged', () => expect(computeInflation({ ...base, toYear: 2000 }).value).toBe(100));
});

describe('future inflation', () => {
  // $100 at 3% for 10 years: 100 × 1.03^10 = $134.39; today's value of $100 then = $74.41.
  it('projects costs forward', () => {
    const o = computeInflation({ ...base, mode: 'future' });
    expect(o.value).toBe(134.39);
    expect(o.todaysValue).toBe(74.41);
    expect(o.cumulative).toBe(34.39);
  });
  it('zero years', () => expect(computeInflation({ ...base, mode: 'future', years: 0 }).value).toBe(100));
});

describe('decade table', () => {
  it('lists each decade before the target year', () => {
    const rows = decadeTable(100, 2024);
    // 100 × 313.689 ÷ 20.042 (1920 CPI) = 1,565.16.
    expect(rows[0]).toEqual({ year: 1920, value: 1_565.16 });
    expect(rows.at(-1)!.year).toBe(2020);
  });
});
