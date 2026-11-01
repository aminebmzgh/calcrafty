/** Amortization schedule with a yearly/monthly toggle and CSV export (shared by loan calculators). */
import { useState } from 'preact/hooks';
import type { AmortRow, YearRow } from '../../lib/math/money.ts';
import { usd } from '../../lib/format.ts';
import DataTable, { type Column } from './DataTable.tsx';
import UnitToggle from './UnitToggle.tsx';

const yearCols: Column<YearRow>[] = [
  { key: 'y', label: 'Year', value: (r) => String(r.year), csv: (r) => r.year },
  { key: 'p', label: 'Principal', value: (r) => usd(r.principal + r.extra), csv: (r) => (r.principal + r.extra).toFixed(2) },
  { key: 'i', label: 'Interest', value: (r) => usd(r.interest), csv: (r) => r.interest.toFixed(2) },
  { key: 'b', label: 'Balance', value: (r) => usd(r.balance), csv: (r) => r.balance.toFixed(2) },
];

const monthCols: Column<AmortRow>[] = [
  { key: 'n', label: 'Month', value: (r) => String(r.period), csv: (r) => r.period },
  { key: 'pay', label: 'Payment', value: (r) => usd(r.payment + r.extra, true), csv: (r) => (r.payment + r.extra).toFixed(2) },
  { key: 'p', label: 'Principal', value: (r) => usd(r.principal + r.extra, true), csv: (r) => (r.principal + r.extra).toFixed(2) },
  { key: 'i', label: 'Interest', value: (r) => usd(r.interest, true), csv: (r) => r.interest.toFixed(2) },
  { key: 'b', label: 'Balance', value: (r) => usd(r.balance, true), csv: (r) => r.balance.toFixed(2) },
];

export default function AmortizationTable({ rows, years, name }: { rows: AmortRow[]; years: YearRow[]; name: string }) {
  const [view, setView] = useState<'year' | 'month'>(rows.length <= 24 ? 'month' : 'year');
  const toggle = <UnitToggle name={`${name}-view`} label="Schedule view" value={view} options={[{ value: 'year', label: 'Yearly' }, { value: 'month', label: 'Monthly' }]} onChange={(v) => setView(v as 'year' | 'month')} />;
  return view === 'year' ? (
    <DataTable<YearRow> title={`Amortization schedule (${years.length} ${years.length === 1 ? 'year' : 'years'})`} caption="Amortization schedule by year" columns={yearCols} rows={years} csvName={`${name}-amortization-yearly.csv`} controls={toggle} />
  ) : (
    <DataTable<AmortRow> title={`Amortization schedule (${rows.length} months)`} caption="Amortization schedule by month" columns={monthCols} rows={rows} csvName={`${name}-amortization-monthly.csv`} controls={toggle} open={rows.length > 24} />
  );
}
