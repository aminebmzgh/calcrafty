/** SVG donut chart with a labelled legend (values and percentages in text, so color is never the only cue). */
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  /** Display value for the legend. */
  display: string;
}

export default function DonutChart({ title, segments, center, centerSub }: { title: string; segments: DonutSegment[]; center: string; centerSub?: string }) {
  const parts = segments.filter((s) => s.value > 0);
  const total = parts.reduce((a, s) => a + s.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const summary = `${title}: ${parts.map((s) => `${s.label} ${s.display} (${total ? Math.round((s.value / total) * 100) : 0}%)`).join(', ')}.`;

  return (
    <figure class="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
      <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label={summary} style={{ maxWidth: '100%', height: 'auto' }}>
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--surface-2)" stroke-width="26" />
        {total > 0 &&
          parts.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={s.color}
                stroke-width="26"
                stroke-dasharray={`${Math.max(0, len - 1.5)} ${C}`}
                stroke-dashoffset={-offset}
                transform="rotate(-90 90 90)"
              />
            );
            offset += len;
            return el;
          })}
        <text x="90" y={centerSub ? 88 : 96} text-anchor="middle" font-size="20" font-weight="750" fill="var(--ink)" class="num">
          {center}
        </text>
        {centerSub && (
          <text x="90" y="110" text-anchor="middle" font-size="12" fill="var(--ink-2)">
            {centerSub}
          </text>
        )}
      </svg>
      <figcaption>
        <p class="font-semibold">{title}</p>
        <ul class="mt-2 grid gap-1.5 text-sm">
          {parts.map((s) => (
            <li key={s.label} class="flex items-baseline justify-between gap-4 border-b border-rule pb-1.5">
              <span>
                <i aria-hidden="true" style={{ display: 'inline-block', width: '.8rem', height: '.8rem', borderRadius: '2px', background: s.color, marginRight: '.4rem', verticalAlign: '-1px' }} />
                {s.label}
              </span>
              <span class="num font-semibold">
                {s.display} <span class="muted font-normal">({total ? Math.round((s.value / total) * 100) : 0}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
