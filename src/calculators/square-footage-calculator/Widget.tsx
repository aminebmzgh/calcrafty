import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { SquareFootageInput, SquareFootageOutput } from './math.ts';

function Visuals({ out }: { input: SquareFootageInput; out: SquareFootageOutput }) {
  const rows: [string, string][] = [
    ['Square feet', num(out.sqft, 2)],
    ['Square inches', num(out.sqin, 0)],
    ['Square yards', num(out.sqyd, 2)],
    ['Square meters', num(out.sqm, 3)],
    ['Acres', num(out.acres, 5)],
  ];
  return (
    <section class="panel" aria-labelledby="sqft-units-h">
      <h2 id="sqft-units-h" class="text-lg mb-3">
        The area in every unit
      </h2>
      <table class="data-table">
        <caption class="sr-only">The same area in square feet, inches, yards, meters and acres</caption>
        <thead>
          <tr>
            <th scope="col">Unit</th>
            <th scope="col">Area</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([u, v]) => (
            <tr key={u}>
              <th scope="row">{u}</th>
              <td class="num">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<SquareFootageInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
