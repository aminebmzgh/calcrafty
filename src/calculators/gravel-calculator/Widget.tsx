import Calculator from '../../components/calculator/Calculator.tsx';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { GravelInput } from './math.ts';

export default function Widget(props: WidgetProps<GravelInput>) {
  return <Calculator config={config} {...props} />;
}
