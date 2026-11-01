/**
 * State data for state calculator pages. Every figure is sourced and dated; anything that could not be
 * confirmed against a primary source is listed in `verify` and shown to the owner in LAUNCH.md.
 * Update yearly (tax figures) and when the Tax Foundation / NAIC publish new data.
 *
 * Sources:
 * - Income tax: Tax Foundation, "State Individual Income Tax Rates and Brackets, 2026".
 * - Property tax: Tax Foundation, "Property Taxes by State and County" (effective rate on owner-occupied
 *   housing, 2024 ACS 5-year estimates), most populous county of each state.
 * - Homeowners insurance: NAIC average HO-3 premium, 2022 (via Insurance Information Institute).
 * - CA SDI: EDD 2026 contribution rate. NY PFL: NY DFS 2026 rate decision. NY DBL: 12 NYCRR Part 362 ($0.60/week cap).
 * - Checked 2026-11-01 (supersede the Tax Foundation table where they differ):
 *   - CA: FTB 2025 Form 540 2EZ tables (standard deduction $5,706 / $11,412; credit $153 / $306).
 *   - GA: HB 463, signed 2026-05-11 (Governor’s office; GA DOR withholding guide rev. June 2026): 4.99%, $15,000 / $30,000.
 *   - OH: ORC 5747.025 as amended by HB 96 (exemption tiers; indexing frozen 2025–2026; none at MAGI >= $500,000 from 2026).
 *   - Philadelphia wage tax: phila.gov, rates effective July 1, 2026. PA UC employee rate 0.07% (PA L&I 2026).
 *   - NYC resident rates 3.078%–3.876% and Detroit 2.4% / 1.2%: unchanged for 2026.
 */
import type { Brackets } from './tax-2026.ts';

export interface StatePayroll {
  name: string;
  /** Employee rate, %. */
  rate: number;
  /** Maximum employee contribution per year, dollars (if capped). */
  maxAnnual?: number;
}

export interface StateTaxSchedule {
  brackets: { single: Brackets; mfj: Brackets };
  standardDeduction: { single: number; mfj: number };
  /** Personal exemption deducted from income. */
  exemption: { single: number; mfj: number };
  /** Exemption per person by income (Ohio): the first tier whose maxIncome covers the income applies; above all tiers, none. Overrides `exemption`. */
  exemptionTiers?: { maxIncome: number; perPerson: number }[];
  /** Personal exemption credit subtracted from tax (California). */
  credit: { single: number; mfj: number };
  payroll: StatePayroll[];
  /** Employee 401(k) deferrals are taxable for state purposes (Pennsylvania). */
  retirementTaxable?: boolean;
}

export interface StateInfo {
  slug: string;
  name: string;
  abbr: string;
  mortgage: {
    county: string;
    medianHomeValue: number;
    /** Effective property tax rate, % (county, 2024). */
    propertyTaxRate: number;
    medianPropertyTax: number | null;
    /** Average HO-3 premium, dollars per year (2022). */
    insurance: number;
    /** State-specific paragraphs for the mortgage page. */
    notes: string[];
  };
  paycheck: {
    noIncomeTax: boolean;
    schedule: StateTaxSchedule;
    summary: string;
    notes: string[];
    local: { place: string; detail: string }[];
  };
  verify: string[];
}

const flat = (rate: number, from = 0): Brackets => (from > 0 ? [[0, 0], [from, rate]] : [[0, rate]]);
const NONE: StateTaxSchedule = { brackets: { single: [[0, 0]], mfj: [[0, 0]] }, standardDeduction: { single: 0, mfj: 0 }, exemption: { single: 0, mfj: 0 }, credit: { single: 0, mfj: 0 }, payroll: [] };

/** US reference values for comparisons. */
export const US_AVERAGE = { insurance: 1569, insuranceYear: 2022 };
export const STATE_DATA_YEAR = '2026-01-01';

