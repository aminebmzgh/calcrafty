/** Renders PNG app icons from public/favicon.svg. Run once after changing the logo: npx tsx scripts/make-icons.ts */
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('public/favicon.svg', 'utf8');
const render = (src: string, size: number, out: string) => {
  const png = new Resvg(src, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(out, png);
};
render(svg, 192, 'public/icons/icon-192.png');
render(svg, 512, 'public/icons/icon-512.png');
render(svg, 180, 'public/icons/apple-touch-icon.png');
// Maskable: full-bleed background with the mark inside the 80% safe zone.
const maskable = svg.replace('<rect width="32" height="32" rx="8"', '<rect width="32" height="32"').replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 40 40"><rect x="-4" y="-4" width="40" height="40" fill="#2341c9"/>');
render(maskable, 512, 'public/icons/icon-maskable-512.png');
console.log('icons written');
