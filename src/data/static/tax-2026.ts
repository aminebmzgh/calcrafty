/**
 * 2026 federal tax figures. Update once a year (one-file change) when the IRS publishes the next
 * Revenue Procedure (usually October) and the SSA announces the wage base.
 *
 * Verified 2026-11-01 against the primary sources listed in TAX_2026_SOURCES.
 */

export type FilingStatus = 'single' | 'mfj' | 'hoh';

/** [lower bound of the bracket, marginal rate]. The first bracket starts at 0. */
export type Brackets = readonly (readonly [number, number])[];

export const TAX_YEAR = 2026;

/** Rev. Proc. 2025-32, section 4.01, Tables 1–3. */
export const FEDERAL_BRACKETS_2026: Record<FilingStatus, Brackets> = {
  single: [
    [0, 0.1],
    [12_400, 0.12],
    [50_400, 0.22],
    [105_700, 0.24],
    [201_775, 0.32],
    [256_225, 0.35],
    [640_600, 0.37],
  ],
  mfj: [
    [0, 0.1],
    [24_800, 0.12],
    [100_800, 0.22],
    [211_400, 0.24],
    [403_550, 0.32],
    [512_450, 0.35],
    [768_700, 0.37],
  ],
  hoh: [
    [0, 0.1],
    [17_700, 0.12],
    [67_450, 0.22],
    [105_700, 0.24],
    [201_750, 0.32],
    [256_200, 0.35],
    [640_600, 0.37],
  ],
};

/** Rev. Proc. 2025-32, section 4.15 (as amended by Public Law 119-21). */
export const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single: 16_100,
  mfj: 32_200,
  hoh: 24_150,
};

/** Social Security (OASDI) and Medicare (HI) employee rates. */
export const FICA_2026 = {
  socialSecurityRate: 0.062,
  /** SSA 2026 contribution and benefit base. */
  socialSecurityWageBase: 184_500,
  medicareRate: 0.0145,
  /** Additional Medicare Tax: employers withhold it on wages above $200,000 regardless of filing status (IRC 3102(f)). */
  additionalMedicareRate: 0.009,
  additionalMedicareThreshold: 200_000,
} as const;

/** IRS cost-of-living adjusted limits for 2026 (retirement plans). */
export const RETIREMENT_LIMITS_2026 = {
  elective401k: 24_500,
  catchUp50: 8_000,
  catchUp60to63: 11_250,
  ira: 7_500,
  iraCatchUp50: 1_100,
} as const;

/** IRS 2026 HSA contribution limits. */
export const HSA_LIMITS_2026 = { selfOnly: 4_400, family: 8_750, catchUp55: 1_000 } as const;

export const TAX_2026_SOURCES = [
  { title: 'IRS Rev. Proc. 2025-32: 2026 inflation adjustments (brackets, standard deduction)', url: 'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf' },
  { title: 'IRS: Tax inflation adjustments for tax year 2026', url: 'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill' },
  { title: 'SSA: Contribution and benefit base', url: 'https://www.ssa.gov/oact/cola/cbb.html' },
  { title: 'IRS: Questions and answers for the Additional Medicare Tax', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/questions-and-answers-for-the-additional-medicare-tax' },
  { title: 'IRS: COLA increases for dollar limitations on benefits and contributions', url: 'https://www.irs.gov/retirement-plans/cola-increases-for-dollar-limitations-on-benefits-and-contributions' },
  { title: 'IRS Publication 15-T: Federal Income Tax Withholding Methods', url: 'https://www.irs.gov/publications/p15t' },
] as const;
