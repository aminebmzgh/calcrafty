/** The readout: large headline result, secondary results in a compact grid. */
import type { ResultSummary } from '../../lib/types.ts';

export default function ResultCard({ summary, stale }: { summary: ResultSummary | null; stale?: boolean }) {
  if (!summary) {
    return (
      <div class="readout">
        <p class="readout-label">Result</p>
        <p class="readout-value num" data-testid="headline-value">
          —
        </p>
        <p class="readout-sub">Fix the highlighted fields to see your result.</p>
      </div>
    );
  }
  const { headline, items } = summary;
  return (
    <div class="readout" data-stale={stale ? 'true' : undefined}>
      <p class="readout-label">{headline.label}</p>
      <p class="readout-value num" data-testid="headline-value">
        {headline.value}
      </p>
      {headline.sub && <p class="readout-sub">{headline.sub}</p>}
      {items.length > 0 && (
        <dl class="readout-grid">
          {items.map((it) => (
            <div key={it.label}>
              <dt>{it.label}</dt>
              <dd class="num">{it.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
