import type { CalculatorConfig } from '../../lib/types.ts';
import { num, usd } from '../../lib/format.ts';
import { computeFuel, switchUnits, type FuelInput, type FuelOutput, type Units } from './math.ts';

const us = (i: FuelInput) => i.units !== 'metric';
const dist = (i: FuelInput) => (us(i) ? 'mi' : 'km');
const vol = (i: FuelInput, n: number) => (us(i) ? `${num(n, 2)} gal` : `${num(n, 2)} L`);
const per = (i: FuelInput) => (us(i) ? 'gallon' : 'litre');
const econ = (i: FuelInput) => (us(i) ? `${num(i.mpg, 1)} mpg` : `${num(i.l100km, 1)} L/100 km`);

const config: CalculatorConfig<FuelInput, FuelOutput> = {
  slug: 'fuel-cost-calculator',
  category: 'other',
  subtopic: 'Driving',
  name: 'Fuel Cost Calculator',
  h1: 'Fuel Cost Calculator: Gas Cost for Any Trip',
  intro: 'What a road trip or commute costs in gas, from distance, fuel economy and this week’s U.S. average price, split between passengers.',
  metaTitle: 'Fuel Cost Calculator: Gas Cost for a Trip or Commute',
  metaDescription:
    'Work out the gas cost of any road trip or commute from distance, mpg and this week’s U.S. average gas price, one way or round trip, split between passengers.',
  primaryKeyword: 'fuel cost calculator',
  secondaryKeywords: ['gas cost calculator', 'trip cost calculator', 'gas money calculator', 'road trip gas calculator', 'gas calculator'],
  synonyms: ['gas', 'gasoline', 'fuel', 'road trip', 'mpg', 'gas money', 'commute cost', 'trip cost', 'diesel'],
  inputs: [
    {
      id: 'units',
      label: 'Units',
      type: 'segmented',
      options: [
        { value: 'us', label: 'Miles and gallons' },
        { value: 'metric', label: 'Kilometres and litres' },
      ],
      onChange: (v, i) => switchUnits(v as Units, i),
    },
    { id: 'miles', label: 'Distance (one way)', type: 'number', unit: 'mi', min: 0, max: 1_000_000, step: 1, sliderMax: 3000, showIf: us },
    { id: 'mpg', label: 'Fuel economy (miles per gallon)', type: 'number', unit: 'none', min: 0, max: 500, step: 0.1, sliderMin: 5, sliderMax: 80, helpText: 'Combined mpg from fueleconomy.gov, or your own average from the trip computer.', showIf: us },
    { id: 'pricePerGallon', label: 'Gas price (per gallon)', type: 'number', unit: 'usd', min: 0, max: 50, step: 0.001, sliderMax: 8, liveDefault: 'gasPrice', showIf: us },
    { id: 'km', label: 'Distance (one way)', type: 'number', unit: 'km', min: 0, max: 1_000_000, step: 1, sliderMax: 5000, showIf: (i) => !us(i) },
    { id: 'l100km', label: 'Fuel consumption (litres per 100 km)', type: 'number', unit: 'none', min: 0, max: 100, step: 0.1, sliderMin: 2, sliderMax: 25, showIf: (i) => !us(i) },
    { id: 'pricePerLitre', label: 'Fuel price (per litre)', type: 'number', unit: 'usd', min: 0, max: 20, step: 0.001, sliderMax: 3, showIf: (i) => !us(i) },
    { id: 'roundTrip', label: 'Round trip (double the distance)', type: 'checkbox' },
    { id: 'people', label: 'Splitting between', type: 'number', unit: 'count', min: 1, max: 100, step: 1, integer: true, slider: false },
    {
      id: 'fuel',
      label: 'Fuel (for CO₂)',
      type: 'select',
      advanced: true,
      options: [
        { value: 'gasoline', label: 'Gasoline' },
        { value: 'diesel', label: 'Diesel' },
      ],
    },
  ],
  defaults: { units: 'us', miles: 350, mpg: 28, pricePerGallon: 3.5, km: 563.3, l100km: 8.4, pricePerLitre: 0.925, roundTrip: false, people: 1, fuel: 'gasoline' },
  compute: computeFuel,
  summarize: (i, o) => ({
    headline: {
      label: o.people > 1 ? 'Fuel cost per person' : 'Fuel cost',
      value: usd(o.people > 1 ? o.perPerson : o.cost, true),
      sub: `${vol(i, o.fuelUsed)} for ${num(o.distance, 1)} ${dist(i)}${o.people > 1 ? ` · ${usd(o.cost, true)} in total` : ''}`,
      raw: o.people > 1 ? o.perPerson : o.cost,
      better: 'lower',
    },
    items: [
      { label: 'Total fuel cost', value: usd(o.cost, true), raw: o.cost, better: 'lower' },
      { label: 'Fuel used', value: vol(i, o.fuelUsed), raw: o.fuelUsed, better: 'lower' },
      { label: `Cost per ${us(i) ? 'mile' : 'kilometre'}`, value: `$${num(o.costPerUnit, 3)}`, raw: o.costPerUnit, better: 'lower' },
      { label: 'CO₂ from the fuel', value: us(i) ? `${num(o.co2Lb, 0)} lb` : `${num(o.co2Kg, 0)} kg`, raw: o.co2Kg, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    const s = [
      `Driving ${num(o.distance, 1)} ${dist(i)}${i.roundTrip ? ' there and back' : ''} at ${econ(i)} uses ${vol(i, o.fuelUsed)} of fuel. At $${num(us(i) ? i.pricePerGallon : i.pricePerLitre, 3)} a ${per(i)}, that's ${usd(o.cost, true)}.`,
    ];
    if (o.people > 1) s.push(`Split ${o.people} ways, each person pays ${usd(o.perPerson, true)}, rounded up to the cent so the fuel is covered.`);
    s.push('Real-world fuel economy drops at highway speeds above about 50 mph, with heavy loads or a roof box, and in very cold weather, so budget a little extra for a long trip.');
    return s;
  },
  steps: (i, o) => [
    ...(i.roundTrip ? [{ label: 'Distance', formula: 'one way × 2', substituted: `${num(us(i) ? i.miles : i.km, 1)} ${dist(i)} × 2`, result: `${num(o.distance, 1)} ${dist(i)}` }] : []),
    us(i)
      ? { label: 'Gallons', formula: 'miles ÷ mpg', substituted: `${num(o.distance, 1)} ÷ ${num(i.mpg, 2)}`, result: vol(i, o.fuelUsed) }
      : { label: 'Litres', formula: 'km × L/100 km ÷ 100', substituted: `${num(o.distance, 1)} × ${num(i.l100km, 2)} ÷ 100`, result: vol(i, o.fuelUsed) },
    { label: 'Cost', formula: `fuel × price per ${per(i)}`, substituted: `${num(o.fuelUsed, 3)} × $${num(us(i) ? i.pricePerGallon : i.pricePerLitre, 3)}`, result: usd(o.cost, true) },
    ...(o.people > 1 ? [{ label: 'Each person', formula: 'cost ÷ people', substituted: `${usd(o.cost, true)} ÷ ${o.people}`, result: usd(o.perPerson, true) }] : []),
  ],
  answerSummary: (i, o) =>
    `A ${num(o.distance, 0)}-${us(i) ? 'mile' : 'kilometre'} trip at ${econ(i)} uses ${vol(i, o.fuelUsed)} of fuel, which costs ${usd(o.cost, true)} at $${num(us(i) ? i.pricePerGallon : i.pricePerLitre, 3)} a ${per(i)}.`,
  ogValue: (_i, o) => usd(o.cost, true),
  related: ['car-co2-calculator', 'car-affordability-calculator', 'auto-loan-calculator', 'electricity-cost-calculator', 'tip-calculator'],
  sources: [
    { title: 'U.S. Energy Information Administration: U.S. regular gasoline price, weekly (GASREGW), via FRED', url: 'https://fred.stlouisfed.org/series/GASREGW' },
    { title: 'U.S. EPA: Greenhouse gas emissions from a typical passenger vehicle (8,887 g CO₂ per gallon)', url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle' },
    { title: 'U.S. DOE and EPA: fueleconomy.gov, fuel economy ratings and driving tips', url: 'https://www.fueleconomy.gov/feg/drivehabits.jsp' },
  ],
  lastReviewed: '2026-11-06',
};

export default config;
