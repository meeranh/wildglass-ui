/* The supporting cast: grass tufts, trailing creepers, broad-leaved
 * rosettes and a few tiny copper-capped mushrooms. All of them grow in on
 * a schedule and then move with the same wind as the ferns. */

import { easeBackOut, easeCubicInOut, easeCubicOut } from 'd3';
import { clamp, lerp, rgb, TAU, type Pt, type Rng } from './util';
import { hazed, type Palette } from './palette';
import type { Wind } from './ferns';

/* ---------- grass ---------- */

interface Blade {
	dx: number;
	a0: number;
	len: number;
	bend: number;
	w: number;
	tone: number;
	phase: number;
	delay: number;
}

export interface Tuft {
	x: number;
	y: number;
	z: number;
	start: number;
	blades: Blade[];
	cols: string[];
}

export function makeTuft(
	rng: Rng,
	x: number,
	y: number,
	z: number,
	start: number,
	size: number,
	count: number
): Tuft {
	const blades: Blade[] = [];
	for (let i = 0; i < count; i++) {
		const lean = rng.normal(0, 0.42);
		blades.push({
			dx: rng.range(-size * 0.09, size * 0.09),
			a0: -Math.PI / 2 + lean * 0.55,
			len: size * rng.range(0.5, 1) * (1 - Math.min(0.4, Math.abs(lean) * 0.3)),
			bend: lean * rng.range(0.9, 1.8),
			w: rng.range(1.1, 2),
			tone: rng.int(0, 2),
			phase: rng.range(0, TAU),
			delay: rng.range(0, 0.45)
		});
	}
	return { x, y, z, start, blades, cols: [] };
}

export function paintTuft(tf: Tuft, pal: Palette) {
	tf.cols = [pal.leaf2, pal.leaf3, pal.leaf4].map((c) => rgb(hazed(c, pal, tf.z)));
}

const SEG = 7;
const bx = new Float32Array(SEG + 1);
const by = new Float32Array(SEG + 1);
const bt = new Float32Array(SEG + 1);
const spring = easeBackOut.overshoot(1.6);

export function drawTuft(ctx: CanvasRenderingContext2D, tf: Tuft, t: number, wind: Wind) {
	for (let tone = 0; tone < 3; tone++) {
		ctx.fillStyle = tf.cols[tone];
		ctx.beginPath();
		let any = false;
		for (const b of tf.blades) {
			if (b.tone !== tone) continue;
			const p = clamp((t - tf.start - b.delay) / 0.8);
			if (p <= 0) continue;
			any = true;
			const L = b.len * spring(p);
			const ds = L / SEG;
			const w = wind(tf.x + b.dx, t, b.phase) * 0.17;
			let x = tf.x + b.dx;
			let y = tf.y;
			for (let i = 0; i <= SEG; i++) {
				const s = i / SEG;
				const th = b.a0 + b.bend * Math.pow(s, 1.7) + w * Math.pow(s, 1.2);
				bx[i] = x;
				by[i] = y;
				bt[i] = th;
				x += Math.cos(th) * ds;
				y += Math.sin(th) * ds;
			}
			for (let i = 0; i <= SEG; i++) {
				const hw = b.w * Math.pow(1 - i / SEG, 0.85) + 0.12;
				const lx = bx[i] - Math.sin(bt[i]) * hw;
				const ly = by[i] + Math.cos(bt[i]) * hw;
				if (i === 0) ctx.moveTo(lx, ly);
				else ctx.lineTo(lx, ly);
			}
			for (let i = SEG; i >= 0; i--) {
				const hw = b.w * Math.pow(1 - i / SEG, 0.85) + 0.12;
				ctx.lineTo(bx[i] + Math.sin(bt[i]) * hw, by[i] - Math.cos(bt[i]) * hw);
			}
			ctx.closePath();
		}
		if (any) ctx.fill();
	}
}

/* ---------- creepers and hanging vines ---------- */

interface Leaf {
	i: number;
	side: 1 | -1;
	r: number;
	tone: number;
	ph: number;
}

interface Strand {
	pts: Pt[];
	leaves: Leaf[];
	hang: number; // how freely the strand swings
	phase: number;
}

export interface Creeper {
	z: number;
	start: number;
	dur: number;
	strands: Strand[];
	cols: string[];
	stem: string;
}

