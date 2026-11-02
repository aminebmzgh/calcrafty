/**
 * Flooring for a rectangular room plus any extra area (closets, alcoves): area × (1 + waste),
 * divided by the coverage of one box and rounded up to whole boxes, with the cost of the boxes.
 */
import { cents, D, Decimal } from '../../lib/math/money.ts';

export interface FlooringInput extends Record<string, unknown> {
  /** Room length, ft. */
  length: number;
  /** Room width, ft. */
  width: number;
  /** Extra area such as a closet, sq ft. */
  extraArea: number;
  /** Waste and cutting allowance, %. */
  waste: number;
  /** Square feet in one box (on the label). */
  boxCoverage: number;
  /** Price per square foot, $. */
  price: number;
}

export interface FlooringOutput {
  area: number;
  areaWithWaste: number;
  boxes: number;
  /** Square feet actually bought (boxes × coverage). */
  purchasedArea: number;
  cost: number;
  /** Cost per square foot of floor actually covered. */
  costPerFloorSqFt: number;
}

const pos = (n: number) => D(Math.max(0, n || 0));

export function computeFlooring(i: FlooringInput): FlooringOutput {
  const area = pos(i.length).times(pos(i.width)).plus(pos(i.extraArea));
  const withWaste = area.times(D(1).plus(pos(i.waste).div(100)));
  const box = pos(i.boxCoverage);
  const boxes = box.gt(0) && withWaste.gt(0) ? withWaste.div(box).toDecimalPlaces(9).toDecimalPlaces(0, Decimal.ROUND_UP).toNumber() : 0;
  const purchased = box.gt(0) ? box.times(boxes) : withWaste;
  const cost = cents(purchased.times(pos(i.price)));
  return {
    area: area.toDecimalPlaces(2).toNumber(),
    areaWithWaste: withWaste.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    boxes,
    purchasedArea: purchased.toDecimalPlaces(2).toNumber(),
    cost: cost.toNumber(),
    costPerFloorSqFt: area.gt(0) ? cents(cost.div(area)).toNumber() : 0,
  };
}