export const STATES: StateInfo[] = [
  {
    slug: 'california',
    name: 'California',
    abbr: 'CA',
    mortgage: {
      county: 'Los Angeles County',
      medianHomeValue: 834_200,
      propertyTaxRate: 0.67,
      medianPropertyTax: 5_675,
      insurance: 1_492,
      notes: [
        'Under Proposition 13, California’s base property tax is 1% of a home’s assessed value, and the assessed value can rise by at most 2% a year until the home is sold. Voter-approved local bonds and assessments add to that, which is why many bills land between about 1.1% and 1.25% of the purchase price in the first year.',
        'Because a home is reassessed at its purchase price when it sells, new buyers often pay far more than long-time neighbors in identical houses. Budget from the price you pay, not the current owner’s tax bill.',
        'Home insurance has become harder to find in wildfire-prone areas. Get quotes early; if private insurers decline, the California FAIR Plan is the insurer of last resort, usually paired with a separate policy for other coverage.',
      ],
    },
    paycheck: {
      noIncomeTax: false,
      schedule: {
        brackets: {
          single: [[0, 0.01], [11_079, 0.02], [26_264, 0.04], [41_452, 0.06], [57_542, 0.08], [72_724, 0.093], [371_479, 0.103], [445_771, 0.113], [742_953, 0.123], [1_000_000, 0.133]],
          mfj: [[0, 0.01], [22_158, 0.02], [52_528, 0.04], [82_904, 0.06], [115_084, 0.08], [145_448, 0.093], [742_958, 0.103], [891_542, 0.113], [1_000_000, 0.123], [1_485_906, 0.133]],
        },
        standardDeduction: { single: 5_706, mfj: 11_412 },
        exemption: { single: 0, mfj: 0 },
        credit: { single: 153, mfj: 306 },
        payroll: [{ name: 'State Disability Insurance (SDI)', rate: 1.3 }],
      },
      summary: 'California has nine income tax brackets from 1% to 12.3%, plus a 1% Mental Health Services Tax on income over $1 million, and withholds 1.3% of every paycheck for State Disability Insurance.',
      notes: [
        'State Disability Insurance (SDI) is withheld from employees at 1.3% in 2026, with no wage cap since 2024. It funds disability and Paid Family Leave benefits.',
        'California doesn’t follow the federal standard deduction; its own is much smaller, and personal exemptions are given as a credit against tax instead of a deduction.',
        'Traditional 401(k) contributions are deductible for California tax, but HSA contributions are not, because California doesn’t recognize HSAs.',
      ],
      local: [],
    },
    verify: ['California 2026 indexed brackets, standard deduction and exemption credit: FTB had not published them as of 2026-11-01, so the 2025 amounts (FTB 2025 Form 540 tables) are used. Update when FTB publishes the 2026 amounts.'],
  },
  {
    slug: 'texas',
    name: 'Texas',
    abbr: 'TX',
    mortgage: {
      county: 'Harris County',
      medianHomeValue: 276_600,
      propertyTaxRate: 1.5,
      medianPropertyTax: 4_489,
      insurance: 2_397,
      notes: [
        'Texas has no state income tax, and property taxes do much of the work of funding schools and local government, so they’re among the higher rates in the country. Rates are set by several local bodies at once (county, city, school district and special districts such as MUDs), so two homes a few miles apart can pay quite different rates.',
        'If the home will be your primary residence, apply for the residence homestead exemption with your county appraisal district. It removes part of the home’s value from school taxes and limits how fast the taxable value of your homestead can rise each year.',
        'Homeowners insurance in Texas is above the national average because of hail, wind and hurricane risk. Coastal properties may need separate windstorm coverage.',
      ],
    },
    paycheck: {
      noIncomeTax: true,
      schedule: NONE,
      summary: 'Texas has no state income tax, so your paycheck has federal income tax, Social Security and Medicare withheld, but no state income tax.',
      notes: [
        'With no state income tax, a Texas paycheck keeps more of each raise: only federal income tax and FICA apply.',
        'Texas has no city or county income taxes either, so take-home pay is the same in Houston, Dallas, Austin or anywhere else in the state for the same salary.',
        'Texas raises revenue through other taxes instead. The state sales tax is 6.25%, and cities, counties and special districts can add up to 2% more, for a combined rate of up to 8.25%. Property taxes are above the national average, and renters pay them indirectly through rent.',
        'State unemployment insurance in Texas is paid entirely by employers, so there’s no state payroll deduction on your pay stub.',
        'The absence of an income tax covers all personal income in Texas, not just wages: interest, dividends and capital gains aren’t taxed by the state either. Businesses pay a separate franchise (margin) tax instead.',
      ],
      local: [],
    },
    verify: [],
  },
  {
    slug: 'florida',
    name: 'Florida',
    abbr: 'FL',
    mortgage: {
      county: 'Miami-Dade County',
      medianHomeValue: 463_000,
      propertyTaxRate: 0.81,
      medianPropertyTax: 3_744,
      insurance: 2_677,
      notes: [
        'Florida’s homestead exemption removes up to $50,000 of a primary residence’s assessed value from property tax (the second $25,000 doesn’t apply to school taxes), and the Save Our Homes rule limits annual increases in a homestead’s assessed value to 3% or the change in inflation, whichever is lower.',
        'When you buy, the assessed value resets to market value, so a new owner’s tax bill can be much higher than the seller’s. You can “port” some of the Save Our Homes benefit from a previous Florida homestead.',
        'Insurance is the wild card in Florida. Premiums are the highest in the country on average because of hurricane risk, and many homes also need separate flood insurance. Get quotes, and a wind-mitigation inspection, before you commit to a price.',
      ],
    },
    paycheck: {
      noIncomeTax: true,
      schedule: NONE,
      summary: 'Florida has no state income tax on wages, so paychecks have only federal income tax, Social Security and Medicare withheld.',
      notes: [
        'Florida’s constitution prohibits a personal income tax, so there’s no state withholding and no state return for wage earners.',
        'There are no local income taxes in Florida either; differences in cost of living come from housing, insurance and sales taxes instead.',
        'Florida’s state sales tax is 6%, and most counties add a discretionary sales surtax on top. Reemployment assistance (unemployment) tax is paid by employers, not deducted from wages.',
        'Florida does levy a corporate income tax, but it applies to corporations, not to people earning wages or running most small sole proprietorships.',
        'Because there’s no income tax, Florida doesn’t tax retirement income either: Social Security, pensions and IRA or 401(k) withdrawals are taxed only at the federal level. That’s one reason the state is popular with retirees.',
      ],
      local: [],
    },
    verify: [],
  },
  {
    slug: 'new-york',
    name: 'New York',
    abbr: 'NY',
    mortgage: {
      county: 'Kings County (Brooklyn)',
      medianHomeValue: 905_000,
      propertyTaxRate: 0.56,
      medianPropertyTax: 6_382,
      insurance: 1_628,
      notes: [
        'Property tax rates in New York vary enormously. New York City’s effective rates on homes are relatively low, while many upstate and Long Island communities have some of the highest rates in the country, often 2% or more.',
        'New York charges a mortgage recording tax when you take out a mortgage. It’s a one-time closing cost, not part of the monthly payment, but it can add thousands of dollars to the cash you need at closing.',
        'Many New York City buyers purchase co-ops or condos, where monthly maintenance or common charges replace part of the property tax and insurance; enter those as HOA dues.',
      ],
    },
    paycheck: {
      noIncomeTax: false,
      schedule: {
        brackets: {
          single: [[0, 0.039], [8_500, 0.044], [11_700, 0.0515], [13_900, 0.054], [80_650, 0.059], [215_400, 0.0685], [1_077_550, 0.0965], [5_000_000, 0.103], [25_000_000, 0.109]],
          mfj: [[0, 0.039], [17_150, 0.044], [23_600, 0.0515], [27_900, 0.054], [161_550, 0.059], [323_200, 0.0685], [2_155_350, 0.0965], [5_000_000, 0.103], [25_000_000, 0.109]],
        },
        standardDeduction: { single: 8_000, mfj: 16_050 },
        exemption: { single: 0, mfj: 0 },
        credit: { single: 0, mfj: 0 },
        payroll: [
          { name: 'Paid Family Leave (PFL)', rate: 0.432, maxAnnual: 411.91 },
          { name: 'Disability insurance (DBL)', rate: 0.5, maxAnnual: 31.2 },
        ],
      },
      summary: 'New York taxes income at rates from 3.9% to 10.9%, and employers also withhold Paid Family Leave (0.432%, up to $411.91 a year) and disability insurance (up to $0.60 a week).',
      notes: [
        'Paid Family Leave is withheld at 0.432% of wages in 2026, up to $411.91 a year. Disability (DBL) is 0.5% of wages, capped at $0.60 a week.',
        'New York’s rate cuts for middle incomes mean most full-time workers are in the 5.4% to 5.9% brackets.',
      ],
      local: [
        { place: 'New York City', detail: 'NYC residents pay a separate city income tax of 3.078% to 3.876%, withheld with state tax. Enter it as a local tax rate under More options.' },
        { place: 'Yonkers', detail: 'Yonkers residents pay a city income tax surcharge calculated on their New York State tax.' },
      ],
    },
    verify: [],
  },
  {
    slug: 'pennsylvania',
    name: 'Pennsylvania',
    abbr: 'PA',
    mortgage: {
      county: 'Philadelphia County',
      medianHomeValue: 243_100,
      propertyTaxRate: 0.85,
      medianPropertyTax: 2_003,
      insurance: 1_120,
      notes: [
        'Pennsylvania property taxes are set mostly by school districts, along with counties and municipalities, so rates vary widely. Philadelphia’s effective rate is moderate, while many suburban school districts around Philadelphia and Pittsburgh charge much more.',
        'Pennsylvania charges a realty transfer tax of 1% for the state, plus local transfer taxes, at closing. Buyers and sellers often split it, but local custom and the sales contract decide.',
        'The Homestead and Farmstead Exclusion, funded by state gambling revenue, can reduce school property taxes on a primary residence. Apply with your county assessment office.',
      ],
    },
    paycheck: {
      noIncomeTax: false,
      schedule: {
        brackets: { single: flat(0.0307), mfj: flat(0.0307) },
        standardDeduction: { single: 0, mfj: 0 },
        exemption: { single: 0, mfj: 0 },
        credit: { single: 0, mfj: 0 },
        payroll: [{ name: 'Unemployment compensation (employee share)', rate: 0.07 }],
        retirementTaxable: true,
      },
      summary: 'Pennsylvania has a flat 3.07% income tax with no standard deduction, and 401(k) contributions are taxed by the state; most workers also pay a local earned income tax.',
      notes: [
        'Pennsylvania doesn’t allow a deduction for employee 401(k) contributions, so state tax applies to your full wages even if you save for retirement.',
        'Employees also pay a small unemployment compensation tax of 0.07% of wages.',
      ],
      local: [
        { place: 'Most municipalities', detail: 'Local earned income taxes (EIT) apply almost everywhere in Pennsylvania, commonly around 1% of wages, plus a local services tax of up to $52 a year.' },
        { place: 'Philadelphia', detail: 'Philadelphia’s wage tax is 3.735% for residents and 3.425% for non-residents who work in the city (rates from July 1, 2026).' },
      ],
    },
    verify: [],
  },
  {
    slug: 'illinois',
    name: 'Illinois',
    abbr: 'IL',
    mortgage: {
      county: 'Cook County',
      medianHomeValue: 324_500,
      propertyTaxRate: 1.73,
      medianPropertyTax: 6_191,
      insurance: 1_343,
      notes: [
        'Illinois has some of the highest property taxes in the country. In Cook County, home to Chicago, the median homeowner pays over $6,000 a year, and rates outside Cook County are often higher still as a share of home value.',
        'Homestead exemptions lower the assessed value of an owner-occupied home; Cook County’s homeowner exemption and senior exemptions can be significant, but you need to apply.',
        'Cook County reassesses property on a three-year cycle by region, so a bill can jump in a reassessment year. Ask for the current bill and the assessment history before you buy.',
      ],
    },
    paycheck: {
      noIncomeTax: false,
      schedule: {
        brackets: { single: flat(0.0495), mfj: flat(0.0495) },
        standardDeduction: { single: 0, mfj: 0 },
        exemption: { single: 2_925, mfj: 5_850 },
        credit: { single: 0, mfj: 0 },
        payroll: [],
      },
      summary: 'Illinois has a flat 4.95% income tax with a personal exemption of $2,925 per person in 2026.',
      notes: [
        'The state constitution requires a flat rate, so every dollar of taxable income is taxed at 4.95%.',
        'Illinois has no state disability or family-leave payroll deduction, and no city income taxes.',
      ],
      local: [],
    },
    verify: [],
  },
  {
    slug: 'ohio',
    name: 'Ohio',
    abbr: 'OH',
    mortgage: {
      county: 'Franklin County',
      medianHomeValue: 288_400,
      propertyTaxRate: 1.53,
      medianPropertyTax: 4_244,
      insurance: 995,
      notes: [
        'Ohio’s property taxes are above the national average, and they depend heavily on voter-approved levies for schools and local services. Franklin County, home to Columbus, has an effective rate of about 1.5%, while nearby Cuyahoga County (Cleveland) is closer to 1.9%.',
        'Ohio reappraises property every six years with an update in the third year, so tax bills can change noticeably in those years.',
        'Homeowners insurance in Ohio is among the cheapest in the country on average, which offsets part of the higher property tax.',
      ],
    },
    paycheck: {
      noIncomeTax: false,
      schedule: {
        brackets: { single: flat(0.0275, 26_050), mfj: flat(0.0275, 26_050) },
        standardDeduction: { single: 0, mfj: 0 },
        exemption: { single: 0, mfj: 0 },
        exemptionTiers: [
          { maxIncome: 40_000, perPerson: 2_400 },
          { maxIncome: 80_000, perPerson: 2_150 },
          { maxIncome: 499_999.99, perPerson: 1_900 },
        ],
        credit: { single: 0, mfj: 0 },
        payroll: [],
      },
      summary: 'From 2026 Ohio taxes income at a flat 2.75% above $26,050, with the first $26,050 untaxed, and most cities add their own income tax.',
      notes: [
        'Ohio’s 2026 change replaced its brackets with a single 2.75% rate above $26,050.',
        'The personal exemption depends on income: $2,400 per person up to $40,000, $2,150 up to $80,000 and $1,900 above that, with none at $500,000 or more. These are the 2025 amounts, carried into 2026 because inflation indexing is frozen.',
      ],
      local: [{ place: 'Most cities and villages', detail: 'Ohio municipalities levy their own income taxes, commonly 1% to 2.5% (Columbus and Cleveland charge 2.5%). Enter your city’s rate under More options.' }],
    },
    verify: [],
  },
  {
    slug: 'georgia',
    name: 'Georgia',
    abbr: 'GA',
    mortgage: {
      county: 'Fulton County',
      medianHomeValue: 458_800,
      propertyTaxRate: 0.89,
      medianPropertyTax: 4_033,
      insurance: 1_655,
      notes: [
        'Georgia’s property taxes are close to the national average overall, but rates differ a lot by county. Fulton County, including most of Atlanta, has an effective rate just under 0.9%.',
        'Georgia’s homestead exemption, and additional local exemptions in many counties, reduce the taxable value of a primary residence. Many counties also freeze or limit increases in a homestead’s assessed value. File with the county tax assessor by the deadline, usually April 1.',
        'Georgia assesses property at 40% of fair market value before applying millage rates, so don’t be surprised to see an assessed value well below the price on your bill.',
      ],
    },
    paycheck: {
      noIncomeTax: false,
      schedule: {
        brackets: { single: flat(0.0499), mfj: flat(0.0499) },
        standardDeduction: { single: 15_000, mfj: 30_000 },
        exemption: { single: 0, mfj: 0 },
        credit: { single: 0, mfj: 0 },
        payroll: [],
      },
      summary: 'Georgia taxes income at a flat 4.99% in 2026 after a $15,000 standard deduction for single filers ($30,000 for married couples).',
      notes: [
        'Georgia moved to a flat income tax in 2024. A 2026 law (HB 463) cut the rate from 5.19% to 4.99%, retroactive to January 1, 2026, and raised the standard deduction by 25%. Further cuts of 0.125 points a year toward 3.99% depend on state revenue targets.',
        'There are no city or county income taxes in Georgia.',
      ],
      local: [],
    },
    verify: [],
  },
  {
    slug: 'north-carolina',
    name: 'North Carolina',
    abbr: 'NC',
    mortgage: {
      county: 'Wake County',
      medianHomeValue: 461_300,
      propertyTaxRate: 0.69,
      medianPropertyTax: 3_260,
      insurance: 1_621,
      notes: [
        'North Carolina’s property taxes are below the national average. Wake County, home to Raleigh, has an effective rate of about 0.7%, and Mecklenburg County (Charlotte) is similar.',
        'Counties reappraise at least every eight years, and many fast-growing counties do it more often; values can jump sharply in a revaluation year even if the tax rate is cut.',
        'Insurance is higher on the coast because of hurricane risk, and coastal homes may need separate wind and flood coverage.',
      ],
    },
    paycheck: {
      noIncomeTax: false,
      schedule: {
        brackets: { single: flat(0.0399), mfj: flat(0.0399) },
        standardDeduction: { single: 12_750, mfj: 25_500 },
        exemption: { single: 0, mfj: 0 },
        credit: { single: 0, mfj: 0 },
        payroll: [],
      },
      summary: 'North Carolina’s flat income tax falls to 3.99% in 2026, after a $12,750 standard deduction for single filers ($25,500 for married couples).',
      notes: ['The 2026 rate of 3.99% continues a series of annual cuts from 4.99% in 2022.', 'North Carolina has no local income taxes.'],
      local: [],
    },
    verify: [],
  },
  {
    slug: 'michigan',
    name: 'Michigan',
    abbr: 'MI',
    mortgage: {
      county: 'Wayne County',
      medianHomeValue: 178_500,
      propertyTaxRate: 1.47,
      medianPropertyTax: 2_904,
      insurance: 1_056,
      notes: [
        'Under Proposal A, the taxable value of a Michigan home can rise each year by no more than 5% or inflation, whichever is lower, until it’s sold. The year after a sale, taxable value “uncaps” to half of market value, so a buyer’s bill is often much higher than the seller’s.',
        'A Principal Residence Exemption removes most of the school operating millage (up to 18 mills) from an owner-occupied home. File the affidavit with your city or township when you buy.',
        'Detroit and much of Wayne County have higher millage rates than most of the state, so check the specific city or township rate.',
      ],
    },
    paycheck: {
      noIncomeTax: false,
      schedule: {
        brackets: { single: flat(0.0425), mfj: flat(0.0425) },
        standardDeduction: { single: 0, mfj: 0 },
        exemption: { single: 5_900, mfj: 11_800 },
        credit: { single: 0, mfj: 0 },
        payroll: [],
      },
      summary: 'Michigan has a flat 4.25% income tax with a $5,900 personal exemption per person in 2026, and some cities, including Detroit, add their own income tax.',
      notes: ['Michigan’s personal exemption is indexed to inflation each year.', 'There’s no state disability or family-leave deduction from Michigan paychecks.'],
      local: [{ place: 'Detroit and 23 other cities', detail: 'Some Michigan cities levy income taxes; Detroit charges residents 2.4% and non-residents who work there 1.2%. Enter your city’s rate under More options.' }],
    },
    verify: [],
  },
];

export const getState = (slug: string): StateInfo | undefined => STATES.find((s) => s.slug === slug);
