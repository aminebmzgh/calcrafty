/** Balance-vs-contributions chart and yearly table, shared by the savings and investment calculators. */
import type { GrowthYear } from '../../lib/math/growth.ts';
import { usd, usdCompact } from '../../lib/format.ts';
import LineChart from '../charts/LineChart.tsx';
import DataTable, { type Column } from './DataTable.tsx';

const cols = (startYear?: number, ageLabel?: boolean): Column<GrowthYear>[] => [
  { key: 'y', label: ageLabel ? 'Age' : 'Year', value: (r) => String(startYear !== undefined ? startYear + r.year : r.year), csv: (r) => (startYear !== undefined ? startYear + r.year : r.year) },
  { key: 'c', label: 'Added this year', value: (r) => usd(r.contributions), csv: (r) => r.contributions.toFixed(2) },
  { key: 'i', label: 'Growth this year', value: (r) => usd(r.interest), csv: (r) => r.interest.toFixed(2) },
  { key: 't', label: 'Total contributed', value: (r) => usd(r.totalContributed), csv: (r) => r.totalContributed.toFixed(2) },
  { key: 'b', label: 'Balance', value: (r) => usd(r.balance), csv: (r) => r.balance.toFixed(2) },
];

export interface GrowthVisualsProps {
  name: string;
  start: number;
  years: GrowthYear[];
  /** Label x-axis by age instead of year (retirement). */
  startAge?: number;
  /** Optional third series, e.g. the balance in today's dollars. */
  extra?: { name: string; values: number[] };
  title?: string;
}

export default function GrowthVisuals({ name, start, years, startAge, extra, title = 'Growth over time' }: GrowthVisualsProps) {
  if (!years.length) return null;
  const n = years.length;
  const step = n > 30 ? 10 : n > 12 ? 5 : n > 6 ? 2 : 1;
  const ticks = Array.from({ length: Math.floor(n / step) + 1 }, (_, k) => k * step).filter((t) => t <= n);
  const last = years.at(-1)!;
  const label = (i: number) => (startAge !== undefined ? String(startAge + i) : i === 0 ? 'Now' : `Yr ${i}`);
  const series = [
    { name: 'Balance', color: 'var(--chart-1)', values: [start, ...years.map((y) => y.balance)] },
    { name: 'Total contributed', color: 'var(--chart-2)', values: [start, ...years.map((y) => y.totalContributed)], dashed: true },
  ];
  if (extra) series.push({ name: extra.name, color: 'var(--chart-3)', values: extra.values, dashed: true });
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby={`${name}-growth-h`}>
        <h2 id={`${name}-growth-h`} class="text-lg mb-3">
          {title}
        </h2>
        <LineChart
          title={title}
          summary={`After ${n} ${n === 1 ? 'year' : 'years'} the balance reaches ${usd(last.balance)}, of which ${usd(last.totalContributed)} is money put in and ${usd(last.totalGrowth)} is growth.`}
          series={series}
          xLabel={label}
          xTicks={ticks}
          yFormat={usdCompact}
          area
        />
      </section>
      <DataTable<GrowthYear> title={`Year-by-year table (${n} ${n === 1 ? 'year' : 'years'})`} caption="Balance by year" columns={cols(startAge, startAge !== undefined)} rows={years} csvName={`${name}-by-year.csv`} />
    </div>
  );
}
