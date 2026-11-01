/**
 * Hydrates calculator widgets (loaded on demand by src/scripts/islands-boot.ts).
 * Each page loads only its own Widget chunk (lazy glob import), so adding a calculator
 * never requires touching this file.
 */
import { h, hydrate } from 'preact';
import { addRecent } from '../lib/storage.ts';

type WidgetModule = { default: (props: Record<string, unknown>) => unknown };
const widgets = import.meta.glob<WidgetModule>('../calculators/*/Widget.tsx');

interface Island {
  el: HTMLElement;
  props: Record<string, unknown>;
  load: () => Promise<WidgetModule>;
  live: boolean;
}

const islands: Island[] = [];
for (const el of document.querySelectorAll<HTMLElement>('[data-widget]')) {
  const load = widgets[`../calculators/${el.dataset.widget}/Widget.tsx`];
  if (!load) continue;
  const props = JSON.parse(el.dataset.props ?? '{}') as Record<string, unknown>;
  let mod: Promise<WidgetModule> | null = null;
  islands.push({ el, props, load: () => (mod ??= load()), live: false });
  if (!props.embed) addRecent(el.dataset.widget!);
}

/** Fetches widget code without hydrating (idle preload). */
export function preload(): void {
  for (const i of islands) void i.load();
}

/** Hydrates every widget; replays a button click that happened before hydration. */
export async function start(pendingClick?: HTMLElement | null): Promise<void> {
  await Promise.all(
    islands.map(async (i) => {
      if (i.live) return;
      const m = await i.load();
      if (i.live) return;
      i.live = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hydrate(h(m.default as any, i.props), i.el);
    }),
  );
  if (pendingClick?.isConnected) pendingClick.click();
}
