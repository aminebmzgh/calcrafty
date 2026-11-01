import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import { BMI_CATEGORIES, type BmiInput, type BmiOutput } from './math.ts';

const MIN = 15;
const MAX = 45;
const COLORS = ['var(--chart-3)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-4)', 'var(--bad)'];

/** BMI scale with labelled bands and a marker; category names are always in text, never color alone. */
function Scale({ out }: { out: BmiOutput }) {
  const x = (v: number) => ((Math.min(Math.max(v, MIN), MAX) - MIN) / (MAX - MIN)) * 100;
  const bands = BMI_CATEGORIES.map((c, i) => ({ ...c, from: Math.max(c.min, MIN), to: BMI_CATEGORIES[i + 1]?.min ?? MAX, color: COLORS[i]! }));
  return (
    <section class="panel" aria-labelledby="bmi-scale-h">
      <h2 id="bmi-scale-h" class="text-lg">
        Where your BMI falls
      </h2>
      <figure class="mt-4">
        <div class="relative" style={{ height: '64px' }} aria-hidden="true">
          <div class="absolute flex w-full overflow-hidden rounded" style={{ top: '22px', height: '14px' }}>
            {bands.map((b) => (
              <span key={b.label} style={{ width: `${x(b.to) - x(b.from)}%`, background: b.color, opacity: 0.75 }} />
            ))}
          </div>
          <div class="absolute text-sm font-bold num" style={{ left: `${x(out.bmiRounded)}%`, top: 0, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            {num(out.bmiRounded, 1)}
          </div>
          <div class="absolute" style={{ left: `${x(out.bmiRounded)}%`, top: '18px', width: '3px', height: '22px', background: 'var(--ink)', transform: 'translateX(-50%)' }} />
          {[18.5, 25, 30, 35, 40].map((t) => (
            <span key={t} class="absolute text-xs muted num" style={{ left: `${x(t)}%`, top: '42px', transform: 'translateX(-50%)' }}>
              {t}
            </span>
          ))}
        </div>
        <figcaption class="mt-2">
          <ul class="legend">
            {bands.map((b) => (
              <li key={b.label}>
                <i style={{ background: b.color }} aria-hidden="true" />
                {b.label}: {b.range}
                {b.label === out.category ? ' (you)' : ''}
              </li>
            ))}
          </ul>
        </figcaption>
      </figure>
    </section>
  );
}

export default function Widget(props: WidgetProps<BmiInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_i, out) => <Scale out={out} />} />;
}
