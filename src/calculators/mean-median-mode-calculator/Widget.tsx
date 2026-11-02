import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { MmmInput, MmmOutput } from './math.ts';

function Visuals({ out }: { input: MmmInput; out: MmmOutput }) {
  if (out.count === 0) return null;
  return (
    <section class="panel" aria-labelledby="mmm-sorted-h">
      <h2 id="mmm-sorted-h" class="text-lg mb-3">
        Your numbers, sorted
      </h2>
      <p class="num" style="overflow-wrap:anywhere">
        {out.sorted.slice(0, 500).map((v) => num(v, 10)).join(', ')}
        {out.sorted.length > 500 ? ', …' : ''}
      </p>
    </section>
  );
}

export default function Widget(props: WidgetProps<MmmInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <Visuals input={input} out={out} />} />;
}
