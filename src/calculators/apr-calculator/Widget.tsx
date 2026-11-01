import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { AprInput, AprOutput } from './math.ts';

function Visuals({ input, out }: { input: AprInput; out: AprOutput }) {
  if (out.amountFinanced <= 0 || out.financeCharge <= 0) return null;
  return (
    <section class="panel" aria-labelledby="apr-cost-h">
      <h2 id="apr-cost-h" class="text-lg mb-3">
        What the loan costs
      </h2>
      <StackedBar
        title="Finance charge"
        summary={`${usd(out.totalInterest)} in interest and ${usd(input.fees)} in fees: ${usd(out.financeCharge)} to borrow ${usd(out.amountFinanced)}.`}
        bars={[
          {
            label: 'Finance charge',
            total: usd(out.financeCharge),
            segments: [
              { label: 'Interest', value: out.totalInterest, color: 'var(--chart-1)', display: usd(out.totalInterest) },
              { label: 'Fees and points', value: input.fees, color: 'var(--chart-3)', display: usd(input.fees) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<AprInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
