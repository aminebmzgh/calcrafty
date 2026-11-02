import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { OvertimeInput, OvertimeOutput } from './math.ts';

function Visuals({ out }: { input: OvertimeInput; out: OvertimeOutput }) {
  if (out.weeklyPay <= 0) return null;
  return (
    <section class="panel" aria-labelledby="ot-split-h">
      <h2 id="ot-split-h" class="text-lg mb-3">
        Your week's pay
      </h2>
      <StackedBar
        title="Weekly pay"
        summary={`Regular ${usd(out.regularPay)}, overtime ${usd(out.overtimePay)} and double time ${usd(out.doublePay)}.`}
        bars={[
          {
            label: 'This week',
            total: usd(out.weeklyPay),
            segments: [
              { label: 'Regular', value: out.regularPay, color: 'var(--chart-1)', display: usd(out.regularPay) },
              { label: 'Overtime', value: out.overtimePay, color: 'var(--chart-2)', display: usd(out.overtimePay) },
              { label: 'Double time', value: out.doublePay, color: 'var(--chart-3)', display: usd(out.doublePay) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<OvertimeInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
