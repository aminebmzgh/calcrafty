import Calculator from '../../components/calculator/Calculator.tsx';
import DonutChart from '../../components/charts/DonutChart.tsx';
import { pct, usd } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { PaycheckInput, PaycheckOutput } from './math.ts';

function Visuals({ out }: { out: PaycheckOutput }) {
  if (out.grossAnnual <= 0) return null;
  const p = out.perPeriod;
  // [label, per paycheck, per year]; negative = deducted.
  const rows: [string, number, number][] = [
    ['Gross pay', out.grossPerPeriod, out.grossAnnual],
    ['Federal income tax', -p.federal, -out.federalTax],
    ['Social Security', -p.socialSecurity, -out.socialSecurity],
    ['Medicare', -p.medicare, -out.medicare],
    ['State and local tax', -p.stateAndLocal, -out.stateAndLocal],
    ['401(k)', -p.retirement, -out.retirementAnnual],
    ['Pre-tax benefits', -p.preTax, -out.preTaxAnnual],
    ['Take-home pay', out.netPerPeriod, out.netAnnual],
  ];
  return (
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="panel" aria-labelledby="pay-split-h">
        <h2 id="pay-split-h" class="text-lg mb-3">
          Where each paycheck goes
        </h2>
        <DonutChart
          title="Paycheck breakdown"
          center={usd(out.grossPerPeriod)}
          centerSub="gross"
          segments={[
            { label: 'Take-home pay', value: out.netPerPeriod, color: 'var(--chart-2)', display: usd(out.netPerPeriod) },
            { label: 'Federal income tax', value: p.federal, color: 'var(--chart-1)', display: usd(p.federal) },
            { label: 'Social Security + Medicare', value: p.fica, color: 'var(--chart-3)', display: usd(p.fica) },
            { label: 'State and local tax', value: p.stateAndLocal, color: 'var(--chart-4)', display: usd(p.stateAndLocal) },
            { label: '401(k) and benefits', value: p.deductions, color: 'var(--ink-2)', display: usd(p.deductions) },
          ]}
        />
      </section>
      <section class="panel" aria-labelledby="pay-stub-h">
        <h2 id="pay-stub-h" class="text-lg">
          Your estimated pay stub
        </h2>
        <table class="data-table mt-3">
          <caption class="sr-only">Estimated pay stub per paycheck and per year</caption>
          <thead>
            <tr>
              <th scope="col">Line</th>
              <th scope="col">Per paycheck</th>
              <th scope="col">Per year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, v, y]) => (
              <tr key={label}>
                <th scope="row" style={{ fontWeight: label === 'Take-home pay' || label === 'Gross pay' ? 700 : 500 }}>
                  {label}
                </th>
                <td>{v < 0 ? `−${usd(-v, true)}` : usd(v, true)}</td>
                <td>{y < 0 ? `−${usd(-y)}` : usd(y)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p class="mt-3 text-sm muted">Marginal federal rate {pct(out.marginalRate * 100, 0)} · effective total tax rate {pct(out.effectiveRate, 1)}</p>
      </section>
    </div>
  );
}

export default function Widget(props: WidgetProps<PaycheckInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_i, out) => <Visuals out={out} />} />;
}
