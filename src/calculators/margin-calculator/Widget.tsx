import Calculator from '../../components/calculator/Calculator.tsx';
import { pct, usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { MarginInput, MarginOutput } from './math.ts';

function Visuals({ out }: { out: MarginOutput }) {
  if (!out.valid || out.table.length === 0) return null;
  return (
    <section class="panel" aria-labelledby="margin-table-h">
      <h2 id="margin-table-h" class="text-lg mb-3">
        Prices for common margins on a {usd(out.cost, true)} cost
      </h2>
      <table class="data-table">
        <caption class="sr-only">Selling price, profit and equivalent markup for each gross margin</caption>
        <thead>
          <tr>
            <th scope="col">Margin</th>
            <th scope="col">Markup</th>
            <th scope="col">Price</th>
            <th scope="col">Profit</th>
          </tr>
        </thead>
        <tbody>
          {out.table.map((r) => (
            <tr key={r.margin}>
              <th scope="row">{r.margin}%</th>
              <td class="num">{pct(r.markup, 2)}</td>
              <td class="num">{usd(r.price, true)}</td>
              <td class="num">{usd(r.profit, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<MarginInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_input, out) => <Visuals out={out} />} />;
}
