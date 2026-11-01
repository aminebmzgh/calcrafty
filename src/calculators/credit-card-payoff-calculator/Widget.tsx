import Calculator from '../../components/calculator/Calculator.tsx';
import LineChart from '../../components/charts/LineChart.tsx';
import { duration, usd, usdCompact } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { CardInput, CardOutput } from './math.ts';

function Visuals({ out }: { out: CardOutput }) {
  if (!out.plan.paysOff) return null;
  const minPaysOff = out.minimum.paysOff;
  // Show both paths over the plan's horizon ×3 (capped at the minimum path's length) so the plan stays readable.
  const span = minPaysOff ? Math.min(out.minimum.balances.length - 1, Math.max(out.plan.months * 3, 24)) : out.plan.months * 3;
  const pad = (b: number[]) => Array.from({ length: span + 1 }, (_, k) => b[k] ?? 0);
  const step = span > 120 ? 24 : span > 48 ? 12 : 6;
  const ticks = Array.from({ length: Math.floor(span / step) + 1 }, (_, k) => k * step);
  return (
    <section class="panel" aria-labelledby="card-path-h">
      <h2 id="card-path-h" class="text-lg mb-3">
        Your plan vs minimum payments
      </h2>
      <LineChart
        title="Card balance over time"
        summary={`Your plan clears the balance in ${duration(out.plan.months)}. ${minPaysOff ? `Minimum payments take ${duration(out.minimum.months)} and cost ${usd(out.interestSaved)} more in interest.` : 'Minimum payments never clear it.'}`}
        series={[
          { name: 'Your plan', color: 'var(--chart-1)', values: pad(out.plan.balances) },
          { name: 'Minimum payments', color: 'var(--chart-3)', values: pad(out.minimum.balances), dashed: true },
        ]}
        xLabel={(i) => (i === 0 ? 'Now' : `Mo ${i}`)}
        xTicks={ticks}
        yFormat={usdCompact}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<CardInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_i, out) => <Visuals out={out} />} />;
}
