import Calculator from '../../components/calculator/Calculator.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { weightLabel } from '../../lib/math/body.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { IdealWeightInput, IdealWeightOutput } from './math.ts';

function Visuals({ input, out }: { input: IdealWeightInput; out: IdealWeightOutput }) {
  const w = (kg: number) => weightLabel(kg, input.units, 0);
  return (
    <section class="panel" aria-labelledby="ibw-h">
      <h2 id="ibw-h" class="text-lg mb-3">
        Formulas compared
      </h2>
      <StackedBar
        title="Ideal weight by formula"
        summary={`Formulas range from ${w(out.minKg)} to ${w(out.maxKg)}; your current weight is ${w(out.currentKg)}; the healthy BMI range is ${w(out.bmiMinKg)} to ${w(out.bmiMaxKg)}.`}
        bars={[
          ...out.results.map((r) => ({ label: r.name, total: w(r.kg), segments: [{ label: r.name, value: r.kg, color: 'var(--chart-1)', display: w(r.kg) }] })),
          { label: 'BMI 24.9 (top of healthy range)', total: w(out.bmiMaxKg), segments: [{ label: 'BMI 24.9', value: out.bmiMaxKg, color: 'var(--chart-2)', display: w(out.bmiMaxKg) }] },
          { label: 'Your current weight', total: w(out.currentKg), segments: [{ label: 'Current', value: out.currentKg, color: 'var(--chart-3)', display: w(out.currentKg) }] },
        ]}
      />
    </section>
  );
}

export default function Widget(props: WidgetProps<IdealWeightInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
