import Calculator from '../../components/calculator/Calculator.tsx';
import GrowthVisuals from '../../components/calculator/GrowthVisuals.tsx';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { CompoundInput } from './math.ts';

export default function Widget(props: WidgetProps<CompoundInput>) {
  return <Calculator config={config} {...props} renderVisuals={(input, out) => <GrowthVisuals name="compound" start={input.principal} years={out.years} title="Balance over time" />} />;
}
