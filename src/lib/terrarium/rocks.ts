/* Hardscape: craggy stones in the spirit of an iwagumi layout. Each stone is
 * a seeded silhouette, triangulated into facets (d3-delaunay) and lit as if
 * it were a real low-relief solid, then finished like an engraving with
 * hatching on the shadow side and pale mineral veins. */

import { Delaunay, polygonContains, polygonCentroid, easeBackOut } from 'd3';
import { clamp, lerp, ramp, rgb, TAU, type Pt, type Rng } from './util';
import { hazed, type Palette } from './palette';

export interface Rock {
	z: number;
	x: number;
	baseY: number;
	w: number;
	h: number;
	start: number;
	hull: Pt[];
	path: Path2D;
	tris: number[]; // vertex positions, 6 numbers per facet
	shade: number[];
	hatch: Float32Array; // x1,y1,x2,y2
	veins: Pt[][];
	specks: Float32Array; // x,y,r
	tops: { x: number; y: number; len: number }[]; // upward faces where moss can sit
	peak: Pt;
}

function fractions(rng: Rng, n: number, a: number, b: number): number[] {
	const out: number[] = [];
	for (let i = 0; i < n; i++) out.push(lerp(a, b, (i + rng.range(0.2, 0.8)) / n));
	return out;
}

const LIGHT = (() => {
	const v = [-0.5, -0.62, 0.6];
	const m = Math.hypot(v[0], v[1], v[2]);
	return [v[0] / m, v[1] / m, v[2] / m];
})();

