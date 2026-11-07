import type { CalculatorConfig } from '../../lib/types.ts';
import { num, usd } from '../../lib/format.ts';
import { computeElectricity, type ElectricityInput, type ElectricityOutput } from './math.ts';

const rateText = (r: number) => `$${num(r, 4)} per kWh`;

const config: CalculatorConfig<ElectricityInput, ElectricityOutput> = {
  slug: 'electricity-cost-calculator',
  category: 'physics',
  subtopic: 'Energy and power',
  name: 'Electricity Cost Calculator',
  h1: 'Electricity Cost Calculator: What Your Appliances Cost to Run',
  intro: 'Turn any appliance’s watts and hours into kilowatt-hours and dollars per day, month and year, at the U.S. average price or your own rate.',
  metaTitle: 'Electricity Cost Calculator: Cost to Run Any Appliance',
  metaDescription:
    'Work out what an appliance costs to run per hour, day, month and year from its watts (or amps and volts), hours of use and your price per kWh, with the math.',
  primaryKeyword: 'electricity cost calculator',
  secondaryKeywords: ['energy cost calculator', 'kwh calculator', 'appliance energy cost calculator', 'watts to kwh calculator', 'power consumption calculator'],
  synonyms: ['electricity', 'kwh', 'kilowatt hour', 'electric bill', 'power bill', 'appliance cost', 'energy use', 'watts'],
  inputs: [
    {
      id: 'powerBy',
      label: 'Power rating',
      type: 'segmented',
      options: [
        { value: 'watts', label: 'Watts' },
        { value: 'amps', label: 'Amps and volts' },
      ],
    },
    { id: 'watts', label: 'Power (watts)', type: 'number', unit: 'none', min: 0, max: 1_000_000, step: 1, sliderMax: 5000, helpText: 'On the label or nameplate, usually on the back or bottom.', showIf: (i) => i.powerBy === 'watts' },
    { id: 'amps', label: 'Current (amps)', type: 'number', unit: 'none', min: 0, max: 10_000, step: 0.1, slider: false, showIf: (i) => i.powerBy === 'amps' },
    { id: 'volts', label: 'Voltage (volts)', type: 'number', unit: 'none', min: 0, max: 100_000, step: 1, slider: false, helpText: 'Most U.S. outlets are 120 V; dryers and ranges use 240 V.', showIf: (i) => i.powerBy === 'amps' },
    { id: 'hoursPerDay', label: 'Hours used per day', type: 'number', unit: 'hours', min: 0, max: 24, step: 0.1, sliderMax: 24 },
    { id: 'daysPerWeek', label: 'Days used per week', type: 'number', unit: 'days', min: 0, max: 7, step: 1, integer: true, sliderMax: 7 },
    { id: 'rate', label: 'Electricity price (dollars per kWh)', type: 'number', unit: 'usd', min: 0, max: 5, step: 0.001, sliderMax: 0.6, liveDefault: 'electricityPrice', helpText: 'Your bill shows it; divide the energy charges by the kWh used for the true rate.' },
    { id: 'quantity', label: 'Number of devices', type: 'number', unit: 'count', min: 1, max: 100_000, step: 1, integer: true, slider: false, advanced: true },
  ],
  defaults: { powerBy: 'watts', watts: 1500, amps: 12.5, volts: 120, hoursPerDay: 5, daysPerWeek: 7, rate: 0.196, quantity: 1 },
  compute: computeElectricity,
  summarize: (_i, o) => ({
    headline: { label: 'Cost per month', value: usd(o.costPerMonth, true), sub: `${usd(o.costPerYear, true)} a year · ${num(o.kwhPerYear, 1)} kWh`, raw: o.costPerMonth, better: 'lower' },
    items: [
      { label: 'Cost per hour of use', value: `$${num(o.costPerHour, 4)}`, raw: o.costPerHour, better: 'lower' },
      { label: 'Cost per day of use', value: usd(o.costPerDay, true), raw: o.costPerDay, better: 'lower' },
      { label: 'Energy per day of use', value: `${num(o.kwhPerDay, 3)} kWh`, raw: o.kwhPerDay, better: 'lower' },
      { label: 'Energy per year', value: `${num(o.kwhPerYear, 1)} kWh`, raw: o.kwhPerYear, better: 'lower' },
    ],
  }),
  explain: (i, o) => [
    `A ${num(o.watts, 1)}-watt load running ${num(i.hoursPerDay, 1)} hours a day uses ${num(o.kwhPerDay, 3)} kilowatt-hours each day it runs${i.daysPerWeek < 7 ? `, on ${i.daysPerWeek} days a week` : ''}.`,
    `At ${rateText(i.rate)} that's ${usd(o.costPerDay, true)} a day of use, about ${usd(o.costPerMonth, true)} a month and ${usd(o.costPerYear, true)} a year.`,
    'The label shows the maximum power. Devices that cycle, such as refrigerators, heaters with a thermostat and air conditioners, draw full power only part of the time, so enter the hours they actually run, or measure with a plug-in usage meter.',
  ],
  steps: (i, o) => [
    ...(i.powerBy === 'amps' ? [{ label: 'Watts', formula: 'amps × volts', substituted: `${num(i.amps, 2)} A × ${num(i.volts, 0)} V`, result: `${num(o.watts / Math.max(1, i.quantity), 1)} W` }] : []),
    { label: 'Energy per day', formula: 'watts × hours ÷ 1,000', substituted: `${num(o.watts, 1)} W × ${num(i.hoursPerDay, 2)} h ÷ 1,000`, result: `${num(o.kwhPerDay, 4)} kWh` },
    { label: 'Energy per year', formula: 'kWh per day × days per week × 365 ÷ 7', substituted: `${num(o.kwhPerDay, 4)} × ${i.daysPerWeek} × 365 ÷ 7`, result: `${num(o.kwhPerYear, 4)} kWh` },
    { label: 'Cost per year', formula: 'kWh × price per kWh', substituted: `${num(o.kwhPerYear, 4)} kWh × ${rateText(i.rate)}`, result: usd(o.costPerYear, true) },
    { label: 'Cost per month', formula: 'yearly cost ÷ 12', substituted: `${usd(o.costPerYear, true)} ÷ 12`, result: usd(o.costPerMonth, true) },
  ],
  answerSummary: (i, o) => `A ${num(o.watts, 0)}-watt appliance used ${num(i.hoursPerDay, 1)} hours a day costs about ${usd(o.costPerMonth, true)} a month (${usd(o.costPerYear, true)} a year) at ${rateText(i.rate)}.`,
  ogValue: (_i, o) => `${usd(o.costPerMonth, true)}/mo`,
  related: ['ohms-law-calculator', 'car-co2-calculator', 'fuel-cost-calculator', 'emergency-fund-calculator', 'percentage-calculator'],
  sources: [
    { title: 'U.S. Bureau of Labor Statistics: Average price, electricity per kWh, U.S. city average (APU000072610), via FRED', url: 'https://fred.stlouisfed.org/series/APU000072610' },
    { title: 'Virginia Cooperative Extension 2901-9014: Estimating Appliance and Home Electronic Energy Use', url: 'https://www.pubs.ext.vt.edu/2901/2901-9014/2901-9014.html' },
    { title: 'U.S. Energy Information Administration: How much electricity does an American home use?', url: 'https://www.eia.gov/tools/faqs/faq.php?id=97&t=3' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
