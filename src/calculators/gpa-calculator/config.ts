import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeGpa, type GpaInput, type GpaOutput } from './math.ts';

const g = (n: number) => num(n, 2);

const config: CalculatorConfig<GpaInput, GpaOutput> = {
  slug: 'gpa-calculator',
  category: 'everyday',
  subtopic: 'School',
  name: 'GPA Calculator',
  h1: 'GPA Calculator',
  intro: 'Your weighted and unweighted GPA from letter grades and credits, plus your cumulative GPA with past semesters.',
  metaTitle: 'GPA Calculator: Weighted & Unweighted GPA | Calcrafty',
  metaDescription:
    'Calculate weighted and unweighted GPA on a 4.0 scale from letter grades and credit hours, with Honors and AP bonuses and your cumulative GPA across semesters.',
  primaryKeyword: 'gpa calculator',
  secondaryKeywords: ['weighted gpa calculator', 'college gpa calculator', 'high school gpa calculator'],
  synonyms: ['grade point average', 'grades', 'cumulative gpa', 'semester gpa', 'credits', 'ap', 'honors'],
  inputs: [
    { id: 'courses', label: 'Courses', type: 'custom' },
    { id: 'priorGpa', label: 'Previous cumulative GPA', type: 'number', unit: 'none', min: 0, max: 5, step: 0.01, slider: false, advanced: true, group: 'prior' },
    { id: 'priorCredits', label: 'Previous credits', type: 'number', unit: 'none', min: 0, max: 1000, step: 0.5, slider: false, advanced: true, group: 'prior', helpText: 'Leave at 0 to see this term’s GPA only.' },
  ],
  defaults: {
    courses: [
      { name: 'English', grade: 'A-', credits: 3, level: 'regular' },
      { name: 'Calculus', grade: 'B+', credits: 4, level: 'ap' },
      { name: 'Biology', grade: 'A', credits: 4, level: 'honors' },
      { name: 'History', grade: 'B', credits: 3, level: 'regular' },
    ],
    priorGpa: 0,
    priorCredits: 0,
  },
  validate: (i) => (i.courses.length === 0 ? [{ id: 'courses', message: 'Add at least one course.' }] : []),
  compute: computeGpa,
  summarize: (_i, o) => ({
    headline: { label: 'Unweighted GPA', value: g(o.unweighted), sub: `Weighted GPA ${g(o.weighted)} · ${num(o.credits, 1)} credits`, raw: o.unweighted, better: 'higher' },
    items: [
      { label: 'Weighted GPA', value: g(o.weighted), raw: o.weighted, better: 'higher' },
      { label: 'Credits this term', value: num(o.credits, 1) },
      { label: 'Quality points', value: num(o.qualityPoints, 2) },
      ...(o.cumulative !== null ? [{ label: `Cumulative GPA (${num(o.cumulativeCredits, 1)} credits)`, value: g(o.cumulative), raw: o.cumulative, better: 'higher' as const }] : []),
    ],
  }),
  explain: (_i, o) => {
    if (o.credits === 0) return ['Add a course with credits to see your GPA.'];
    const s = [`Your ${num(o.credits, 1)} credits earn ${num(o.qualityPoints, 2)} quality points, for an unweighted GPA of ${g(o.unweighted)} on a 4.0 scale.`];
    if (o.weighted !== o.unweighted) s.push(`With Honors (+0.5) and AP/IB (+1.0) bonuses, your weighted GPA is ${g(o.weighted)}. Colleges often recalculate GPAs their own way, so report the one your school uses.`);
    if (o.cumulative !== null) s.push(`Combined with your previous credits, your cumulative GPA becomes ${g(o.cumulative)}.`);
    return s;
  },
  steps: (_i, o) => [
    { label: 'Quality points per course', formula: 'grade points × credits', substituted: o.rows.map((r) => `${r.grade} ${num(r.points, 1)} × ${num(r.credits, 1)}`).join(' + '), result: num(o.qualityPoints, 2) },
    { label: 'Unweighted GPA', formula: 'total quality points ÷ total credits', substituted: `${num(o.qualityPoints, 2)} ÷ ${num(o.credits, 1)}`, result: g(o.unweighted) },
    { label: 'Weighted GPA', formula: '(grade points + level bonus) × credits, ÷ total credits', substituted: `${num(o.weightedPoints, 2)} ÷ ${num(o.credits, 1)}`, result: g(o.weighted) },
  ],
  answerSummary: (_i, o) => `Grades of A−, B+, A and B over ${num(o.credits, 0)} credits give an unweighted GPA of ${g(o.unweighted)}; with AP and Honors bonuses the weighted GPA is ${g(o.weighted)}.`,
  ogValue: (_i, o) => `GPA ${g(o.unweighted)}`,
  related: ['percentage-calculator', 'age-calculator', 'days-between-dates-calculator', 'standard-deviation-calculator'],
  sources: [
    { title: 'College Board: How to convert your GPA to a 4.0 scale', url: 'https://pages.collegeboard.org/how-to-convert-gpa-4.0-scale' },
    { title: 'National Center for Education Statistics: High School Transcript Study (GPA methods)', url: 'https://nces.ed.gov/nationsreportcard/hsts/' },
    { title: 'U.S. Department of Education: Federal Student Aid, satisfactory academic progress', url: 'https://studentaid.gov/understand-aid/eligibility/staying-eligible' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
