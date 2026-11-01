/** Shared input definitions for the health calculators: units toggle, sex, age, height and weight. */
import type { InputDef } from './types.ts';
import { convertBodyUnits, type BodyFields } from './math/body.ts';

export const BODY_DEFAULTS: BodyFields = { units: 'imperial', heightFt: 5, heightIn: 9, heightCm: 175.3, weightLb: 170, weightKg: 77.1 };

type WithBody = BodyFields & Record<string, unknown>;

export function unitsInput<I extends WithBody>(): InputDef<I> {
  return {
    id: 'units' as InputDef<I>['id'],
    label: 'Units',
    type: 'segmented',
    options: [
      { value: 'imperial', label: 'lb, ft/in' },
      { value: 'metric', label: 'kg, cm' },
    ],
    onChange: (v, input) => convertBodyUnits(v, input) as Partial<I>,
  };
}

export function heightInputs<I extends WithBody>(): InputDef<I>[] {
  const imperial = (i: I) => i.units === 'imperial';
  return [
    { id: 'heightFt' as InputDef<I>['id'], label: 'Height (feet)', type: 'number', unit: 'ft', min: 1, max: 8, step: 1, integer: true, slider: false, group: 'height', showIf: imperial },
    { id: 'heightIn' as InputDef<I>['id'], label: 'Height (inches)', type: 'number', unit: 'in', min: 0, max: 11.9, step: 0.5, slider: false, group: 'height', showIf: imperial },
    { id: 'heightCm' as InputDef<I>['id'], label: 'Height', type: 'number', unit: 'cm', min: 50, max: 250, step: 0.5, sliderMin: 120, sliderMax: 220, showIf: (i: I) => !imperial(i) },
  ];
}

export function weightInputs<I extends WithBody>(label = 'Weight'): InputDef<I>[] {
  return [
    { id: 'weightLb' as InputDef<I>['id'], label, type: 'number', unit: 'lbs', min: 20, max: 1000, step: 0.5, sliderMin: 80, sliderMax: 400, showIf: (i: I) => i.units === 'imperial' },
    { id: 'weightKg' as InputDef<I>['id'], label, type: 'number', unit: 'kg', min: 10, max: 450, step: 0.1, sliderMin: 35, sliderMax: 180, showIf: (i: I) => i.units === 'metric' },
  ];
}

export function sexInput<I extends Record<string, unknown>>(): InputDef<I> {
  return {
    id: 'sex' as InputDef<I>['id'],
    label: 'Sex',
    type: 'segmented',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
    ],
    helpText: 'The formulas use biological sex because it affects body composition.',
  };
}

export function ageInput<I extends Record<string, unknown>>(min = 18): InputDef<I> {
  return { id: 'age' as InputDef<I>['id'], label: 'Age', type: 'number', unit: 'years', min, max: 100, step: 1, integer: true, slider: false };
}

export const HEALTH_SOURCES = {
  cdcBmi: { title: 'CDC: Adult BMI categories', url: 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html' },
  nihBmi: { title: 'NIH NHLBI: Calculate your body mass index', url: 'https://www.nhlbi.nih.gov/health/educational/lose_wt/BMI/bmicalc.htm' },
  whoBmi: { title: 'WHO: Obesity and overweight fact sheet', url: 'https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight' },
} as const;
