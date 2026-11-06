import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config, { SYMBOLS, UNIT_NAMES } from './config.ts';
import { referenceTable, type TemperatureInput, type TemperatureOutput } from './math.ts';

const REFERENCE = referenceTable();

function Visuals({ input, out }: { input: TemperatureInput; out: TemperatureOutput }) {
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="temp-all-h">
        <h2 id="temp-all-h" class="text-lg mb-3">
          {num(input.value, 4)} {SYMBOLS[input.from]} on every scale
        </h2>
        <table class="data-table">
          <caption class="sr-only">The same temperature on each scale</caption>
          <thead>
            <tr>
              <th scope="col">Scale</th>
              <th scope="col">Temperature</th>
            </tr>
          </thead>
          <tbody>
            {out.all.map((r) => (
              <tr key={r.unit}>
                <th scope="row">{UNIT_NAMES[r.unit]}</th>
                <td class="num">
                  {num(r.value, 4)} {SYMBOLS[r.unit]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section class="panel" aria-labelledby="temp-ref-h">
        <h2 id="temp-ref-h" class="text-lg mb-3">
          Reference temperatures
        </h2>
        <table class="data-table">
          <caption class="sr-only">Common reference temperatures in Celsius, Fahrenheit and kelvin</caption>
          <thead>
            <tr>
              <th scope="col">Point</th>
              <th scope="col">°C</th>
              <th scope="col">°F</th>
              <th scope="col">K</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCE.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                <td class="num">{num(r.c, 2)}</td>
                <td class="num">{num(r.f, 2)}</td>
                <td class="num">{num(r.k, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function Widget(props: WidgetProps<TemperatureInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
