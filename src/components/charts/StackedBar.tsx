/** Horizontal stacked bars (e.g. principal vs interest per scenario). Every segment is labelled in text below the bar. */
export interface BarSegment {
  label: string;
  value: number;
  color: string;
  display: string;
}

export interface Bar {
  label: string;
  total: string;
  segments: BarSegment[];
}

export default function StackedBar({ title, summary, bars }: { title: string; summary: string; bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => b.segments.reduce((a, s) => a + Math.max(0, s.value), 0)));
  return (
    <figure class="grid gap-3">
      <p class="font-semibold">{title}</p>
      {bars.map((b) => (
        <div key={b.label}>
          <div class="flex justify-between text-sm">
            <span>{b.label}</span>
            <span class="num font-semibold">{b.total}</span>
          </div>
          <div class="mt-1 flex h-4 overflow-hidden rounded" style={{ background: 'var(--surface-2)' }} aria-hidden="true">
            {b.segments.map((s) => (
              <span key={s.label} style={{ width: `${(Math.max(0, s.value) / max) * 100}%`, background: s.color }} />
            ))}
          </div>
          <p class="mt-1 text-xs muted">{b.segments.map((s) => `${s.label} ${s.display}`).join(' · ')}</p>
        </div>
      ))}
      <figcaption class="text-sm muted">{summary}</figcaption>
    </figure>
  );
}
