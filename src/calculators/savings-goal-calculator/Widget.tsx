import Calculator from '../../components/calculator/Calculator.tsx';
import GrowthVisuals from '../../components/calculator/GrowthVisuals.tsx';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { SavingsGoalInput } from './math.ts';

export default function Widget(props: WidgetProps<SavingsGoalInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => (out.reached && out.years.length ? <GrowthVisuals name="savings-goal" start={input.current} years={out.years} title="Your path to the goal" /> : null)} />;
}
