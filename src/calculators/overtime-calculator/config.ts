import type { CalculatorConfig } from '../../lib/types.ts';
import { num, usd } from '../../lib/format.ts';
import { computeOvertime, type OvertimeInput, type OvertimeOutput } from './math.ts';

const config: CalculatorConfig<OvertimeInput, OvertimeOutput> = {
  slug: 'overtime-calculator',
  category: 'finance',
  subtopic: 'Income',
  name: 'Overtime Calculator',
  h1: 'Overtime Calculator',
  intro: 'Your weekly pay with time and a half, under the federal 40-hour rule or California’s daily overtime and double time.',
  metaTitle: 'Overtime Calculator: Time and a Half Pay (FLSA & CA)',
  metaDescription:
    'Calculate overtime pay at time and a half for hours over 40 a week, or under California’s daily overtime and double-time rules, with weekly and yearly totals.',
  primaryKeyword: 'overtime calculator',
  secondaryKeywords: ['time and a half calculator', 'overtime pay calculator', 'california overtime calculator', 'double time calculator'],
  synonyms: ['time and a half', 'ot pay', 'double time', 'flsa overtime', 'hours over 40'],
  inputs: [
    { id: 'rate', label: 'Hourly rate', type: 'number', unit: 'usd', min: 0, max: 10_000, step: 0.25, sliderMin: 7, sliderMax: 100 },
    {
      id: 'rule',
      label: 'Overtime rule',
      type: 'segmented',
      options: [
        { value: 'federal', label: 'Federal (40 hours a week)' },
        { value: 'california', label: 'California (daily)' },
      ],
    },
    { id: 'weekHours', label: 'Hours worked this week', type: 'number', unit: 'hours', min: 0, max: 168, step: 0.25, sliderMax: 80, showIf: (i) => i.rule === 'federal' },
    { id: 'dayHours', label: 'Hours per day', type: 'number', unit: 'hours', min: 0, max: 24, step: 0.25, sliderMax: 16, group: 'ca', showIf: (i) => i.rule === 'california' },
    { id: 'days', label: 'Days worked this week', type: 'number', unit: 'days', min: 0, max: 7, step: 1, integer: true, slider: false, group: 'ca', showIf: (i) => i.rule === 'california', helpText: '7 means seven consecutive days.' },
    { id: 'multiplier', label: 'Overtime multiplier', type: 'number', unit: 'none', min: 1, max: 3, step: 0.1, slider: false, advanced: true, helpText: '1.5 is the legal minimum; some contracts pay more.' },
  ],
  defaults: { rate: 25, rule: 'federal', weekHours: 50, dayHours: 10, days: 5, multiplier: 1.5 },
  compute: computeOvertime,
  summarize: (i, o) => ({
    headline: { label: 'Weekly pay', value: usd(o.weeklyPay, true), sub: `${num(o.totalHours, 2)} hours, ${num(o.premiumHours, 2)} of them at a premium`, raw: o.weeklyPay, better: 'higher' },
    items: [
      { label: `Regular (${num(o.regularHours, 2)} h × ${usd(i.rate, true)})`, value: usd(o.regularPay, true), raw: o.regularPay },
      { label: `Overtime (${num(o.overtimeHours, 2)} h × ${num(i.multiplier, 1)})`, value: usd(o.overtimePay, true), raw: o.overtimePay },
      ...(i.rule === 'california' ? [{ label: `Double time (${num(o.doubleHours, 2)} h × 2)`, value: usd(o.doublePay, true), raw: o.doublePay }] : []),
      { label: 'Yearly at this schedule', value: usd(o.annualPay), raw: o.annualPay, better: 'higher' as const },
      { label: 'Average per hour worked', value: usd(o.averageRate, true), raw: o.averageRate, better: 'higher' as const },
    ],
  }),
  explain: (i, o) => {
    const s = [
      o.premiumHours > 0
        ? `You worked ${num(o.totalHours, 2)} hours: ${num(o.regularHours, 2)} at ${usd(i.rate, true)} and ${num(o.overtimeHours, 2)} at time and a half${o.doubleHours > 0 ? `, plus ${num(o.doubleHours, 2)} at double time` : ''}, for ${usd(o.weeklyPay, true)} before tax.`
        : `All ${num(o.totalHours, 2)} hours are regular time, so you earn ${usd(o.weeklyPay, true)} before tax with no overtime.`,
    ];
    if (i.rule === 'federal') s.push('Federal law requires overtime only for non-exempt employees, for hours over 40 in a workweek. Some states, such as California, also count daily overtime; switch the rule to check.');
    else s.push('California counts overtime after 8 hours in a day and 40 in a week, double time after 12 hours in a day, and special rules on the seventh consecutive day. Hours are never counted twice.');
    s.push('Overtime is taxed like the rest of your pay. Employers often withhold more on large paychecks, but your actual tax is settled when you file.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Regular pay', formula: 'regular hours × rate', substituted: `${num(o.regularHours, 2)} × ${usd(i.rate, true)}`, result: usd(o.regularPay, true) },
    { label: 'Overtime pay', formula: 'overtime hours × rate × 1.5', substituted: `${num(o.overtimeHours, 2)} × ${usd(i.rate, true)} × ${num(i.multiplier, 1)}`, result: usd(o.overtimePay, true) },
    ...(i.rule === 'california' ? [{ label: 'Double-time pay', formula: 'double-time hours × rate × 2', substituted: `${num(o.doubleHours, 2)} × ${usd(i.rate, true)} × 2`, result: usd(o.doublePay, true) }] : []),
    { label: 'Weekly pay', formula: 'regular + overtime + double time', substituted: `${usd(o.regularPay, true)} + ${usd(o.overtimePay, true)} + ${usd(o.doublePay, true)}`, result: usd(o.weeklyPay, true) },
  ],
  answerSummary: (i, o) => `At ${usd(i.rate, true)} an hour, ${num(o.totalHours, 2)} hours this week with ${num(o.overtimeHours, 2)} hours of overtime pays ${usd(o.weeklyPay, true)} before tax.`,
  ogValue: (_i, o) => `${usd(o.weeklyPay)}/wk`,
  related: ['time-card-calculator', 'salary-to-hourly-calculator', 'paycheck-calculator', 'pay-raise-calculator', 'savings-goal-calculator'],
  sources: [
    { title: 'U.S. Department of Labor: Overtime pay under the Fair Labor Standards Act', url: 'https://www.dol.gov/agencies/whd/overtime' },
    { title: 'California Labor Code § 510 (daily overtime and double time)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=LAB&sectionNum=510' },
    { title: 'California Department of Industrial Relations: Overtime FAQ', url: 'https://www.dir.ca.gov/dlse/faq_overtime.htm' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
