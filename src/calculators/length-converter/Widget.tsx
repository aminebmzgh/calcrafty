import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config, { UNIT_NAMES } from './config.ts';
import type { LengthInput, LengthOutput } from './math.ts';

function Visuals({ input, out }: { input: LengthInput; out: LengthOutput }) {
  return (
    <section class="panel" aria-labelledby="length-all-h">
      <h2 id="length-all-h" class="text-lg mb-3">
        {num(input.value, 6)} {UNIT_NAMES[input.from]} in every unit
      </h2>
      <table class="data-table">
        <caption class="sr-only">The same length in each unit</caption>
        <thead>
          <tr>
            <th scope="col">Unit</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {out.all.map((r) => (
            <tr key={r.unit}>
              <th scope="row">
                {UNIT_NAMES[r.unit]} ({r.unit})
              </th>
              <td class="num">{num(r.value, 6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<LengthInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
