import type { CalculatorConfig } from '../../lib/types.ts';
import { num, usd } from '../../lib/format.ts';
import { computeSalary, type PayPeriod, type SalaryInput, type SalaryOutput } from './math.ts';

const PERIOD_LABEL: Record<PayPeriod, string> = {
  hour: 'an hour',
  day: 'a day',
  week: 'a week',
  biweek: 'every two weeks',
  semimonth: 'twice a month',
  month: 'a month',
  year: 'a year',
};

const config: CalculatorConfig<SalaryInput, SalaryOutput> = {
  slug: 'salary-to-hourly-calculator',
  category: 'finance',
  subtopic: 'Income',
  name: 'Salary to Hourly Calculator',
  h1: 'Salary to Hourly Calculator',
  intro: 'Convert an annual salary to an hourly wage, or an hourly wage to a salary, and see your pay for every pay period.',
  metaTitle: 'Salary to Hourly Calculator (and Hourly to Salary)',
  metaDescription:
    'Convert salary to hourly pay or hourly pay to an annual salary in both directions, with weekly, biweekly, monthly and yearly amounts and your real hourly rate.',
  primaryKeyword: 'salary to hourly calculator',
  secondaryKeywords: ['hourly to salary calculator', 'annual salary to hourly', 'hourly wage to annual salary', 'salary converter'],
  synonyms: ['hourly rate', 'wage converter', 'yearly salary', 'how much per hour', '2080 hours'],
  inputs: [
    { id: 'amount', label: 'Pay', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 0.01, sliderMax: 250_000, group: 'pay' },
    {
      id: 'period',
      label: 'Paid',
      type: 'select',
      group: 'pay',
      options: [
        { value: 'hour', label: 'per hour' },
        { value: 'day', label: 'per day' },
        { value: 'week', label: 'per week' },
        { value: 'biweek', label: 'every two weeks' },
        { value: 'semimonth', label: 'twice a month' },
        { value: 'month', label: 'per month' },
        { value: 'year', label: 'per year' },
      ],
    },
    { id: 'hoursPerWeek', label: 'Hours per week', type: 'number', unit: 'hours', min: 0, max: 168, step: 0.5, sliderMax: 80, group: 'time' },
    { id: 'daysPerWeek', label: 'Days per week', type: 'number', unit: 'days', min: 1, max: 7, step: 0.5, slider: false, group: 'time' },
    { id: 'weeksPerYear', label: 'Paid weeks per year', type: 'number', unit: 'count', min: 1, max: 52, step: 1, integer: true, sliderMin: 1, advanced: true, helpText: '52 for a salaried job. Lower it if you’re paid hourly and take unpaid weeks off.' },
    { id: 'ptoDays', label: 'Paid days off a year', type: 'number', unit: 'days', min: 0, max: 200, step: 1, integer: true, sliderMax: 60, advanced: true, helpText: 'Paid holidays and vacation. Used to show what you earn per hour actually worked.' },
  ],
  defaults: { amount: 75_000, period: 'year', hoursPerWeek: 40, daysPerWeek: 5, weeksPerYear: 52, ptoDays: 0 },
  compute: computeSalary,
  summarize: (i, o) => {
    const toSalary = i.period === 'hour';
    const items = [
      toSalary ? { label: 'Hourly', value: usd(o.hourly, true), raw: o.hourly, better: 'higher' as const } : { label: 'Annual salary', value: usd(o.annual, true), raw: o.annual, better: 'higher' as const },
      { label: 'Monthly', value: usd(o.monthly, true), raw: o.monthly, better: 'higher' as const },
      { label: 'Every two weeks', value: usd(o.biweekly, true), raw: o.biweekly, better: 'higher' as const },
      { label: 'Weekly', value: usd(o.weekly, true), raw: o.weekly, better: 'higher' as const },
    ];
    if (i.ptoDays > 0) items.push({ label: 'Per hour actually worked', value: usd(o.effectiveHourly, true), raw: o.effectiveHourly, better: 'higher' });
    return {
      headline: toSalary
        ? { label: 'Annual salary', value: usd(o.annual, true), sub: `at ${num(i.hoursPerWeek, 1)} hours a week`, raw: o.annual, better: 'higher' }
        : { label: 'Hourly wage', value: usd(o.hourly, true), sub: `at ${num(i.hoursPerWeek, 1)} hours a week`, raw: o.hourly, better: 'higher' },
      items,
    };
  },
  explain: (i, o) => {
    if (o.annual <= 0) return ['Enter your pay to see it in every pay period.'];
    const s = [
      `${usd(i.amount, true)} ${PERIOD_LABEL[i.period]} at ${num(i.hoursPerWeek, 1)} hours a week for ${i.weeksPerYear} weeks is ${usd(o.annual)} a year, or ${usd(o.hourly, true)} for each of the ${num(o.hoursPerYear, 0)} paid hours.`,
    ];
    if (i.ptoDays > 0) s.push(`Because ${i.ptoDays} of those days are paid time off, you earn ${usd(o.effectiveHourly, true)} for every hour you actually work.`);
    s.push('These are gross amounts, before taxes and deductions. Your paycheck will be smaller; the paycheck calculator shows your take-home pay.');
    return s;
  },
  steps: (i, o) => [
    {
      label: 'Annual pay',
      formula:
        i.period === 'hour'
          ? 'hourly rate × hours per week × weeks'
          : i.period === 'day'
            ? 'daily rate × days per week × weeks'
            : i.period === 'week'
              ? 'weekly pay × weeks'
              : i.period === 'biweek'
                ? 'biweekly pay × weeks ÷ 2'
                : i.period === 'semimonth'
                  ? 'semimonthly pay × 24'
                  : i.period === 'month'
                    ? 'monthly pay × 12'
                    : 'annual salary',
      substituted:
        i.period === 'hour'
          ? `${usd(i.amount, true)} × ${num(i.hoursPerWeek, 1)} × ${i.weeksPerYear}`
          : i.period === 'day'
            ? `${usd(i.amount, true)} × ${num(i.daysPerWeek, 1)} × ${i.weeksPerYear}`
            : i.period === 'week'
              ? `${usd(i.amount, true)} × ${i.weeksPerYear}`
              : i.period === 'biweek'
                ? `${usd(i.amount, true)} × ${i.weeksPerYear} ÷ 2`
                : i.period === 'semimonth'
                  ? `${usd(i.amount, true)} × 24`
                  : i.period === 'month'
                    ? `${usd(i.amount, true)} × 12`
                    : usd(i.amount, true),
      result: usd(o.annual, true),
    },
    { label: 'Paid hours per year', formula: 'hours per week × weeks', substituted: `${num(i.hoursPerWeek, 1)} × ${i.weeksPerYear}`, result: num(o.hoursPerYear, 0) },
    { label: 'Hourly rate', formula: 'annual pay ÷ paid hours', substituted: `${usd(o.annual, true)} ÷ ${num(o.hoursPerYear, 0)}`, result: usd(o.hourly, true) },
    { label: 'Monthly pay', formula: 'annual pay ÷ 12', substituted: `${usd(o.annual, true)} ÷ 12`, result: usd(o.monthly, true) },
  ],
  answerSummary: (i, o) =>
    i.period === 'hour'
      ? `${usd(i.amount, true)} an hour at ${num(i.hoursPerWeek, 1)} hours a week is ${usd(o.annual)} a year, ${usd(o.monthly, true)} a month or ${usd(o.biweekly, true)} every two weeks, before tax.`
      : `${usd(i.amount, true)} ${PERIOD_LABEL[i.period]} is ${usd(o.hourly, true)} an hour at ${num(i.hoursPerWeek, 1)} hours a week, or ${usd(o.monthly, true)} a month, before tax.`,
  ogValue: (i, o) => (i.period === 'hour' ? `${usd(o.annual)}/yr` : `${usd(o.hourly, true)}/hr`),
  related: ['paycheck-calculator', 'pay-raise-calculator', 'savings-goal-calculator', 'debt-to-income-ratio-calculator', 'retirement-calculator'],
  sources: [
    { title: 'U.S. Office of Personnel Management: computing hourly rates of pay using the 2,087-hour divisor', url: 'https://www.opm.gov/policy-data-oversight/pay-leave/pay-administration/fact-sheets/computing-hourly-rates-of-pay-using-the-2087-hour-divisor/' },
    { title: 'U.S. Department of Labor: Fair Labor Standards Act, hours worked and overtime', url: 'https://www.dol.gov/agencies/whd/flsa' },
    { title: 'Bureau of Labor Statistics: average hourly earnings (Current Employment Statistics)', url: 'https://www.bls.gov/ces/' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
