import { describe, expect, it } from 'vitest';
import { computeScientific } from './math.ts';

const calc = (expression: string, angle: 'deg' | 'rad' = 'deg') => computeScientific({ expression, angle });
const d = (e: string, a: 'deg' | 'rad' = 'deg') => calc(e, a).display;

describe('order of operations (standard mathematical precedence)', () => {
  it('2 + 3 × 4 = 14', () => expect(d('2+3*4')).toBe('14'));
  it('(2 + 3) × 4 = 20', () => expect(d('(2+3)×4')).toBe('20'));
  it('2^3^2 = 512 (right-associative)', () => expect(d('2^3^2')).toBe('512'));
  it('−2^2 = −4 (exponent before negation)', () => expect(d('-2^2')).toBe('−4'));
  it('implicit multiplication: 2π, 3(4), (1+2)(3+4)', () => {
    expect(d('2pi')).toBe('6.28318530718');
    expect(d('3(4)')).toBe('12');
    expect(d('(1+2)(3+4)')).toBe('21');
  });
});

describe('functions (reference values)', () => {
  it('sin 30° = 0.5, cos 60° = 0.5, tan 45° = 1', () => {
    expect(d('sin(30)')).toBe('0.5');
    expect(d('cos(60)')).toBe('0.5');
    expect(d('tan(45)')).toBe('1');
  });
  it('sin 180° is exactly 0 in degree mode', () => expect(d('sin(180)')).toBe('0'));
  it('sin(π/2) = 1 in radians', () => expect(d('sin(pi/2)', 'rad')).toBe('1'));
  it('ln(e) = 1, log(1000) = 3, sqrt(144) = 12, cbrt(−8) = −2', () => {
    expect(d('ln(e)')).toBe('1');
    expect(d('log(1000)')).toBe('3');
    expect(d('√(144)')).toBe('12');
    expect(d('cbrt(-8)')).toBe('−2');
  });
  it('5! = 120, 20% = 0.2', () => {
    expect(d('5!')).toBe('120');
    expect(d('20%')).toBe('0.2');
  });
  it('asin(0.5) = 30°', () => expect(d('asin(0.5)')).toBe('30'));
});

describe('precision and errors', () => {
  it('0.1 + 0.2 shows 0.3', () => expect(d('0.1+0.2')).toBe('0.3'));
  it('scientific notation input and output', () => {
    expect(d('1.5e3*2')).toBe('3000');
    expect(d('10^20')).toBe('1e+20');
  });
  it('errors are plain words, never NaN or Infinity', () => {
    for (const bad of ['1/0', 'sqrt(-1)', 'ln(0)', '(2+3', '2+3)', '2+', 'foo(2)', '(-8)^(1/3)', 'tan(90)', '171!', '10^400', '']) {
      const o = calc(bad);
      expect(o.error, bad).not.toBeNull();
      expect(o.display).toBe('—');
    }
  });
});
