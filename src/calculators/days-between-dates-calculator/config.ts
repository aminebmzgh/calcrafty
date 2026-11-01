import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeDays, type DaysInput, type DaysOutput } from './math.ts';

const plural = (n: number, w: string) => `${num(n, 0)} ${w}${n === 1 ? '' : 's'}`;

const config: CalculatorConfig<DaysInput, DaysOutput> = {
  slug: 'days-between-dates-calculator',
  category: 'everyday',
  subtopic: 'Dates and time',
  name: 'Days Between Dates Calculator',
  h1: 'Days Between Dates Calculator',
  intro: 'Count the days, weeks, months and business days between two dates, with US federal holidays excluded if you want.',
  metaTitle: 'Days Between Dates Calculator & Business Days | Calcrafty',
  metaDescription:
    'Count the days between two dates, in days, weeks and months, plus business days with weekends and US federal holidays excluded. Include or exclude the end date.',
  primaryKeyword: 'days between dates calculator',
  secondaryKeywords: ['date calculator', 'business days calculator', 'how many days between dates'],
  synonyms: ['days until', 'countdown', 'working days', 'business days', 'date difference', 'weeks between'],
  inputs: [
    { id: 'start', label: 'Start date', type: 'date', min: '1800-01-01', max: '2200-12-31', group: 'dates', e2eValue: '2026-01-15' },
    { id: 'end', label: 'End date', type: 'date', min: '1800-01-01', max: '2200-12-31', group: 'dates' },
    { id: 'includeEnd', label: 'Count the end date too (+1 day)', type: 'checkbox' },
    { id: 'excludeHolidays', label: 'Exclude US federal holidays from business days', type: 'checkbox' },
  ],
  defaults: { start: '2026-11-02', end: '2026-12-25', includeEnd: false, excludeHolidays: true },
  compute: computeDays,
  summarize: (i, o) =>
    o.error
      ? { headline: { label: 'Days between', value: '—', sub: o.error }, items: [] }
      : {
          headline: { label: 'Days between the dates', value: plural(o.days, 'day'), sub: `${o.startLabel} to ${o.endLabel}${i.includeEnd ? ', end date included' : ''}`, raw: o.days },
          items: [
            { label: 'Business days', value: num(o.businessDays, 0), raw: o.businessDays },
            { label: 'In weeks', value: `${plural(o.weeks, 'week')}, ${plural(o.weekRemainder, 'day')}` },
            { label: 'In months', value: `${o.years ? `${plural(o.years, 'year')}, ` : ''}${plural(o.months, 'month')}, ${plural(o.monthDays, 'day')}` },
            { label: 'Weekend days', value: num(o.weekendDays, 0) },
            { label: 'Federal holidays on weekdays', value: i.excludeHolidays ? num(o.holidays.length, 0) : 'not excluded' },
          ],
        },
  explain: (i, o) => {
    if (o.error) return [o.error];
    const s = [`There are ${plural(o.days, 'day')} from ${o.startLabel} to ${o.endLabel}${i.includeEnd ? ', counting both dates' : ', counting the start date but not the end date'}.`];
    s.push(`${num(o.businessDays, 0)} of them are business days (Monday to Friday)${i.excludeHolidays && o.holidays.length ? `, after excluding ${o.holidays.map((h) => h.name).join(', ')}` : ''}.`);
    if (o.reversed) s.push('The end date was before the start date, so the dates were swapped.');
    return s;
  },
  steps: (i, o) =>
    o.error
      ? []
      : [
          { label: 'Calendar days', formula: i.includeEnd ? 'end − start + 1' : 'end − start', substituted: `${o.startLabel} → ${o.endLabel}`, result: plural(o.days, 'day') },
          { label: 'Weeks', formula: 'days ÷ 7', substituted: `${o.days} ÷ 7`, result: `${o.weeks} weeks, ${o.weekRemainder} days` },
          { label: 'Business days', formula: 'days − weekend days − weekday federal holidays', substituted: `${o.days} − ${o.weekendDays} − ${o.holidays.length}`, result: num(o.businessDays, 0) },
        ],
  answerSummary: (_i, o) => `From Monday, November 2, 2026 to Christmas Day there are ${plural(o.days, 'day')}, including ${num(o.businessDays, 0)} business days once weekends, Veterans Day and Thanksgiving are excluded.`,
  ogValue: (_i, o) => plural(o.days, 'day'),
  related: ['age-calculator', 'paycheck-calculator', 'savings-goal-calculator', 'gpa-calculator'],
  sources: [
    { title: '5 U.S.C. 6103: Federal holidays', url: 'https://www.law.cornell.edu/uscode/text/5/6103' },
    { title: 'U.S. Office of Personnel Management: Federal holidays', url: 'https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/' },
    { title: 'U.S. Naval Observatory: Leap years', url: 'https://aa.usno.navy.mil/faq/calendars' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
