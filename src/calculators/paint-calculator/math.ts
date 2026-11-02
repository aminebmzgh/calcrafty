/**
 * Paint for a rectangular room: wall area 2 × (length + width) × height, minus doors and windows,
 * plus the ceiling if chosen, times the number of coats, divided by the coverage per gallon.
 * The amount to buy is whole gallons plus quarts for the remainder (three or more quarts
 * become another gallon, which usually costs about the same).
 */
import { D, Decimal } from '../../lib/math/money.ts';

export interface PaintInput extends Record<string, unknown> {
  /** Room length, ft. */
  length: number;
  /** Room width, ft. */
  width: number;
  /** Wall height, ft. */
  height: number;
  doors: number;
  windows: number;
  coats: number;
  /** Square feet one gallon covers (from the can's label). */
  coverage: number;
  includeCeiling: boolean;
  /** Area of one door, sq ft (3 × 7 ft = 21). */
  doorArea: number;
  /** Area of one window, sq ft (3 × 5 ft = 15). */
  windowArea: number;
}

export interface PaintOutput {
  grossWallArea: number;
  openingsArea: number;
  wallArea: number;
  ceilingArea: number;
  /** Area painted once (walls, plus ceiling if included). */
  areaPerCoat: number;
  /** Area × coats. */
  totalArea: number;
  /** Exact gallons, 2 decimals. */
  gallons: number;
  buyGallons: number;
  buyQuarts: number;
  /** Paint left over after the job, gallons, 2 decimals. */
  leftoverGallons: number;
}

const pos = (n: number) => D(Math.max(0, n || 0));
const up = (d: Decimal) => d.toDecimalPlaces(9).toDecimalPlaces(0, Decimal.ROUND_UP).toNumber();

/** Whole gallons plus quarts covering an exact number of gallons. */
export function cansFor(gallons: Decimal): { gallons: number; quarts: number } {
  if (gallons.lte(0)) return { gallons: 0, quarts: 0 };
  const whole = gallons.toDecimalPlaces(9).toDecimalPlaces(0, Decimal.ROUND_DOWN);
  const quarts = up(gallons.minus(whole).times(4));
  if (quarts >= 3) return { gallons: whole.toNumber() + 1, quarts: 0 };
  return { gallons: whole.toNumber(), quarts };
}

export function computePaint(i: PaintInput): PaintOutput {
  const gross = pos(i.length).plus(pos(i.width)).times(2).times(pos(i.height));
  const openings = pos(Math.round(i.doors || 0)).times(pos(i.doorArea)).plus(pos(Math.round(i.windows || 0)).times(pos(i.windowArea)));
  const walls = gross.gt(openings) ? gross.minus(openings) : D(0);
  const ceiling = i.includeCeiling ? pos(i.length).times(pos(i.width)) : D(0);
  const perCoat = walls.plus(ceiling);
  const total = perCoat.times(pos(Math.round(i.coats || 0)));
  const gallons = pos(i.coverage).gt(0) ? total.div(pos(i.coverage)) : D(0);
  const cans = cansFor(gallons);
  const bought = D(cans.gallons).plus(D(cans.quarts).div(4));
  return {
    grossWallArea: gross.toDecimalPlaces(2).toNumber(),
    openingsArea: openings.toDecimalPlaces(2).toNumber(),
    wallArea: walls.toDecimalPlaces(2).toNumber(),
    ceilingArea: ceiling.toDecimalPlaces(2).toNumber(),
    areaPerCoat: perCoat.toDecimalPlaces(2).toNumber(),
    totalArea: total.toDecimalPlaces(2).toNumber(),
    gallons: gallons.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    buyGallons: cans.gallons,
    buyQuarts: cans.quarts,
    leftoverGallons: bought.minus(gallons).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
  };
}
