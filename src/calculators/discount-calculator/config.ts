import type { CalculatorConfig } from '../../lib/types.ts';
import { pct, usd } from '../../lib/format.ts';
import { computeDiscount, type DiscountInput, type DiscountOutput } from './math.ts';

const config: CalculatorConfig<DiscountInput, DiscountOutput> = {
  slug: 'discount-calculator',
  category: 'math',
  subtopic: 'Arithmetic',
  name: 'Discount Calculator',
  h1: 'Discount Calculator: Sale Price and Savings',
  intro: 'The sale price and how much you save for any percent or dollar discount, with stacked coupons and sales tax.',
  metaTitle: 'Discount Calculator: Sale Price After Percent Off',
  metaDescription:
    'Work out the sale price and your savings for any percent or dollar discount, stack an extra coupon on top and add sales tax, with a table from 10% to 75% off.',
  primaryKeyword: 'discount calculator',
  secondaryKeywords: ['percent off calculator', 'sale price calculator', 'price after discount calculator', 'double discount calculator'],
  synonyms: ['discount', 'percent off', '% off', 'sale price', 'coupon', 'savings', 'stacked discount', 'clearance'],
  inputs: [
    { id: 'price', label: 'Original price', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 0.01, sliderMax: 1000 },
    {
      id: 'type',
      label: 'Discount type',
      type: 'segmented',
      options: [
        { value: 'percent', label: 'Percent off' },
        { value: 'amount', label: 'Dollars off' },
      ],
    },
    { id: 'percentOff', label: 'Discount', type: 'number', unit: 'percent', min: 0, max: 100, step: 1, sliderMax: 90, showIf: (i) => i.type === 'percent' },
    { id: 'amountOff', label: 'Amount off', type: 'number', unit: 'usd', min: 0, max: 100_000_000, step: 0.01, sliderMax: 500, showIf: (i) => i.type === 'amount' },
    { id: 'extraPercent', label: 'Extra percent off (coupon on the sale price)', type: 'number', unit: 'percent', min: 0, max: 100, step: 1, sliderMax: 50, advanced: true, helpText: 'Applied after the first discount, the way stores stack coupons.' },
    { id: 'taxRate', label: 'Sales tax', type: 'number', unit: 'percent', min: 0, max: 25, step: 0.01, sliderMax: 12, advanced: true, helpText: 'Charged on the discounted price in most states.' },
  ],
  defaults: { price: 80, type: 'percent', percentOff: 25, amountOff: 15, extraPercent: 0, taxRate: 0 },
  compute: computeDiscount,
  summarize: (i, o) => ({
    headline: { label: 'Sale price', value: usd(o.salePrice, true), sub: `You save ${usd(o.savings, true)} (${pct(o.effectivePercent, 2)} off ${usd(o.original, true)})`, raw: o.salePrice, better: 'lower' },
    items: [
      { label: 'You save', value: usd(o.savings, true), raw: o.savings, better: 'higher' },
      { label: 'Total discount', value: pct(o.effectivePercent, 2), raw: o.effectivePercent, better: 'higher' },
      ...(i.taxRate > 0
        ? [
            { label: `Sales tax (${pct(i.taxRate, 3)})`, value: usd(o.tax, true), raw: o.tax },
            { label: 'Total with tax', value: usd(o.total, true), raw: o.total, better: 'lower' as const },
          ]
        : []),
    ],
  }),
  explain: (i, o) => {
    const first = i.type === 'amount' ? `${usd(i.amountOff, true)} off` : `${pct(i.percentOff, 2)} off`;
    const s = [`${first} ${usd(o.original, true)} brings the price to ${usd(o.afterFirst, true)}.`];
    if (i.extraPercent > 0) {
      s.push(`The extra ${pct(i.extraPercent, 2)} comes off the reduced price, not the original, so the final price is ${usd(o.salePrice, true)}: ${pct(o.effectivePercent, 2)} off in total, not the ${pct(o.addedPercent, 2)} you'd get by adding the two discounts.`);
    }
    s.push(`You save ${usd(o.savings, true)}${i.taxRate > 0 ? `, and with ${pct(i.taxRate, 3)} sales tax you pay ${usd(o.total, true)}` : ''}.`);
    return s;
  },
  steps: (i, o) => [
    i.type === 'amount'
      ? { label: 'First discount', formula: 'price − amount off', substituted: `${usd(o.original, true)} − ${usd(i.amountOff, true)}`, result: usd(o.afterFirst, true) }
      : { label: 'First discount', formula: 'price × (1 − discount ÷ 100)', substituted: `${usd(o.original, true)} × (1 − ${i.percentOff} ÷ 100)`, result: usd(o.afterFirst, true) },
    ...(i.extraPercent > 0
      ? [{ label: 'Extra discount', formula: 'reduced price × (1 − extra ÷ 100)', substituted: `${usd(o.afterFirst, true)} × (1 − ${i.extraPercent} ÷ 100)`, result: usd(o.salePrice, true) }]
      : []),
    { label: 'Savings', formula: 'original − sale price', substituted: `${usd(o.original, true)} − ${usd(o.salePrice, true)}`, result: usd(o.savings, true) },
    { label: 'Total percent off', formula: 'savings ÷ original × 100', substituted: `${usd(o.savings, true)} ÷ ${usd(o.original, true)} × 100`, result: pct(o.effectivePercent, 2) },
    ...(i.taxRate > 0 ? [{ label: 'With sales tax', formula: 'sale price × (1 + tax ÷ 100)', substituted: `${usd(o.salePrice, true)} + ${usd(o.tax, true)}`, result: usd(o.total, true) }] : []),
  ],
  answerSummary: (_i, o) => `${pct(o.effectivePercent, 2)} off ${usd(o.original, true)} is a sale price of ${usd(o.salePrice, true)}, saving you ${usd(o.savings, true)}.`,
  ogValue: (_i, o) => usd(o.salePrice, true),
  related: ['percentage-calculator', 'margin-calculator', 'tip-calculator', 'pay-raise-calculator', 'fraction-calculator'],
  sources: [
    { title: 'Federal Trade Commission: Guides Against Deceptive Pricing (16 CFR Part 233)', url: 'https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-233' },
    { title: 'NIST Handbook 130: Uniform Regulation for the Method of Sale of Commodities', url: 'https://www.nist.gov/pml/owm/publications/nist-handbooks/handbook-130' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
