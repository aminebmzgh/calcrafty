import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import { clockOf, type TimeCardInput, type TimeCardOutput } from './math.ts';

function Visuals({ out }: { input: TimeCardInput; out: TimeCardOutput }) {
  if (out.shifts.length === 0) return null;
  return (
    <section class="panel" aria-labelledby="tc-shifts-h">
      <h2 id="tc-shifts-h" class="text-lg mb-3">
        Hours by shift
      </h2>
      <table class="data-table">
        <caption class="sr-only">Hours worked on each shift</caption>
        <thead>
          <tr>
            <th scope="col">Shift</th>
            <th scope="col">Break</th>
            <th scope="col">Hours</th>
            <th scope="col">Decimal</th>
          </tr>
        </thead>
        <tbody>
          {out.shifts.map((s, k) => (
            <tr key={k}>
              <th scope="row">
                {s.label || `Shift ${k + 1}`}
                {s.overnight ? ' (overnight)' : ''}
              </th>
              <td class="num">{num(s.breakMinutes, 0)} min</td>
              <td class="num">{clockOf(s.minutes)}</td>
              <td class="num">{num(s.hours, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function Widget(props: WidgetProps<TimeCardInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
