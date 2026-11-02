import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { computeConcrete, BAG_YIELD_FT3, type ConcreteInput, type ConcreteOutput } from './math.ts';

const SHAPE = { slab: 'slab', footing: 'footing', column: 'column' } as const;

const config: CalculatorConfig<ConcreteInput, ConcreteOutput> = {
  slug: 'concrete-calculator',
  category: 'construction',
  subtopic: 'Area and volume',
  name: 'Concrete Calculator',
  h1: 'Concrete Calculator',
  intro: 'How much concrete you need for a slab, footing or column, in cubic yards for ready-mix or in 40, 60 or 80 lb bags.',
  metaTitle: 'Concrete Calculator: Cubic Yards and Bags Needed',
  metaDescription:
    'Calculate concrete for a slab, footing or round column in cubic yards, cubic feet and cubic meters, plus how many 40, 60 or 80 lb bags to buy, waste included.',
  primaryKeyword: 'concrete calculator',
  secondaryKeywords: ['how much concrete do i need', 'concrete slab calculator', 'concrete bag calculator', 'cubic yards of concrete calculator'],
  synonyms: ['cement calculator', 'quikrete', 'ready mix', 'footing', 'sonotube', 'yards of concrete'],
  inputs: [
    {
      id: 'shape',
      label: 'What are you pouring?',
      type: 'segmented',
      options: [
        { value: 'slab', label: 'Slab' },
        { value: 'footing', label: 'Footing or wall' },
        { value: 'column', label: 'Round column' },
      ],
    },
    { id: 'length', label: 'Length', type: 'number', unit: 'ft', min: 0, max: 10_000, step: 0.5, sliderMax: 100, group: 'dims', showIf: (i) => i.shape !== 'column' },
    { id: 'width', label: 'Width', type: 'number', unit: 'ft', min: 0, max: 10_000, step: 0.5, sliderMax: 100, group: 'dims', showIf: (i) => i.shape === 'slab' },
    { id: 'thickness', label: 'Thickness', type: 'number', unit: 'in', min: 0, max: 120, step: 0.5, sliderMax: 24, showIf: (i) => i.shape === 'slab', helpText: '4 inches for patios and walkways, 5 to 6 inches for driveways.' },
    { id: 'footingWidth', label: 'Footing width', type: 'number', unit: 'in', min: 0, max: 240, step: 1, sliderMax: 48, group: 'ft', showIf: (i) => i.shape === 'footing' },
    { id: 'footingDepth', label: 'Footing depth', type: 'number', unit: 'in', min: 0, max: 240, step: 1, sliderMax: 48, group: 'ft', showIf: (i) => i.shape === 'footing' },
    { id: 'diameter', label: 'Diameter', type: 'number', unit: 'in', min: 0, max: 240, step: 1, sliderMax: 48, group: 'col', showIf: (i) => i.shape === 'column' },
    { id: 'height', label: 'Height or depth', type: 'number', unit: 'ft', min: 0, max: 500, step: 0.5, sliderMax: 20, group: 'col', showIf: (i) => i.shape === 'column' },
    { id: 'quantity', label: 'How many', type: 'number', unit: 'count', min: 0, max: 10_000, step: 1, integer: true, slider: false, helpText: 'Identical pieces, such as fence post holes.' },
    { id: 'waste', label: 'Extra for waste', type: 'number', unit: 'percent', min: 0, max: 50, step: 1, sliderMax: 25, helpText: '5% to 10% covers spillage, uneven ground and forms bowing out.' },
    {
      id: 'bagSize',
      label: 'Bag size',
      type: 'select',
      options: [
        { value: '80', label: '80 lb bags (0.60 cu ft each)' },
        { value: '60', label: '60 lb bags (0.45 cu ft each)' },
        { value: '40', label: '40 lb bags (0.30 cu ft each)' },
      ],
    },
  ],
  defaults: { shape: 'slab', length: 10, width: 10, thickness: 4, footingWidth: 16, footingDepth: 8, diameter: 12, height: 4, quantity: 1, waste: 10, bagSize: '80' },
  compute: computeConcrete,
  summarize: (i, o) => ({
    headline: { label: 'Concrete needed', value: `${num(o.cubicYards, 2)} cubic yards`, sub: `${num(o.cubicFeet, 2)} cu ft or ${num(o.cubicMeters, 2)} m³, including ${num(i.waste, 0)}% extra`, raw: o.cubicYards },
    items: [
      { label: `${i.bagSize} lb bags`, value: `${num(o.bags, 0)} bags (${num(o.bagWeight, 0)} lb)`, raw: o.bags },
      { label: 'Ready-mix order', value: `${num(o.orderYards, 2)} cubic yards`, raw: o.orderYards },
      { label: 'Before waste', value: `${num(o.netCubicYards, 2)} cubic yards (${num(o.netCubicFeet, 2)} cu ft)`, raw: o.netCubicYards },
    ],
  }),
  explain: (i, o) => {
    if (o.cubicFeet <= 0) return ['Enter the size of what you’re pouring to see how much concrete you need.'];
    const s = [`You need about ${num(o.cubicYards, 2)} cubic yards (${num(o.cubicFeet, 2)} cubic feet) of concrete, including ${num(i.waste, 0)}% extra for waste.`];
    s.push(
      o.cubicYards >= 1
        ? `That’s ${num(o.bags, 0)} bags of ${i.bagSize} lb mix, about ${num(o.bagWeight, 0)} lb to haul and mix by hand. At around a cubic yard or more, ready-mix delivered by truck is usually easier: order ${num(o.orderYards, 2)} cubic yards.`
        : `That’s ${num(o.bags, 0)} bags of ${i.bagSize} lb mix. For a job this size, bagged concrete is usually simpler and cheaper than a ready-mix delivery.`,
    );
    s.push('Concrete can’t be topped up once it starts to set, so running short is worse than having a little left over.');
    return s;
  },
  steps: (i, o) => [
    {
      label: 'Volume of one piece',
      formula: i.shape === 'column' ? 'π × (diameter ÷ 2)² × height' : i.shape === 'footing' ? 'length × width × depth' : 'length × width × thickness',
      substituted:
        i.shape === 'column'
          ? `π × (${num(i.diameter, 2)} in ÷ 24)² ft × ${num(i.height, 2)} ft`
          : i.shape === 'footing'
            ? `${num(i.length, 2)} ft × (${num(i.footingWidth, 2)} ÷ 12) ft × (${num(i.footingDepth, 2)} ÷ 12) ft`
            : `${num(i.length, 2)} ft × ${num(i.width, 2)} ft × (${num(i.thickness, 2)} ÷ 12) ft`,
      result: `${num(o.pieceCubicFeet, 2)} cu ft`,
    },
    { label: 'Total before waste', formula: 'piece volume × how many', substituted: `× ${num(i.quantity, 0)}`, result: `${num(o.netCubicFeet, 2)} cu ft` },
    { label: 'Add waste', formula: 'volume × (1 + waste %)', substituted: `${num(o.netCubicFeet, 2)} × ${num(o.wasteFactor, 2)}`, result: `${num(o.cubicFeet, 2)} cu ft` },
    { label: 'Cubic yards', formula: 'cubic feet ÷ 27', substituted: `${num(o.cubicFeet, 2)} ÷ 27`, result: `${num(o.cubicYards, 2)} yd³` },
    { label: 'Bags', formula: 'cubic feet ÷ yield per bag, rounded up', substituted: `${num(o.cubicFeet, 2)} ÷ ${num(BAG_YIELD_FT3[i.bagSize], 2)}`, result: `${num(o.bags, 0)} bags` },
  ],
  answerSummary: (i, o) => `A ${SHAPE[i.shape]} of this size needs about ${num(o.cubicYards, 2)} cubic yards of concrete including ${num(i.waste, 0)}% waste, or ${num(o.bags, 0)} bags of ${i.bagSize} lb mix.`,
  ogValue: (_i, o) => `${num(o.cubicYards, 2)} yd³`,
  related: ['gravel-calculator', 'flooring-calculator', 'paint-calculator', 'roofing-calculator', 'heloc-calculator'],
  sources: [
    { title: 'QUIKRETE: Concrete Mix No. 1101 data sheet (bag yields)', url: 'https://www.quikrete.com/PDFs/DATA_SHEET-Concrete%20Mix%201101.pdf' },
    { title: 'Portland Cement Association', url: 'https://www.cement.org/' },
    { title: 'NIST Special Publication 811: Guide for the Use of the SI (conversion factors)', url: 'https://www.nist.gov/pml/special-publication-811' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
