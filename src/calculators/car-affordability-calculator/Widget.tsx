import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { CarAffordInput, CarAffordOutput } from './math.ts';

function Visuals({ out }: { input: CarAffordInput; out: CarAffordOutput }) {
  if (out.monthlyBudget <= 0) return null;
  return (
    <section class="panel" aria-labelledby="car-afford-h">
      <h2 id="car-afford-h" class="text-lg mb-3">
        What the car really costs
      </h2>
      <StackedBar
        title="Total cost over the loan"
        summary={`Cash up front ${usd(out.upfront)}, loan ${usd(out.loanAmount)} and ${usd(out.totalInterest)} in interest: ${usd(out.totalCost)} in total.`}
        bars={[
          {
            label: 'Total cost',
            total: usd(out.totalCost),
            segments: [
              { label: 'Down payment and trade-in', value: out.upfront, color: 'var(--chart-2)', display: usd(out.upfront) },
              { label: 'Loan', value: out.loanAmount, color: 'var(--chart-1)', display: usd(out.loanAmount) },
              { label: 'Interest', value: out.totalInterest, color: 'var(--chart-3)', display: usd(out.totalInterest) },
            ],
          },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<CarAffordInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
