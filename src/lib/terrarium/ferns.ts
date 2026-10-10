/* Living ferns. Each frond starts as a fiddlehead (a tight spiral) and
 * unrolls from the base toward the tip, opening its leaflets as the unrolled
 * front passes them. The shape is found by integrating a heading along the
 * stem: straightened where it has unrolled, a shrinking spiral beyond. The
 * same integration runs every frame with a little wind added, so the frond
 * bends like a real cantilever: fixed at the root, freest at the tip. */

import { easeCubicInOut, easeCubicOut, easeBackOut } from 'd3';
import { clamp, lerp, smoothstep, ramp, rgb, type Rng } from './util';
import { hazed, type Palette } from './palette';
import { insideGlass } from './vessel';

export type Wind = (x: number, t: number, phase: number) => number;

export interface Frond {
	x: number;
	y: number;
	a0: number; // heading at the root
	len: number;
	arch: number; // how far it bends over along its length
	droop: number; // extra weight toward the tip
	curl: 1 | -1; // which way the fiddlehead is wound
	pairs: number;
	pinna: number; // longest leaflet
	stem: number;
	start: number;
	dur: number;
	maxUnfurl: number; // < 1 keeps it a fiddlehead for good
	tipCurl: number; // the little hook left at the tip
	flex: number;
	phase: number;
	tone: number; // 0 old and dark .. 1 young and bright
	jit: Float32Array;
	// colours, refreshed whenever the palette changes
	c0: string;
	c1: string;
	cs: string;
	cm: string;
	csh: string;
}

export interface Fern {
	z: number;
	x: number;
	y: number;
	fronds: Frond[];
	seg: number;
	detail: boolean;
}

export interface FernOpts {
	x: number;
	y: number;
	z: number;
	scale: number; // length of the longest frond
	count: number;
	spread: number; // half-angle of the fan, radians
	start: number;
	seg: number;
	detail: boolean;
	density: number;
	croziers: number;
	late: number[]; // start times of slow late-comers
}

const COIL_C = 0.14; // how quickly the spiral tightens
const COIL_M = 0.02; // radius at its very centre
const S0 = 0.09; // bare stalk before the leaflets begin

const N_MAX = 72;
const X = new Float32Array(N_MAX + 1);
const Y = new Float32Array(N_MAX + 1);
const TH = new Float32Array(N_MAX + 1);
let unrolled = 0;
let grown = 0;

const heading = (F: Frond, s: number) =>
	F.a0 + F.arch * Math.pow(s, 1.5) + F.droop * Math.pow(s, 3.2);

/** Fill X/Y/TH with the stem at unfurl progress p (0..1) and wind bend w. */
function shape(F: Frond, p: number, w: number, N: number) {
	const f = easeCubicInOut(p) * F.maxUnfurl * (1 - F.tipCurl);
	const g = 0.3 + 0.7 * easeCubicOut(p);
	const ds = (F.len * g) / N;
	const R = 1 - f;
	const thf = heading(F, f);
	let x = F.x;
	let y = F.y + (1 - easeCubicOut(clamp(p * 6))) * 7;
	for (let i = 0; i <= N; i++) {
		const s = i / N;
		let th =
			s <= f
				? heading(F, s)
				: thf +
					(F.curl / COIL_C) * Math.log((COIL_C * R + COIL_M) / (COIL_C * (R - (s - f)) + COIL_M));
		th += w * Math.pow(s, 1.4);
		X[i] = x;
		Y[i] = y;
		TH[i] = th;
		x += Math.cos(th) * ds;
		y += Math.sin(th) * ds;
	}
	unrolled = f;
	grown = g;
}

/** The outline of a frond: narrow at the base, widest a third of the way up. */
const outline = (s: number) =>
	Math.pow(Math.sin(Math.PI * Math.pow(clamp((s - S0) / (1 - S0)), 0.6)), 0.7);

function fits(F: Frond): boolean {
	shape(F, 1, 0, 40);
	for (let i = 6; i <= 40; i += 2) {
		const s = i / 40;
		if (!insideGlass(X[i], Y[i], F.pinna * 0.78 * outline(s) + 5)) return false;
	}
	return true;
}

