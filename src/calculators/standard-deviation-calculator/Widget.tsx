import Calculator from '../../components/calculator/Calculator.tsx';
import DataTable, { type Column } from '../../components/calculator/DataTable.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { StdDevInput, StdDevOutput } from './math.ts';

type Row = StdDevOutput['deviations'][number] & { i: number };
const cols: Column<Row>[] = [
  { key: 'i', label: '#', value: (r) => String(r.i), csv: (r) => r.i },
  { key: 'x', label: 'Value (x)', value: (r) => num(r.x, 6), csv: (r) => r.x },
  { key: 'd', label: 'x − mean', value: (r) => num(r.dev, 6), csv: (r) => r.dev },
  { key: 's', label: '(x − mean)²', value: (r) => num(r.sq, 6), csv: (r) => r.sq },
];

export default function Widget(props: WidgetProps<StdDevInput>) {
  return (
    <Calculator
      config={config}
      {...props}
      renderVisuals={(_i, out) =>
        out.n > 0 ? (
          <DataTable<Row>
            title={`Deviations table (${out.n} values)`}
            caption="Each value's deviation from the mean"
            columns={cols}
            rows={out.deviations.map((d, i) => ({ ...d, i: i + 1 }))}
            csvName="standard-deviation-steps.csv"
            open={out.n <= 12}
          />
        ) : null
      }
    />
  );
}
