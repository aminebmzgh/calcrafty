import type { CalculatorConfig } from '../../lib/types.ts';
import { num, usd } from '../../lib/format.ts';
import { computeCarCo2, GRAMS_PER_GALLON, TYPICAL_TONS, type CarCo2Input, type CarCo2Output } from './math.ts';

const config: CalculatorConfig<CarCo2Input, CarCo2Output> = {
  slug: 'car-co2-calculator',
  category: 'ecology',
  subtopic: 'Carbon footprint',
  name: 'Car CO2 Emissions Calculator',
  h1: 'Car CO2 Emissions Calculator',
  intro: 'How much carbon dioxide your car emits each year from the miles you drive and its fuel economy, using EPA emission factors.',
  metaTitle: 'Car CO2 Emissions Calculator: Your Driving Footprint',
  metaDescription:
    'Calculate your car’s yearly CO2 emissions from miles driven and mpg, using the EPA figure of 8,887 grams per gallon of gas, and compare with a typical car.',
  primaryKeyword: 'car co2 emissions calculator',
  secondaryKeywords: ['car carbon footprint calculator', 'vehicle emissions calculator', 'co2 per mile calculator', 'car emissions calculator'],
  synonyms: ['carbon footprint', 'tailpipe emissions', 'co2', 'greenhouse gas', 'mpg', 'gas mileage'],
  inputs: [
    { id: 'milesPerYear', label: 'Miles driven per year', type: 'number', unit: 'mi', min: 0, max: 200_000, step: 100, sliderMax: 40_000, helpText: 'The U.S. average is roughly 11,500 miles a year.' },
    { id: 'mpg', label: 'Fuel economy', type: 'number', unit: 'none', min: 1, max: 150, step: 0.5, sliderMin: 10, sliderMax: 60, helpText: 'Miles per gallon, combined. Find your car’s rating at fueleconomy.gov.' },
    { id: 'fuel', label: 'Fuel', type: 'segmented', options: [{ value: 'gasoline', label: 'Gasoline' }, { value: 'diesel', label: 'Diesel' }] },
    { id: 'fuelPrice', label: 'Fuel price per gallon', type: 'number', unit: 'usd', min: 0, max: 20, step: 0.01, slider: false, advanced: true },
  ],
  defaults: { milesPerYear: 11_500, mpg: 25, fuel: 'gasoline', fuelPrice: 3.2 },
  compute: computeCarCo2,
  summarize: (_i, o) => ({
    headline: { label: 'CO2 per year', value: o.valid ? `${num(o.tons, 2)} metric tons` : '—', sub: `${num(o.pounds, 0)} lb, from ${num(o.gallons, 1)} gallons of fuel`, raw: o.tons, better: 'lower' },
    items: [
      { label: 'Per mile', value: `${num(o.gramsPerMile, 0)} g CO2`, raw: o.gramsPerMile, better: 'lower' },
      { label: 'Per month', value: `${num(o.kgPerMonth, 0)} kg CO2`, raw: o.kgPerMonth, better: 'lower' },
      { label: `Vs the typical car (${num(TYPICAL_TONS, 1)} t)`, value: `${num(o.vsTypical, 0)}%`, raw: o.vsTypical, better: 'lower' },
      { label: 'With 10 mpg better fuel economy', value: `${num(o.tonsAtPlus10Mpg, 2)} t`, raw: o.tonsAtPlus10Mpg, better: 'lower' },
      { label: 'Fuel cost per year', value: usd(o.fuelCost), raw: o.fuelCost, better: 'lower' },
    ],
  }),
  explain: (i, o) => {
    if (!o.valid) return ['Enter your car’s fuel economy in miles per gallon.'];
    return [
      `Driving ${num(i.milesPerYear, 0)} miles at ${num(i.mpg, 1)} mpg burns ${num(o.gallons, 1)} gallons of ${i.fuel}. Each gallon produces ${num(GRAMS_PER_GALLON[i.fuel], 0)} grams of CO2, so your car emits about ${num(o.tons, 2)} metric tons a year.`,
      `That’s ${num(o.vsTypical, 0)}% of the EPA’s typical passenger vehicle, which emits about ${num(TYPICAL_TONS, 1)} metric tons a year${o.vsTypical > 100 ? '; better fuel economy or fewer miles would bring it down' : ''}.`,
      'This counts tailpipe CO2 only. Making the fuel and the car, and small amounts of other greenhouse gases, add to the total footprint.',
    ];
  },
  steps: (i, o) => [
    { label: 'Fuel used', formula: 'miles ÷ mpg', substituted: `${num(i.milesPerYear, 0)} ÷ ${num(i.mpg, 1)}`, result: `${num(o.gallons, 1)} gallons` },
    { label: 'CO2', formula: `gallons × ${num(GRAMS_PER_GALLON[i.fuel], 0)} g`, substituted: `${num(o.gallons, 1)} × ${num(GRAMS_PER_GALLON[i.fuel], 0)} g`, result: `${num(o.kg, 0)} kg` },
    { label: 'Metric tons', formula: 'kg ÷ 1,000', substituted: `${num(o.kg, 0)} ÷ 1,000`, result: `${num(o.tons, 2)} t` },
    { label: 'Per mile', formula: `${num(GRAMS_PER_GALLON[i.fuel], 0)} g ÷ mpg`, substituted: `${num(GRAMS_PER_GALLON[i.fuel], 0)} ÷ ${num(i.mpg, 1)}`, result: `${num(o.gramsPerMile, 0)} g/mile` },
  ],
  answerSummary: (i, o) => `Driving ${num(i.milesPerYear, 0)} miles a year in a ${num(i.mpg, 0)} mpg gasoline car emits about ${num(o.tons, 2)} metric tons of CO2, or ${num(o.gramsPerMile, 0)} grams per mile.`,
  ogValue: (_i, o) => `${num(o.tons, 2)} t CO2`,
  related: ['auto-loan-calculator', 'car-affordability-calculator', 'length-converter', 'ohms-law-calculator', 'tip-calculator'],
  sources: [
    { title: 'EPA: Greenhouse gas emissions from a typical passenger vehicle', url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle' },
    { title: 'U.S. DOE and EPA: fueleconomy.gov', url: 'https://www.fueleconomy.gov/' },
  ],
  lastReviewed: '2026-11-02',
};

export default config;
