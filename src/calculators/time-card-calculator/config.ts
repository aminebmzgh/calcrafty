import type { CalculatorConfig } from '../../lib/types.ts';
import { num, usd } from '../../lib/format.ts';
import { computeTimeCard, parseShift, type TimeCardInput, type TimeCardOutput } from './math.ts';

const SAMPLE = ['Mon 8:30am - 5:15pm 30', 'Tue 8:30am - 5:15pm 30', 'Wed 8:30am - 6:00pm 30', 'Thu 8:30am - 5:15pm 30', 'Fri 8:30am - 4:00pm 30'].join('\n');

const config: CalculatorConfig<TimeCardInput, TimeCardOutput> = {
  slug: 'time-card-calculator',
  category: 'everyday',
  subtopic: 'Dates and time',
  name: 'Time Card Calculator',
  h1: 'Time Card Calculator',
  intro: 'Total the hours on your time card from start and end times, minus breaks, with overtime and gross pay for the week.',
  metaTitle: 'Time Card Calculator: Hours Worked, Breaks & Pay',
  metaDescription:
    'Add up hours worked from clock-in and clock-out times, minus unpaid breaks, including overnight shifts. See decimal hours, overtime after 40 and weekly pay.',
  primaryKeyword: 'time card calculator',
  secondaryKeywords: ['timesheet calculator', 'hours worked calculator', 'work hours calculator', 'clock in clock out calculator'],
  synonyms: ['timesheet', 'hours calculator', 'punch clock', 'decimal hours', 'shift hours'],
  inputs: [
    {
      id: 'shifts',
      label: 'Your shifts, one per line',
      type: 'textarea',
      placeholder: 'Mon 8:30am - 5:15pm 30',
      maxLength: 4_000,
      helpText: 'Start - end, then unpaid break minutes. 12- or 24-hour times; overnight shifts are fine. Day names are optional.',
      e2eValue: 'Mon 9am - 5pm 30\nTue 9am - 6pm 60',
      validate: (s) => (s.split(/\r?\n/).some((l) => l.trim() && !parseShift(l)) ? 'One or more lines could not be read. Use a format like "8:30am - 5:15pm 30".' : null),
    },
    { id: 'rate', label: 'Hourly rate', type: 'number', unit: 'usd', min: 0, max: 10_000, step: 0.25, sliderMin: 7, sliderMax: 100 },
    { id: 'overtimeAfter', label: 'Overtime after (hours per week)', type: 'number', unit: 'hours', min: 0, max: 168, step: 1, slider: false, advanced: true, group: 'ot' },
    { id: 'multiplier', label: 'Overtime multiplier', type: 'number', unit: 'none', min: 1, max: 3, step: 0.1, slider: false, advanced: true, group: 'ot' },
  ],
  defaults: { shifts: SAMPLE, rate: 22, overtimeAfter: 40, multiplier: 1.5 },
  compute: computeTimeCard,
  summarize: (_i, o) => ({
    headline: { label: 'Total hours', value: `${o.clock} (${num(o.totalHours, 2)} h)`, sub: `${o.shifts.length} shift${o.shifts.length === 1 ? '' : 's'}`, raw: o.totalHours },
    items: [
      { label: 'Regular hours', value: num(o.regularHours, 2), raw: o.regularHours },
      { label: 'Overtime hours', value: num(o.overtimeHours, 2), raw: o.overtimeHours },
      { label: 'Gross pay', value: usd(o.totalPay, true), raw: o.totalPay, better: 'higher' },
      { label: 'of which overtime', value: usd(o.overtimePay, true), raw: o.overtimePay },
    ],
  }),
  explain: (i, o) => {
    if (o.shifts.length === 0) return ['Enter at least one shift, such as "9am - 5pm 30".'];
    const s = [`Your ${o.shifts.length} shift${o.shifts.length === 1 ? '' : 's'} add up to ${o.clock}, which is ${num(o.totalHours, 2)} hours in decimal form.`];
    s.push(
      o.overtimeHours > 0
        ? `That's ${num(o.overtimeHours, 2)} hours over ${num(i.overtimeAfter, 0)}, paid at ${num(i.multiplier, 1)} times your rate, for ${usd(o.totalPay, true)} before tax.`
        : `At ${usd(i.rate, true)} an hour that's ${usd(o.totalPay, true)} before tax, with no overtime.`,
    );
    if (o.invalid.length) s.push(`These lines couldn't be read and aren't counted: ${o.invalid.join('; ')}.`);
    return s;
  },
  steps: (i, o) => [
    { label: 'Minutes worked', formula: 'sum of (end − start − break) for each shift', substituted: `${o.shifts.length} shifts`, result: `${num(o.totalMinutes, 0)} minutes` },
    { label: 'Decimal hours', formula: 'minutes ÷ 60', substituted: `${num(o.totalMinutes, 0)} ÷ 60`, result: num(o.totalHours, 2) },
    { label: 'Regular pay', formula: 'regular hours × rate', substituted: `${num(o.regularHours, 2)} × ${usd(i.rate, true)}`, result: usd(o.regularPay, true) },
    { label: 'Overtime pay', formula: 'overtime hours × rate × multiplier', substituted: `${num(o.overtimeHours, 2)} × ${usd(i.rate, true)} × ${num(i.multiplier, 1)}`, result: usd(o.overtimePay, true) },
  ],
  answerSummary: (i, o) => `The sample week of ${o.shifts.length} shifts adds up to ${o.clock} (${num(o.totalHours, 2)} hours); at ${usd(i.rate, true)} an hour with overtime after ${num(i.overtimeAfter, 0)} hours, that's ${usd(o.totalPay, true)} before tax.`,
  ogValue: (_i, o) => `${o.clock} h`,
  related: ['overtime-calculator', 'salary-to-hourly-calculator', 'paycheck-calculator', 'days-between-dates-calculator', 'age-calculator'],
  sources: [
    { title: 'U.S. Department of Labor: Hours worked under the FLSA (fact sheet 22)', url: 'https://www.dol.gov/agencies/whd/fact-sheets/22-flsa-hours-worked' },
    { title: 'U.S. Department of Labor: Breaks and meal periods', url: 'https://www.dol.gov/general/topic/workhours/breaks' },
    { title: 'U.S. Department of Labor: Overtime pay', url: 'https://www.dol.gov/agencies/whd/overtime' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