/** Strands wander out from an anchor, then give in to gravity and trail down. */
export function makeCreeper(
	rng: Rng,
	anchor: Pt,
	z: number,
	start: number,
	count: number,
	length: number,
	dirBias: number
): Creeper {
	const strands: Strand[] = [];
	for (let k = 0; k < count; k++) {
		const dir = dirBias !== 0 && rng.chance(0.72) ? dirBias : rng.sign();
		let th = dir > 0 ? rng.range(-0.5, 0.25) : Math.PI + rng.range(-0.25, 0.5);
		const n = Math.round((length * rng.range(0.55, 1.1)) / 3.2);
		const pts: Pt[] = [];
		let x = anchor[0] + rng.range(-5, 5);
		let y = anchor[1] + rng.range(-2, 3);
		for (let i = 0; i <= n; i++) {
			pts.push([x, y]);
			const s = i / n;
			// steer toward straight down as the strand lengthens
			const down = Math.PI / 2;
			let d = down - th;
			while (d > Math.PI) d -= TAU;
			while (d < -Math.PI) d += TAU;
			th += d * lerp(0.03, 0.2, s) + rng.normal(0, 0.11);
			x += Math.cos(th) * 3.2;
			y += Math.sin(th) * 3.2;
		}
		const leaves: Leaf[] = [];
		for (let i = 2; i < n; i += rng.int(2, 3)) {
			leaves.push({
				i,
				side: leaves.length % 2 ? 1 : -1,
				r: rng.range(2.5, 4.4) * lerp(1, 0.62, i / n),
				tone: rng.int(0, 2),
				ph: rng.range(0, TAU)
			});
		}
		strands.push({ pts, leaves, hang: rng.range(4, 9), phase: rng.range(0, TAU) });
	}
	return { z, start, dur: 1.9, strands, cols: [], stem: '' };
}

export function paintCreeper(c: Creeper, pal: Palette) {
	c.cols = [pal.leaf3, pal.leaf4, pal.leaf5].map((k) => rgb(hazed(k, pal, c.z)));
	c.stem = rgb(hazed(pal.leaf2, pal, c.z));
}

const pop = easeBackOut.overshoot(2);

export function drawCreeper(ctx: CanvasRenderingContext2D, c: Creeper, t: number, wind: Wind) {
	const reveal = easeCubicInOut(clamp((t - c.start) / c.dur));
	if (reveal <= 0) return;
	for (const st of c.strands) {
		const n = st.pts.length - 1;
		const upto = reveal * n;
		const w = wind(st.pts[0][0], t, st.phase);
		const sx = (i: number) => st.pts[i][0] + w * st.hang * Math.pow(i / n, 1.6);

		ctx.strokeStyle = c.stem;
		ctx.lineWidth = 0.9;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(sx(0), st.pts[0][1]);
		for (let i = 1; i <= Math.min(n, Math.floor(upto)); i++) ctx.lineTo(sx(i), st.pts[i][1]);
		ctx.stroke();

		for (let tone = 0; tone < 3; tone++) {
			ctx.fillStyle = c.cols[tone];
			ctx.beginPath();
			for (const lf of st.leaves) {
				if (lf.tone !== tone || lf.i > upto) continue;
				const s = pop(clamp((upto - lf.i) / 5));
				const a = st.pts[Math.min(n, lf.i + 1)];
				const b = st.pts[lf.i - 1];
				const tan = Math.atan2(a[1] - b[1], a[0] - b[0]);
				const rot = tan + lf.side * 1.05 + Math.sin(t * 1.9 + lf.ph) * 0.1 * (0.4 + Math.abs(w));
				const r = lf.r * s;
				const cx = sx(lf.i) + Math.cos(rot) * r * 0.95;
				const cy = st.pts[lf.i][1] + Math.sin(rot) * r * 0.95;
				ctx.moveTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
				ctx.ellipse(cx, cy, r, r * 0.72, rot, 0, TAU);
			}
			ctx.fill();
		}
	}
}

/* ---------- broad-leaved rosettes ---------- */

interface RLeaf {
	ang: number;
	len: number;
	wid: number;
	tone: number;
	delay: number;
	ph: number;
}

export interface Rosette {
	x: number;
	y: number;
	z: number;
	start: number;
	leaves: RLeaf[];
	cols: string[];
	rib: string;
}

