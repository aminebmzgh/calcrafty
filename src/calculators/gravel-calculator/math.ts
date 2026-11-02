/**
 * Gravel or crushed stone for a rectangular area: length × width × depth, plus an allowance for
 * compaction, in cubic feet and cubic yards, then tons from the material's density
 * (tons per cubic yard; about 1.4 for most gravel) and bags of a given volume.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export interface GravelInput extends Record<string, unknown> {
  /** Area length, ft. */
  length: number;
  /** Area width, ft. */
  width: number;
  /** Depth, in. */
  depth: number;
  /** Extra for compaction and settling, %. */
  extra: number;
  /** Density, short tons per cubic yard. */
  density: number;
  /** Volume of one bag, ft³. */
  bagVolume: number;
}

export interface GravelOutput {
  area: number;
  netCubicYards: number;
  cubicFeet: number;
  cubicYards: number;
  cubicMeters: number;
  tons: number;
  pounds: number;
  bags: number;
}

const pos = (n: number) => D(Math.max(0, n || 0));

export function computeGravel(i: GravelInput): GravelOutput {
  const area = pos(i.length).times(pos(i.width));
  const net = area.times(pos(i.depth).div(12));
  const ft3 = net.times(D(1).plus(pos(i.extra).div(100)));
  const yd3 = ft3.div(27);
  const tons = yd3.times(pos(i.density));
  const bag = pos(i.bagVolume);
  return {
    area: area.toDecimalPlaces(2).toNumber(),
    netCubicYards: net.div(27).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    cubicFeet: ft3.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    cubicYards: yd3.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    cubicMeters: ft3.times(0.028316846592).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    tons: tons.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    pounds: tons.times(2000).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber(),
    bags: bag.gt(0) && ft3.gt(0) ? ft3.div(bag).toDecimalPlaces(9).toDecimalPlaces(0, Decimal.ROUND_UP).toNumber() : 0,
  };
}
