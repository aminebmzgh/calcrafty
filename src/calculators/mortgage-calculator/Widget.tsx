import { useState } from 'preact/hooks';
import Calculator from '../../components/calculator/Calculator.tsx';
import DataTable, { type Column } from '../../components/calculator/DataTable.tsx';
import UnitToggle from '../../components/calculator/UnitToggle.tsx';
import DonutChart from '../../components/charts/DonutChart.tsx';
import LineChart from '../../components/charts/LineChart.tsx';
import { duration, usd, usdCompact } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import type { YearRow } from '../../lib/math/money.ts';
import config from './config.ts';
import { computeMortgage, type MortgageInput, type MortgageOutput, type MortgageRow } from './math.ts';

const yearCols: Column<YearRow>[] = [
  { key: 'y', label: 'Year', value: (r) => String(r.year), csv: (r) => r.year },
  { key: 'p', label: 'Principal', value: (r) => usd(r.principal + r.extra), csv: (r) => (r.principal + r.extra).toFixed(2) },
  { key: 'i', label: 'Interest', value: (r) => usd(r.interest), csv: (r) => r.interest.toFixed(2) },
  { key: 'm', label: 'PMI', value: (r) => usd(r.other), csv: (r) => r.other.toFixed(2) },
  { key: 'b', label: 'Balance', value: (r) => usd(r.balance), csv: (r) => r.balance.toFixed(2) },
];

const monthCols: Column<MortgageRow>[] = [
  { key: 'n', label: 'Month', value: (r) => String(r.period), csv: (r) => r.period },
  { key: 'pay', label: 'Payment', value: (r) => usd(r.payment + r.extra, true), csv: (r) => (r.payment + r.extra).toFixed(2) },
  { key: 'p', label: 'Principal', value: (r) => usd(r.principal + r.extra, true), csv: (r) => (r.principal + r.extra).toFixed(2) },
  { key: 'i', label: 'Interest', value: (r) => usd(r.interest, true), csv: (r) => r.interest.toFixed(2) },
  { key: 'm', label: 'PMI', value: (r) => usd(r.other, true), csv: (r) => r.other.toFixed(2) },
  { key: 'b', label: 'Balance', value: (r) => usd(r.balance, true), csv: (r) => r.balance.toFixed(2) },
];

function Visuals({ input, out }: { input: MortgageInput; out: MortgageOutput }) {
  const [view, setView] = useState<'year' | 'month'>('year');
  if (out.loanAmount <= 0) return null;

  // Balance at the end of each year; compare with the no-extra baseline when extra payments are set.
  const years = Math.ceil(Math.max(out.baseline.payoffMonths, out.payoffMonths) / 12);
  const balances = [out.loanAmount, ...out.years.map((y) => y.balance)];
  const series = [{ name: input.extraMonthly > 0 ? 'With extra payments' : 'Loan balance', color: 'var(--chart-1)', values: balances }];
  if (input.extraMonthly > 0) {
    const base = computeMortgage({ ...input, extraMonthly: 0 });
    series.push({ name: 'Without extra payments', color: 'var(--chart-3)', values: [base.loanAmount, ...base.years.map((y) => y.balance)], dashed: true } as (typeof series)[number]);
  }
  const step = years > 20 ? 5 : years > 8 ? 2 : 1;
  const ticks = Array.from({ length: Math.floor(years / step) + 1 }, (_, k) => k * step).filter((t) => t <= years);
  const half = out.years[Math.min(out.years.length - 1, Math.floor(years / 2) - 1)];

  return (
    <div class="grid gap-6">
      <div class="grid gap-6 lg:grid-cols-2">
        <section class="panel" aria-labelledby="breakdown-h">
          <h2 id="breakdown-h" class="text-lg mb-3">
            Where your monthly payment goes
          </h2>
          <DonutChart
            title="Monthly payment breakdown"
            center={usd(out.totalMonthly)}
            centerSub="per month"
            segments={[
              { label: 'Principal & interest', value: out.monthlyPI, color: 'var(--chart-1)', display: usd(out.monthlyPI) },
              { label: 'Property tax', value: out.monthlyTax, color: 'var(--chart-2)', display: usd(out.monthlyTax) },
              { label: 'Home insurance', value: out.monthlyInsurance, color: 'var(--chart-3)', display: usd(out.monthlyInsurance) },
              { label: 'PMI', value: out.monthlyPMI, color: 'var(--chart-4)', display: usd(out.monthlyPMI) },
              { label: 'HOA', value: out.monthlyHOA, color: 'var(--ink-2)', display: usd(out.monthlyHOA) },
            ]}
          />
        </section>
        <section class="panel" aria-labelledby="balance-h">
          <h2 id="balance-h" class="text-lg mb-3">
            Loan balance over time
          </h2>
          <LineChart
            title="Loan balance by year"
            summary={`The balance falls from ${usd(out.loanAmount)} to $0 over ${duration(out.payoffMonths)}${half ? `; after year ${half.year} you still owe ${usd(half.balance)}` : ''}. Early payments are mostly interest, so the balance drops slowly at first.`}
            series={series}
            xLabel={(i) => (i === 0 ? 'Start' : `Yr ${i}`)}
            xTicks={ticks}
            yFormat={usdCompact}
            area
          />
        </section>
      </div>
      {view === 'year' ? (
        <DataTable<YearRow>
          title={`Amortization schedule (${out.years.length} years)`}
          caption="Amortization schedule by year"
          columns={yearCols}
          rows={out.years}
          csvName="mortgage-amortization-yearly.csv"
          controls={<UnitToggle name="amort-view" label="Schedule view" value={view} options={[{ value: 'year', label: 'Yearly' }, { value: 'month', label: 'Monthly' }]} onChange={(v) => setView(v as 'year' | 'month')} />}
        />
      ) : (
        <DataTable<MortgageRow>
          title={`Amortization schedule (${out.schedule.length} months)`}
          caption="Amortization schedule by month"
          columns={monthCols}
          rows={out.schedule}
          csvName="mortgage-amortization-monthly.csv"
          open
          controls={<UnitToggle name="amort-view" label="Schedule view" value={view} options={[{ value: 'year', label: 'Yearly' }, { value: 'month', label: 'Monthly' }]} onChange={(v) => setView(v as 'year' | 'month')} />}
        />
      )}
    </div>
  );
}

export default function Widget(props: WidgetProps<MortgageInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
