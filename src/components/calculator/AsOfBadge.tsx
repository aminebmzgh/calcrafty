/** "Today's average: 7.24% (as of Oct 29, 2026 · Freddie Mac)", with a one-click reset to today's value. Prices read "$4.153 per gallon". */
import type { LiveSeries } from '../../data/live/index.ts';
import { formatAsOf, formatLive } from '../../data/live/index.ts';

export default function AsOfBadge({ series, current, onApply }: { series: LiveSeries; current?: number; onApply?: (v: number) => void }) {
  const differs = current !== undefined && Math.abs(current - series.value) > 1e-9;
  const price = series.unit === 'usd';
  return (
    <p class="asof">
      <span>
        {price ? 'U.S. average' : 'Today’s average'}: <strong class="num">{formatLive(series)}</strong> (as of {formatAsOf(series.asOf)} ·{' '}
        <a href={series.url} rel="noopener">
          {series.source}
        </a>
        )
      </span>
      {differs && onApply && (
        <button type="button" class="asof-apply no-print" onClick={() => onApply(series.value)}>
          {price ? 'Use the average price' : 'Use today’s rate'}
        </button>
      )}
    </p>
  );
}
