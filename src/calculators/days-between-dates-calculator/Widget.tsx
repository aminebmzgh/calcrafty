import Calculator from '../../components/calculator/Calculator.tsx';
import { parseISO, shortLabel } from '../../lib/math/dates.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { DaysInput, DaysOutput } from './math.ts';

function Holidays({ out }: { out: DaysOutput }) {
  if (!out.holidays.length) return null;
  return (
    <section class="panel" aria-labelledby="hol-h">
      <h2 id="hol-h" class="text-lg">
        Federal holidays excluded
      </h2>
      <ul class="mt-3 grid gap-1">
        {out.holidays.map((h) => (
          <li key={h.date}>
            <span class="num">{shortLabel(parseISO(h.date)!)}</span>: {h.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Widget(props: WidgetProps<DaysInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_i, out) => <Holidays out={out} />} />;
}
