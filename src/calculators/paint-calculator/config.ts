import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computePaint, type PaintInput, type PaintOutput } from './math.ts';

const cans = (o: PaintOutput) =>
  [o.buyGallons ? `${o.buyGallons} gallon${o.buyGallons === 1 ? '' : 's'}` : '', o.buyQuarts ? `${o.buyQuarts} quart${o.buyQuarts === 1 ? '' : 's'}` : ''].filter(Boolean).join(' + ') || 'none';

const config: CalculatorConfig<PaintInput, PaintOutput> = {
  slug: 'paint-calculator',
  category: 'construction',
  subtopic: 'Materials',
  name: 'Paint Calculator',
  h1: 'Paint Calculator',
  intro: 'How many gallons of paint a room needs, after doors and windows, for any number of coats, with or without the ceiling.',
  metaTitle: 'Paint Calculator: How Much Paint Do I Need?',
  metaDescription:
    'Work out how much paint a room needs: wall area minus doors and windows, times the coats, divided by coverage, with exactly how many gallons and quarts to buy.',
  primaryKeyword: 'paint calculator',
  secondaryKeywords: ['how much paint do i need', 'paint calculator for room', 'how many gallons of paint do i need', 'wall paint calculator'],
  synonyms: ['gallons of paint', 'paint coverage', 'square feet per gallon', 'interior paint', 'how much paint'],
  inputs: [
    { id: 'length', label: 'Room length', type: 'number', unit: 'ft', min: 0, max: 1_000, step: 0.5, sliderMax: 40, group: 'room' },
    { id: 'width', label: 'Room width', type: 'number', unit: 'ft', min: 0, max: 1_000, step: 0.5, sliderMax: 40, group: 'room' },
    { id: 'height', label: 'Wall height', type: 'number', unit: 'ft', min: 0, max: 100, step: 0.5, sliderMax: 16, helpText: 'Most ceilings are 8 to 9 feet.' },
    { id: 'doors', label: 'Doors', type: 'number', unit: 'count', min: 0, max: 100, step: 1, integer: true, slider: false, group: 'open' },
    { id: 'windows', label: 'Windows', type: 'number', unit: 'count', min: 0, max: 100, step: 1, integer: true, slider: false, group: 'open' },
    { id: 'coats', label: 'Coats', type: 'number', unit: 'count', min: 0, max: 10, step: 1, integer: true, slider: false, helpText: 'Two coats for most color changes; one for a fresh coat of the same color.' },
    { id: 'includeCeiling', label: 'Paint the ceiling too', type: 'checkbox' },
    { id: 'coverage', label: 'Coverage per gallon (sq ft)', type: 'number', unit: 'none', min: 50, max: 1_000, step: 5, slider: false, advanced: true, helpText: 'Check the can. Most interior paints cover 350 to 400 sq ft; textured or porous walls take more paint.' },
    { id: 'doorArea', label: 'Area of one door (sq ft)', type: 'number', unit: 'none', min: 0, max: 200, step: 1, slider: false, advanced: true, group: 'sizes', helpText: 'A standard 3 × 7 ft door is 21 sq ft.' },
    { id: 'windowArea', label: 'Area of one window (sq ft)', type: 'number', unit: 'none', min: 0, max: 200, step: 1, slider: false, advanced: true, group: 'sizes', helpText: 'A 3 × 5 ft window is 15 sq ft.' },
  ],
  defaults: { length: 14, width: 12, height: 8, doors: 1, windows: 2, coats: 2, coverage: 350, includeCeiling: false, doorArea: 21, windowArea: 15 },
  compute: computePaint,
  summarize: (_i, o) => ({
    headline: { label: 'Paint to buy', value: cans(o), sub: `${num(o.gallons, 2)} gallons needed for ${num(o.totalArea, 0)} sq ft of painting`, raw: o.gallons },
    items: [
      { label: 'Wall area to paint', value: `${num(o.wallArea, 0)} sq ft`, raw: o.wallArea },
      ...(o.ceilingArea > 0 ? [{ label: 'Ceiling area', value: `${num(o.ceilingArea, 0)} sq ft`, raw: o.ceilingArea }] : []),
      { label: 'Doors and windows left out', value: `${num(o.openingsArea, 0)} sq ft`, raw: o.openingsArea },
      { label: 'Left over for touch-ups', value: `${num(o.leftoverGallons, 2)} gallons`, raw: o.leftoverGallons },
    ],
  }),
  explain: (i, o) => {
    if (o.totalArea <= 0) return ['Enter the room size and the number of coats to see how much paint you need.'];
    const s = [`There are ${num(o.areaPerCoat, 0)} sq ft to paint${o.ceilingArea > 0 ? ', including the ceiling' : ''}. With ${num(i.coats, 0)} coat${i.coats === 1 ? '' : 's'} at ${num(i.coverage, 0)} sq ft per gallon, you need ${num(o.gallons, 2)} gallons: buy ${cans(o)}.`];
    s.push('Ceilings are usually painted with a separate flat ceiling paint, and trim with a semi-gloss, so buy those separately if you’re using different products.');
    s.push('If you’re covering a dark color, new drywall or a stained wall, a coat of primer first often saves a coat of paint.');
    return s;
  },
  steps: (i, o) => [
    { label: 'Wall area', formula: '2 × (length + width) × height', substituted: `2 × (${num(i.length, 2)} + ${num(i.width, 2)}) × ${num(i.height, 2)}`, result: `${num(o.grossWallArea, 0)} sq ft` },
    { label: 'Doors and windows', formula: 'doors × door area + windows × window area', substituted: `${num(i.doors, 0)} × ${num(i.doorArea, 0)} + ${num(i.windows, 0)} × ${num(i.windowArea, 0)}`, result: `${num(o.openingsArea, 0)} sq ft` },
    { label: 'Area per coat', formula: 'walls − openings (+ ceiling)', substituted: `${num(o.grossWallArea, 0)} − ${num(o.openingsArea, 0)}${o.ceilingArea > 0 ? ` + ${num(o.ceilingArea, 0)}` : ''}`, result: `${num(o.areaPerCoat, 0)} sq ft` },
    { label: 'Gallons', formula: 'area × coats ÷ coverage', substituted: `${num(o.areaPerCoat, 0)} × ${num(i.coats, 0)} ÷ ${num(i.coverage, 0)}`, result: `${num(o.gallons, 2)} gallons` },
    { label: 'To buy', formula: 'whole gallons + quarts for the rest (3+ quarts → 1 gallon)', substituted: `${num(o.gallons, 2)} gallons`, result: cans(o) },
  ],
  answerSummary: (i, o) => `A ${num(i.length, 0)} × ${num(i.width, 0)} ft room with ${num(i.height, 0)} ft walls has ${num(o.areaPerCoat, 0)} sq ft to paint and needs ${num(o.gallons, 2)} gallons for ${num(i.coats, 0)} coats, so buy ${cans(o)}.`,
  ogValue: (_i, o) => cans(o),
  related: ['flooring-calculator', 'concrete-calculator', 'roofing-calculator', 'gravel-calculator', 'heloc-calculator'],
  sources: [
    { title: 'American Coatings Association', url: 'https://www.paint.org/' },
    { title: 'EPA: Lead Renovation, Repair and Painting Program (homes built before 1978)', url: 'https://www.epa.gov/lead/lead-renovation-repair-and-painting-program' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