function frond(
	rng: Rng,
	o: FernOpts,
	off: number,
	out: number,
	len: number,
	start: number,
	dur: number
): Frond {
	const dir = off === 0 ? rng.sign() : off > 0 ? 1 : -1;
	const pairs = Math.round(clamp(len / 7.4, 9, 40) * o.density);
	const jit = new Float32Array(pairs * 2);
	for (let i = 0; i < jit.length; i++) jit[i] = rng.range(0.88, 1.1);
	const F: Frond = {
		x: o.x + off * 5,
		y: o.y,
		a0: -Math.PI / 2 + off * 0.72,
		len,
		arch: dir * (lerp(0.2, 1.02, out) + rng.range(-0.08, 0.12)),
		droop: dir * lerp(0.1, 0.56, out) * rng.range(0.6, 1.2),
		curl: dir as 1 | -1,
		pairs,
		pinna: len * rng.range(0.132, 0.158),
		stem: lerp(1.35, 2.5, clamp(len / 280)),
		start,
		dur,
		maxUnfurl: 1,
		tipCurl: rng.chance(0.45) ? rng.range(0.035, 0.075) : 0.012,
		flex: rng.range(0.05, 0.085),
		phase: rng.range(0, 6.28),
		tone: clamp(1 - out * 0.8 + rng.range(-0.1, 0.1)),
		jit,
		c0: '',
		c1: '',
		cs: '',
		cm: '',
		csh: ''
	};
	// keep the whole frond inside the glass
	for (let i = 0; i < 16 && !fits(F); i++) {
		F.len *= 0.93;
		F.pinna *= 0.955;
		F.arch *= 1.04;
	}
	return F;
}

export function makeFern(rng: Rng, o: FernOpts): Fern {
	const fronds: Frond[] = [];
	for (let i = 0; i < o.count; i++) {
		const u = o.count === 1 ? 0 : (i / (o.count - 1)) * 2 - 1;
		const off = u * o.spread + rng.normal(0, 0.05);
		const out = Math.abs(u);
		const len = o.scale * lerp(1, 0.7, Math.pow(out, 1.3)) * rng.range(0.9, 1.08);
		// the outer, older fronds open first
		const F = frond(
			rng,
			o,
			off,
			out,
			len,
			o.start + (1 - out) * 1.15 + rng.range(0, 0.35),
			rng.range(1.7, 2.4)
		);
		// every other frond sits a little further back, in shade
		if (i % 2) F.tone = clamp(F.tone - 0.24);
		fronds.push(F);
	}
	// fiddleheads that never quite open
	for (let i = 0; i < o.croziers; i++) {
		const off = rng.range(-0.3, 0.3);
		const F = frond(
			rng,
			o,
			off,
			0.1,
			o.scale * rng.range(0.36, 0.5),
			o.start + 1.2 + rng.range(0, 0.8),
			2.6
		);
		F.maxUnfurl = rng.range(0.34, 0.52);
		F.tone = 1;
		F.stem *= 1.15;
		fronds.push(F);
	}
	// slow late-comers, so the world keeps growing while you watch
	for (const at of o.late) {
		const off = rng.range(-0.34, 0.34);
		const F = frond(rng, o, off, 0.18, o.scale * rng.range(0.7, 0.86), at, rng.range(7, 9.5));
		F.tone = 0.95;
		fronds.push(F);
	}
	fronds.sort((a, b) => a.tone - b.tone);
	return { z: o.z, x: o.x, y: o.y, fronds, seg: o.seg, detail: o.detail };
}

export function paintFern(fern: Fern, pal: Palette) {
	const dark = [pal.leaf1, pal.leaf2, pal.leaf3];
	const light = [pal.leaf3, pal.leaf4, pal.leaf5];
	for (const F of fern.fronds) {
		F.c0 = rgb(hazed(ramp(dark, F.tone), pal, fern.z));
		F.c1 = rgb(hazed(ramp(light, F.tone), pal, fern.z));
		F.cs = rgb(hazed(pal.stipe, pal, fern.z));
		F.cm = rgb(hazed(pal.leaf1, pal, fern.z), 0.3);
		F.csh = rgb(hazed(pal.ink, pal, fern.z), 0.17);
	}
}

const swing = easeBackOut.overshoot(1.4);

