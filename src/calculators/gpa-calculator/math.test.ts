import { describe, expect, it } from 'vitest';
import { computeGpa, type Course } from './math.ts';

const c = (grade: Course['grade'], credits: number, level: Course['level'] = 'regular'): Course => ({ name: grade, grade, credits, level });

describe('GPA references (4.0 scale, credit-weighted)', () => {
  // A (4.0 × 3) + B (3.0 × 4) + A− (3.7 × 3) = 12 + 12 + 11.1 = 35.1 points ÷ 10 credits = 3.51.
  it('A, B, A− over 10 credits = 3.51', () => {
    const o = computeGpa({ courses: [c('A', 3), c('B', 4), c('A-', 3)], priorGpa: 0, priorCredits: 0 });
    expect(o.unweighted).toBe(3.51);
    expect(o.qualityPoints).toBe(35.1);
  });
  // Weighted: the A is AP (+1.0 → 5.0): 15 + 12 + 11.1 = 38.1 ÷ 10 = 3.81.
  it('AP bonus: weighted 3.81', () => expect(computeGpa({ courses: [c('A', 3, 'ap'), c('B', 4), c('A-', 3)], priorGpa: 0, priorCredits: 0 }).weighted).toBe(3.81));
  // Honors +0.5: B in honors = 3.5.
  it('honors bonus', () => expect(computeGpa({ courses: [c('B', 1, 'honors')], priorGpa: 0, priorCredits: 0 }).weighted).toBe(3.5));
  // Cumulative: prior 3.2 × 30 = 96, plus 35.1 → 131.1 ÷ 40 = 3.2775 → 3.278.
  it('cumulative GPA with prior credits', () => {
    const o = computeGpa({ courses: [c('A', 3), c('B', 4), c('A-', 3)], priorGpa: 3.2, priorCredits: 30 });
    expect(o.cumulative).toBe(3.278);
    expect(o.cumulativeCredits).toBe(40);
  });
});

describe('GPA edge cases', () => {
  it('no bonus for an F, even in AP', () => expect(computeGpa({ courses: [c('F', 3, 'ap')], priorGpa: 0, priorCredits: 0 }).weighted).toBe(0));
  it('zero-credit courses are ignored; no courses gives 0, not NaN', () => {
    expect(computeGpa({ courses: [c('A', 0)], priorGpa: 0, priorCredits: 0 }).unweighted).toBe(0);
    expect(computeGpa({ courses: [], priorGpa: 0, priorCredits: 0 }).credits).toBe(0);
  });
  it('fractional credits', () => expect(computeGpa({ courses: [c('A', 0.5), c('C', 1.5)], priorGpa: 0, priorCredits: 0 }).unweighted).toBe(2.5));
  it('no prior credits → no cumulative', () => expect(computeGpa({ courses: [c('A', 3)], priorGpa: 3.9, priorCredits: 0 }).cumulative).toBeNull());
});
