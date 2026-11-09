// Generates the temporary "TB" app icons (D38): SVG sources + PNG rasters in public/icons.
// Run: node scripts/gen-icons.mjs  (devDependency @resvg/resvg-js; letters are paths, no fonts needed)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'icons');
mkdirSync(out, { recursive: true });

const INK = '#0B0F17';

/** "TB" monogram drawn with thick rounded strokes on a 512 grid, centred on (256,256). */
const monogram = (scale) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)" fill="none" stroke="${INK}"
     stroke-width="50" stroke-linecap="round" stroke-linejoin="round">
    <path d="M104 174H232M168 174V338"/>
    <path d="M302 174V338M302 174H354a40 40 0 0 1 0 80H302M302 254H362a42 42 0 0 1 0 84H302"/>
  </g>`;

/**
 * @param {object} o
 * @param {number} o.radius corner radius of the background (0 = full bleed square)
 * @param {number} o.scale monogram scale (maskable keeps content inside the 80% safe circle)
 */
const svg = ({ radius, scale }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF5A1F"/>
      <stop offset="1" stop-color="#FF8A3D"/>
    </linearGradient>
    <radialGradient id="h" cx="0.3" cy="0.2" r="0.9">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/>
      <stop offset="0.6" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#g)"/>
  <rect width="512" height="512" rx="${radius}" fill="url(#h)"/>${monogram(scale)}
</svg>
`;

const variants = {
  icon: svg({ radius: 112, scale: 1 }), // "any" purpose, also used as SVG favicon
  maskable: svg({ radius: 0, scale: 0.78 }), // content inside the 40% radius safe zone
  apple: svg({ radius: 0, scale: 0.9 }), // iOS applies its own mask, needs an opaque square
};

writeFileSync(join(out, 'icon.svg'), variants.icon);
writeFileSync(join(out, 'maskable.svg'), variants.maskable);

const png = (source, size, file) => {
  const data = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(out, file), data);
  console.log(`${file} (${size}px, ${data.length} B)`);
};

png(variants.icon, 192, 'icon-192.png');
png(variants.icon, 512, 'icon-512.png');
png(variants.maskable, 512, 'maskable-512.png');
png(variants.maskable, 192, 'maskable-192.png');
png(variants.apple, 180, 'apple-touch-icon-180.png');
png(variants.icon, 32, 'favicon-32.png');
