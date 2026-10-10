/* The scene's colours live in tokens.css as --t-* custom properties, one set
 * per theme. The engine reads them here, so the terrarium re-lights itself
 * whenever the theme changes and no colour is hardcoded in the drawing code. */

import { mixRgb, parseColor, type RGB } from './util';

const KEYS = [
	'haze1',
	'haze2',
	'leaf1',
	'leaf2',
	'leaf3',
	'leaf4',
	'leaf5',
	'moss1',
	'moss2',
	'moss3',
	'stone1',
	'stone2',
	'stone3',
	'stone4',
	'stone5',
	'soil1',
	'soil2',
	'soil3',
	'sand',
	'wood1',
	'wood2',
	'wood3',
	'stipe',
	'cap',
	'glassEdge',
	'glassTint',
	'glassHi',
	'light',
	'glow',
	'firefly',
	'mote',
	'shadow',
	'ink'
] as const;

export type PaletteKey = (typeof KEYS)[number];
export type Palette = Record<PaletteKey, RGB>;

/** haze1 -> --t-haze-1, glassEdge -> --t-glass-edge */
const cssName = (k: string) =>
	'--t-' +
	k
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.replace(/([a-z])(\d)/g, '$1-$2')
		.toLowerCase();

export function readPalette(el: Element = document.documentElement): Palette {
	const cs = getComputedStyle(el);
	const out = {} as Palette;
	for (const k of KEYS) out[k] = parseColor(cs.getPropertyValue(cssName(k)) || '#888');
	return out;
}

/** Mix a colour toward the air inside the glass: more for distant layers
 * (z = 0 is the back of the vessel, z = 1 is pressed against the front). */
export const hazed = (c: RGB, pal: Palette, z: number): RGB =>
	mixRgb(c, pal.haze2, Math.pow(1 - z, 1.5) * 0.62);

export function mixPalette(a: Palette, b: Palette, t: number): Palette {
	if (t <= 0) return a;
	if (t >= 1) return b;
	const out = {} as Palette;
	for (const k of KEYS) out[k] = mixRgb(a[k], b[k], t);
	return out;
}
