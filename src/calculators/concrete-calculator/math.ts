/**
 * Concrete volume for a slab, a continuous footing or a round column, with a waste allowance,
 * then cubic yards (for ready-mix, rounded up to the next quarter yard) and premixed bags.
 * Bag yields are QUIKRETE Concrete Mix's published figures: 40 lb ≈ 0.30 ft³, 60 lb ≈ 0.45 ft³,
 * 80 lb ≈ 0.60 ft³.
 */
import { D, Decimal } from '../../lib/math/money.ts';

export type ConcreteShape = 'slab' | 'footing' | 'column';
export type BagSize = '40' | '60' | '80';

export interface ConcreteInput extends Record<string, unknown> {
  shape: ConcreteShape;
  /** Slab and footing length, ft. */
  length: number;
  /** Slab width, ft. */
  width: number;
  /** Slab thickness, in. */
  thickness: number;
  /** Footing width, in. */
  footingWidth: number;
  /** Footing depth, in. */
  footingDepth: number;
  /** Column diameter, in. */
  diameter: number;
  /** Column height, ft. */
  height: number;
  /** Number of identical pieces. */
  quantity: number;
  /** Extra for spillage, uneven ground and form bulge, %. */
  waste: number;
  bagSize: BagSize;
}

export interface ConcreteOutput {
  /** 1 + waste %, for display. */
  wasteFactor: number;
  /** Volume of one piece, before waste. */
  pieceCubicFeet: number;
  /** Volume before waste. */
  netCubicFeet: number;
  netCubicYards: number;
  /** Volume including waste. */
  cubicFeet: number;
  cubicYards: number;
  cubicMeters: number;
  /** Ready-mix order, rounded up to the next quarter yard. */
  orderYards: number;
  /** Bags of the chosen size. */
  bags: number;
  bagsBySize: Record<BagSize, number>;
  /** Weight of the chosen bags, lb. */
  bagWeight: number;
}

export const BAG_YIELD_FT3: Record<BagSize, number> = { '40': 0.3, '60': 0.45, '80': 0.6 };
export const FT3_PER_YD3 = 27;
/** 1 ft³ = 0.028316846592 m³ exactly (NIST). */
export const M3_PER_FT3 = 0.028316846592;

const pos = (n: number) => D(Math.max(0, n || 0));

/** Volume of one piece in cubic feet, before waste. */
export function pieceCubicFeet(i: Pick<ConcreteInput, 'shape' | 'length' | 'width' | 'thickness' | 'footingWidth' | 'footingDepth' | 'diameter' | 'height'>): Decimal {
  if (i.shape === 'column') {
    const r = pos(i.diameter).div(24); // radius in feet
    return D(Math.PI).times(r.pow(2)).times(pos(i.height));
  }
  if (i.shape === 'footing') return pos(i.length).times(pos(i.footingWidth).div(12)).times(pos(i.footingDepth).div(12));
  return pos(i.length).times(pos(i.width)).times(pos(i.thickness).div(12));
}

/** Whole bags needed for a volume (always rounded up). */
export function bagsFor(cubicFeet: Decimal, size: BagSize): number {
  if (cubicFeet.lte(0)) return 0;
  return cubicFeet.div(BAG_YIELD_FT3[size]).toDecimalPlaces(9).toDecimalPlaces(0, Decimal.ROUND_UP).toNumber();
}

export function computeConcrete(i: ConcreteInput): ConcreteOutput {
  const qty = Math.max(0, Math.round(i.quantity || 0));
  const net = pieceCubicFeet(i).times(qty);
  const factor = D(1).plus(pos(i.waste).div(100));
  const total = net.times(factor);
  const yards = total.div(FT3_PER_YD3);
  const bagsBySize = { '40': bagsFor(total, '40'), '60': bagsFor(total, '60'), '80': bagsFor(total, '80') } as Record<BagSize, number>;
  const bags = bagsBySize[i.bagSize];
  return {
    wasteFactor: factor.toNumber(),
    pieceCubicFeet: pieceCubicFeet(i).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    netCubicFeet: net.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    netCubicYards: net.div(FT3_PER_YD3).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    cubicFeet: total.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    cubicYards: yards.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    cubicMeters: total.times(M3_PER_FT3).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    orderYards: yards.times(4).toDecimalPlaces(9).toDecimalPlaces(0, Decimal.ROUND_UP).div(4).toNumber(),
    bags,
    bagsBySize,
    bagWeight: bags * Number(i.bagSize),
  };
}
