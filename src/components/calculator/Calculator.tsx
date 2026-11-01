/**
 * The calculator shell every Widget uses. It owns state (signals), validation, the 150 ms debounce,
 * URL state, history, compare and favorites. Formulas come from the config (math.ts); this file has none.
 *
 * Server render and first client render use `initial` only, so hydration never shifts layout.
 * URL parameters are applied after hydration.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { useComputed, useSignal, useSignalEffect } from '@preact/signals';
import type { CalculatorConfig, InputDef, ResultSummary } from '../../lib/types.ts';
import { fromQuery, toQuery } from '../../lib/url-state.ts';
import { addHistory, clearHistory, getHistory, isFavorite, toggleFavorite, type HistoryEntry } from '../../lib/storage.ts';
import InputField from './InputField.tsx';
import ResultCard from './ResultCard.tsx';
import ExplainPanel from './ExplainPanel.tsx';
import ShowTheMath from './ShowTheMath.tsx';
import ShareButton from './ShareButton.tsx';
import CompareTable, { MAX_SCENARIOS, type Scenario } from './CompareTable.tsx';
import HistoryPanel from './HistoryPanel.tsx';

const DEBOUNCE_MS = 150;
const SITE = 'https://calcrafty.com';

export interface CalculatorProps<I extends Record<string, unknown>, O> {
  config: CalculatorConfig<I, O>;
  initial: I;
  path: string;
  answer?: string;
  embed?: boolean;
  /** Charts and tables for the current result (rendered below Explain / Show the math). */
  renderVisuals?: (input: I, out: O) => ComponentChildren;
  /** Extra content in the results column under the readout. */
  renderResultsExtra?: (input: I, out: O) => ComponentChildren;
  /** Renders inputs of type 'custom'. */
  renderCustom?: (def: InputDef<I>, values: I, set: (id: keyof I & string, v: unknown) => void) => ComponentChildren;
}

interface Computed<O> {
  out: O;
  summary: ResultSummary;
  explain: string[];
}

function visible<I>(def: InputDef<I>, values: I) {
  return !def.showIf || def.showIf(values);
}

/** Groups consecutive inputs that share `group` so they render side by side. */
function chunk<I>(defs: InputDef<I>[]): InputDef<I>[][] {
  const out: InputDef<I>[][] = [];
  for (const d of defs) {
    const last = out.at(-1);
    if (d.group && last && last[0]!.group === d.group) last.push(d);
    else out.push([d]);
  }
  return out;
}

