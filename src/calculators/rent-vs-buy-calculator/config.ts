import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeRentBuy, type RentBuyInput, type RentBuyOutput } from './math.ts';

const config: CalculatorConfig<RentBuyInput, RentBuyOutput> = {
  slug: 'rent-vs-buy-calculator',
  category: 'finance',
  subtopic: 'Home buying',
  name: 'Rent vs Buy Calculator',
  h1: 'Rent vs Buy Calculator',
  intro: 'Compare your net worth after renting or buying, including equity, every cost of owning and investing the difference.',
  metaTitle: 'Rent vs Buy Calculator: Should You Rent or Buy?',
  metaDescription:
    'Should you rent or buy? Compare your net worth after renting vs buying, with every cost of owning, home price growth, invested savings and a break-even year.',
  primaryKeyword: 'rent vs buy calculator',
  secondaryKeywords: ['rent or buy calculator', 'renting vs buying a home calculator', 'should i rent or buy'],
  synonyms: ['rent', 'buy a house', 'homeownership', 'break even', 'renting'],
  inputs: [
    { id: 'years', label: 'How long you’ll stay', type: 'number', unit: 'years', min: 1, max: 30, step: 1, integer: true, sliderMax: 30 },
    { id: 'homePrice', label: 'Home price', type: 'number', unit: 'usd', min: 10_000, max: 20_000_000, step: 1000, sliderMin: 50_000, sliderMax: 1_500_000, group: 'buy1' },
    { id: 'downPct', label: 'Down payment', type: 'number', unit: 'percent', min: 0, max: 100, step: 1, sliderMax: 50, group: 'buy1' },
    { id: 'interestRate', label: 'Mortgage rate', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.01, sliderMax: 12, liveDefault: 'mortgage30' },
    { id: 'rent', label: 'Monthly rent', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 25, sliderMax: 8_000, helpText: 'For a comparable home.', group: 'rent' },
    { id: 'rentIncrease', label: 'Rent increase per year', type: 'number', unit: 'percent', min: 0, max: 20, step: 0.1, sliderMax: 10, group: 'rent' },
    { id: 'appreciation', label: 'Home price growth per year', type: 'number', unit: 'percent', min: -10, max: 20, step: 0.1, sliderMin: -2, sliderMax: 8, group: 'growth' },
    { id: 'investReturn', label: 'Investment return', type: 'number', unit: 'percent', min: -10, max: 20, step: 0.1, sliderMin: 0, sliderMax: 10, group: 'growth', helpText: 'What money not tied up in the home would earn.' },
    { id: 'termYears', label: 'Loan term', type: 'select', advanced: true, group: 'a1', options: [{ value: '30', label: '30 years' }, { value: '15', label: '15 years' }] },
    { id: 'propertyTaxRate', label: 'Property tax', type: 'number', unit: 'percent', min: 0, max: 5, step: 0.01, sliderMax: 3, advanced: true, group: 'a1' },
    { id: 'homeInsurance', label: 'Home insurance per year', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 50, sliderMax: 8_000, advanced: true, group: 'a2' },
    { id: 'maintenancePct', label: 'Maintenance per year', type: 'number', unit: 'percent', min: 0, max: 10, step: 0.1, sliderMax: 4, advanced: true, group: 'a2', helpText: '% of home value.' },
    { id: 'hoa', label: 'HOA dues per month', type: 'number', unit: 'usd', min: 0, max: 10_000, step: 10, sliderMax: 1_000, advanced: true, group: 'a3' },
    { id: 'rentersInsurance', label: 'Renters insurance per year', type: 'number', unit: 'usd', min: 0, max: 10_000, step: 10, sliderMax: 1_000, advanced: true, group: 'a3' },
    { id: 'buyClosingPct', label: 'Buying closing costs', type: 'number', unit: 'percent', min: 0, max: 10, step: 0.1, sliderMax: 6, advanced: true, group: 'a4' },
    { id: 'sellClosingPct', label: 'Selling costs', type: 'number', unit: 'percent', min: 0, max: 15, step: 0.1, sliderMax: 10, advanced: true, group: 'a4', helpText: 'Agent commissions, transfer taxes and fees.' },
  ],
  defaults: {
    years: 10,
    homePrice: 375_000,
    downPct: 20,
    interestRate: 6.5,
    termYears: 30,
    propertyTaxRate: 0.9,
    homeInsurance: 2_000,
    maintenancePct: 1,
    hoa: 0,
    appreciation: 3.5,
    buyClosingPct: 3,
    sellClosingPct: 6,
    rent: 2_100,
    rentIncrease: 3.5,
    rentersInsurance: 180,
    investReturn: 6,
  },
  compute: computeRentBuy,
  summarize: (i, o) => ({
    headline: {
      label: o.advantage >= 0 ? `Buying comes out ahead after ${i.years} years by` : `Renting comes out ahead after ${i.years} years by`,
      value: usd(Math.abs(o.advantage)),
      sub: o.breakEvenYear ? `Buying breaks even in year ${o.breakEvenYear}` : `Buying doesn’t break even within ${i.years} years`,
      raw: o.advantage,
      better: 'higher',
    },
    items: [
      { label: 'Net worth if you buy', value: usd(o.buyerNetWorth), raw: o.buyerNetWorth, better: 'higher' },
      { label: 'Net worth if you rent', value: usd(o.renterNetWorth), raw: o.renterNetWorth, better: 'higher' },
      { label: 'Owning costs, month 1', value: usd(o.firstMonthBuy), raw: o.firstMonthBuy, better: 'lower' },
      { label: 'Renting costs, month 1', value: usd(o.firstMonthRent), raw: o.firstMonthRent, better: 'lower' },
      { label: 'Cash needed to buy', value: usd(o.upfront), raw: o.upfront },
      { label: `Home value in ${i.years} years`, value: usd(o.homeValueEnd), raw: o.homeValueEnd },
    ],
  }),
  explain: (i, o) => {
    const s = [
      `Buying costs ${usd(o.firstMonthBuy)} in the first month (mortgage, tax, insurance and upkeep) versus ${usd(o.firstMonthRent)} to rent, and needs ${usd(o.upfront)} upfront.`,
      `After ${i.years} years, selling the home (worth about ${usd(o.homeValueEnd)}) and repaying the ${usd(o.loanBalanceEnd)} loan leaves the buyer with ${usd(o.buyerNetWorth)}; the renter, who invested the upfront cash and the monthly savings, has ${usd(o.renterNetWorth)}.`,
    ];
    s.push(
      o.breakEvenYear
        ? `Buying pulls ahead from year ${o.breakEvenYear}: the longer you stay, the more the buying and selling costs are spread out.`
        : `Within ${i.years} years, buying and selling costs aren’t recovered. Staying longer, faster price growth or lower rates would change that.`,
    );
    return s;
  },
  steps: (i, o) => [
    { label: 'Cash to buy', formula: 'down payment + closing costs', substituted: `${usd(i.homePrice)} × (${pct(i.downPct, 0)} + ${pct(i.buyClosingPct)})`, result: usd(o.upfront) },
    { label: 'Each month', formula: 'buyer pays mortgage + tax + insurance + maintenance + HOA; renter pays rent + insurance; the cheaper side invests the difference', substituted: `month 1: ${usd(o.firstMonthBuy)} vs ${usd(o.firstMonthRent)}` },
    { label: 'Buyer’s net worth', formula: 'home value × (1 − selling costs) − loan balance + buyer’s investments', substituted: `${usd(o.homeValueEnd)} × (1 − ${pct(i.sellClosingPct)}) − ${usd(o.loanBalanceEnd)} + investments`, result: usd(o.buyerNetWorth) },
    { label: 'Renter’s net worth', formula: 'invested upfront cash + invested monthly savings, grown at the investment return', substituted: `${usd(o.upfront)} invested at ${pct(i.investReturn)} plus monthly differences`, result: usd(o.renterNetWorth) },
  ],
  answerSummary: (i, o) =>
    `Over ${i.years} years, buying a ${usd(i.homePrice)} home with ${pct(i.downPct, 0)} down instead of renting at ${usd(i.rent)} a month leaves you ${usd(Math.abs(o.advantage))} ${o.advantage >= 0 ? 'better' : 'worse'} off${o.breakEvenYear ? `, breaking even in year ${o.breakEvenYear}` : ''}.`,
  ogValue: (_i, o) => `${o.advantage >= 0 ? 'Buy' : 'Rent'} +${usd(Math.abs(o.advantage))}`,
  related: ['mortgage-calculator', 'mortgage-affordability-calculator', 'investment-calculator', 'savings-goal-calculator'],
  sources: [
    { title: 'CFPB: Buying a house', url: 'https://www.consumerfinance.gov/owning-a-home/' },
    { title: 'Freddie Mac Primary Mortgage Market Survey (via FRED, MORTGAGE30US)', url: 'https://fred.stlouisfed.org/series/MORTGAGE30US' },
    { title: 'FHFA House Price Index', url: 'https://www.fhfa.gov/data/hpi' },
    { title: 'BLS CPI: Rent of primary residence', url: 'https://www.bls.gov/cpi/factsheets/owners-equivalent-rent-and-rent.htm' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
