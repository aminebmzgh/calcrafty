import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { RaiseInput, RaiseOutput } from './math.ts';

function Visuals({ out }: { input: RaiseInput; out: RaiseOutput }) {
  if (out.currentAnnual <= 0 || out.annualIncrease <= 0) return null;
  return (
    <section class="panel" aria-labelledby="raise-split-h">
      <h2 id="raise-split-h" class="text-lg mb-3">
        Where the raise goes
      </h2>
      <StackedBar
        title="Extra pay per year"
        summary={`Of the ${usd(out.annualIncrease)} raise, ${usd(out.keepUpPortion)} is needed to keep up with inflation and ${usd(out.aheadPortion)} puts you ahead.`}
        bars={[
          {
            label: 'Annual raise',
            total: usd(out.annualIncrease),
            segments: [
              { label: 'Keeps up with inflation', value: out.keepUpPortion, color: 'var(--chart-3)', display: usd(out.keepUpPortion) },
              { label: 'Ahead of inflation', value: out.aheadPortion, color: 'var(--chart-2)', display: usd(out.aheadPortion) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<RaiseInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