export function makeRock(
	rng: Rng,
	cx: number,
	baseY: number,
	w: number,
	h: number,
	lean: number,
	z: number,
	start: number
): Rock {
	const big = h > 70;
	const local: Pt[] = [];
	const peakX = rng.range(-0.16, 0.16) * w;

	local.push([-w * 0.5, 16]);
	for (const t of fractions(rng, big ? rng.int(2, 3) : rng.int(1, 2), 0.2, 0.86)) {
		const x = lerp(-w * 0.5, peakX, Math.pow(t, rng.range(0.95, 1.7))) + rng.range(-0.08, 0.05) * w;
		local.push([x, -h * t]);
	}
	const peakIndex = local.length;
	local.push([peakX, -h]);
	let shoulder = false;
	if (big && rng.chance(0.75)) {
		local.push([peakX + w * rng.range(0.2, 0.3), -h * rng.range(0.64, 0.8)]);
		shoulder = true;
	}
	for (const t of fractions(rng, rng.int(1, 2), 0.18, shoulder ? 0.56 : 0.8).reverse()) {
		const x = lerp(w * 0.5, peakX, Math.pow(t, rng.range(0.95, 1.7))) + rng.range(-0.05, 0.08) * w;
		local.push([x, -h * t]);
	}
	local.push([w * 0.5, 16]);

	const hull = local.map(([x, y]): Pt => [cx + x - lean * y, baseY + y]);
	const peak = hull[peakIndex];

	// interior ridge points give the facets their relief
	const baseC: Pt = [cx, baseY + 6];
	const verts: Pt[] = [...hull];
	const height: number[] = hull.map((_, i) => (i === peakIndex ? 0.3 : 0));
	verts.push([lerp(peak[0], baseC[0], 0.4) - w * 0.07, lerp(peak[1], baseC[1], 0.4)]);
	height.push(1);
	if (big) {
		verts.push([lerp(peak[0], baseC[0], 0.72) + w * 0.13, lerp(peak[1], baseC[1], 0.72)]);
		height.push(0.8);
	}

	const del = Delaunay.from(verts);
	const K = 0.5 * Math.min(w, h);
	const tris: number[] = [];
	const shade: number[] = [];
	const hatch: number[] = [];
	const ha = 0.95;
	const hnx = -Math.sin(ha);
	const hny = Math.cos(ha);

	for (let i = 0; i < del.triangles.length; i += 3) {
		const ia = del.triangles[i];
		const ib = del.triangles[i + 1];
		const ic = del.triangles[i + 2];
		const a = verts[ia];
		const b = verts[ib];
		const c = verts[ic];
		const cen: Pt = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
		if (!polygonContains(hull, cen)) continue;

		const ux = b[0] - a[0];
		const uy = b[1] - a[1];
		const uz = (height[ib] - height[ia]) * K;
		const vx = c[0] - a[0];
		const vy = c[1] - a[1];
		const vz = (height[ic] - height[ia]) * K;
		let nx = uy * vz - uz * vy;
		let ny = uz * vx - ux * vz;
		let nz = ux * vy - uy * vx;
		if (nz < 0) {
			nx = -nx;
			ny = -ny;
			nz = -nz;
		}
		const m = Math.hypot(nx, ny, nz) || 1;
		const lam = Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / m);
		const sh = clamp(0.08 + 0.92 * lam + rng.range(-0.04, 0.04));
		tris.push(a[0], a[1], b[0], b[1], c[0], c[1]);
		shade.push(sh);

		// engraver's hatching on the faces turned away from the light
		if (sh < 0.48) {
			const pts = [a, b, c];
			const ds = pts.map((p) => p[0] * hnx + p[1] * hny);
			const d0 = Math.min(...ds);
			const d1 = Math.max(...ds);
			const gap = sh < 0.26 ? 3.3 : 4.7;
			for (let d = d0 + gap * rng.range(0.4, 0.8); d < d1; d += gap) {
				const hit: Pt[] = [];
				for (let e = 0; e < 3; e++) {
					const p = pts[e];
					const q = pts[(e + 1) % 3];
					const da = ds[e] - d;
					const db = ds[(e + 1) % 3] - d;
					if (da * db < 0) {
						const t = da / (da - db);
						hit.push([lerp(p[0], q[0], t), lerp(p[1], q[1], t)]);
					}
				}
				if (hit.length === 2) {
					const k = rng.range(0.06, 0.16);
					hatch.push(
						lerp(hit[0][0], hit[1][0], k),
						lerp(hit[0][1], hit[1][1], k),
						lerp(hit[0][0], hit[1][0], 1 - k),
						lerp(hit[0][1], hit[1][1], 1 - k)
					);
				}
			}
		}
	}

	// mineral veins
	const veins: Pt[][] = [];
	const cen = polygonCentroid(hull);
	for (let v = 0; v < (big ? 2 : 1); v++) {
		const y0 = lerp(peak[1], baseY, rng.range(0.25, 0.7));
		const y1 = y0 + rng.range(-0.22, 0.22) * h;
		const line: Pt[] = [];
		for (let i = 0; i <= 6; i++) {
			const t = i / 6;
			line.push([cen[0] + (t - 0.5) * w * 1.2, lerp(y0, y1, t) + rng.normal(0, h * 0.022)]);
		}
		veins.push(line);
	}

	const specks: number[] = [];
	for (let i = 0; i < (big ? 26 : 9); i++) {
		const p: Pt = [cen[0] + rng.range(-0.5, 0.5) * w, cen[1] + rng.range(-0.5, 0.5) * h];
		if (polygonContains(hull, p)) specks.push(p[0], p[1], rng.range(0.5, 1.1));
	}

	// upward-facing edges, where moss likes to settle
	const tops: Rock['tops'] = [];
	for (let i = 0; i < hull.length - 1; i++) {
		const p = hull[i];
		const q = hull[i + 1];
		const ex = q[0] - p[0];
		const ey = q[1] - p[1];
		const len = Math.hypot(ex, ey);
		if (len < 12) continue;
		const mx = (p[0] + q[0]) / 2;
		const my = (p[1] + q[1]) / 2;
		let ox = ey;
		let oy = -ex;
		if (ox * (mx - cen[0]) + oy * (my - cen[1]) < 0) {
			ox = -ox;
			oy = -oy;
		}
		if (oy / len < -0.52 && my < baseY - h * 0.2) tops.push({ x: mx, y: my, len });
	}

	const path = new Path2D();
	path.moveTo(hull[0][0], hull[0][1]);
	for (const p of hull) path.lineTo(p[0], p[1]);
	path.closePath();

	return {
		z,
		x: cx,
		baseY,
		w,
		h,
		start,
		hull,
		path,
		tris,
		shade,
		hatch: new Float32Array(hatch),
		veins,
		specks: new Float32Array(specks),
		tops,
		peak
	};
}

