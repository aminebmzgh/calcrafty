/** Server-side lookup of calculator Widgets (for pre-rendering). The client hydrates via src/scripts/islands.ts. */
import type { FunctionComponent } from 'preact';
import type { WidgetProps } from './types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWidget = FunctionComponent<WidgetProps<any>>;

const modules = import.meta.glob<{ default: AnyWidget }>('../calculators/*/Widget.tsx', { eager: true });

export function getWidget(slug: string): AnyWidget {
  const mod = modules[`../calculators/${slug}/Widget.tsx`];
  if (!mod) throw new Error(`src/calculators/${slug}/Widget.tsx is missing`);
  return mod.default;
}
