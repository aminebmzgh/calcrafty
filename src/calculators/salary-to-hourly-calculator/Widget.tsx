import Calculator from '../../components/calculator/Calculator.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { SalaryInput, SalaryOutput } from './math.ts';

function Visuals({ out }: { input: SalaryInput; out: SalaryOutput }) {
  if (out.annual <= 0) return null;
  const rows: [string, number][] = [
    ['Hourly', out.hourly],
    ['Daily', out.daily],
    ['Weekly', out.weekly],
    ['Every two weeks (biweekly)', out.biweekly],
    ['Twice a month (semimonthly)', out.semimonthly],
    ['Monthly', out.monthly],
    ['Yearly', out.annual],
  ];
  return (
    <section class="panel" aria-labelledby="salary-periods-h">
      <h2 id="salary-periods-h" class="text-lg mb-3">
        Your pay in every period
      </h2>
      <table class="data-table">
        <caption class="sr-only">Gross pay by pay period</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Gross pay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td class="num">{usd(value, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<SalaryInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
