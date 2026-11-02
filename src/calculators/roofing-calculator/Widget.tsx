import Calculator from '../../components/calculator/Calculator.tsx';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { RoofingInput } from './math.ts';

export default function Widget(props: WidgetProps<RoofingInput>) {
  return <Calculator config={config} {...props} />;
}
