import Calculator from '../../components/calculator/Calculator.tsx';
import GrowthVisuals from '../../components/calculator/GrowthVisuals.tsx';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { InvestmentInput } from './math.ts';

export default function Widget(props: WidgetProps<InvestmentInput>) {
  return (
    <Calculator
      config={config}
      {...props}
      renderVisuals={(input, out) => (
        <GrowthVisuals name="investment" start={input.initial} years={out.years} title="Projected growth" extra={{ name: 'Balance in today’s dollars', values: out.realSeries }} />
      )}
    />
  );
}
