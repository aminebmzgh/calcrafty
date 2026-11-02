/**
 * Roof area from the house footprint plus overhangs, multiplied by the pitch factor
 * √(1 + (rise ÷ 12)²). For a roof whose planes all share one pitch, this is exact for gable and hip
 * roofs alike. Area is converted to roofing squares (100 sq ft), a waste allowance is added and
 * shingle bundles are counted (usually 3 per square).
 */
import { D, Decimal } from '../../lib/math/money.ts';

export interface RoofingInput extends Record<string, unknown> {
  /** Footprint length, ft. */
  length: number;
  /** Footprint width, ft. */
  width: number;
  /** Eave and rake overhang on each side, in. */
  overhang: number;
  /** Rise in inches per 12 inches of run. */
  pitch: number;
  /** Waste allowance, %. */
  waste: number;
  bundlesPerSquare: number;
}

export interface RoofingOutput {
  /** Footprint plus overhangs, sq ft. */
  planArea: number;
  /** √(1 + (rise/12)²), 4 decimals. */
  pitchFactor: number;
  /** Pitch angle, degrees, 1 decimal. */
  pitchDegrees: number;
  roofArea: number;
  squares: number;
  squaresWithWaste: number;
  bundles: number;
}

const pos = (n: number) => D(Math.max(0, n || 0));

export function pitchFactorOf(rise: number): Decimal {
  return D(1).plus(pos(rise).div(12).pow(2)).sqrt();
}

export function computeRoofing(i: RoofingInput): RoofingOutput {
  const o = pos(i.overhang).div(12).times(2);
  const plan = pos(i.length).plus(o).times(pos(i.width).plus(o));
  const factor = pitchFactorOf(i.pitch);
  const area = plan.times(factor);
  const squares = area.div(100);
  const withWaste = squares.times(D(1).plus(pos(i.waste).div(100)));
  const bundles = withWaste.gt(0) ? withWaste.times(pos(i.bundlesPerSquare)).toDecimalPlaces(9).toDecimalPlaces(0, Decimal.ROUND_UP).toNumber() : 0;
  return {
    planArea: plan.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    pitchFactor: factor.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    // Display only; the angle is not used in the area math.
    pitchDegrees: Math.round((Math.atan(Math.max(0, i.pitch || 0) / 12) * 180 * 10) / Math.PI) / 10,
    roofArea: area.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    squares: squares.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    squaresWithWaste: withWaste.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    bundles,
  };
}
