/**
 * Square footage of rectangles, L-shaped rooms, circles and triangles, measured in feet, inches,
 * yards, meters or centimeters. Areas are computed in square meters from exact length definitions
 * (1 ft = 0.3048 m), then converted: 1 sq ft = 0.09290304 m², 1 sq yd = 9 sq ft, 1 acre = 43,560 sq ft.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type Shape = 'rectangle' | 'lshape' | 'circle' | 'triangle';
export type LengthUnit = 'ft' | 'in' | 'yd' | 'm' | 'cm';

export interface SquareFootageInput extends Record<string, unknown> {
  shape: Shape;
  unit: LengthUnit;
  length: number;
  width: number;
  /** Second rectangle of an L-shaped room. */
  length2: number;
  width2: number;
  diameter: number;
  base: number;
  height: number;
  /** Number of identical areas. */
  count: number;
  wastePct: number;
  pricePerSqFt: number;
}

export interface SquareFootageOutput {
  sqft: number;
  sqm: number;
  sqyd: number;
  sqin: number;
  acres: number;
  /** One area, before multiplying by count. */
  eachSqft: number;
  withWaste: number;
  cost: number;
  /** Length and width of a square with the same area, in feet. */
  squareSide: number;
}

export const METERS_PER: Record<LengthUnit, string> = { ft: '0.3048', in: '0.0254', yd: '0.9144', m: '1', cm: '0.01' };
export const SQM_PER_SQFT = '0.09290304';
export const SQFT_PER_ACRE = 43_560;

const sig = (d: Decimal) => d.toSignificantDigits(12).toNumber();
const m = (v: number, u: LengthUnit) => D(Math.max(0, v || 0)).times(METERS_PER[u]);

/** Area of one shape in square meters. */
export function areaSqm(i: Pick<SquareFootageInput, 'shape' | 'unit' | 'length' | 'width' | 'length2' | 'width2' | 'diameter' | 'base' | 'height'>): Decimal {
  switch (i.shape) {
    case 'rectangle':
      return m(i.length, i.unit).times(m(i.width, i.unit));
    case 'lshape':
      return m(i.length, i.unit).times(m(i.width, i.unit)).plus(m(i.length2, i.unit).times(m(i.width2, i.unit)));
    case 'circle': {
      const r = m(i.diameter, i.unit).div(2);
      return r.times(r).times(Math.PI);
    }
    case 'triangle':
      return m(i.base, i.unit).times(m(i.height, i.unit)).div(2);
  }
}

export function computeSquareFootage(i: SquareFootageInput): SquareFootageOutput {
  const each = areaSqm(i);
  const count = Math.max(1, Math.round(i.count || 1));
  const sqm = each.times(count);
  const sqft = sqm.div(SQM_PER_SQFT);
  const withWaste = sqft.times(D(i.wastePct || 0).div(100).plus(1));
  return {
    sqft: sig(sqft),
    sqm: sig(sqm),
    sqyd: sig(sqft.div(9)),
    sqin: sig(sqft.times(144)),
    acres: sig(sqft.div(SQFT_PER_ACRE)),
    eachSqft: sig(each.div(SQM_PER_SQFT)),
    withWaste: sig(withWaste),
    cost: withWaste.times(i.pricePerSqFt || 0).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    squareSide: sig(sqft.sqrt()),
  };
}
