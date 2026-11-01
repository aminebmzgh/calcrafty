/** Renders one config InputDef with the right control. Custom inputs are rendered by the calculator's Widget. */
import type { ComponentChildren } from 'preact';
import type { InputDef } from '../../lib/types.ts';
import NumberInput from './NumberInput.tsx';
import UnitToggle from './UnitToggle.tsx';
import AsOfBadge from './AsOfBadge.tsx';
import { liveValue } from '../../data/live/index.ts';

export interface InputFieldProps<I extends Record<string, unknown>> {
  def: InputDef<I>;
  values: I;
  set: (id: keyof I & string, value: unknown) => void;
  /** Replace several values at once (unit toggles convert the field and switch mode together). */
  patch: (p: Partial<I>) => void;
  error?: string;
  renderCustom?: (def: InputDef<I>) => ComponentChildren;
  idPrefix?: string;
}

export default function InputField<I extends Record<string, unknown>>({ def, values, set, patch, error, renderCustom, idPrefix = 'in' }: InputFieldProps<I>) {
  const id = `${idPrefix}-${def.id}`;
  const help = def.helpText;
  /** Select/segmented change: set the value plus any derived values (e.g. unit conversion). */
  const choose = (v: string) => {
    if (def.type !== 'select' && def.type !== 'segmented') return;
    patch({ [def.id]: coerce(v, values[def.id]), ...(def.onChange?.(v, values) ?? {}) } as Partial<I>);
  };

  switch (def.type) {
    case 'number': {
      const value = Number(values[def.id]);
      const t = def.unitToggle;
      const mode = t ? String(values[t.id]) : null;
      const opt = t?.options.find((o) => o.value === mode);
      const unit = opt?.unit ?? def.unit;
      const min = opt?.min ?? def.min;
      const max = opt?.max ?? def.max;
      const step = opt?.step ?? def.step;
      const sliderMax = opt ? (opt.sliderMax ?? opt.max) : def.sliderMax;
      return (
        <NumberInput
          id={id}
          label={def.label}
          value={value}
          unit={unit}
          min={min}
          max={max}
          step={step}
          sliderMin={opt ? opt.min : def.sliderMin}
          sliderMax={sliderMax}
          slider={def.slider}
          integer={def.integer}
          helpText={help}
          externalError={error}
          onValue={(n) => set(def.id, n)}
          toggle={
            t && mode
              ? {
                  name: `${id}-unit`,
                  label: t.label,
                  value: mode,
                  options: t.options,
                  onChange: (next) => patch({ [t.id]: next, [def.id]: t.convert(value, mode, next, values) } as Partial<I>),
                }
              : undefined
          }
          footer={def.liveDefault ? <AsOfBadge series={liveValue(def.liveDefault)} current={value} onApply={(v) => set(def.id, v)} /> : undefined}
        />
      );
    }
    case 'select':
      return (
        <div class="field">
          <label class="field-label" for={id}>
            {def.label}
          </label>
          <div class="input-shell">
            <select id={id} name={def.id} value={String(values[def.id])} aria-describedby={help ? `${id}-help` : undefined} onChange={(e) => choose((e.target as HTMLSelectElement).value)}>
              {def.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {help && (
            <p id={`${id}-help`} class="field-help">
              {help}
            </p>
          )}
        </div>
      );
    case 'segmented':
      return (
        <div class="field">
          <span class="field-label" id={`${id}-label`}>
            {def.label}
          </span>
          <UnitToggle name={id} label={def.label} value={String(values[def.id])} options={def.options} onChange={choose} />
          {help && <p class="field-help">{help}</p>}
        </div>
      );
    case 'checkbox':
      return (
        <div class="field">
          <label class="check" for={id}>
            <input id={id} name={def.id} type="checkbox" checked={Boolean(values[def.id])} aria-describedby={help ? `${id}-help` : undefined} onChange={(e) => set(def.id, (e.target as HTMLInputElement).checked)} />
            {def.label}
          </label>
          {help && (
            <p id={`${id}-help`} class="field-help">
              {help}
            </p>
          )}
        </div>
      );
    case 'date':
      return (
        <div class="field">
          <label class="field-label" for={id}>
            {def.label}
          </label>
          <div class="input-shell" data-invalid={error ? 'true' : undefined}>
            <input
              id={id}
              name={def.id}
              type="date"
              data-testid={def.e2eValue ? 'e2e-input' : undefined}
              data-e2e-value={def.e2eValue}
              value={String(values[def.id])}
              min={def.min}
              max={def.max}
              aria-invalid={error ? true : undefined}
              aria-describedby={[help ? `${id}-help` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined}
              onInput={(e) => {
                const v = (e.target as HTMLInputElement).value;
                if (v) set(def.id, v);
              }}
            />
          </div>
          {help && (
            <p id={`${id}-help`} class="field-help">
              {help}
            </p>
          )}
          {error && (
            <p id={`${id}-err`} class="field-error" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    case 'text':
    case 'textarea': {
      const msg = error ?? def.validate?.(String(values[def.id])) ?? null;
      const describedBy = [help ? `${id}-help` : '', msg ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
      return (
        <div class="field">
          <label class="field-label" for={id}>
            {def.label}
          </label>
          <div class="input-shell" data-invalid={msg ? 'true' : undefined}>
            {def.type === 'textarea' ? (
              <textarea id={id} name={def.id} data-testid={def.e2eValue ? 'e2e-input' : undefined} data-e2e-value={def.e2eValue} placeholder={def.placeholder} maxLength={def.maxLength} aria-invalid={msg ? true : undefined} aria-describedby={describedBy} value={String(values[def.id])} onInput={(e) => set(def.id, (e.target as HTMLTextAreaElement).value)} />
            ) : (
              <input id={id} name={def.id} data-testid={def.e2eValue ? 'e2e-input' : undefined} data-e2e-value={def.e2eValue} type="text" placeholder={def.placeholder} maxLength={def.maxLength} autoComplete="off" aria-invalid={msg ? true : undefined} aria-describedby={describedBy} value={String(values[def.id])} onInput={(e) => set(def.id, (e.target as HTMLInputElement).value)} />
            )}
          </div>
          {help && (
            <p id={`${id}-help`} class="field-help">
              {help}
            </p>
          )}
          {msg && (
            <p id={`${id}-err`} class="field-error" role="alert">
              {msg}
            </p>
          )}
        </div>
      );
    }
    case 'custom':
      return <>{renderCustom?.(def)}</>;
  }
}

/** Keeps select values typed like their defaults (e.g. term years stay numbers). */
function coerce(v: string, like: unknown): unknown {
  return typeof like === 'number' ? Number(v) : v;
}
