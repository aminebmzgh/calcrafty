/**
 * The calculator definition contract (docs/BUILD-BRIEF.md section 9).
 * Every page, sitemap entry, schema block, search entry and internal link for a
 * calculator is generated from its `src/calculators/<slug>/config.ts`.
 */

export type Category = 'finance' | 'health' | 'math' | 'everyday';

/** Keys into src/data/live/snapshot.json that an input can default to. */
export type LiveKey = 'mortgage30' | 'mortgage15' | 'cpiInflation' | 'treasury10' | 'savingsRate' | 'autoLoan60' | 'personalLoan24' | 'creditCard';

export type NumberUnit =
  | 'usd'
  | 'percent'
  | 'years'
  | 'months'
  | 'days'
  | 'hours'
  | 'count'
  | 'lbs'
  | 'kg'
  | 'cm'
  | 'in'
  | 'ft'
  | 'km'
  | 'mi'
  | 'none';

interface BaseInput<I> {
  /** Must be a key of the calculator's `defaults` object; also the URL query parameter name. */
  id: Extract<keyof I, string>;
  label: string;
  helpText?: string;
  /** Collapsed under "More options". */
  advanced?: boolean;
  /** Hide the input unless this returns true (e.g. metric vs imperial fields). */
  showIf?: (input: I) => boolean;
  /** Consecutive inputs sharing a group render side by side. */
  group?: string;
}

export interface NumberInputDef<I> extends BaseInput<I> {
  type: 'number';
  unit: NumberUnit;
  min: number;
  max: number;
  step: number;
  /** Slider range when narrower than min/max (e.g. home price slider to $2M, field accepts $50M). */
  sliderMin?: number;
  sliderMax?: number;
  /** Show a slider next to the text field. Default true. */
  slider?: boolean;
  integer?: boolean;
  liveDefault?: LiveKey;
  /** Optional unit toggle: a sibling select input id whose value switches this field (e.g. $ vs %). */
  unitToggle?: {
    id: Extract<keyof I, string>;
    label: string;
    options: { value: string; label: string; unit: NumberUnit; min: number; max: number; step: number; sliderMax?: number }[];
    /** Converts the field value when the unit changes (math lives in math.ts). */
    convert: (value: number, from: string, to: string, input: I) => number;
  };
}

export interface SelectInputDef<I> extends BaseInput<I> {
  type: 'select' | 'segmented';
  options: { value: string; label: string }[];
}

export interface CheckboxInputDef<I> extends BaseInput<I> {
  type: 'checkbox';
}

export interface DateInputDef<I> extends BaseInput<I> {
  type: 'date';
  /** ISO dates. */
  min?: string;
  max?: string;
}

export interface TextInputDef<I> extends BaseInput<I> {
  type: 'text' | 'textarea';
  placeholder?: string;
  maxLength?: number;
  /** Return an error message or null. */
  validate?: (value: string) => string | null;
}

/** Inputs the calculator's Widget renders itself (lists of debts, courses, etc.). Serialized to the URL as JSON. */
export interface CustomInputDef<I> extends BaseInput<I> {
  type: 'custom';
}

export type InputDef<I> =
  | NumberInputDef<I>
  | SelectInputDef<I>
  | CheckboxInputDef<I>
  | DateInputDef<I>
  | TextInputDef<I>
  | CustomInputDef<I>;

export interface ResultItem {
  label: string;
  value: string;
  /** Raw number used to highlight differences in the compare table. */
  raw?: number;
  /** For compare highlighting: is a bigger number better? */
  better?: 'higher' | 'lower';
}

export interface ResultSummary {
  headline: ResultItem & { sub?: string };
  items: ResultItem[];
}

export interface MathStep {
  label: string;
  /** The general formula, e.g. "M = P × r(1+r)^n / ((1+r)^n − 1)". */
  formula?: string;
  /** The formula with the user's numbers substituted. */
  substituted: string;
  result?: string;
}

export interface StatePageConfig {
  /** Which data set in src/data/static/states.ts drives the page. */
  kind: 'mortgage' | 'paycheck';
}

export interface Source {
  title: string;
  url: string;
}

export interface CalculatorConfig<I extends Record<string, unknown>, O> {
  slug: string;
  category: Category;
  name: string;
  h1: string;
  /** One-line description under the H1. */
  intro: string;
  /** <= 60 chars, unique. */
  metaTitle: string;
  /** 140–160 chars, unique. */
  metaDescription: string;
  /** Must exist in research/keyword-map.csv. */
  primaryKeyword: string;
  secondaryKeywords: string[];
  /** Extra search synonyms for the site search (e.g. "emi", "house payment"). */
  synonyms?: string[];
  /** Sub-topic used to group calculators on category hubs. */
  subtopic: string;
  inputs: InputDef<I>[];
  /** Build-time defaults; live values are merged in by the registry. */
  defaults: I;
  /** Cross-field validation; per-field min/max checks are automatic. */
  validate?: (input: I) => { id: Extract<keyof I, string>; message: string }[];
  compute: (input: I) => O;
  summarize: (input: I, out: O) => ResultSummary;
  explain: (input: I, out: O) => string[];
  steps: (input: I, out: O) => MathStep[];
  answerSummary: (input: I, out: O) => string;
  /** A key number for the OG image, e.g. "$1,896/mo". */
  ogValue: (input: I, out: O) => string;
  related: string[];
  statePages?: StatePageConfig;
  sources: Source[];
  reviewedBy?: string;
  /** ISO date of the last math/data review. */
  lastReviewed: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCalculatorConfig = CalculatorConfig<any, any>;

export interface WidgetProps<I> {
  /** Starting values: config defaults with live data and page overrides (state pages) merged in. */
  initial: I;
  /** Root-relative page path, used for share links and history. */
  path: string;
  /** Static AnswerBox sentence for the default scenario. */
  answer?: string;
  /** Compact embed mode: no history, favorites or compare. */
  embed?: boolean;
}
