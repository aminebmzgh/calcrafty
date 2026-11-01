/** "Today's average: 7.24% (as of Oct 29, 2026 · Freddie Mac)", with a one-click reset to today's value. */
import type { LiveSeries } from '../../data/live/index.ts';
import { formatAsOf } from '../../data/live/index.ts';
import { pct } from '../../lib/format.ts';

export default function AsOfBadge({ series, current, onApply }: { series: LiveSeries; current?: number; onApply?: (v: number) => void }) {
  const differs = current !== undefined && Math.abs(current - series.value) > 1e-9;
  return (
    <p class="asof">
      <span>
        Today’s average: <strong class="num">{pct(series.value)}</strong> (as of {formatAsOf(series.asOf)} ·{' '}
        <a href={series.url} rel="noopener">
          {series.source}
        </a>
        )
      </span>
      {differs && onApply && (
        <button type="button" class="asof-apply no-print" onClick={() => onApply(series.value)}>
          Use today’s rate
        </button>
      )}
    </p>
  );
}
