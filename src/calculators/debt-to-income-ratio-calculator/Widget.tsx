import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { DtiInput, DtiOutput } from './math.ts';

function Visuals({ input, out }: { input: DtiInput; out: DtiOutput }) {
  if (out.monthlyIncome <= 0) return null;
  return (
    <section class="panel" aria-labelledby="dti-split-h">
      <h2 id="dti-split-h" class="text-lg mb-3">
        Where your gross income goes
      </h2>
      <StackedBar
        title="Gross monthly income"
        summary={`Housing ${usd(input.housing)}, other debts ${usd(out.nonHousingDebts)} and ${usd(out.leftOver)} left before taxes and living costs.`}
        bars={[
          {
            label: 'Monthly income',
            total: usd(out.monthlyIncome),
            segments: [
              { label: 'Housing', value: input.housing, color: 'var(--chart-1)', display: usd(input.housing) },
              { label: 'Other debts', value: out.nonHousingDebts, color: 'var(--chart-3)', display: usd(out.nonHousingDebts) },
              { label: 'Left over', value: out.leftOver, color: 'var(--chart-2)', display: usd(out.leftOver) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<DtiInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
