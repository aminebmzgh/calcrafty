import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import { BAG_YIELD_FT3, type BagSize, type ConcreteInput, type ConcreteOutput } from './math.ts';

const SIZES: BagSize[] = ['80', '60', '40'];

function Visuals({ out }: { input: ConcreteInput; out: ConcreteOutput }) {
  if (out.cubicFeet <= 0) return null;
  return (
    <section class="panel" aria-labelledby="concrete-bags-h">
      <h2 id="concrete-bags-h" class="text-lg mb-3">
        Bags needed by size
      </h2>
      <table class="data-table">
        <caption class="sr-only">Premixed concrete bags needed for {num(out.cubicFeet, 2)} cubic feet</caption>
        <thead>
          <tr>
            <th scope="col">Bag size</th>
            <th scope="col">Yield per bag</th>
            <th scope="col">Bags</th>
          </tr>
        </thead>
        <tbody>
          {SIZES.map((s) => (
            <tr key={s}>
              <th scope="row">{s} lb</th>
              <td class="num">{num(BAG_YIELD_FT3[s], 2)} cu ft</td>
              <td class="num">{num(out.bagsBySize[s], 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<ConcreteInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
