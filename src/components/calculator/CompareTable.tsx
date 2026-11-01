/** Up to 3 saved scenarios side by side; the best value in each row is highlighted (text + color, never color alone). */
import type { ResultSummary } from '../../lib/types.ts';

export interface Scenario {
  id: number;
  name: string;
  summary: ResultSummary;
  /** Input changes from the defaults, as readable text. */
  inputs: string;
}

export const MAX_SCENARIOS = 3;

export default function CompareTable({ scenarios, onRemove }: { scenarios: Scenario[]; onRemove: (id: number) => void }) {
  if (!scenarios.length) return null;
  const rows = [scenarios[0]!.summary.headline, ...scenarios[0]!.summary.items].map((r) => r.label);
  const cell = (s: Scenario, label: string) => [s.summary.headline, ...s.summary.items].find((x) => x.label === label);

  return (
    <section class="panel" aria-labelledby="compare-h">
      <h2 id="compare-h" class="text-lg">
        Compare scenarios
      </h2>
      <p class="text-sm muted mt-1">Best value in each row is marked ★.</p>
      <div class="table-scroll mt-3" style={{ maxHeight: 'none' }}>
        <table class="data-table">
          <caption class="sr-only">Saved scenarios compared</caption>
          <thead>
            <tr>
              <th scope="col">Result</th>
              {scenarios.map((s) => (
                <th scope="col" key={s.id}>
                  {s.name}{' '}
                  <button type="button" class="btn btn-quiet" style={{ minHeight: '32px', padding: '0 .4rem' }} aria-label={`Remove ${s.name}`} onClick={() => onRemove(s.id)}>
                    ×
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((label) => {
              const cells = scenarios.map((s) => cell(s, label));
              const better = cells.find((c) => c?.better)?.better;
              const raws = cells.map((c) => c?.raw).filter((r): r is number => typeof r === 'number');
              const best = better && raws.length > 1 && new Set(raws).size > 1 ? (better === 'higher' ? Math.max(...raws) : Math.min(...raws)) : null;
              return (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {cells.map((c, i) => {
                    const isBest = best !== null && c?.raw === best;
                    return (
                      <td key={i} class={isBest ? 'diff-better' : undefined}>
                        {c?.value ?? '—'}
                        {isBest && <span aria-label=" (best)"> ★</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <th scope="row">Inputs</th>
              {scenarios.map((s) => (
                <td key={s.id} style={{ whiteSpace: 'normal', minWidth: '10rem' }} class="text-sm">
                  {s.inputs}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
