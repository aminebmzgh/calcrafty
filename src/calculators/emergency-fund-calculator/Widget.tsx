import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { EmergencyInput, EmergencyOutput } from './math.ts';

function Visuals({ out }: { input: EmergencyInput; out: EmergencyOutput }) {
  if (out.target <= 0) return null;
  return (
    <section class="panel" aria-labelledby="ef-progress-h">
      <h2 id="ef-progress-h" class="text-lg mb-3">
        Progress toward your target
      </h2>
      <StackedBar
        title="Emergency fund"
        summary={`${usd(out.savedTowardTarget)} saved of a ${usd(out.target)} target; ${usd(out.gap)} to go.`}
        bars={[
          {
            label: 'Target',
            total: usd(out.target),
            segments: [
              { label: 'Saved', value: out.savedTowardTarget, color: 'var(--chart-2)', display: usd(out.savedTowardTarget) },
              { label: 'Still to save', value: out.gap, color: 'var(--chart-3)', display: usd(out.gap) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<EmergencyInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
