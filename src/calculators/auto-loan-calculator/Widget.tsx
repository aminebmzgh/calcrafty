import Calculator from '../../components/calculator/Calculator.tsx';
import AmortizationTable from '../../components/calculator/AmortizationTable.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { AutoLoanInput, AutoLoanOutput } from './math.ts';

function Visuals({ input, out }: { input: AutoLoanInput; out: AutoLoanOutput }) {
  if (out.amountFinanced <= 0) return null;
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="car-cost-h">
        <h2 id="car-cost-h" class="text-lg mb-3">
          Total cost of the car
        </h2>
        <StackedBar
          title="What you pay over the loan"
          summary={`Down payment ${usd(input.downPayment)}, amount financed ${usd(out.amountFinanced)} and ${usd(out.totalInterest)} in interest: ${usd(out.totalCost)} in total.`}
          bars={[
            {
              label: 'Total cost',
              total: usd(out.totalCost),
              segments: [
                { label: 'Down payment', value: input.downPayment, color: 'var(--chart-2)', display: usd(input.downPayment) },
                { label: 'Amount financed', value: out.amountFinanced, color: 'var(--chart-1)', display: usd(out.amountFinanced) },
                { label: 'Interest', value: out.totalInterest, color: 'var(--chart-3)', display: usd(out.totalInterest) },
              ],
            },
          ]}
        />
      </section>
      <AmortizationTable rows={out.rows} years={out.years} name="auto-loan" />
    </div>
  );
}

export default function Widget(props: WidgetProps<AutoLoanInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
