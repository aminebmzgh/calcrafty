import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { PunnettInput, PunnettOutput } from './math.ts';

function Visuals({ out }: { input: PunnettInput; out: PunnettOutput }) {
  if (!out.valid) return null;
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="punnett-grid-h">
        <h2 id="punnett-grid-h" class="text-lg mb-3">
          Punnett square
        </h2>
        <div style="overflow-x:auto">
          <table class="data-table">
            <caption class="sr-only">Offspring genotypes: parent 1 gametes down the side, parent 2 gametes across the top</caption>
            <thead>
              <tr>
                <th scope="col">Gametes</th>
                {out.gametes2.map((g, c) => (
                  <th scope="col" key={c}>
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {out.grid.map((row, r) => (
                <tr key={r}>
                  <th scope="row">{out.gametes1[r]}</th>
                  {row.map((cell, c) => (
                    <td key={c} class="num">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel" aria-labelledby="punnett-ratios-h">
        <h2 id="punnett-ratios-h" class="text-lg mb-3">
          Offspring by genotype
        </h2>
        <table class="data-table">
          <caption class="sr-only">Share of offspring with each genotype</caption>
          <thead>
            <tr>
              <th scope="col">Genotype</th>
              <th scope="col">Boxes</th>
              <th scope="col">Chance</th>
            </tr>
          </thead>
          <tbody>
            {out.genotypes.map((g) => (
              <tr key={g.label}>
                <th scope="row">{g.label}</th>
                <td class="num">
                  {g.count} of {out.cells}
                </td>
                <td class="num">{num(g.percent, 2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function Widget(props: WidgetProps<PunnettInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
