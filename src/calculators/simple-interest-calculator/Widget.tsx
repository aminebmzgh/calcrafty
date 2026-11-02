import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { SimpleInput, SimpleOutput } from './math.ts';

function Visuals({ out }: { input: SimpleInput; out: SimpleOutput }) {
  if (!out.valid || out.total <= 0) return null;
  return (
    <section class="panel" aria-labelledby="simple-split-h">
      <h2 id="simple-split-h" class="text-lg mb-3">
        Principal and interest
      </h2>
      <StackedBar
        title="Total"
        summary={`Principal ${usd(out.principal)} plus ${usd(out.interest)} of simple interest: ${usd(out.total)}.`}
        bars={[
          {
            label: 'Total',
            total: usd(out.total),
            segments: [
              { label: 'Principal', value: out.principal, color: 'var(--chart-1)', display: usd(out.principal) },
              { label: 'Interest', value: out.interest, color: 'var(--chart-2)', display: usd(out.interest) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<SimpleInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
