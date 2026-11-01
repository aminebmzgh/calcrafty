import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { CalorieInput, CalorieOutput } from './math.ts';

function Visuals({ input, out }: { input: CalorieInput; out: CalorieOutput }) {
  return (
    <section class="panel" aria-labelledby="cal-goals-h">
      <h2 id="cal-goals-h" class="text-lg mb-3">
        Daily calories by goal
      </h2>
      <StackedBar
        title="Calories per day"
        summary={`Maintenance is ${num(out.tdee, 0)} kcal a day. Each pound per week of loss or gain moves the target by 500 kcal a day.`}
        bars={out.goals.map((g) => ({
          label: `${g.label}${g.value === input.goal ? ' (your goal)' : ''}${g.calories < out.floor ? ', below the usual minimum' : ''}`,
          total: `${num(g.calories, 0)} kcal`,
          segments: [{ label: g.label, value: g.calories, color: g.value === input.goal ? 'var(--chart-1)' : 'var(--rule-strong)', display: `${num(g.calories, 0)} kcal` }],
        }))}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<CalorieInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
