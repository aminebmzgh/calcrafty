import Calculator from '../../components/calculator/Calculator.tsx';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import { ACE, type BodyFatInput, type BodyFatOutput } from './math.ts';

function Chart({ input, out }: { input: BodyFatInput; out: BodyFatOutput }) {
  return (
    <section class="panel" aria-labelledby="bf-chart-h">
      <h2 id="bf-chart-h" class="text-lg">
        Body fat chart for {input.sex === 'female' ? 'women' : 'men'} (ACE)
      </h2>
      <table class="data-table mt-3">
        <caption class="sr-only">American Council on Exercise body fat categories</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Body fat</th>
          </tr>
        </thead>
        <tbody>
          {ACE[input.sex].slice(1).map((c) => {
            const you = c.label === out.category;
            return (
              <tr key={c.label} style={you ? { background: 'var(--accent-soft)' } : undefined}>
                <th scope="row" style={{ fontWeight: you ? 700 : 500 }}>
                  {c.label}
                  {you ? ' (you)' : ''}
                </th>
                <td>{c.range}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<BodyFatInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Chart input={input} out={out} />} />;
}
