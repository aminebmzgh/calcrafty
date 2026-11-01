/** Responsive SVG line chart. Pre-renders on the server; series are distinguished by dash style as well as color. */
export interface LineSeries {
  name: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

export interface LineChartProps {
  title: string;
  /** Text summary shown under the chart (and read by screen readers). */
  summary: string;
  series: LineSeries[];
  /** Label for x index i. */
  xLabel: (i: number) => string;
  /** Indices that get an x-axis tick. */
  xTicks: number[];
  yFormat: (n: number) => string;
  area?: boolean;
}

const W = 640;
const H = 260;
const PAD = { top: 14, right: 16, bottom: 30, left: 64 };

function niceMax(n: number): number {
  if (n <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(n));
  const m = n / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

export default function LineChart({ title, summary, series, xLabel, xTicks, yFormat, area }: LineChartProps) {
  const n = Math.max(1, ...series.map((s) => s.values.length));
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values.filter(Number.isFinite))));
  const x = (i: number) => PAD.left + (n === 1 ? 0 : (i / (n - 1)) * (W - PAD.left - PAD.right));
  const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <figure class="grid gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-labelledby={`${id}-t ${id}-d`} style={{ display: 'block', height: 'auto', maxHeight: '300px' }}>
        <title id={`${id}-t`}>{title}</title>
        <desc id={`${id}-d`}>{summary}</desc>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--rule)" stroke-width="1" />
            <text x={PAD.left - 8} y={y(t) + 4} text-anchor="end" font-size="12" fill="var(--ink-2)" class="num">
              {yFormat(t)}
            </text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text key={i} x={x(i)} y={H - 8} text-anchor="middle" font-size="12" fill="var(--ink-2)">
            {xLabel(i)}
          </text>
        ))}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
          return (
            <g key={s.name}>
              {area && !s.dashed && s.values.length > 1 && (
                <polygon points={`${x(0)},${y(0)} ${pts} ${x(s.values.length - 1)},${y(0)}`} fill={s.color} opacity="0.12" />
              )}
              <polyline points={pts} fill="none" stroke={s.color} stroke-width="2.5" stroke-linejoin="round" stroke-dasharray={s.dashed ? '7 5' : undefined} />
            </g>
          );
        })}
      </svg>
      <div class="legend" aria-hidden="true">
        {series.map((s) => (
          <span key={s.name}>
            <svg width="22" height="10" style={{ marginRight: '.35rem', verticalAlign: 'middle' }}>
              <line x1="0" x2="22" y1="5" y2="5" stroke={s.color} stroke-width="3" stroke-dasharray={s.dashed ? '5 3' : undefined} />
            </svg>
            {s.name}
          </span>
        ))}
      </div>
      <figcaption class="text-sm muted">{summary}</figcaption>
    </figure>
  );
}
