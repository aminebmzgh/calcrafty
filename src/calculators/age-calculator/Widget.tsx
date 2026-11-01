import Calculator from '../../components/calculator/Calculator.tsx';
import type { WidgetProps } from '../../lib/types.ts';
import config from './config.ts';
import type { AgeInput } from './math.ts';

export default function Widget(props: WidgetProps<AgeInput>) {
  return <Calculator config={config} {...props} />;
}
