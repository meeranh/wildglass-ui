/* Procedural fern geometry for the logomark. Produces an arching rachis path
 * plus line-art leaflets, in the engraving style of the WILDGLASS mark.
 * Pure + deterministic. (The hero's living ferns are in #lib/terrarium.) */

import { line, curveNatural } from 'd3';

export interface Leaflet {
	/** path drawn from (0,0) along +x, length `len`; place with transform */
	d: string;
	x: number;
	y: number;
	deg: number; // absolute direction to rotate the leaf to
	len: number;
	side: 1 | -1;
	t: number; // position along the rachis, 0 to 1
}

export interface Frond {
	rachis: string;
	leaflets: Leaflet[];
	tip: { x: number; y: number };
}

export interface FrondOpts {
	x: number;
	y: number;
	length: number;
	baseAngleDeg?: number; // -90 = straight up
	archDeg?: number; // total signed bend over the length
	leafMax?: number;
	leafCount?: number;
	leafSpreadDeg?: number;
	leafStart?: number; // where leaflets begin along t
	leafEnd?: number;
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const curve = line<[number, number]>().curve(curveNatural);

export function buildFrond(opts: FrondOpts): Frond {
	const {
		x: bx,
		y: by,
		length,
		baseAngleDeg = -90,
		archDeg = 22,
		leafMax = length * 0.26,
		leafCount = 13,
		leafSpreadDeg = 58,
		leafStart = 0.1,
		leafEnd = 0.95
	} = opts;

	const N = 64;
	const base = rad(baseAngleDeg);
	const arch = rad(archDeg);
	const ds = length / N;

	const pts: [number, number][] = [];
	const tan: number[] = [];
	let x = bx;
	let y = by;
	for (let i = 0; i <= N; i++) {
		const t = i / N;
		const theta = base + arch * easeInOut(t);
		pts.push([x, y]);
		tan.push(theta);
		x += Math.cos(theta) * ds;
		y += Math.sin(theta) * ds;
	}

	const leaflets: Leaflet[] = [];
	for (let k = 0; k < leafCount; k++) {
		const t = leafStart + (leafEnd - leafStart) * (k / (leafCount - 1));
		const idx = Math.round(t * N);
		const [lx, ly] = pts[idx];
		const taper = 1 - t * 0.82; // smaller toward the tip
		const len = leafMax * taper;
		for (const side of [-1, 1] as const) {
			const direction = deg(tan[idx]) + side * leafSpreadDeg;
			// leaf along +x, length len, with a gentle upward arc toward the tip
			const d = `M0,0 Q${(len * 0.55).toFixed(1)},${(-len * 0.22).toFixed(1)} ${len.toFixed(1)},${(-len * 0.04).toFixed(1)}`;
			leaflets.push({ d, x: lx, y: ly, deg: direction, len, side, t });
		}
	}

	return {
		rachis: curve(pts) ?? '',
		leaflets,
		tip: { x: pts[N][0], y: pts[N][1] }
	};
}
