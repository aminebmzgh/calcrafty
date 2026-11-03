import Calculator from '../../components/calculator/Calculator.tsx';
import { usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { TipInput, TipOutput } from './math.ts';

function Visuals({ input, out }: { input: TipInput; out: TipOutput }) {
  if (input.bill <= 0) return null;
  return (
    <section class="panel" aria-labelledby="tip-table-h">
      <h2 id="tip-table-h" class="text-lg mb-3">
        Common tips on {usd(input.bill, true)}
      </h2>
      <table class="data-table">
        <caption class="sr-only">Tip, total and amount per person at common tip percentages</caption>
        <thead>
          <tr>
            <th scope="col">Tip %</th>
            <th scope="col">Tip</th>
            <th scope="col">Total</th>
            {out.people > 1 && <th scope="col">Each of {out.people}</th>}
          </tr>
        </thead>
        <tbody>
          {out.table.map((r) => (
            <tr key={r.percent}>
              <th scope="row">{r.percent}%</th>
              <td class="num">{usd(r.tip, true)}</td>
              <td class="num">{usd(r.total, true)}</td>
              {out.people > 1 && <td class="num">{usd(r.perPerson, true)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<TipInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
