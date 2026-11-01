import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { TAX_2026_SOURCES, STANDARD_DEDUCTION_2026, TAX_YEAR } from '../../data/static/tax-2026.ts';
import { computePaycheck, type PaycheckInput, type PaycheckOutput } from './math.ts';
import { getState, STATES } from '../../data/static/states.ts';

const FREQ_LABEL = { weekly: 'weekly', biweekly: 'every two weeks', semimonthly: 'twice a month', monthly: 'monthly' } as const;
const STATUS_LABEL = { single: 'single', mfj: 'married filing jointly', hoh: 'head of household' } as const;

const config: CalculatorConfig<PaycheckInput, PaycheckOutput> = {
  slug: 'paycheck-calculator',
  category: 'finance',
  subtopic: 'Income',
  name: 'Paycheck Calculator',
  h1: 'Paycheck Calculator',
  intro: `Your take-home pay after ${TAX_YEAR} federal tax, Social Security, Medicare, state tax and 401(k), from a salary or hourly wage.`,
  metaTitle: `Paycheck Calculator ${TAX_YEAR}: Take-Home Pay | Calcrafty`,
  metaDescription: `Free ${TAX_YEAR} paycheck calculator: see take-home pay after federal tax, Social Security, Medicare, state tax and 401(k). Salary or hourly, any pay frequency.`,
  primaryKeyword: 'paycheck calculator',
  secondaryKeywords: ['salary calculator', 'take home pay calculator', 'hourly to salary calculator', 'salary paycheck calculator'],
  synonyms: ['net pay', 'take-home', 'withholding', 'salary', 'wage', 'hourly', 'gross to net', 'income tax'],
  inputs: [
    {
      id: 'payType',
      label: 'Pay type',
      type: 'segmented',
      options: [
        { value: 'salary', label: 'Salary' },
        { value: 'hourly', label: 'Hourly' },
      ],
    },
    { id: 'salary', label: 'Annual salary', type: 'number', unit: 'usd', min: 0, max: 10_000_000, step: 500, sliderMax: 300_000, showIf: (i) => i.payType === 'salary' },
    { id: 'hourlyRate', label: 'Hourly wage', type: 'number', unit: 'usd', min: 0, max: 5_000, step: 0.25, sliderMax: 150, showIf: (i) => i.payType === 'hourly', group: 'hourly' },
    { id: 'hoursPerWeek', label: 'Hours per week', type: 'number', unit: 'hours', min: 0, max: 100, step: 0.5, sliderMax: 80, showIf: (i) => i.payType === 'hourly', group: 'hourly' },
    {
      id: 'payFrequency',
      label: 'Paid',
      type: 'select',
      group: 'status',
      options: [
        { value: 'weekly', label: 'Weekly (52)' },
        { value: 'biweekly', label: 'Every two weeks (26)' },
        { value: 'semimonthly', label: 'Twice a month (24)' },
        { value: 'monthly', label: 'Monthly (12)' },
      ],
    },
    {
      id: 'filingStatus',
      label: 'Filing status',
      type: 'select',
      group: 'status',
      options: [
        { value: 'single', label: 'Single' },
        { value: 'mfj', label: 'Married filing jointly' },
        { value: 'hoh', label: 'Head of household' },
      ],
    },
    { id: 'retirementPct', label: '401(k) contribution', type: 'number', unit: 'percent', min: 0, max: 100, step: 1, sliderMax: 30, helpText: 'Traditional (pre-tax) 401(k) or 403(b), % of gross pay. Capped at the 2026 limit of $24,500.' },
    {
      id: 'state',
      label: 'State',
      type: 'select',
      options: [{ value: '', label: 'Other state (enter a rate)' }, ...STATES.map((st) => ({ value: st.slug, label: st.name }))],
      helpText: 'Listed states use their 2026 brackets, deductions and payroll taxes.',
    },
    { id: 'stateRate', label: 'State income tax rate', type: 'number', unit: 'percent', min: 0, max: 15, step: 0.1, sliderMax: 10, showIf: (i) => i.state === '', helpText: 'Your effective state rate. Use 0 for states with no income tax.' },
    { id: 'localRate', label: 'City or county income tax', type: 'number', unit: 'percent', min: 0, max: 10, step: 0.01, sliderMax: 5, advanced: true, helpText: 'For example NYC, Philadelphia, Detroit or Ohio cities. Leave at 0 if none.' },
    { id: 'preTaxAnnual', label: 'Pre-tax benefits per year', type: 'number', unit: 'usd', min: 0, max: 100_000, step: 100, sliderMax: 20_000, advanced: true, helpText: 'Health, dental and vision premiums, HSA and FSA through payroll (section 125). These lower income tax and FICA.' },
  ],
  defaults: {
    payType: 'salary',
    salary: 75_000,
    hourlyRate: 25,
    hoursPerWeek: 40,
    payFrequency: 'biweekly',
    filingStatus: 'single',
    retirementPct: 5,
    preTaxAnnual: 0,
    state: '',
    stateRate: 0,
    localRate: 0,
  },
  compute: (i) => computePaycheck(i),
  summarize: (i, o) => ({
    headline: { label: `Take-home pay per paycheck`, value: usd(o.netPerPeriod, true), sub: `${usd(o.netAnnual)} a year, paid ${FREQ_LABEL[i.payFrequency]}`, raw: o.netPerPeriod, better: 'higher' },
    items: [
      { label: 'Gross per paycheck', value: usd(o.grossPerPeriod, true), raw: o.grossPerPeriod, better: 'higher' },
      { label: 'Federal income tax', value: usd(o.perPeriod.federal, true), raw: o.perPeriod.federal, better: 'lower' },
      { label: 'Social Security', value: usd(o.perPeriod.socialSecurity, true), raw: o.perPeriod.socialSecurity, better: 'lower' },
      { label: 'Medicare', value: usd(o.perPeriod.medicare, true), raw: o.perPeriod.medicare, better: 'lower' },
      { label: 'State tax', value: usd(o.perPeriod.stateAndLocal, true), raw: o.perPeriod.stateAndLocal, better: 'lower' },
      { label: '401(k)', value: usd(o.perPeriod.retirement, true), raw: o.perPeriod.retirement },
      { label: 'Annual salary', value: usd(o.grossAnnual), raw: o.grossAnnual },
      { label: 'Hourly equivalent', value: `${usd(o.hourlyEquivalent, true)}/hr`, raw: o.hourlyEquivalent },
      { label: 'Effective tax rate', value: pct(o.effectiveRate, 1), raw: o.effectiveRate, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (o.grossAnnual <= 0) return ['Enter a salary or hourly wage to see your take-home pay.'];
    const s = [
      `Out of ${usd(o.grossAnnual)} in gross pay, you keep ${usd(o.netAnnual)} a year (${usd(o.netPerPeriod, true)} per paycheck) after taxes and deductions.`,
      `Your federal taxable income is ${usd(o.federalTaxable)} after the ${usd(STANDARD_DEDUCTION_2026[i.filingStatus])} standard deduction${o.retirementAnnual + o.preTaxAnnual > 0 ? ' and pre-tax contributions' : ''}, which puts you in the ${pct(o.marginalRate * 100, 0)} bracket. Only income above that bracket's threshold is taxed at ${pct(o.marginalRate * 100, 0)}.`,
      `Social Security and Medicare take ${usd(o.fica)} a year: 7.65% of wages (6.2% + 1.45%).`,
    ];
    if (o.retirementAnnual > 0) s.push(`Your ${usd(o.retirementAnnual)} 401(k) contribution goes into your retirement account, not to the IRS, and lowers this year’s federal income tax.`);
    return s.slice(0, 4);
  },
  steps: (i, o) => [
    { label: 'Annual gross pay', formula: i.payType === 'hourly' ? 'hourly wage × hours per week × 52' : 'annual salary', substituted: i.payType === 'hourly' ? `${usd(i.hourlyRate, true)} × ${i.hoursPerWeek} × 52` : usd(i.salary), result: usd(o.grossAnnual) },
    {
      label: 'Federal taxable income',
      formula: 'gross − 401(k) − pre-tax benefits − standard deduction',
      substituted: `${usd(o.grossAnnual)} − ${usd(o.retirementAnnual)} − ${usd(o.preTaxAnnual)} − ${usd(STANDARD_DEDUCTION_2026[i.filingStatus])}`,
      result: usd(o.federalTaxable),
    },
    {
      label: `Federal income tax (${TAX_YEAR} ${STATUS_LABEL[i.filingStatus]} brackets)`,
      formula: 'each slice of income × its bracket rate',
      substituted: o.federalSlices.length ? o.federalSlices.map((sl) => `${usd(sl.amount)} × ${pct(sl.rate * 100, 0)}`).join(' + ') : '$0',
      result: usd(o.federalTax, true),
    },
    { label: 'Social Security and Medicare', formula: '6.2% up to $184,500 + 1.45% (+0.9% over $200,000)', substituted: `${usd(o.socialSecurity, true)} + ${usd(o.medicare, true)}`, result: usd(o.fica, true) },
    {
      label: 'Take-home pay per paycheck',
      formula: '(gross − taxes − 401(k) − pre-tax benefits) ÷ paychecks per year',
      substituted: `${usd(o.netAnnual)} ÷ ${o.periods}`,
      result: usd(o.netPerPeriod, true),
    },
  ],
  answerSummary: (i, o) =>
    `On a ${usd(o.grossAnnual)} salary, a ${STATUS_LABEL[i.filingStatus]} filer paid ${FREQ_LABEL[i.payFrequency]} takes home about ${usd(o.netPerPeriod, true)} per paycheck (${usd(o.netAnnual)} a year) in ${TAX_YEAR}${getState(i.state) ? ` in ${getState(i.state)!.name}, after state taxes` : ', before state income tax'}.`,
  ogValue: (_i, o) => `${usd(o.netPerPeriod)}/check`,
  related: ['mortgage-affordability-calculator', 'retirement-calculator', 'savings-goal-calculator', 'debt-payoff-calculator', 'mortgage-calculator'],
  statePages: { kind: 'paycheck' },
  sources: [...TAX_2026_SOURCES],
  lastReviewed: '2026-11-01',
};

export default config;
