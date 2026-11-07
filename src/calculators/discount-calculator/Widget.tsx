import Calculator from '../../components/calculator/Calculator.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { DiscountInput, DiscountOutput } from './math.ts';

function Visuals({ out }: { out: DiscountOutput }) {
  if (out.original <= 0) return null;
  return (
    <section class="panel" aria-labelledby="discount-table-h">
      <h2 id="discount-table-h" class="text-lg mb-3">
        Common discounts on {usd(out.original, true)}
      </h2>
      <table class="data-table">
        <caption class="sr-only">Sale price and savings at common percentages off</caption>
        <thead>
          <tr>
            <th scope="col">Percent off</th>
            <th scope="col">Sale price</th>
            <th scope="col">You save</th>
          </tr>
        </thead>
        <tbody>
          {out.table.map((r) => (
            <tr key={r.percentOff}>
              <th scope="row">{r.percentOff}%</th>
              <td class="num">{usd(r.salePrice, true)}</td>
              <td class="num">{usd(r.savings, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<DiscountInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_input, out) => <Visuals out={out} />} />;
}
