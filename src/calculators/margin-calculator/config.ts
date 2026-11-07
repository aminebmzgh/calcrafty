import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeMargin, type MarginInput, type MarginMode, type MarginOutput } from './math.ts';

const MODES: Record<MarginMode, string> = {
  costPrice: 'Cost and price (find margin and markup)',
  costMargin: 'Cost and target margin (find price)',
  costMarkup: 'Cost and markup (find price)',
  priceMargin: 'Price and target margin (find maximum cost)',
};
const mk = (o: MarginOutput) => (Number.isFinite(o.markup) ? pct(o.markup, 2) : 'no cost entered');

const config: CalculatorConfig<MarginInput, MarginOutput> = {
  slug: 'margin-calculator',
  category: 'finance',
  subtopic: 'Business',
  name: 'Margin Calculator',
  h1: 'Margin Calculator: Profit Margin, Markup and Price',
  intro: 'Gross margin, markup and profit from cost and price, or the selling price that hits a target margin, with a margin-to-markup table.',
  metaTitle: 'Margin Calculator: Profit Margin, Markup and Price',
  metaDescription:
    'Find gross profit margin and markup from cost and price, or the price for a target margin. Shows profit per unit and in total, and converts margin to markup.',
  primaryKeyword: 'margin calculator',
  secondaryKeywords: ['profit margin calculator', 'gross margin calculator', 'markup calculator', 'selling price calculator'],
  synonyms: ['profit margin', 'gross margin', 'markup', 'mark up', 'selling price', 'gross profit', 'pricing'],
  inputs: [
    { id: 'mode', label: 'What do you know?', type: 'select', options: (Object.keys(MODES) as MarginMode[]).map((k) => ({ value: k, label: MODES[k] })) },
    { id: 'cost', label: 'Cost per unit', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 0.01, sliderMax: 1000, helpText: 'What the item costs you to buy or make.', showIf: (i) => i.mode !== 'priceMargin' },
    { id: 'price', label: 'Selling price per unit', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 0.01, sliderMax: 2000, showIf: (i) => i.mode === 'costPrice' || i.mode === 'priceMargin' },
    { id: 'margin', label: 'Target gross margin', type: 'number', unit: 'percent', min: -1000, max: 99.99, step: 0.1, sliderMin: 0, sliderMax: 90, showIf: (i) => i.mode === 'costMargin' || i.mode === 'priceMargin' },
    { id: 'markup', label: 'Markup on cost', type: 'number', unit: 'percent', min: -99.99, max: 10_000, step: 0.1, sliderMin: 0, sliderMax: 300, showIf: (i) => i.mode === 'costMarkup' },
    { id: 'units', label: 'Units sold', type: 'number', unit: 'count', min: 1, max: 100_000_000, step: 1, integer: true, slider: false, advanced: true, helpText: 'For total revenue and profit.' },
  ],
  defaults: { mode: 'costPrice', cost: 45, price: 75, margin: 40, markup: 50, units: 1 },
  compute: computeMargin,
  summarize: (i, o) => {
    if (!o.valid) return { headline: { label: 'Result', value: '—', sub: o.problem }, items: [] };
    const priceAnswer = i.mode === 'costMargin' || i.mode === 'costMarkup';
    const costAnswer = i.mode === 'priceMargin';
    return {
      headline: priceAnswer
        ? { label: 'Selling price', value: usd(o.price, true), sub: `${usd(o.profit, true)} profit · ${pct(o.margin, 2)} margin · ${mk(o)} markup`, raw: o.price }
        : costAnswer
          ? { label: 'Maximum cost', value: usd(o.cost, true), sub: `${usd(o.profit, true)} profit on a ${usd(o.price, true)} price`, raw: o.cost }
          : { label: 'Gross margin', value: pct(o.margin, 2), sub: `${usd(o.profit, true)} profit · ${mk(o)} markup`, raw: o.margin, better: 'higher' },
      items: [
        { label: 'Profit per unit', value: usd(o.profit, true), raw: o.profit, better: 'higher' },
        { label: 'Gross margin', value: pct(o.margin, 2), raw: o.margin, better: 'higher' },
        { label: 'Markup', value: mk(o), raw: Number.isFinite(o.markup) ? o.markup : undefined },
        ...(o.units > 1
          ? [
              { label: `Revenue on ${o.units.toLocaleString('en-US')} units`, value: usd(o.totalRevenue, true), raw: o.totalRevenue },
              { label: `Profit on ${o.units.toLocaleString('en-US')} units`, value: usd(o.totalProfit, true), raw: o.totalProfit, better: 'higher' as const },
            ]
          : []),
      ],
    };
  },
  explain: (_i, o) => {
    if (!o.valid) return [o.problem ?? 'Check the values you entered.'];
    const s = [`Selling at ${usd(o.price, true)} something that costs ${usd(o.cost, true)} leaves ${usd(o.profit, true)} of gross profit per unit.`];
    if (o.profit >= 0) {
      s.push(`That profit is ${pct(o.margin, 2)} of the selling price (the margin) and ${mk(o)} of the cost (the markup). Margin is always the smaller number, because it divides by the larger price.`);
    } else {
      s.push(`The price is below cost, so each sale loses ${usd(-o.profit, true)}: a margin of ${pct(o.margin, 2)}.`);
    }
    s.push('Gross margin counts only the direct cost of the item. Rent, wages, shipping, card fees and marketing come out of the gross profit, so the net margin is lower.');
    return s;
  },
  steps: (_i, o) =>
    o.valid
      ? [
          { label: 'Profit', formula: 'price − cost', substituted: `${usd(o.price, true)} − ${usd(o.cost, true)}`, result: usd(o.profit, true) },
          { label: 'Gross margin', formula: 'profit ÷ price × 100', substituted: `${usd(o.profit, true)} ÷ ${usd(o.price, true)} × 100`, result: pct(o.margin, 4) },
          { label: 'Markup', formula: 'profit ÷ cost × 100', substituted: `${usd(o.profit, true)} ÷ ${usd(o.cost, true)} × 100`, result: Number.isFinite(o.markup) ? pct(o.markup, 4) : 'undefined (cost is zero)' },
          { label: 'Price for a target margin', formula: 'price = cost ÷ (1 − margin)', substituted: `${usd(o.cost, true)} ÷ (1 − ${pct(o.margin, 4)})`, result: usd(o.price, true) },
        ]
      : [],
  answerSummary: (_i, o) =>
    o.valid
      ? `An item that costs ${usd(o.cost, true)} and sells for ${usd(o.price, true)} makes ${usd(o.profit, true)} of profit: a gross margin of ${pct(o.margin, 2)} and a markup of ${mk(o)}.`
      : 'Enter a cost and a selling price to see the profit margin and markup.',
  ogValue: (_i, o) => (o.valid ? `${pct(o.margin, 1)} margin` : '—'),
  related: ['discount-calculator', 'percentage-calculator', 'salary-to-hourly-calculator', 'loan-calculator', 'investment-calculator'],
  sources: [
    { title: 'U.S. Small Business Administration: Manage your finances', url: 'https://www.sba.gov/business-guide/manage-your-business/manage-your-finances' },
    { title: 'IRS Publication 334: Tax Guide for Small Business (gross profit and cost of goods sold)', url: 'https://www.irs.gov/publications/p334' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
