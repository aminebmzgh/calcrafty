/**
 * Numeric field: text box (friendly formats: 300k, $300,000, 6.5%) + optional slider,
 * unit adornments, an optional $ / % style unit toggle and inline fix-it validation.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { NumberUnit } from '../../lib/types.ts';
import { formatInputValue, num, parseFriendly, unitLabel, usd } from '../../lib/format.ts';
import UnitToggle from './UnitToggle.tsx';
import type { ComponentChildren } from 'preact';

export interface NumberInputProps {
  id: string;
  label: string;
  value: number;
  unit: NumberUnit;
  min: number;
  max: number;
  step: number;
  sliderMin?: number;
  sliderMax?: number;
  slider?: boolean;
  integer?: boolean;
  helpText?: string;
  onValue: (n: number) => void;
  toggle?: { name: string; label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void };
  /** Extra content under the field (e.g. the AsOfBadge). */
  footer?: ComponentChildren;
  /** Cross-field error from the calculator's validate(). */
  externalError?: string;
  /** e2e hook: a valid alternative value the test suite types. */
  e2eValue?: string;
}

export function rangeMessage(label: string, unit: NumberUnit, min: number, max: number): string {
  const f = (n: number) => (unit === 'usd' ? usd(n) : unit === 'percent' ? `${num(n, 3)}%` : `${num(n, 3)}${unitLabel(unit) ? ' ' + unitLabel(unit) : ''}`);
  return `${label} must be between ${f(min)} and ${f(max)}.`;
}

export function validateNumber(raw: string, p: Pick<NumberInputProps, 'label' | 'unit' | 'min' | 'max' | 'integer'>): { value: number | null; error: string | null } {
  if (raw.trim() === '') return { value: null, error: `Enter ${p.label.toLowerCase()}.` };
  const n = parseFriendly(raw);
  if (n === null) return { value: null, error: `${p.label} must be a number, like ${p.unit === 'usd' ? '250,000 or 250k' : p.unit === 'percent' ? '6.5' : '12'}.` };
  if (p.integer && !Number.isInteger(n)) return { value: null, error: `${p.label} must be a whole number.` };
  if (n < p.min || n > p.max) return { value: null, error: rangeMessage(p.label, p.unit, p.min, p.max) };
  return { value: n, error: null };
}

export default function NumberInput(p: NumberInputProps) {
  const [text, setText] = useState(() => formatInputValue(p.value, p.unit, p.step));
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);

  // Reflect outside changes (slider, reset, URL state, unit toggle) when the user isn't typing.
  useEffect(() => {
    if (!focused.current) {
      setText(formatInputValue(p.value, p.unit, p.step));
      setError(null);
    }
  }, [p.value, p.unit, p.step]);

  const onText = (raw: string) => {
    setText(raw);
    const { value, error: err } = validateNumber(raw, p);
    setError(err);
    if (value !== null) p.onValue(value);
  };

  const sMin = p.sliderMin ?? p.min;
  const sMax = Math.max(p.sliderMax ?? p.max, Math.min(p.value, p.max));
  const helpId = `${p.id}-help`;
  const errId = `${p.id}-err`;
  const shown = error ?? p.externalError ?? null;
  const describedBy = [p.helpText ? helpId : '', shown ? errId : ''].filter(Boolean).join(' ') || undefined;
  const prefix = p.unit === 'usd' ? '$' : null;
  const suffix = p.unit === 'usd' || p.unit === 'none' || p.unit === 'count' ? null : p.unit === 'percent' ? '%' : unitLabel(p.unit);

  return (
    <div class="field">
      <div class="field-label">
        <label for={p.id}>{p.label}</label>
        {p.toggle && <UnitToggle {...p.toggle} />}
      </div>
      <div class="input-shell" data-invalid={shown ? 'true' : undefined}>
        {prefix && (
          <span class="adorn adorn-start" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={p.id}
          name={p.id}
          type="text"
          inputMode={p.integer || (p.unit === 'usd' && p.step >= 1) ? 'numeric' : 'decimal'}
          autoComplete="off"
          spellcheck={false}
          data-testid={p.e2eValue ? 'e2e-input' : undefined}
          data-e2e-value={p.e2eValue}
          value={text}
          aria-invalid={shown ? true : undefined}
          aria-describedby={describedBy}
          onFocus={() => (focused.current = true)}
          onBlur={() => {
            focused.current = false;
            if (!error) setText(formatInputValue(p.value, p.unit, p.step));
          }}
          onInput={(e) => onText((e.target as HTMLInputElement).value)}
        />
        {suffix && (
          <span class="adorn adorn-end" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {p.slider !== false && (
        <input
          class="slider no-print"
          type="range"
          min={sMin}
          max={sMax}
          step={p.step}
          value={Math.min(Math.max(p.value, sMin), sMax)}
          aria-label={`${p.label} slider`}
          aria-valuetext={p.unit === 'usd' ? usd(p.value) : p.unit === 'percent' ? `${num(p.value, 3)}%` : `${num(p.value, 3)} ${unitLabel(p.unit)}`.trim()}
          onInput={(e) => {
            const n = Number((e.target as HTMLInputElement).value);
            focused.current = false;
            p.onValue(n);
          }}
        />
      )}
      {p.helpText && (
        <p id={helpId} class="field-help">
          {p.helpText}
        </p>
      )}
      {shown && (
        <p id={errId} class="field-error" role="alert">
          {shown}
        </p>
      )}
      {p.footer}
    </div>
  );
}
