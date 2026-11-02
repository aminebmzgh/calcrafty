import { describe, expect, it } from 'vitest';
import { computeFinal, courseGrade, gradeTable, neededScore, type FinalInput } from './math.ts';

const base: FinalInput = { current: 85, target: 90, weight: 40, expected: 90 };

describe('score needed on the final', () => {
  // (90 − 85 × 0.6) ÷ 0.4 = (90 − 51) ÷ 0.4 = 97.5.
  it('85% now, want 90%, final worth 40%', () => expect(neededScore(85, 90, 40)).toBe(97.5));
  // (80 − 78 × 0.75) ÷ 0.25 = (80 − 58.5) ÷ 0.25 = 86.
  it('78% now, want 80%, final worth 25%', () => expect(neededScore(78, 80, 25)).toBe(86));
  // (70 − 88 × 0.8) ÷ 0.2 = (70 − 70.4) ÷ 0.2 = −2: already secured.
  it('a negative result means the grade is secured', () => {
    expect(neededScore(88, 70, 20)).toBe(-2);
    expect(computeFinal({ ...base, current: 88, target: 70, weight: 20 }).status).toBe('secured');
  });
  it('above 100 is impossible', () => expect(computeFinal({ ...base, current: 70, target: 90, weight: 20 }).status).toBe('impossible'));
  it('a final worth nothing', () => expect(neededScore(85, 90, 0)).toBe(Infinity));
});

describe('course grade from a final score', () => {
  // 85 × 0.6 + 90 × 0.4 = 51 + 36 = 87.
  it('expected final of 90', () => expect(courseGrade(85, 90, 40)).toBe(87));
  it('worst and best case', () => {
    const o = computeFinal(base);
    expect(o.worst).toBe(51);
    expect(o.best).toBe(91);
  });
  // A (90): 97.5; B (80): (80 − 51) ÷ 0.4 = 72.5; C (70): 47.5; D (60): 22.5.
  it('score needed for each letter grade', () => {
    expect(computeFinal(base).letters.map((l) => l.needed)).toEqual([97.5, 72.5, 47.5, 22.5]);
  });
});

describe('grade table', () => {
  // 85 × 0.6 + 70 × 0.4 = 79.
  it('course grade for each final score', () => expect(gradeTable(85, 40).find((r) => r.score === 70)!.grade).toBe(79));
});
