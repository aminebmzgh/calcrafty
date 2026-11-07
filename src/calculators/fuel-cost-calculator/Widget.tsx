import Calculator from '../../components/calculator/Calculator.tsx';
import { num, usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { FuelInput, FuelOutput } from './math.ts';

function Visuals({ input, out }: { input: FuelInput; out: FuelOutput }) {
  if (out.distance <= 0) return null;
  const metric = input.units === 'metric';
  return (
    <section class="panel" aria-labelledby="fuel-table-h">
      <h2 id="fuel-table-h" class="text-lg mb-3">
        This trip in other cars
      </h2>
      <table class="data-table">
        <caption class="sr-only">Fuel used and cost of the same trip at other fuel economies</caption>
        <thead>
          <tr>
            <th scope="col">{metric ? 'L/100 km' : 'mpg'}</th>
            <th scope="col">Fuel</th>
            <th scope="col">Cost</th>
          </tr>
        </thead>
        <tbody>
          {out.table.map((r) => (
            <tr key={r.economy}>
              <th scope="row">{r.economy}</th>
              <td class="num">
                {num(r.fuelUsed, 2)} {metric ? 'L' : 'gal'}
              </td>
              <td class="num">{usd(r.cost, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<FuelInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
