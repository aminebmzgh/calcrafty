import Calculator from '../../components/calculator/Calculator.tsx';
import { num, usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { ElectricityInput, ElectricityOutput } from './math.ts';

function Visuals({ out }: { out: ElectricityOutput }) {
  if (out.watts <= 0) return null;
  return (
    <section class="panel" aria-labelledby="elec-table-h">
      <h2 id="elec-table-h" class="text-lg mb-3">
        Energy and cost by period
      </h2>
      <table class="data-table">
        <caption class="sr-only">Kilowatt-hours used and cost per hour, day, week, month and year</caption>
        <thead>
          <tr>
            <th scope="col">Per</th>
            <th scope="col">Energy</th>
            <th scope="col">Cost</th>
          </tr>
        </thead>
        <tbody>
          {out.rows.map((r) => (
            <tr key={r.period}>
              <th scope="row">{r.period === 'Day' ? 'Day of use' : r.period}</th>
              <td class="num">{num(r.kwh, 3)} kWh</td>
              <td class="num">{r.period === 'Hour' ? `$${num(out.costPerHour, 4)}` : usd(r.cost, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<ElectricityInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_input, out) => <Visuals out={out} />} />;
}