const settle = easeBackOut.overshoot(1.15);

/** `grow` runs 0..1 as the stone rises out of the ground and settles. */
export function drawRock(ctx: CanvasRenderingContext2D, r: Rock, pal: Palette, grow: number) {
	if (grow <= 0) return;
	const stops = [pal.stone5, pal.stone4, pal.stone3, pal.stone2, pal.stone1].map((c) =>
		hazed(c, pal, r.z)
	);
	const ink = hazed(pal.ink, pal, r.z);

	ctx.save();
	ctx.globalAlpha *= clamp(grow * 2.6);
	ctx.translate(0, (1 - settle(grow)) * 52);

	ctx.fillStyle = rgb(stops[2]);
	ctx.fill(r.path);

	ctx.save();
	ctx.clip(r.path);
	ctx.lineWidth = 0.8;
	ctx.lineJoin = 'round';
	for (let i = 0, k = 0; i < r.tris.length; i += 6, k++) {
		const c = rgb(ramp(stops, r.shade[k]));
		ctx.fillStyle = c;
		ctx.strokeStyle = c;
		ctx.beginPath();
		ctx.moveTo(r.tris[i], r.tris[i + 1]);
		ctx.lineTo(r.tris[i + 2], r.tris[i + 3]);
		ctx.lineTo(r.tris[i + 4], r.tris[i + 5]);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	// ridges between facets
	ctx.strokeStyle = rgb(ink, 0.13);
	ctx.lineWidth = 0.7;
	ctx.beginPath();
	for (let i = 0; i < r.tris.length; i += 6) {
		ctx.moveTo(r.tris[i], r.tris[i + 1]);
		ctx.lineTo(r.tris[i + 2], r.tris[i + 3]);
		ctx.lineTo(r.tris[i + 4], r.tris[i + 5]);
		ctx.closePath();
	}
	ctx.stroke();

	ctx.strokeStyle = rgb(ink, 0.26);
	ctx.lineWidth = 0.75;
	ctx.lineCap = 'round';
	ctx.beginPath();
	for (let i = 0; i < r.hatch.length; i += 4) {
		ctx.moveTo(r.hatch[i], r.hatch[i + 1]);
		ctx.lineTo(r.hatch[i + 2], r.hatch[i + 3]);
	}
	ctx.stroke();

	ctx.strokeStyle = rgb(stops[4], 0.5);
	ctx.lineWidth = 1;
	for (const v of r.veins) {
		ctx.beginPath();
		ctx.moveTo(v[0][0], v[0][1]);
		for (const p of v) ctx.lineTo(p[0], p[1]);
		ctx.stroke();
	}

	ctx.fillStyle = rgb(ink, 0.28);
	ctx.beginPath();
	for (let i = 0; i < r.specks.length; i += 3) {
		ctx.moveTo(r.specks[i] + r.specks[i + 2], r.specks[i + 1]);
		ctx.arc(r.specks[i], r.specks[i + 1], r.specks[i + 2], 0, TAU);
	}
	ctx.fill();
	ctx.restore();

	ctx.strokeStyle = rgb(ink, 0.5);
	ctx.lineWidth = 1.25;
	ctx.lineJoin = 'round';
	ctx.stroke(r.path);
	ctx.restore();
}
