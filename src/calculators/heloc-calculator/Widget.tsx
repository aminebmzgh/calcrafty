import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { HelocInput, HelocOutput } from './math.ts';

function Visuals({ out }: { input: HelocInput; out: HelocOutput }) {
  if (out.drawUsed <= 0) return null;
  return (
    <section class="panel" aria-labelledby="heloc-cost-h">
      <h2 id="heloc-cost-h" class="text-lg mb-3">
        What the line costs over its life
      </h2>
      <StackedBar
        title="Total repaid"
        summary={`${usd(out.drawUsed)} borrowed, ${usd(out.drawInterest)} interest while drawing and ${usd(out.repayInterest)} during repayment.`}
        bars={[
          {
            label: 'Total repaid',
            total: usd(out.totalRepaid),
            segments: [
              { label: 'Amount borrowed', value: out.drawUsed, color: 'var(--chart-1)', display: usd(out.drawUsed) },
              { label: 'Interest, draw period', value: out.drawInterest, color: 'var(--chart-3)', display: usd(out.drawInterest) },
              { label: 'Interest, repayment', value: out.repayInterest, color: 'var(--chart-2)', display: usd(out.repayInterest) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<HelocInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
