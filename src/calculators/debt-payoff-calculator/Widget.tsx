import { useEffect, useRef, useState } from 'preact/hooks';
import Calculator from '../../components/calculator/Calculator.tsx';
import LineChart from '../../components/charts/LineChart.tsx';
import { duration, formatInputValue, parseFriendly, usd, usdCompact } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { Debt, DebtInput, DebtOutput, StrategyResult } from './math.ts';

const MAX_DEBTS = 10;

/** A number field that keeps what the user types (e.g. "22.") and only reformats on blur. */
function DebtNumber({ id, value, unit, onValue }: { id: string; value: number; unit: 'usd' | 'percent'; onValue: (n: number) => void }) {
  const [text, setText] = useState(() => formatInputValue(value, unit, unit === 'usd' ? 1 : 0.01));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(formatInputValue(value, unit, unit === 'usd' ? 1 : 0.01));
  }, [value]);
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        setText(formatInputValue(value, unit, unit === 'usd' ? 1 : 0.01));
      }}
      onInput={(e) => {
        const raw = (e.target as HTMLInputElement).value;
        setText(raw);
        const n = parseFriendly(raw);
        if (n !== null && n >= 0) onValue(n);
      }}
    />
  );
}

function DebtList({ debts, onChange }: { debts: Debt[]; onChange: (d: Debt[]) => void }) {
  const update = (i: number, patch: Partial<Debt>) => onChange(debts.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <fieldset class="field" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend class="field-label">Your debts</legend>
      <div class="grid gap-3">
        {debts.map((d, i) => (
          <div key={i} class="panel grid gap-2" style={{ padding: '.75rem' }}>
            <div class="flex items-center gap-2">
              <label class="sr-only" for={`debt-${i}-name`}>
                Debt {i + 1} name
              </label>
              <div class="input-shell flex-1">
                <input id={`debt-${i}-name`} type="text" value={d.name} maxLength={40} onInput={(e) => update(i, { name: (e.target as HTMLInputElement).value || `Debt ${i + 1}` })} />
              </div>
              <button type="button" class="btn btn-quiet" aria-label={`Remove ${d.name}`} disabled={debts.length <= 1} onClick={() => onChange(debts.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
            <div class="field-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(7rem, 1fr))' }}>
              {(
                [
                  ['balance', 'Balance', 'usd'],
                  ['apr', 'APR', 'percent'],
                  ['minPayment', 'Minimum', 'usd'],
                ] as const
              ).map(([key, label, unit]) => (
                <div class="field" key={key}>
                  <label class="field-help" for={`debt-${i}-${key}`}>
                    {label}
                    <span class="sr-only"> for {d.name}</span>
                  </label>
                  <div class="input-shell">
                    {unit === 'usd' && (
                      <span class="adorn adorn-start" aria-hidden="true">
                        $
                      </span>
                    )}
                    <DebtNumber id={`debt-${i}-${key}`} value={d[key]} unit={unit} onValue={(n) => update(i, { [key]: n })} />
                    {unit === 'percent' && (
                      <span class="adorn adorn-end" aria-hidden="true">
                        %
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        class="btn mt-3"
        disabled={debts.length >= MAX_DEBTS}
        onClick={() => onChange([...debts, { name: `Debt ${debts.length + 1}`, balance: 1_000, apr: 15, minPayment: 35 }])}
      >
        Add a debt
      </button>
    </fieldset>
  );
}

function Column({ r, title, recommended }: { r: StrategyResult; title: string; recommended: boolean }) {
  return (
    <div class="panel">
      <h3 class="text-base">
        {title}
        {recommended && <span class="muted text-sm font-normal"> · lowest interest</span>}
      </h3>
      <p class="mt-2 text-2xl font-bold num">{r.paysOff ? duration(r.months) : 'Never'}</p>
      <p class="text-sm muted num">{r.paysOff ? `${usd(r.totalInterest)} interest` : 'payments don’t cover the interest'}</p>
      <ol class="mt-3 grid gap-1 text-sm">
        {r.order.map((d, i) => (
          <li key={d.name + i} class="flex justify-between gap-3 border-b border-rule pb-1">
            <span>
              {i + 1}. {d.name}
            </span>
            <span class="num muted">month {d.month}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Visuals({ out }: { out: DebtOutput }) {
  if (!out.avalanche.paysOff || !out.snowball.paysOff) return null;
  const n = Math.max(out.avalanche.balances.length, out.snowball.balances.length) - 1;
  const pad = (b: number[]) => Array.from({ length: n + 1 }, (_, k) => b[k] ?? 0);
  const step = n > 120 ? 24 : n > 48 ? 12 : 6;
  return (
    <div class="grid gap-6">
      <section aria-labelledby="debt-compare-h" class="grid gap-3">
        <h2 id="debt-compare-h" class="text-lg">
          Avalanche vs snowball
        </h2>
        <div class="grid gap-4 md:grid-cols-2">
          <Column r={out.avalanche} title="Avalanche: highest rate first" recommended={out.best === 'avalanche'} />
          <Column r={out.snowball} title="Snowball: smallest balance first" recommended={out.best === 'snowball'} />
        </div>
      </section>
      <section class="panel" aria-labelledby="debt-chart-h">
        <h2 id="debt-chart-h" class="text-lg mb-3">
          Total debt over time
        </h2>
        <LineChart
          title="Total debt balance"
          summary={`Both methods start at ${usd(out.totalBalance)}. Avalanche reaches $0 in ${duration(out.avalanche.months)}, snowball in ${duration(out.snowball.months)}.`}
          series={[
            { name: 'Avalanche', color: 'var(--chart-1)', values: pad(out.avalanche.balances) },
            { name: 'Snowball', color: 'var(--chart-3)', values: pad(out.snowball.balances), dashed: true },
          ]}
          xLabel={(i) => (i === 0 ? 'Now' : `Mo ${i}`)}
          xTicks={Array.from({ length: Math.floor(n / step) + 1 }, (_, k) => k * step)}
          yFormat={usdCompact}
        />
      </section>
    </div>
  );
}

export default function Widget(props: WidgetProps<DebtInput>) {
  return (
    <Calculator
      config={config}
      {...props}
      renderCustom={(_def, values, set) => <DebtList debts={values.debts} onChange={(d) => set('debts', d)} />}
      renderVisuals={(_i, out) => <Visuals out={out} />}
    />
  );
}
