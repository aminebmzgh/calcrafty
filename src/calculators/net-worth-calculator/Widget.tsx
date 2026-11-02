import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { NetWorthInput, NetWorthOutput } from './math.ts';

const ASSET_COLORS = ['var(--chart-2)', 'var(--chart-1)', 'var(--chart-4)', 'var(--chart-3)'];
const DEBT_COLORS = ['var(--chart-4)', 'var(--chart-1)', 'var(--chart-3)'];

function Visuals({ out }: { input: NetWorthInput; out: NetWorthOutput }) {
  if (out.totalAssets <= 0 && out.totalLiabilities <= 0) return null;
  return (
    <section class="panel" aria-labelledby="nw-split-h">
      <h2 id="nw-split-h" class="text-lg mb-3">
        What you own and what you owe
      </h2>
      <StackedBar
        title="Assets and debts"
        summary={`Assets ${usd(out.totalAssets)}; debts ${usd(out.totalLiabilities)}.`}
        bars={[
          {
            label: 'Assets',
            total: usd(out.totalAssets),
            segments: out.assetGroups.map((g, k) => ({ label: g.label, value: g.value, color: ASSET_COLORS[k]!, display: usd(g.value) })),
          },
          {
            label: 'Debts',
            total: usd(out.totalLiabilities),
            segments: out.debtGroups.map((g, k) => ({ label: g.label, value: g.value, color: DEBT_COLORS[k]!, display: usd(g.value) })),
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<NetWorthInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
