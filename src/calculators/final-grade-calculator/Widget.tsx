import Calculator from '../../components/calculator/Calculator.tsx';
import { pct } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import { gradeTable, type FinalInput, type FinalOutput } from './math.ts';

function Visuals({ input }: { input: FinalInput; out: FinalOutput }) {
  const rows = gradeTable(input.current, input.weight);
  return (
    <section class="panel" aria-labelledby="final-table-h">
      <h2 id="final-table-h" class="text-lg mb-3">
        Your course grade for each final score
      </h2>
      <table class="data-table">
        <caption class="sr-only">Course grade by final exam score</caption>
        <thead>
          <tr>
            <th scope="col">Final exam score</th>
            <th scope="col">Course grade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.score}>
              <th scope="row">{pct(r.score, 0)}</th>
              <td class="num">{pct(r.grade, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<FinalInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
