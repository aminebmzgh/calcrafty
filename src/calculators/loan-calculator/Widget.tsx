import Calculator from '../../components/calculator/Calculator.tsx';
import AmortizationTable from '../../components/calculator/AmortizationTable.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { LoanInput, LoanOutput } from './math.ts';

function Visuals({ input, out }: { input: LoanInput; out: LoanOutput }) {
  if (input.amount <= 0) return null;
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="loan-cost-h">
        <h2 id="loan-cost-h" class="text-lg mb-3">
          What the loan costs
        </h2>
        <StackedBar
          title="Principal and interest"
          summary={`Of the ${usd(out.totalPaid)} you repay, ${usd(input.amount)} is the amount borrowed and ${usd(out.totalInterest)} is interest.`}
          bars={[
            {
              label: 'Total repaid',
              total: usd(out.totalPaid),
              segments: [
                { label: 'Principal', value: input.amount, color: 'var(--chart-1)', display: usd(input.amount) },
                { label: 'Interest', value: out.totalInterest, color: 'var(--chart-3)', display: usd(out.totalInterest) },
              ],
            },
          ]}
        />
      </section>
      <AmortizationTable rows={out.rows} years={out.years} name="loan" />
    </div>
  );
}

export default function Widget(props: WidgetProps<LoanInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