export function makeRosette(
	rng: Rng,
	x: number,
	y: number,
	z: number,
	start: number,
	size: number
): Rosette {
	const n = rng.int(6, 9);
	const leaves: RLeaf[] = [];
	for (let i = 0; i < n; i++) {
		const u = (i / (n - 1)) * 2 - 1;
		leaves.push({
			ang: -Math.PI / 2 + u * 1.25 + rng.normal(0, 0.1),
			len: size * rng.range(0.7, 1.05) * (1 - Math.abs(u) * 0.18),
			wid: size * rng.range(0.2, 0.28),
			tone: rng.int(0, 2),
			delay: (1 - Math.abs(u)) * 0.5 + rng.range(0, 0.2),
			ph: rng.range(0, TAU)
		});
	}
	// outer leaves sit behind the inner ones
	leaves.sort((a, b) => Math.abs(b.ang + Math.PI / 2) - Math.abs(a.ang + Math.PI / 2));
	return { x, y, z, start, leaves, cols: [], rib: '' };
}

export function paintRosette(r: Rosette, pal: Palette) {
	r.cols = [pal.leaf2, pal.leaf3, pal.leaf4].map((k) => rgb(hazed(k, pal, r.z)));
	r.rib = rgb(hazed(pal.leaf5, pal, r.z), 0.55);
}

export function drawRosette(ctx: CanvasRenderingContext2D, r: Rosette, t: number, wind: Wind) {
	const w = wind(r.x, t, 0);
	for (const lf of r.leaves) {
		const p = clamp((t - r.start - lf.delay) / 0.95);
		if (p <= 0) continue;
		const g = spring(p);
		// a new leaf starts folded upright and leans out as it opens
		const a =
			lerp(-Math.PI / 2, lf.ang, easeCubicOut(p)) + w * 0.09 + Math.sin(t * 1.3 + lf.ph) * 0.022;
		const dx = Math.cos(a);
		const dy = Math.sin(a);
		const L = lf.len * g;
		const stalk = L * 0.3;
		const sx = r.x + dx * stalk;
		const sy = r.y + dy * stalk;
		const tx = r.x + dx * L;
		const ty = r.y + dy * L + L * 0.06;
		const wd = lf.wid * g;
		const mx = (sx + tx) / 2;
		const my = (sy + ty) / 2;

		ctx.strokeStyle = r.cols[0];
		ctx.lineWidth = 1.1;
		ctx.beginPath();
		ctx.moveTo(r.x, r.y);
		ctx.lineTo(sx, sy);
		ctx.stroke();

		ctx.fillStyle = r.cols[lf.tone];
		ctx.beginPath();
		ctx.moveTo(sx, sy);
		ctx.quadraticCurveTo(mx - dy * wd * 1.25, my + dx * wd * 1.25, tx, ty);
		ctx.quadraticCurveTo(mx + dy * wd * 1.25, my - dx * wd * 1.25, sx, sy);
		ctx.fill();

		ctx.strokeStyle = r.rib;
		ctx.lineWidth = 0.7;
		ctx.beginPath();
		ctx.moveTo(sx, sy);
		ctx.lineTo(lerp(sx, tx, 0.9), lerp(sy, ty, 0.9));
		ctx.stroke();
	}
}

/* ---------- mushrooms ---------- */

export interface Shroom {
	x: number;
	y: number;
	h: number;
	w: number;
	lean: number;
	start: number;
	z: number;
}

export function makeShroom(
	rng: Rng,
	x: number,
	y: number,
	z: number,
	start: number,
	size: number
): Shroom {
	return {
		x,
		y,
		h: size * rng.range(0.9, 1.5),
		w: size * rng.range(0.9, 1.25),
		lean: rng.range(-0.22, 0.22),
		start,
		z
	};
}

export function drawShroom(
	ctx: CanvasRenderingContext2D,
	m: Shroom,
	pal: Palette,
	t: number,
	wind: Wind
) {
	const p = clamp((t - m.start) / 0.7);
	if (p <= 0) return;
	const g = pop(p);
	const lean = m.lean + wind(m.x, t, 0) * 0.04;
	const tx = m.x + lean * m.h * g;
	const ty = m.y - m.h * g;
	ctx.strokeStyle = rgb(hazed(pal.stone1, pal, m.z));
	ctx.lineWidth = Math.max(1, m.w * 0.24);
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(m.x, m.y);
	ctx.quadraticCurveTo(m.x, m.y - m.h * g * 0.6, tx, ty);
	ctx.stroke();

	const rw = (m.w / 2) * g;
	ctx.fillStyle = rgb(hazed(pal.cap, pal, m.z));
	ctx.beginPath();
	ctx.ellipse(tx, ty, rw, rw * 0.86, lean, Math.PI, 0, false);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = rgb(pal.glassHi, 0.42);
	ctx.beginPath();
	ctx.ellipse(tx - rw * 0.32, ty - rw * 0.44, rw * 0.2, rw * 0.12, -0.5, 0, TAU);
	ctx.fill();
}