export function drawFern(ctx: CanvasRenderingContext2D, fern: Fern, t: number, wind: Wind) {
	const N = fern.seg;
	for (const F of fern.fronds) {
		const p = clamp((t - F.start) / F.dur);
		if (p <= 0) continue;
		const gust = wind(F.x, t, F.phase);
		shape(F, p, gust * F.flex * (0.25 + 0.75 * p), N);
		const f = unrolled;
		const g = grown;
		const tipI = Math.min(N, Math.round(Math.max(f, 0.3) * N));

		ctx.globalAlpha = clamp(p * 8);

		// leaflets
		const total = F.pairs * 2;
		const flutter = 0.03 * (0.4 + Math.abs(gust));
		const grad = ctx.createLinearGradient(X[0], Y[0], X[tipI], Y[tipI]);
		grad.addColorStop(0, F.c0);
		grad.addColorStop(1, F.c1);
		const leaf = new Path2D();
		const ribs: number[] = [];
		for (let k = 0; k < total; k++) {
			const s = S0 + ((0.975 - S0) * k) / (total - 1);
			const open = smoothstep(0, 0.11, f - s);
			if (open < 0.02) continue;
			const side = k % 2 ? 1 : -1;
			const fi = s * N;
			const i = Math.min(N - 1, fi | 0);
			const fr = fi - i;
			const px = X[i] + (X[i + 1] - X[i]) * fr;
			const py = Y[i] + (Y[i + 1] - Y[i]) * fr;
			const th = TH[i] + (TH[i + 1] - TH[i]) * fr;
			const len = F.pinna * g * outline(s) * F.jit[k] * (0.2 + 0.8 * easeCubicOut(open));
			if (len < 1.2) continue;
			const ang =
				lerp(1.3, 0.74, Math.pow(s, 1.2)) * (0.3 + 0.7 * swing(open)) +
				Math.sin(t * 2.3 + k * 0.9 + F.phase) * flutter;
			const a = th + side * ang;
			const dx = Math.cos(a);
			const dy = Math.sin(a);
			const nx = dy * side; // toward the tip of the frond
			const ny = -dx * side;
			const wd = len * 0.2 + 0.6;
			const tx = px + dx * len + nx * len * 0.07;
			const ty = py + dy * len + ny * len * 0.07;
			leaf.moveTo(px, py);
			leaf.quadraticCurveTo(px + dx * len * 0.32 + nx * wd, py + dy * len * 0.32 + ny * wd, tx, ty);
			leaf.quadraticCurveTo(
				px + dx * len * 0.55 - nx * wd * 0.5,
				py + dy * len * 0.55 - ny * wd * 0.5,
				px,
				py
			);
			if (fern.detail && len > 9) ribs.push(px, py, px + (tx - px) * 0.86, py + (ty - py) * 0.86);
		}
		if (fern.detail) {
			// each frond throws a soft shadow on the ones behind it
			ctx.save();
			ctx.translate(1.5, 2.8);
			ctx.fillStyle = F.csh;
			ctx.fill(leaf);
			ctx.restore();
		}
		ctx.fillStyle = grad;
		ctx.fill(leaf);

		if (ribs.length) {
			ctx.strokeStyle = F.cm;
			ctx.lineWidth = 0.6;
			ctx.beginPath();
			for (let i = 0; i < ribs.length; i += 4) {
				ctx.moveTo(ribs[i], ribs[i + 1]);
				ctx.lineTo(ribs[i + 2], ribs[i + 3]);
			}
			ctx.stroke();
		}

		// the stem, tapering to the tip (and winding into the fiddlehead)
		const sg = ctx.createLinearGradient(X[0], Y[0], X[tipI], Y[tipI]);
		sg.addColorStop(0, F.cs);
		sg.addColorStop(0.45, F.c0);
		sg.addColorStop(1, F.c1);
		ctx.fillStyle = sg;
		ctx.beginPath();
		for (let i = 0; i <= N; i++) {
			const s = i / N;
			const hw = (F.stem * g * (1 - 0.86 * s) + 0.34) * (s > f ? 1.2 : 1);
			const lx = X[i] - Math.sin(TH[i]) * hw;
			const ly = Y[i] + Math.cos(TH[i]) * hw;
			if (i === 0) ctx.moveTo(lx, ly);
			else ctx.lineTo(lx, ly);
		}
		for (let i = N; i >= 0; i--) {
			const s = i / N;
			const hw = (F.stem * g * (1 - 0.86 * s) + 0.34) * (s > f ? 1.2 : 1);
			ctx.lineTo(X[i] + Math.sin(TH[i]) * hw, Y[i] - Math.cos(TH[i]) * hw);
		}
		ctx.closePath();
		ctx.fill();
	}
	ctx.globalAlpha = 1;
}
