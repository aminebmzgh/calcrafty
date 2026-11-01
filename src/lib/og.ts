/** Build-time Open Graph images (1200×630) with Satori + resvg. Never shipped to the client. */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700 | 800; style: 'normal' }[]> | null = null;

function loadFonts() {
  fonts ??= Promise.all(
    ([400, 700, 800] as const).map(async (weight) => ({
      name: 'Inter',
      weight,
      style: 'normal' as const,
      data: await readFile(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`)),
    })),
  );
  return fonts;
}

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({ type, props: { style, children } });

export type OgInput = {
  /** Small line above the title, e.g. "Finance calculator". */
  kicker: string;
  title: string;
  /** Key number, e.g. "$1,896/mo". Optional. */
  value?: string;
  valueLabel?: string;
};

export async function renderOg({ kicker, title, value, valueLabel }: OgInput): Promise<Uint8Array> {
  const ink = '#14213d';
  const accent = '#2341c9';
  const grid = 'rgba(35,65,201,0.08)';
  const tree = el(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      background: '#f6f8fb',
      backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      fontFamily: 'Inter',
      color: ink,
    },
    [
      el('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
        el('div', { width: 64, height: 64, borderRadius: 16, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40, fontWeight: 800 }, 'C='),
        el('div', { fontSize: 40, fontWeight: 800, letterSpacing: -1 }, 'Calcrafty'),
      ]),
      el('div', { display: 'flex', flexDirection: 'column', gap: 12 }, [
        el('div', { fontSize: 30, fontWeight: 700, color: accent }, kicker),
        el('div', { fontSize: title.length > 34 ? 64 : 76, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.05, maxWidth: 1000 }, title),
      ]),
      value
        ? el('div', { display: 'flex', alignItems: 'baseline', gap: 20, borderTop: `3px solid ${ink}`, paddingTop: 24 }, [
            el('div', { fontSize: 72, fontWeight: 800, letterSpacing: -2 }, value),
            el('div', { fontSize: 28, fontWeight: 400, color: '#4a5873' }, valueLabel ?? ''),
          ])
        : el('div', { display: 'flex', fontSize: 28, color: '#4a5873', borderTop: `3px solid ${ink}`, paddingTop: 24 }, 'Live answers. The math shown. Free.'),
    ],
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(tree as any, { width: 1200, height: 630, fonts: await loadFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
