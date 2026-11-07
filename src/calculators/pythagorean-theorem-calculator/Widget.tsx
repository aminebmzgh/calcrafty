import Calculator from '../../components/calculator/Calculator.tsx';
import { num } from '../../lib/format.ts';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { PythagorasInput, PythagorasOutput } from './math.ts';

/** A right triangle drawn to the proportions of the result, with each side labelled. */
function Triangle({ out }: { out: PythagorasOutput }) {
  if (!out.valid) return null;
  const W = 260;
  const H = 180;
  const scale = Math.min((W - 60) / out.b, (H - 40) / out.a);
  const bx = out.b * scale;
  const ay = out.a * scale;
  const x0 = 30;
  const y0 = H - 20;
  return (
    <section class="panel" aria-labelledby="tri-h">
      <h2 id="tri-h" class="text-lg mb-3">
        Your triangle, to scale
      </h2>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style="max-width:340px" role="img" aria-label={`Right triangle with legs a = ${num(out.a, 4)} and b = ${num(out.b, 4)}, and hypotenuse c = ${num(out.c, 4)}`}>
        <polygon points={`${x0},${y0} ${x0 + bx},${y0} ${x0},${y0 - ay}`} fill="var(--color-accent-soft, transparent)" stroke="currentColor" stroke-width="2" />
        <rect x={x0} y={y0 - 12} width="12" height="12" fill="none" stroke="currentColor" stroke-width="1" />
        <text x={x0 - 6} y={y0 - ay / 2} text-anchor="end" font-size="13" fill="currentColor">
          a = {num(out.a, 3)}
        </text>
        <text x={x0 + bx / 2} y={y0 + 16} text-anchor="middle" font-size="13" fill="currentColor">
          b = {num(out.b, 3)}
        </text>
        <text x={x0 + bx / 2 + 8} y={y0 - ay / 2 - 6} font-size="13" fill="currentColor">
          c = {num(out.c, 3)}
        </text>
      </svg>
    </section>
  );
}

export default function Widget(props: WidgetProps<PythagorasInput>) {
  return <Calculator config={config} {...props} renderVisuals={(_input, out) => <Triangle out={out} />} />;
}
