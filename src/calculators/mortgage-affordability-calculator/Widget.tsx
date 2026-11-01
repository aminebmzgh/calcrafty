import Calculator from '../../components/calculator/Calculator.tsx';
import DonutChart from '../../components/charts/DonutChart.tsx';
import StackedBar from '../../components/charts/StackedBar.tsx';
import { pct, usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { AffordabilityInput, AffordabilityOutput } from './math.ts';

function Visuals({ input, out }: { input: AffordabilityInput; out: AffordabilityOutput }) {
  if (out.maxPrice <= 0) return null;
  const p = out.payment;
  return (
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="panel" aria-labelledby="afford-pay-h">
        <h2 id="afford-pay-h" class="text-lg mb-3">
          The payment at your maximum price
        </h2>
        <DonutChart
          title="Monthly housing payment"
          center={usd(p.total)}
          centerSub="per month"
          segments={[
            { label: 'Principal & interest', value: p.pi, color: 'var(--chart-1)', display: usd(p.pi) },
            { label: 'Property tax', value: p.tax, color: 'var(--chart-2)', display: usd(p.tax) },
            { label: 'Home insurance', value: p.insurance, color: 'var(--chart-3)', display: usd(p.insurance) },
            { label: 'PMI', value: p.pmi, color: 'var(--chart-4)', display: usd(p.pmi) },
            { label: 'HOA', value: p.hoa, color: 'var(--ink-2)', display: usd(p.hoa) },
          ]}
        />
      </section>
      <section class="panel" aria-labelledby="afford-dti-h">
        <h2 id="afford-dti-h" class="text-lg mb-3">
          Your debt-to-income ratios
        </h2>
        <StackedBar
          title={`Share of ${usd(out.monthlyIncome)} monthly income`}
          summary={`Housing takes ${pct(out.frontDti, 1)} of gross income (limit ${pct(input.frontRatio, 0)}); housing plus other debts take ${pct(out.backDti, 1)} (limit ${pct(input.backRatio, 0)}).`}
          bars={[
            { label: `Housing (limit ${pct(input.frontRatio, 0)})`, total: pct(out.frontDti, 1), segments: [{ label: 'Housing', value: out.frontDti, color: 'var(--chart-1)', display: pct(out.frontDti, 1) }] },
            {
              label: `All debts (limit ${pct(input.backRatio, 0)})`,
              total: pct(out.backDti, 1),
              segments: [
                { label: 'Housing', value: out.frontDti, color: 'var(--chart-1)', display: pct(out.frontDti, 1) },
                { label: 'Other debts', value: out.otherDti, color: 'var(--chart-3)', display: usd(input.monthlyDebts) },
              ],
            },
          ]}
        />
      </section>
    </div>
  );
}

export default function Widget(props: WidgetProps<AffordabilityInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
