import Calculator from '../../components/calculator/Calculator.tsx';
import DataTable, { type Column } from '../../components/calculator/DataTable.tsx';
import LineChart from '../../components/charts/LineChart.tsx';
import { usd, usdCompact } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { RentBuyInput, RentBuyOutput, RentBuyYear } from './math.ts';

const cols: Column<RentBuyYear>[] = [
  { key: 'y', label: 'Year', value: (r) => String(r.year), csv: (r) => r.year },
  { key: 'bc', label: 'Owning costs', value: (r) => usd(r.buyCostYear), csv: (r) => r.buyCostYear.toFixed(2) },
  { key: 'rc', label: 'Renting costs', value: (r) => usd(r.rentCostYear), csv: (r) => r.rentCostYear.toFixed(2) },
  { key: 'bn', label: 'Net worth (buy)', value: (r) => usd(r.buyerNetWorth), csv: (r) => r.buyerNetWorth.toFixed(2) },
  { key: 'rn', label: 'Net worth (rent)', value: (r) => usd(r.renterNetWorth), csv: (r) => r.renterNetWorth.toFixed(2) },
  { key: 'a', label: 'Buying ahead by', value: (r) => usd(r.advantage), csv: (r) => r.advantage.toFixed(2) },
];

function Visuals({ input, out }: { input: RentBuyInput; out: RentBuyOutput }) {
  const n = out.years.length;
  const step = n > 20 ? 5 : n > 8 ? 2 : 1;
  return (
    <div class="grid gap-6">
      <section class="panel" aria-labelledby="rvb-h">
        <h2 id="rvb-h" class="text-lg mb-3">
          Net worth: buying vs renting
        </h2>
        <LineChart
          title="Net worth by year"
          summary={`After ${input.years} years, net worth is ${usd(out.buyerNetWorth)} if you buy and ${usd(out.renterNetWorth)} if you rent.${out.breakEvenYear ? ` Buying pulls ahead in year ${out.breakEvenYear}.` : ''}`}
          series={[
            { name: 'Buy', color: 'var(--chart-1)', values: out.years.map((y) => y.buyerNetWorth) },
            { name: 'Rent and invest', color: 'var(--chart-3)', values: out.years.map((y) => y.renterNetWorth), dashed: true },
          ]}
          xLabel={(i) => `Yr ${i + 1}`}
          xTicks={Array.from({ length: n }, (_, k) => k).filter((k) => (k + 1) % step === 0 || k === 0)}
          yFormat={usdCompact}
        />
      </section>
      <DataTable<RentBuyYear> title={`Year-by-year comparison (${n} years)`} caption="Rent vs buy by year" columns={cols} rows={out.years} csvName="rent-vs-buy.csv" />
    </div>
  );
}

export default function Widget(props: WidgetProps<RentBuyInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
