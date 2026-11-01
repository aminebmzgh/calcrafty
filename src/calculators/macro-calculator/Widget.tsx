import Calculator from '../../components/calculator/Calculator.tsx';
import DonutChart from '../../components/charts/DonutChart.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { MacroInput, MacroOutput } from './math.ts';

function Visuals({ out }: { out: MacroOutput }) {
  return (
    <section class="panel" aria-labelledby="macro-split-h">
      <h2 id="macro-split-h" class="text-lg mb-3">
        Where your calories come from
      </h2>
      <DonutChart
        title="Calories by macronutrient"
        center={`${num(out.calories, 0)}`}
        centerSub="kcal a day"
        segments={[
          { label: `Protein, ${num(out.protein.grams, 0)} g`, value: out.protein.kcal, color: 'var(--chart-1)', display: `${num(out.protein.kcal, 0)} kcal` },
          { label: `Carbs, ${num(out.carbs.grams, 0)} g`, value: out.carbs.kcal, color: 'var(--chart-2)', display: `${num(out.carbs.kcal, 0)} kcal` },
          { label: `Fat, ${num(out.fat.grams, 0)} g`, value: out.fat.kcal, color: 'var(--chart-3)', display: `${num(out.fat.kcal, 0)} kcal` },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<MacroInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_i, out) => <Visuals out={out} />} />;
}
