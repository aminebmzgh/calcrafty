import Calculator from '../../components/calculator/Calculator.tsx';
import AmortizationTable from '../../components/calculator/AmortizationTable.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { AmortizationInput, AmortizationOutput } from './math.ts';

function Visuals({ input, out }: { input: AmortizationInput; out: AmortizationOutput }) {
  if (input.amount <= 0 || !out.rows.length) return null;
  const cross = out.crossoverPeriod > 0 ? out.rows[out.crossoverPeriod - 1] : undefined;
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="amort-cost-h">
        <h2 id="amort-cost-h" class="text-lg mb-3">
          Where your payments go
        </h2>
        <StackedBar
          title="Principal and interest"
          summary={`Of the ${usd(out.totalPaid)} you pay in total, ${usd(input.amount)} repays the loan and ${usd(out.totalInterest)} is interest.`}
          bars={[
            {
              label: 'Total paid',
              total: usd(out.totalPaid),
              segments: [
                { label: 'Principal', value: input.amount, color: 'var(--chart-1)', display: usd(input.amount) },
                { label: 'Interest', value: out.totalInterest, color: 'var(--chart-3)', display: usd(out.totalInterest) },
              ],
            },
          ]}
        />
      </section>
      <section class="panel" aria-labelledby="amort-milestones-h">
        <h2 id="amort-milestones-h" class="text-lg mb-3">
          Milestones
        </h2>
        <table class="data-table">
          <caption class="sr-only">When the loan reaches each milestone</caption>
          <thead>
            <tr>
              <th scope="col">Milestone</th>
              <th scope="col">Payment</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">First payment</th>
              <td class="num">1</td>
              <td>{out.firstDate}</td>
            </tr>
            {cross && (
              <tr>
                <th scope="row">Principal first exceeds interest</th>
                <td class="num">{cross.period}</td>
                <td>{out.crossoverDate}</td>
              </tr>
            )}
            {out.milestones.map((m) => (
              <tr key={m.label}>
                <th scope="row">{m.label}</th>
                <td class="num">{m.period}</td>
                <td>{m.date}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Loan paid off</th>
              <td class="num">{out.payoffMonths}</td>
              <td>{out.payoffDate}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <AmortizationTable rows={out.rows} years={out.years} name="amortization" />
    </div>
  );
}

export default function Widget(props: WidgetProps<AmortizationInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
