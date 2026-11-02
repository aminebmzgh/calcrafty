import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { K401Input, K401Output } from './math.ts';

function Visuals({ input, out }: { input: K401Input; out: K401Output }) {
  if (out.balance <= 0) return null;
  const milestones = out.years.filter((_y, idx) => (idx + 1) % 5 === 0 || idx === out.years.length - 1);
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="k401-split-h">
        <h2 id="k401-split-h" class="text-lg mb-3">
          Where the balance comes from
        </h2>
        <StackedBar
          title={`Balance at ${input.retireAge}`}
          summary={`Starting balance ${usd(input.balance)}, your contributions ${usd(out.employeeTotal)}, employer match ${usd(out.employerTotal)} and growth ${usd(out.growth)}.`}
          bars={[
            {
              label: 'Balance',
              total: usd(out.balance),
              segments: [
                { label: 'Starting balance', value: input.balance, color: 'var(--chart-4)', display: usd(input.balance) },
                { label: 'Your contributions', value: out.employeeTotal, color: 'var(--chart-1)', display: usd(out.employeeTotal) },
                { label: 'Employer match', value: out.employerTotal, color: 'var(--chart-2)', display: usd(out.employerTotal) },
                { label: 'Growth', value: out.growth, color: 'var(--chart-3)', display: usd(out.growth) },
              ],
            },
          ]}
        />
      </section>
      <section class="panel" aria-labelledby="k401-years-h">
        <h2 id="k401-years-h" class="text-lg mb-3">
          Balance every five years
        </h2>
        <table class="data-table">
          <caption class="sr-only">Projected 401(k) balance by age</caption>
          <thead>
            <tr>
              <th scope="col">Age</th>
              <th scope="col">Salary</th>
              <th scope="col">Balance</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((y) => (
              <tr key={y.age}>
                <th scope="row">{y.age}</th>
                <td class="num">{usd(y.salary)}</td>
                <td class="num">{usd(y.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function Widget(props: WidgetProps<K401Input>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
