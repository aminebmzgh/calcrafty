import Calculator from '../../components/calculator/Calculator.tsx';
import DataTable, { type Column } from '../../components/calculator/DataTable.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import { clock, type PaceInput, type PaceOutput } from './math.ts';

type Split = PaceOutput['splits'][number];
const cols: Column<Split>[] = [
  { key: 'n', label: 'Split', value: (r) => `${num(r.n, 2)} ${r.unit}`, csv: (r) => r.n },
  { key: 't', label: 'Elapsed time', value: (r) => clock(r.elapsed), csv: (r) => clock(r.elapsed) },
];

function Visuals({ out }: { out: PaceOutput }) {
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="pace-pred-h">
        <h2 id="pace-pred-h" class="text-lg">
          Race times at this fitness
        </h2>
        <table class="data-table mt-3">
          <caption class="sr-only">Race time predictions</caption>
          <thead>
            <tr>
              <th scope="col">Race</th>
              <th scope="col">Same pace</th>
              <th scope="col">Predicted (Riegel)</th>
            </tr>
          </thead>
          <tbody>
            {out.predictions.map((p) => (
              <tr key={p.key}>
                <th scope="row">{p.label}</th>
                <td>{clock(p.samePace)}</td>
                <td>{clock(p.riegel)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {out.splits.length > 0 && <DataTable<Split> title={`Splits (${out.splits.length})`} caption="Elapsed time at each split" columns={cols} rows={out.splits} csvName="running-splits.csv" />}
    </div>
  );
}

export default function Widget(props: WidgetProps<PaceInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_i, out) => <Visuals out={out} />} />;
}
