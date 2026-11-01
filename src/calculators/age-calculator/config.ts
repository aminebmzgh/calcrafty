import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeAge, type AgeInput, type AgeOutput } from './math.ts';

const plural = (n: number, w: string) => `${num(n, 0)} ${w}${n === 1 ? '' : 's'}`;

const config: CalculatorConfig<AgeInput, AgeOutput> = {
  slug: 'age-calculator',
  category: 'everyday',
  subtopic: 'Dates and time',
  name: 'Age Calculator',
  h1: 'Age Calculator',
  intro: 'Your exact age in years, months and days, plus total days and weeks lived and a countdown to your next birthday.',
  metaTitle: 'Age Calculator: Exact Age in Years, Months, Days | Calcrafty',
  metaDescription:
    'Find your exact age in years, months and days from your date of birth, plus total weeks and days lived, the weekday you were born and your next birthday.',
  primaryKeyword: 'age calculator',
  secondaryKeywords: ['how old am i', 'birthday calculator', 'chronological age calculator'],
  synonyms: ['age', 'birthday', 'date of birth', 'how old', 'born'],
  inputs: [
    { id: 'birth', label: 'Date of birth', type: 'date', min: '1800-01-01', max: '2200-12-31', e2eValue: '1985-03-20' },
    { id: 'asOf', label: 'Age on this date', type: 'date', min: '1800-01-01', max: '2200-12-31', helpText: 'Leave empty to use today’s date.' },
  ],
  defaults: { birth: '1990-05-15', asOf: '' },
  compute: computeAge,
  summarize: (_i, o) =>
    o.error
      ? { headline: { label: 'Age', value: '—', sub: o.error }, items: [] }
      : {
          headline: { label: 'Your age', value: `${plural(o.years, 'year')}`, sub: `${plural(o.months, 'month')}, ${plural(o.days, 'day')} · on ${o.asOfLabel}`, raw: o.totalDays },
          items: [
            { label: 'In months', value: `${num(o.totalMonths, 0)} months, ${plural(o.days, 'day')}` },
            { label: 'In weeks', value: `${num(o.totalWeeks, 0)} weeks, ${plural(o.weeksRemainder, 'day')}` },
            { label: 'In days', value: num(o.totalDays, 0) },
            { label: 'In hours (approx.)', value: num(o.totalHours, 0) },
            { label: 'Born on a', value: o.bornOn },
            { label: o.birthdayToday ? 'Birthday' : 'Next birthday', value: o.birthdayToday ? 'Today. Happy birthday!' : `${o.nextBirthday} (in ${plural(o.daysToBirthday, 'day')})` },
          ],
        },
  explain: (_i, o) =>
    o.error
      ? [o.error]
      : [
          `You are ${plural(o.years, 'year')}, ${plural(o.months, 'month')} and ${plural(o.days, 'day')} old on ${o.asOfLabel}: ${num(o.totalDays, 0)} days in total.`,
          o.birthdayToday ? `Today you turn ${o.nextAge}.` : `You turn ${o.nextAge} on ${o.nextBirthday}, ${plural(o.daysToBirthday, 'day')} from now.`,
          'Months are counted as calendar months, so the day count resets on the same date each month.',
        ],
  steps: (i, o) =>
    o.error
      ? []
      : [
          { label: 'Whole years and months', formula: 'count calendar months from the birth date without passing the “as of” date', substituted: `${i.birth} → ${i.asOf || 'today'}`, result: `${o.years} y ${o.months} m` },
          { label: 'Remaining days', formula: 'days from the last monthly anniversary to the “as of” date', substituted: '', result: plural(o.days, 'day') },
          { label: 'Total days', formula: 'difference between the two calendar dates (leap days included)', substituted: '', result: num(o.totalDays, 0) },
        ],
  answerSummary: () => 'Enter a date of birth to see an exact age in years, months and days. For example, someone born on May 15, 1990 is 36 years, 5 months and 17 days old on November 1, 2026.',
  ogValue: (_i, o) => (o.error ? '—' : `${o.years} years`),
  related: ['days-between-dates-calculator', 'gpa-calculator', 'retirement-calculator', 'bmi-calculator'],
  sources: [
    { title: 'NIST: Time and Frequency Division (calendar and leap year background)', url: 'https://www.nist.gov/pml/time-and-frequency-division' },
    { title: 'U.S. Naval Observatory: Leap years', url: 'https://aa.usno.navy.mil/faq/calendars' },
    { title: 'ISO 8601 date and time format', url: 'https://www.iso.org/iso-8601-date-and-time-format.html' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
