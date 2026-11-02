import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { CdInput, CdOutput } from './math.ts';

function Visuals({ input, out }: { input: CdInput; out: CdOutput }) {
  if (input.deposit <= 0) return null;
  return (
    <section class="panel" aria-labelledby="cd-split-h">
      <h2 id="cd-split-h" class="text-lg mb-3">
        What you get back at maturity
      </h2>
      <StackedBar
        title="Balance at maturity"
        summary={`Your deposit of ${usd(input.deposit)} plus ${usd(out.interest)} of interest: ${usd(out.balance)}.`}
        bars={[
          {
            label: 'At maturity',
            total: usd(out.balance),
            segments: [
              { label: 'Deposit', value: input.deposit, color: 'var(--chart-1)', display: usd(input.deposit) },
              { label: 'Interest', value: out.interest, color: 'var(--chart-2)', display: usd(out.interest) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<CdInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
