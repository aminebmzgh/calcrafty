import type { CalculatorConfig } from '../../lib/types.ts';
import { num } from '../../lib/format.ts';
import { clock, computePace, RACES, toSeconds, type PaceInput, type PaceOutput } from './math.ts';

const notTime = (i: PaceInput) => i.mode !== 'time';
const notPace = (i: PaceInput) => i.mode !== 'pace';
const raceName = (i: PaceInput) => (i.race === 'custom' ? `${num(i.customDistance, 2)} ${i.distanceUnit === 'mi' ? 'miles' : 'km'}` : RACES[i.race].label.toLowerCase());

const config: CalculatorConfig<PaceInput, PaceOutput> = {
  slug: 'running-pace-calculator',
  category: 'sports',
  subtopic: 'Running',
  name: 'Running Pace Calculator',
  h1: 'Running Pace Calculator',
  intro: 'Find your pace per mile or kilometer, your finish time or your distance, with splits and race-time predictions.',
  metaTitle: 'Running Pace Calculator: Pace, Time & Splits | Calcrafty',
  metaDescription:
    'Calculate running pace per mile or km, finish time or distance for a 5K, 10K, half or full marathon. Includes mile or km splits and race predictions by Riegel.',
  primaryKeyword: 'pace calculator',
  secondaryKeywords: ['running pace calculator', 'marathon pace calculator', 'race pace calculator'],
  synonyms: ['pace', 'running', 'marathon', 'half marathon', '5k', '10k', 'splits', 'mile time'],
  inputs: [
    {
      id: 'mode',
      label: 'Calculate my',
      type: 'segmented',
      options: [
        { value: 'pace', label: 'Pace' },
        { value: 'time', label: 'Finish time' },
        { value: 'distance', label: 'Distance' },
      ],
    },
    {
      id: 'race',
      label: 'Distance',
      type: 'select',
      showIf: (i) => i.mode !== 'distance',
      options: [...Object.entries(RACES).map(([value, r]) => ({ value, label: r.label })), { value: 'custom', label: 'Custom distance' }],
    },
    { id: 'customDistance', label: 'Custom distance', type: 'number', unit: 'none', min: 0.1, max: 500, step: 0.1, slider: false, group: 'custom', showIf: (i) => i.mode !== 'distance' && i.race === 'custom' },
    { id: 'distanceUnit', label: 'Distance unit', type: 'segmented', group: 'custom', options: [{ value: 'mi', label: 'Miles' }, { value: 'km', label: 'Kilometers' }] },
    { id: 'hours', label: 'Hours', type: 'number', unit: 'none', min: 0, max: 99, step: 1, integer: true, slider: false, group: 'time', showIf: notTime },
    { id: 'minutes', label: 'Minutes', type: 'number', unit: 'none', min: 0, max: 59, step: 1, integer: true, slider: false, group: 'time', showIf: notTime },
    { id: 'seconds', label: 'Seconds', type: 'number', unit: 'none', min: 0, max: 59, step: 1, integer: true, slider: false, group: 'time', showIf: notTime },
    { id: 'paceMin', label: 'Pace minutes', type: 'number', unit: 'none', min: 0, max: 59, step: 1, integer: true, slider: false, group: 'pace', showIf: notPace },
    { id: 'paceSec', label: 'Pace seconds', type: 'number', unit: 'none', min: 0, max: 59, step: 1, integer: true, slider: false, group: 'pace', showIf: notPace },
    { id: 'paceUnit', label: 'Pace per', type: 'segmented', group: 'pace', showIf: notPace, options: [{ value: 'mi', label: 'Mile' }, { value: 'km', label: 'Kilometer' }] },
  ],
  defaults: { mode: 'pace', race: 'marathon', customDistance: 3, distanceUnit: 'mi', hours: 4, minutes: 0, seconds: 0, paceMin: 9, paceSec: 0, paceUnit: 'mi' },
  validate: (i) => {
    if (i.mode !== 'time' && toSeconds(i.hours, i.minutes, i.seconds) <= 0) return [{ id: 'minutes', message: 'Enter a finish time greater than zero.' }];
    if (i.mode !== 'pace' && toSeconds(0, i.paceMin, i.paceSec) <= 0) return [{ id: 'paceMin', message: 'Enter a pace greater than zero.' }];
    return [];
  },
  compute: computePace,
  summarize: (i, o) => {
    const head =
      i.mode === 'pace'
        ? { label: 'Your pace', value: `${clock(i.distanceUnit === 'km' ? o.paceKm : o.paceMi)} /${i.distanceUnit}`, sub: `${clock(i.distanceUnit === 'km' ? o.paceMi : o.paceKm)} /${i.distanceUnit === 'km' ? 'mi' : 'km'}`, raw: o.paceKm, better: 'lower' as const }
        : i.mode === 'time'
          ? { label: `Finish time, ${raceName(i)}`, value: clock(o.timeSec), raw: o.timeSec, better: 'lower' as const }
          : { label: 'Distance', value: `${num(i.distanceUnit === 'mi' ? o.distanceMi : o.distanceKm, 2)} ${i.distanceUnit}`, raw: o.distanceKm, better: 'higher' as const };
    return {
      headline: head,
      items: [
        { label: 'Pace per mile', value: clock(o.paceMi), raw: o.paceMi, better: 'lower' },
        { label: 'Pace per km', value: clock(o.paceKm), raw: o.paceKm, better: 'lower' },
        { label: 'Speed', value: `${num(o.mph, 2)} mph · ${num(o.kph, 2)} km/h`, raw: o.kph, better: 'higher' },
        { label: 'Finish time', value: clock(o.timeSec), raw: o.timeSec },
      ],
    };
  },
  explain: (_i, o) => {
    const m = o.predictions.find((p) => p.key === 'marathon')!;
    const t = o.predictions.find((p) => p.key === '10k')!;
    return [
      `Covering ${num(o.distanceKm, 2)} km in ${clock(o.timeSec)} means running ${clock(o.paceMi)} per mile (${clock(o.paceKm)} per km), or ${num(o.mph, 1)} mph.`,
      `Based on this run, Riegel’s formula predicts about ${clock(t.riegel)} for a 10K and ${clock(m.riegel)} for a marathon. Longer races are slower per mile, so predictions are more realistic than just holding the same pace.`,
      'Predictions assume similar training for each distance; marathon predictions in particular need long runs to be achievable.',
    ];
  },
  steps: (i, o) => [
    { label: 'Total time in seconds', formula: 'hours × 3,600 + minutes × 60 + seconds', substituted: i.mode === 'time' ? 'from your pace × distance' : `${i.hours} × 3,600 + ${i.minutes} × 60 + ${i.seconds}`, result: `${num(o.timeSec, 0)} s` },
    { label: 'Pace', formula: 'time ÷ distance (1 mile = 1.609344 km)', substituted: `${num(o.timeSec, 0)} s ÷ ${num(o.distanceKm, 3)} km`, result: `${clock(o.paceKm)} /km = ${clock(o.paceMi)} /mi` },
    { label: 'Speed', formula: 'distance ÷ hours', substituted: `${num(o.distanceKm, 3)} km ÷ ${num(o.hours, 4)} h`, result: `${num(o.kph, 2)} km/h` },
    { label: 'Race prediction (Riegel)', formula: 'T₂ = T₁ × (D₂ ÷ D₁)^1.06', substituted: `marathon: ${clock(o.timeSec)} × (42.195 ÷ ${num(o.distanceKm, 3)})^1.06`, result: clock(o.predictions.find((p) => p.key === 'marathon')!.riegel) },
  ],
  answerSummary: (i, o) => `To run a ${raceName(i)} in ${clock(o.timeSec)}, you need to average ${clock(o.paceMi)} per mile (${clock(o.paceKm)} per km).`,
  ogValue: (_i, o) => `${clock(o.paceMi)}/mi`,
  related: ['calorie-calculator', 'macro-calculator', 'bmi-calculator', 'body-fat-calculator'],
  sources: [
    { title: 'Riegel PS. Athletic records and human endurance. American Scientist 1981;69:285–90', url: 'https://www.jstor.org/stable/27850427' },
    { title: 'World Athletics: Competition rules (road race distances)', url: 'https://worldathletics.org/about-iaaf/documents/book-of-rules' },
    { title: 'NIST: Definition of the international mile (1,609.344 m)', url: 'https://www.nist.gov/pml/owm/si-units-length' },
    { title: 'CDC: Physical activity guidelines for adults', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html' },
  ],
  lastReviewed: '2026-11-01',
};

export default config;
