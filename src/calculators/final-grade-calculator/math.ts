/**
 * Final exam grade needed: required = (target − current × (1 − w)) ÷ w, where w is the final's weight.
 * Also the course grade a given final score produces, and the score needed for each letter grade.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export interface FinalInput extends Record<string, unknown> {
  /** Current grade before the final, %. */
  current: number;
  /** Grade you want in the course, %. */
  target: number;
  /** Weight of the final exam in the course grade, %. */
  weight: number;
  /** A score you expect on the final, % (for the "what if" result). */
  expected: number;
}

export interface FinalOutput {
  /** Score needed on the final, %, 2 decimals (may be above 100 or below 0). */
  needed: number;
  status: 'possible' | 'impossible' | 'secured';
  /** Course grade if you score `expected` on the final, %. */
  gradeWithExpected: number;
  /** Course grade with a 0 and a 100 on the final. */
  worst: number;
  best: number;
  letters: { letter: string; cutoff: number; needed: number }[];
}

const LETTERS: [string, number][] = [
  ['A', 90],
  ['B', 80],
  ['C', 70],
  ['D', 60],
];

const round2 = (x: Decimal) => x.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

/** Score needed on the final to finish with `target`. */
export function neededScore(current: number, target: number, weightPct: number): number {
  const w = D(weightPct).div(100);
  if (w.lte(0)) return target <= current ? 0 : Infinity;
  return round2(D(target).minus(D(current).times(D(1).minus(w))).div(w));
}

/** Course grade from the current grade and a final exam score. */
export function courseGrade(current: number, finalScore: number, weightPct: number): number {
  const w = D(weightPct).div(100);
  return round2(D(current).times(D(1).minus(w)).plus(D(finalScore).times(w)));
}

export function computeFinal(i: FinalInput): FinalOutput {
  const needed = neededScore(i.current, i.target, i.weight);
  return {
    needed,
    status: needed > 100 ? 'impossible' : needed <= 0 ? 'secured' : 'possible',
    gradeWithExpected: courseGrade(i.current, i.expected, i.weight),
    worst: courseGrade(i.current, 0, i.weight),
    best: courseGrade(i.current, 100, i.weight),
    letters: LETTERS.map(([letter, cutoff]) => ({ letter, cutoff, needed: neededScore(i.current, cutoff, i.weight) })),
  };
}

/** Course grade for a range of final exam scores. */
export function gradeTable(current: number, weightPct: number): { score: number; grade: number }[] {
  return [50, 60, 70, 80, 90, 100].map((score) => ({ score, grade: courseGrade(current, score, weightPct) }));
}
