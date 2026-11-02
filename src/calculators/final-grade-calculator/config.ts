import type { CalculatorConfig } from '../../lib/types.ts';
import { num, pct } from '../../lib/format.ts';
import { computeFinal, type FinalInput, type FinalOutput } from './math.ts';

const config: CalculatorConfig<FinalInput, FinalOutput> = {
  slug: 'final-grade-calculator',
  category: 'everyday',
  subtopic: 'School',
  name: 'Final Grade Calculator',
  h1: 'Final Grade Calculator',
  intro: 'The score you need on your final exam to get the grade you want, and the score needed for an A, B, C or D.',
  metaTitle: 'Final Grade Calculator: What Do I Need on My Final?',
  metaDescription:
    'Find the score you need on your final exam to reach a target grade, from your current grade and the final’s weight, plus the score needed for each letter.',
  primaryKeyword: 'final grade calculator',
  secondaryKeywords: ['what do i need on my final', 'final exam calculator', 'grade needed on final', 'final exam grade calculator'],
  synonyms: ['finals', 'exam score needed', 'pass the class', 'course grade', 'weighted grade'],
  inputs: [
    { id: 'current', label: 'Current grade', type: 'number', unit: 'percent', min: 0, max: 150, step: 0.1, sliderMax: 100, helpText: 'Your grade in the class before the final.' },
    { id: 'target', label: 'Grade you want', type: 'number', unit: 'percent', min: 0, max: 150, step: 0.1, sliderMax: 100 },
    { id: 'weight', label: 'Final exam weight', type: 'number', unit: 'percent', min: 0, max: 100, step: 0.5, sliderMax: 60, helpText: 'How much of the course grade the final counts for, from the syllabus.' },
    { id: 'expected', label: 'If I score this on the final', type: 'number', unit: 'percent', min: 0, max: 150, step: 0.5, sliderMax: 100, advanced: true },
  ],
  defaults: { current: 85, target: 90, weight: 40, expected: 90 },
  compute: computeFinal,
  summarize: (i, o) => ({
    headline: {
      label: 'You need on the final',
      value: o.status === 'secured' ? 'Already secured' : o.status === 'impossible' ? `${pct(o.needed, 1)} (not possible)` : pct(o.needed, 1),
      sub: `to finish with ${pct(i.target, 1)}`,
      raw: o.needed,
      better: 'lower',
    },
    items: [
      ...o.letters.map((l) => ({ label: `For a ${l.letter} (${l.cutoff}%)`, value: l.needed <= 0 ? 'Secured' : l.needed > 100 ? 'Out of reach' : pct(l.needed, 1), raw: l.needed, better: 'lower' as const })),
      { label: `Course grade with ${pct(i.expected, 0)} on the final`, value: pct(o.gradeWithExpected, 1), raw: o.gradeWithExpected, better: 'higher' },
    ],
  }),
  explain: (i, o) => {
    const range = `Depending on the final, your course grade will land between ${pct(o.worst, 1)} (a zero) and ${pct(o.best, 1)} (a perfect score).`;
    if (o.status === 'secured') return [`Even a zero on the final keeps you at ${pct(o.worst, 1)}, above your ${pct(i.target, 1)} target. Your grade is already secured.`, range];
    if (o.status === 'impossible')
      return [`You'd need ${pct(o.needed, 1)} on the final, which isn't possible without extra credit. The highest you can reach is ${pct(o.best, 1)}.`, range, 'Ask your instructor about extra credit or whether the final can replace a lower score.'];
    return [`To finish with ${pct(i.target, 1)}, you need at least ${pct(o.needed, 1)} on a final worth ${pct(i.weight, 0)} of the grade.`, range];
  },
  steps: (i, o) => [
    { label: 'Share of the grade already earned', formula: 'current × (1 − final weight)', substituted: `${pct(i.current, 1)} × (1 − ${pct(i.weight, 0)})`, result: num(o.worst, 2) },
    { label: 'Score needed on the final', formula: '(target − current × (1 − weight)) ÷ weight', substituted: `(${num(i.target, 1)} − ${num(o.worst, 2)}) ÷ ${num(i.weight / 100, 2)}`, result: pct(o.needed, 2) },
    { label: 'Course grade with your expected score', formula: 'current × (1 − weight) + final × weight', substituted: `${num(o.worst, 2)} + ${num(i.expected, 1)} × ${num(i.weight / 100, 2)}`, result: pct(o.gradeWithExpected, 2) },
  ],
  answerSummary: (i, o) =>
    o.status === 'secured'
      ? `With ${pct(i.current, 1)} now and a final worth ${pct(i.weight, 0)}, your ${pct(i.target, 1)} target is already secured.`
      : `With ${pct(i.current, 1)} now and a final worth ${pct(i.weight, 0)}, you need ${pct(o.needed, 1)} on the final to finish with ${pct(i.target, 1)}.`,
  ogValue: (_i, o) => (o.status === 'secured' ? 'Secured' : pct(o.needed, 1)),
  related: ['gpa-calculator', 'percentage-calculator', 'standard-deviation-calculator', 'age-calculator', 'days-between-dates-calculator'],
  sources: [
    { title: 'Weighted average: how course grades combine (Khan Academy)', url: 'https://www.khanacademy.org/math/statistics-probability/summarizing-quantitative-data' },
    { title: 'National Center for Education Statistics: grading and GPA conventions', url: 'https://nces.ed.gov/' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
