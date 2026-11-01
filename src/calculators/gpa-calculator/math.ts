/**
 * GPA on the common 4.0 scale: credit-weighted average of grade points.
 * Weighted GPA adds +0.5 for Honors and +1.0 for AP/IB/college-level courses (a common convention;
 * schools vary), with no bonus for an F. Cumulative GPA combines prior credits and GPA.
 */
import { D } from '../../lib/math/money.ts';

export const GRADE_POINTS = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  'D+': 1.3,
  D: 1.0,
  'D-': 0.7,
  F: 0.0,
} as const;
export type Grade = keyof typeof GRADE_POINTS;

export const LEVELS = {
  regular: { label: 'Regular', bonus: 0 },
  honors: { label: 'Honors', bonus: 0.5 },
  ap: { label: 'AP / IB / college', bonus: 1.0 },
} as const;
export type Level = keyof typeof LEVELS;

export interface Course {
  name: string;
  grade: Grade;
  credits: number;
  level: Level;
}

export interface GpaInput extends Record<string, unknown> {
  courses: Course[];
  priorGpa: number;
  priorCredits: number;
}

export interface GpaOutput {
  unweighted: number;
  weighted: number;
  credits: number;
  qualityPoints: number;
  weightedPoints: number;
  cumulative: number | null;
  cumulativeCredits: number;
  rows: { name: string; grade: Grade; credits: number; points: number; weightedPoints: number }[];
}

export const pointsFor = (grade: Grade, level: Level, weighted: boolean): number =>
  D(GRADE_POINTS[grade]).plus(weighted && grade !== 'F' ? LEVELS[level].bonus : 0).toNumber();

export function computeGpa(i: GpaInput): GpaOutput {
  const courses = i.courses.filter((c) => c.credits > 0 && c.grade in GRADE_POINTS);
  let credits = D(0);
  let qp = D(0);
  let wqp = D(0);
  const rows = courses.map((c) => {
    const p = pointsFor(c.grade, c.level, false);
    const w = pointsFor(c.grade, c.level, true);
    credits = credits.plus(c.credits);
    qp = qp.plus(D(p).times(c.credits));
    wqp = wqp.plus(D(w).times(c.credits));
    return { name: c.name, grade: c.grade, credits: c.credits, points: p, weightedPoints: w };
  });
  const avg = (x: ReturnType<typeof D>) => (credits.gt(0) ? x.div(credits).toDecimalPlaces(3).toNumber() : 0);
  const priorCredits = Math.max(0, i.priorCredits);
  const totalCredits = credits.plus(priorCredits);
  const cumulative = priorCredits > 0 && totalCredits.gt(0) ? D(i.priorGpa).times(priorCredits).plus(qp).div(totalCredits).toDecimalPlaces(3).toNumber() : null;
  return {
    unweighted: avg(qp),
    weighted: avg(wqp),
    credits: credits.toNumber(),
    qualityPoints: qp.toDecimalPlaces(2).toNumber(),
    weightedPoints: wqp.toDecimalPlaces(2).toNumber(),
    cumulative,
    cumulativeCredits: totalCredits.toNumber(),
    rows,
  };
}
