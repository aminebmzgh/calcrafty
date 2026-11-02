import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeNetWorth, type NetWorthInput, type NetWorthOutput } from './math.ts';

const signed = (n: number) => `${n < 0 ? '−' : ''}${usd(Math.abs(n))}`;

const config: CalculatorConfig<NetWorthInput, NetWorthOutput> = {
  slug: 'net-worth-calculator',
  category: 'finance',
  subtopic: 'Saving and investing',
  name: 'Net Worth Calculator',
  h1: 'Net Worth Calculator',
  intro: 'Add up what you own and what you owe to find your net worth, and see how it compares with the median for your age.',
  metaTitle: 'Net Worth Calculator: Assets, Debts & Age Median',
  metaDescription:
    'Calculate your net worth from your assets and debts, see your home equity and liquid net worth, and compare it with the Federal Reserve median for your age.',
  primaryKeyword: 'net worth calculator',
  secondaryKeywords: ['calculate net worth', 'personal net worth calculator', 'net worth by age calculator', 'household net worth'],
  synonyms: ['assets minus liabilities', 'wealth', 'balance sheet', 'how much am i worth', 'financial snapshot'],
  inputs: [
    { id: 'cash', label: 'Cash and savings', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 100, sliderMax: 100_000, group: 'a1' },
    { id: 'investments', label: 'Taxable investments', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 1_000, sliderMax: 500_000, group: 'a1' },
    { id: 'retirement', label: 'Retirement accounts', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 1_000, sliderMax: 1_000_000, group: 'a2', helpText: '401(k), IRA, HSA.' },
    { id: 'homeValue', label: 'Home value', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 1_000, sliderMax: 1_500_000, group: 'a2' },
    { id: 'vehicles', label: 'Vehicles', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 500, sliderMax: 100_000, group: 'a3' },
    { id: 'otherAssets', label: 'Other assets', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 500, sliderMax: 200_000, group: 'a3' },
    { id: 'mortgage', label: 'Mortgage balance', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 1_000, sliderMax: 1_000_000, group: 'l1' },
    { id: 'carLoans', label: 'Car loans', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 500, sliderMax: 100_000, group: 'l1' },
    { id: 'studentLoans', label: 'Student loans', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 500, sliderMax: 200_000, group: 'l2' },
    { id: 'creditCards', label: 'Credit cards', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 100, sliderMax: 50_000, group: 'l2' },
    { id: 'otherDebts', label: 'Other debts', type: 'number', unit: 'usd', min: 0, max: 1_000_000_000, step: 500, sliderMax: 200_000 },
    { id: 'age', label: 'Your age', type: 'number', unit: 'years', min: 16, max: 110, step: 1, integer: true, slider: false, helpText: 'Used only to compare with the median for your age group.' },
  ],
  defaults: { cash: 12_000, investments: 25_000, retirement: 85_000, homeValue: 380_000, vehicles: 18_000, otherAssets: 5_000, mortgage: 290_000, carLoans: 14_000, studentLoans: 22_000, creditCards: 3_500, otherDebts: 0, age: 38 },
  compute: computeNetWorth,
  summarize: (_i, o) => ({
    headline: { label: 'Net worth', value: signed(o.netWorth), sub: `${usd(o.totalAssets)} in assets − ${usd(o.totalLiabilities)} in debts`, raw: o.netWorth, better: 'higher' },
    items: [
      { label: `Median for ages ${o.ageGroup}`, value: `${usd(o.ageMedian)} (you: ${o.vsMedian >= 0 ? '+' : '−'}${usd(Math.abs(o.vsMedian))})`, raw: o.vsMedian, better: 'higher' },
      { label: 'Liquid net worth', value: signed(o.liquidNetWorth), raw: o.liquidNetWorth, better: 'higher' },
      { label: 'Home equity', value: signed(o.homeEquity), raw: o.homeEquity, better: 'higher' },
      { label: 'Debt-to-asset ratio', value: pct(o.debtToAsset, 1), raw: o.debtToAsset, better: 'lower' },
    ],
  }),
  explain: (_i, o) => {
    const s = [
      o.netWorth >= 0
        ? `You own ${usd(o.totalAssets)} and owe ${usd(o.totalLiabilities)}, so your net worth is ${usd(o.netWorth)}.`
        : `You owe ${usd(o.totalLiabilities)}, more than the ${usd(o.totalAssets)} you own, so your net worth is ${signed(o.netWorth)}. That's common early in a career, especially with student loans, and it improves as debts fall and savings grow.`,
    ];
    s.push(`The median household net worth for ages ${o.ageGroup} was about ${usd(o.ageMedian)} in the Federal Reserve's 2022 survey; you're ${o.vsMedian >= 0 ? `${usd(o.vsMedian)} above` : `${usd(-o.vsMedian)} below`} it.`);
    s.push(`Your liquid net worth, money you could reach quickly minus consumer debt, is ${signed(o.liquidNetWorth)}. Much of most households' wealth is tied up in a home and retirement accounts.`);
    return s;
  },
  steps: (i, o) => [
    { label: 'Total assets', formula: 'cash + investments + retirement + home + vehicles + other', substituted: `${usd(i.cash)} + ${usd(i.investments)} + ${usd(i.retirement)} + ${usd(i.homeValue)} + ${usd(i.vehicles)} + ${usd(i.otherAssets)}`, result: usd(o.totalAssets) },
    { label: 'Total debts', formula: 'mortgage + car + student + cards + other', substituted: `${usd(i.mortgage)} + ${usd(i.carLoans)} + ${usd(i.studentLoans)} + ${usd(i.creditCards)} + ${usd(i.otherDebts)}`, result: usd(o.totalLiabilities) },
    { label: 'Net worth', formula: 'assets − debts', substituted: `${usd(o.totalAssets)} − ${usd(o.totalLiabilities)}`, result: signed(o.netWorth) },
    { label: 'Debt-to-asset ratio', formula: 'debts ÷ assets × 100', substituted: `${usd(o.totalLiabilities)} ÷ ${usd(o.totalAssets)} × 100`, result: pct(o.debtToAsset, 1) },
  ],
  answerSummary: (_i, o) => `With ${usd(o.totalAssets)} in assets and ${usd(o.totalLiabilities)} in debts, your net worth is ${signed(o.netWorth)}, compared with a median of about ${usd(o.ageMedian)} for ages ${o.ageGroup}.`,
  ogValue: (_i, o) => signed(o.netWorth),
  related: ['retirement-calculator', 'debt-payoff-calculator', '401k-calculator', 'investment-calculator', 'emergency-fund-calculator'],
  sources: [
    { title: 'Federal Reserve: Survey of Consumer Finances, 2022', url: 'https://www.federalreserve.gov/econres/scfindex.htm' },
    { title: 'Federal Reserve Bulletin: Changes in U.S. Family Finances from 2019 to 2022', url: 'https://www.federalreserve.gov/publications/files/scf23.pdf' },
    { title: 'CFPB: Your Money, Your Goals toolkit (tracking assets and debts)', url: 'https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
