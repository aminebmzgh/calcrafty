import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeTip, type TipInput, type TipOutput } from './math.ts';

const config: CalculatorConfig<TipInput, TipOutput> = {
  slug: 'tip-calculator',
  category: 'other',
  subtopic: 'Miscellaneous',
  name: 'Tip Calculator',
  h1: 'Tip Calculator',
  intro: 'The tip and total for any bill, split between any number of people, with an option to round each share up.',
  metaTitle: 'Tip Calculator: Tip, Total and Bill Split',
  metaDescription:
    'Calculate the tip and total on any bill, split it evenly between friends and round each share up to the dollar, with a table of 15%, 18% and 20% tips.',
  primaryKeyword: 'tip calculator',
  secondaryKeywords: ['gratuity calculator', 'bill split calculator', 'split the bill calculator', 'restaurant tip calculator'],
  synonyms: ['tip', 'gratuity', 'split bill', 'restaurant tip', '20 percent tip', 'tipping'],
  inputs: [
    { id: 'bill', label: 'Bill amount', type: 'number', unit: 'usd', min: 0, max: 1_000_000, step: 0.01, sliderMax: 500, helpText: 'Many people tip on the amount before tax.' },
    { id: 'tipPercent', label: 'Tip', type: 'number', unit: 'percent', min: 0, max: 100, step: 1, sliderMax: 35 },
    { id: 'people', label: 'Splitting between', type: 'number', unit: 'count', min: 1, max: 100, step: 1, integer: true, slider: false },
    { id: 'roundUp', label: 'Round each share up to the next dollar', type: 'checkbox' },
  ],
  defaults: { bill: 85, tipPercent: 18, people: 2, roundUp: false },
  compute: computeTip,
  summarize: (i, o) => ({
    headline: { label: o.people > 1 ? 'Each person pays' : 'Total to pay', value: usd(o.people > 1 ? o.perPerson : o.total, true), sub: `${usd(o.tip, true)} tip (${pct(o.effectivePercent, 1)}) on ${usd(i.bill, true)}`, raw: o.perPerson },
    items: [
      { label: 'Tip', value: usd(o.tip, true), raw: o.tip },
      { label: 'Total with tip', value: usd(o.total, true), raw: o.total },
      ...(o.people > 1 ? [{ label: 'Tip per person', value: usd(o.tipPerPerson, true), raw: o.tipPerPerson }] : []),
    ],
  }),
  explain: (i, o) => {
    const s = [`A tip of ${pct(i.tipPercent, 0)} on ${usd(i.bill, true)} is ${usd(o.tip, true)}, for a total of ${usd(o.total, true)}.`];
    if (o.people > 1) s.push(`Split ${o.people} ways, each person pays ${usd(o.perPerson, true)}${i.roundUp ? `, rounded up to the dollar, which brings the tip to ${pct(o.effectivePercent, 1)}` : ''}.`);
    s.push('In U.S. restaurants with table service, 15% to 20% of the pre-tax bill is the usual range, and many people now treat 20% as the standard for good service.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Tip', formula: 'bill × tip %', substituted: `${usd(i.bill, true)} × ${pct(i.tipPercent, 0)}`, result: usd(o.baseTip, true) },
    { label: 'Total', formula: 'bill + tip', substituted: `${usd(i.bill, true)} + ${usd(o.tip, true)}`, result: usd(o.total, true) },
    { label: 'Each person', formula: i.roundUp ? 'total ÷ people, rounded up to the dollar' : 'total ÷ people, rounded up to the cent', substituted: `${usd(o.total, true)} ÷ ${o.people}`, result: usd(o.perPerson, true) },
  ],
  answerSummary: (i, o) => `A tip of ${pct(i.tipPercent, 0)} on a ${usd(i.bill)} bill is ${usd(o.tip, true)}, making ${usd(o.total, true)} in total, or ${usd(o.perPerson, true)} each for ${o.people} people.`,
  ogValue: (_i, o) => usd(o.tip, true),
  related: ['percentage-calculator', 'paycheck-calculator', 'recipe-scaler', 'overtime-calculator', 'salary-to-hourly-calculator'],
  sources: [
    { title: 'IRS: Topic no. 761, Tips (withholding and reporting)', url: 'https://www.irs.gov/taxtopics/tc761' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
