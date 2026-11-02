import Calculator from '../../components/calculator/Calculator.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import { decadeTable, type InflationInput, type InflationOutput } from './math.ts';

function Visuals({ input }: { input: InflationInput; out: InflationOutput }) {
  if (input.mode !== 'past' || input.amount <= 0) return null;
  const rows = decadeTable(input.amount, Math.round(input.toYear));
  return (
    <section class="panel" aria-labelledby="inflation-decades-h">
      <h2 id="inflation-decades-h" class="text-lg mb-3">
        {usd(input.amount)} in {Math.round(input.toYear)} dollars, by decade
      </h2>
      <table class="data-table">
        <caption class="sr-only">What the amount from each decade is worth in the selected year</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Worth in {Math.round(input.toYear)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year}>
              <th scope="row">{r.year}</th>
              <td class="num">{usd(r.value, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<InflationInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