export default function Calculator<I extends Record<string, unknown>, O>(props: CalculatorProps<I, O>) {
  const { config, initial, path, answer, embed = false } = props;
  const values = useSignal<I>(initial);
  const committed = useSignal<I>(initial);
  const hydrated = useSignal(false);
  const touched = useRef(false);
  const scenarios = useSignal<Scenario[]>([]);
  const history = useSignal<HistoryEntry[]>([]);
  const favorite = useSignal(false);
  const nextId = useRef(1);
  const resultsRef = useRef<HTMLDivElement>(null);
  const readoutVisible = useSignal(false);

  // Mobile: a slim sticky bar shows the headline result while the full readout is off screen.
  useEffect(() => {
    const el = resultsRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => (readoutVisible.value = !!e?.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const crossErrors = useComputed(() => {
    const errs = config.validate?.(values.value) ?? [];
    return Object.fromEntries(errs.map((e) => [e.id, e.message])) as Record<string, string>;
  });

  const result = useComputed<Computed<O> | null>(() => {
    const input = committed.value;
    try {
      const out = config.compute(input);
      return { out, summary: config.summarize(input, out), explain: config.explain(input, out) };
    } catch {
      return null;
    }
  });
  const steps = useComputed(() => (result.value ? config.steps(committed.value, result.value.out) : []));

  // Hydration: apply URL parameters, load local state.
  useEffect(() => {
    const fromUrl = fromQuery(window.location.search, initial);
    if (Object.keys(fromUrl).length) {
      const merged = { ...initial, ...fromUrl };
      values.value = merged;
      committed.value = merged;
    }
    history.value = getHistory();
    favorite.value = isFavorite(config.slug);
    hydrated.value = true;
  }, []);

  // Debounced commit of valid inputs.
  useSignalEffect(() => {
    const v = values.value;
    if (Object.keys(crossErrors.value).length) return;
    const t = setTimeout(() => (committed.value = v), DEBOUNCE_MS);
    return () => clearTimeout(t);
  });

  // URL state + history after the user changes something.
  useSignalEffect(() => {
    const v = committed.value;
    if (!hydrated.peek() || embed) return;
    const q = toQuery(v, initial);
    window.history.replaceState(null, '', path + q + window.location.hash);
    if (!touched.current) return;
    const r = result.peek();
    if (!r) return;
    const t = setTimeout(() => {
      history.value = addHistory({ slug: config.slug, name: config.name, path, query: q, summary: `${r.summary.headline.label}: ${r.summary.headline.value}`, at: Date.now() });
    }, 1500);
    return () => clearTimeout(t);
  });

  const set = (id: keyof I & string, v: unknown) => {
    touched.current = true;
    values.value = { ...values.value, [id]: v };
  };
  const patch = (p: Partial<I>) => {
    touched.current = true;
    values.value = { ...values.value, ...p };
  };
  const reset = () => {
    touched.current = false;
    values.value = initial;
    committed.value = initial;
  };

  const inputsText = (v: I) => {
    const parts: string[] = [];
    for (const def of config.inputs) {
      if (!visible(def, v) || def.type === 'custom') continue;
      if (String(v[def.id]) !== String(initial[def.id])) parts.push(`${def.label}: ${String(v[def.id])}`);
    }
    return parts.length ? parts.join('; ') : 'Default values';
  };

  const addScenario = () => {
    const r = result.value;
    if (!r || scenarios.value.length >= MAX_SCENARIOS) return;
    const id = nextId.current++;
    scenarios.value = [...scenarios.value, { id, name: `Scenario ${id}`, summary: r.summary, inputs: inputsText(committed.value) }];
  };

  const v = values.value;
  const r = result.value;
  const basic = config.inputs.filter((d) => !d.advanced && visible(d, v));
  const advanced = config.inputs.filter((d) => d.advanced && visible(d, v));
  const errs = crossErrors.value;
  const idPrefix = embed ? 'em' : 'in';

  const renderGroup = (group: InputDef<I>[]) => {
    const fields = group.map((def) => (
      <InputField<I>
        key={def.id}
        def={def}
        values={v}
        set={set}
        patch={patch}
        error={errs[def.id]}
        idPrefix={idPrefix}
        renderCustom={(d) => props.renderCustom?.(d, v, set)}
      />
    ));
    return group.length > 1 ? (
      <div class="field-row" key={group[0]!.id}>
        {fields}
      </div>
    ) : (
      fields[0]
    );
  };

  const visuals = useMemo(() => (r ? props.renderVisuals?.(committed.value, r.out) : null), [r]);

  return (
    <div class="grid gap-6">
      <div class="calc" data-hydrated={hydrated.value ? 'true' : 'false'}>
        <form
          class="calc-inputs"
          method="get"
          action={path}
          aria-label={`${config.name} inputs`}
          onSubmit={(e) => {
            e.preventDefault();
            committed.value = values.value;
          }}
        >
          {chunk(basic).map(renderGroup)}
          {advanced.length > 0 && (
            <details class="more">
              <summary>More options</summary>
              <div class="mt-3">{chunk(advanced).map(renderGroup)}</div>
            </details>
          )}
          <button type="submit" class="sr-only">
            Calculate
          </button>
        </form>
        <div class="calc-results" id={`${idPrefix}-results`} ref={resultsRef}>
          <h2 class="sr-only">Result</h2>
          <div aria-live="polite">
            <ResultCard summary={r?.summary ?? null} />
          </div>
          {r && props.renderResultsExtra?.(committed.value, r.out)}
          <ShareButton
            embed={embed}
            title={config.name}
            canonicalUrl={SITE + path}
            shareUrl={() => SITE + path + toQuery(committed.value, initial)}
            resultText={() =>
              r ? [`${config.name} (Calcrafty)`, `${r.summary.headline.label}: ${r.summary.headline.value}`, ...r.summary.items.map((i) => `${i.label}: ${i.value}`), SITE + path + toQuery(committed.value, initial)].join('\n') : ''
            }
            onReset={reset}
            onCompare={embed ? undefined : addScenario}
            compareFull={scenarios.value.length >= MAX_SCENARIOS}
            favorite={favorite.value}
            onFavorite={embed ? undefined : () => (favorite.value = toggleFavorite(config.slug))}
          />
        </div>
      </div>

      {!embed && r && (
        <div
          class="mobile-readout no-print"
          aria-hidden="true"
          data-hidden={readoutVisible.value ? 'true' : undefined}
          onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        >
          <span>{r.summary.headline.label}</span>
          <strong class="num">{r.summary.headline.value}</strong>
        </div>
      )}

      {!embed && answer && (
        <p class="answer" data-testid="answer-box">
          {answer}
        </p>
      )}

      {!embed && r && (
        <div class="grid gap-6 lg:grid-cols-2">
          <ExplainPanel sentences={r.explain} />
          <ShowTheMath steps={steps.value} />
        </div>
      )}

      {!embed && visuals && <div class="defer-render">{visuals}</div>}

      {!embed && <CompareTable scenarios={scenarios.value} onRemove={(id) => (scenarios.value = scenarios.value.filter((s) => s.id !== id))} />}
      {!embed && (
        <HistoryPanel
          entries={history.value}
          onClear={() => {
            clearHistory();
            history.value = [];
          }}
        />
      )}
    </div>
  );
}
