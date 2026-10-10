/* The land: three receding hills carpeted in moss, the soil strata you see
 * through the front of the glass, gravel, and cushions of moss. */

import { bump, clamp, lerp, mixRgb, rgb, TAU, type Rng } from './util';
import { hazed, type Palette } from './palette';
import { CX, G_BOT } from './vessel';

const X0 = 40;
const X1 = 560;
const STEP = 4;
const FLOOR_BOTTOM = 700;

export interface Hill {
	z: number; // 0 far .. 1 near
	ys: Float32Array;
	top: number; // highest point (smallest y)
	cap: number; // thickness of the moss carpet over soil (front hill only)
	mossy: boolean; // a slope seen from above: moss all the way down
	fringe: Float32Array; // x, y, len, angle, tone
	stipple: Float32Array; // x, y, r, tone(0 dark, 1 light)
	yAt(x: number): number;
}

export interface Strata {
	soilEnd: Float32Array; // y of the soil/sand boundary, sampled like the hills
	sandH: number;
	pebbles: { x: number; y: number; rx: number; ry: number; rot: number; tone: number }[];
	specks: { x: number; y: number; r: number; light: boolean }[];
}

export interface Moss {
	x: number;
	y: number;
	r: number;
	z: number;
	start: number;
	lobes: { dx: number; dy: number; rx: number; ry: number }[];
	dots: { dx: number; dy: number; r: number; light: boolean; d: number }[];
}

export interface Ground {
	hills: [Hill, Hill, Hill]; // far, mid, near
	strata: Strata;
}

const idx = (x: number) => clamp((x - X0) / STEP, 0, (X1 - X0) / STEP);

function makeHill(
	z: number,
	f: (x: number) => number,
	mossy: boolean,
	cap: number,
	rng: Rng,
	density: number
): Hill {
	const n = Math.round((X1 - X0) / STEP) + 1;
	const ys = new Float32Array(n);
	let top = Infinity;
	for (let i = 0; i < n; i++) {
		ys[i] = f(X0 + i * STEP);
		top = Math.min(top, ys[i]);
	}
	const yAt = (x: number) => {
		const k = idx(x);
		const i = Math.min(n - 2, Math.floor(k));
		return lerp(ys[i], ys[i + 1], k - i);
	};

	// a soft fringe of tiny blades along the skyline
	const fr: number[] = [];
	const gap = 2.3 / density;
	for (let x = X0 + 6; x < X1 - 6; x += gap * rng.range(0.6, 1.5)) {
		fr.push(
			x,
			yAt(x) + 1.2,
			rng.range(2.4, 6.8) * (0.55 + z * 0.6),
			-Math.PI / 2 + rng.normal(0, 0.38),
			rng.int(0, 2)
		);
	}

	// stippling: bright along the crest, darker down the slope
	const st: number[] = [];
	const depth = mossy ? 44 : cap + 3;
	const count = Math.round((mossy ? 620 : 280) * density);
	for (let i = 0; i < count; i++) {
		const x = rng.range(X0 + 8, X1 - 8);
		const d = mossy ? Math.pow(rng(), 1.5) : rng() * rng();
		const light = d < 0.2 ? rng.chance(0.85) : rng.chance(mossy ? 0.22 : 0.1);
		st.push(x, yAt(x) + 1 + d * depth, rng.range(0.55, 1.3), light ? 1 : 0);
	}

	return {
		z,
		ys,
		top,
		cap,
		mossy,
		fringe: new Float32Array(fr),
		stipple: new Float32Array(st),
		yAt
	};
}

export function makeGround(
	rng: Rng,
	noise: (x: number) => number,
	flip: boolean,
	density: number
): Ground {
	const fx = (x: number) => (flip ? 2 * CX - x : x);
	const a1 = rng.range(40, 54);
	const a2 = rng.range(10, 18);
	const b1 = rng.range(22, 32);
	const b2 = rng.range(6, 12);
	const c1 = rng.range(8, 14);
	const c2 = rng.range(10, 16);
	const m1 = rng.range(366, 396);
	const m2 = rng.range(218, 246);

	const far = makeHill(
		0.2,
		(x) => {
			const u = fx(x);
			return 494 - a1 * bump((u - m1) / 122) - a2 * bump((u - 190) / 96) + noise(u * 0.021) * 4;
		},
		true,
		0,
		rng,
		density
	);
	const mid = makeHill(
		0.56,
		(x) => {
			const u = fx(x);
			return (
				529 - b1 * bump((u - m2) / 106) - b2 * bump((u - 432) / 86) + noise(u * 0.027 + 40) * 3
			);
		},
		true,
		0,
		rng,
		density
	);
	const near = makeHill(
		0.88,
		(x) => {
			const u = fx(x);
			return (
				560 +
				6 * bump((u - 305) / 120) -
				c1 * bump((u - 140) / 76) -
				c2 * bump((u - 468) / 72) +
				noise(u * 0.033 + 90) * 2.4
			);
		},
		false,
		10,
		rng,
		density
	);

	// strata seen through the front of the glass
	const n = near.ys.length;
	const soilEnd = new Float32Array(n);
	const ph = rng.range(0, TAU);
	for (let i = 0; i < n; i++) {
		const x = X0 + i * STEP;
		soilEnd[i] = 593 + Math.sin(x * 0.026 + ph) * 3 + noise(x * 0.05 + 200) * 2.2;
	}
	const sandH = rng.range(5.5, 8);
	const soilEndAt = (x: number) => {
		const k = idx(x);
		const i = Math.min(n - 2, Math.floor(k));
		return lerp(soilEnd[i], soilEnd[i + 1], k - i);
	};
	const floorAt = (x: number) => {
		const u = (x - CX) / 150;
		return G_BOT + 17 * Math.sqrt(Math.max(0, 1 - u * u));
	};

	const pebbles: Strata['pebbles'] = [];
	const pc = Math.round(150 * density);
	for (let i = 0; i < pc; i++) {
		const x = rng.range(138, 462);
		const top = soilEndAt(x) + sandH + 1;
		const bot = floorAt(x) + 3;
		if (bot - top < 3) continue;
		const rx = rng.range(2.6, 7.4);
		pebbles.push({
			x,
			y: rng.range(top, bot),
			rx,
			ry: rx * rng.range(0.52, 0.8),
			rot: rng.range(-0.5, 0.5),
			tone: rng()
		});
	}
	pebbles.sort((p, q) => p.y - q.y);

	const specks: Strata['specks'] = [];
	const sc = Math.round(170 * density);
	for (let i = 0; i < sc; i++) {
		const x = rng.range(118, 482);
		const top = near.yAt(x) + near.cap + 2;
		const bot = soilEndAt(x) - 1.5;
		if (bot - top < 2) continue;
		specks.push({ x, y: rng.range(top, bot), r: rng.range(0.6, 1.5), light: rng.chance(0.3) });
	}

	return { hills: [far, mid, near], strata: { soilEnd, sandH, pebbles, specks } };
}

/** A cushion of moss. `flat` squashes it: low for stone, rounder on soil. */
export function makeMoss(
	rng: Rng,
	x: number,
	y: number,
	r: number,
	z: number,
	start: number,
	density: number,
	flat = 0.62
): Moss {
	const lobes: Moss['lobes'] = [];
	const n = Math.round(4 + r / 4.5);
	for (let i = 0; i < n; i++) {
		const u = (i / (n - 1)) * 2 - 1; // -1 .. 1 across the cushion
		const dx = u * r * 0.84 + rng.normal(0, r * 0.05);
		const lr = r * lerp(0.4, 0.19, Math.abs(u)) * rng.range(0.85, 1.2);
		const ry = lr * flat;
		lobes.push({ dx, dy: -ry * 0.5 - (1 - u * u) * r * 0.1 * flat, rx: lr, ry });
	}
	const dots: Moss['dots'] = [];
	const dc = Math.round(r * 2.6 * density);
	for (let i = 0; i < dc; i++) {
		const l = rng.pick(lobes);
		const a = rng.range(0, TAU);
		const m = Math.sqrt(rng()) * 0.9;
		const dx = l.dx + Math.cos(a) * m * l.rx;
		const dy = l.dy + Math.sin(a) * m * l.ry;
		const light = Math.sin(a) < 0.1 ? rng.chance(0.72) : rng.chance(0.14);
		dots.push({ dx, dy, r: rng.range(0.6, 1.3), light, d: Math.hypot(dx, dy) / r });
	}
	return { x, y, r, z, start, lobes, dots };
}

/* ---------- drawing ---------- */

function hillPath(ctx: CanvasRenderingContext2D, h: Hill, drop: number) {
	const n = h.ys.length;
	ctx.beginPath();
	ctx.moveTo(X0, FLOOR_BOTTOM);
	for (let i = 0; i < n; i++) ctx.lineTo(X0 + i * STEP, h.ys[i] + drop);
	ctx.lineTo(X1, FLOOR_BOTTOM);
	ctx.closePath();
}

function crest(ctx: CanvasRenderingContext2D, h: Hill, drop: number) {
	ctx.beginPath();
	for (let i = 0; i < h.ys.length; i++) {
		const x = X0 + i * STEP;
		if (i === 0) ctx.moveTo(x, h.ys[i] + drop);
		else ctx.lineTo(x, h.ys[i] + drop);
	}
}

export function drawHill(
	ctx: CanvasRenderingContext2D,
	h: Hill,
	pal: Palette,
	shadows: { x: number; y: number; r: number }[]
) {
	const moss2 = hazed(pal.moss2, pal, h.z);
	const moss1 = hazed(pal.moss1, pal, h.z);
	const moss3 = hazed(pal.moss3, pal, h.z);
	const ink = hazed(pal.ink, pal, h.z);

	hillPath(ctx, h, 0);
	if (h.mossy) {
		// a slope seen from slightly above: bright where it crests, deep in the hollows
		const g = ctx.createLinearGradient(0, h.top, 0, h.top + 92);
		g.addColorStop(0, rgb(mixRgb(moss2, moss3, 0.28)));
		g.addColorStop(0.3, rgb(moss2));
		g.addColorStop(0.72, rgb(moss1));
		g.addColorStop(1, rgb(mixRgb(moss1, ink, 0.38)));
		ctx.fillStyle = g;
		ctx.fill();
	} else {
		ctx.fillStyle = rgb(moss2);
		ctx.fill();
		// soil beneath the carpet
		hillPath(ctx, h, h.cap);
		const g = ctx.createLinearGradient(0, 548, 0, 600);
		g.addColorStop(0, rgb(pal.soil1));
		g.addColorStop(0.5, rgb(pal.soil2));
		g.addColorStop(1, rgb(pal.soil3));
		ctx.fillStyle = g;
		ctx.fill();
	}

	// where things rest on the ground, the moss darkens
	ctx.fillStyle = rgb(ink, 0.24);
	for (const s of shadows) {
		ctx.beginPath();
		ctx.ellipse(s.x, s.y + 2.5, s.r, s.r * 0.24, 0, 0, TAU);
		ctx.fill();
	}

	// stipple
	const st = h.stipple;
	for (const light of [0, 1]) {
		ctx.fillStyle = rgb(light ? moss3 : mixRgb(moss1, ink, 0.3), light ? 0.8 : 0.5);
		ctx.beginPath();
		for (let i = 0; i < st.length; i += 4) {
			if (st[i + 3] !== light) continue;
			ctx.moveTo(st[i] + st[i + 2], st[i + 1]);
			ctx.arc(st[i], st[i + 1], st[i + 2], 0, TAU);
		}
		ctx.fill();
	}

	// light catching the crest
	crest(ctx, h, 0.8);
	ctx.strokeStyle = rgb(moss3, 0.5);
	ctx.lineWidth = 1.6;
	ctx.lineJoin = 'round';
	ctx.stroke();

	// fringe along the skyline
	const fr = h.fringe;
	const tones = [moss1, moss2, moss3];
	ctx.lineCap = 'round';
	ctx.lineWidth = 0.9 + h.z * 0.5;
	for (let tone = 0; tone < 3; tone++) {
		ctx.strokeStyle = rgb(tones[tone]);
		ctx.beginPath();
		for (let i = 0; i < fr.length; i += 5) {
			if (fr[i + 4] !== tone) continue;
			ctx.moveTo(fr[i], fr[i + 1]);
			ctx.lineTo(
				fr[i] + Math.cos(fr[i + 3]) * fr[i + 2],
				fr[i + 1] + Math.sin(fr[i + 3]) * fr[i + 2]
			);
		}
		ctx.stroke();
	}
}

export function drawStrata(ctx: CanvasRenderingContext2D, near: Hill, s: Strata, pal: Palette) {
	const n = s.soilEnd.length;

	// gravel bed
	ctx.beginPath();
	ctx.moveTo(X0, FLOOR_BOTTOM);
	for (let i = 0; i < n; i++) ctx.lineTo(X0 + i * STEP, s.soilEnd[i]);
	ctx.lineTo(X1, FLOOR_BOTTOM);
	ctx.closePath();
	ctx.fillStyle = rgb(mixRgb(pal.stone4, pal.soil3, 0.45));
	ctx.fill();

	for (const p of s.pebbles) {
		const c =
			p.tone < 0.5
				? mixRgb(pal.stone4, pal.stone3, p.tone * 2)
				: mixRgb(pal.stone3, pal.stone2, p.tone * 2 - 1);
		ctx.fillStyle = rgb(c);
		ctx.beginPath();
		ctx.ellipse(p.x, p.y, p.rx, p.ry, p.rot, 0, TAU);
		ctx.fill();
		// lit upper edge
		ctx.strokeStyle = rgb(pal.stone1, 0.42);
		ctx.lineWidth = 0.8;
		ctx.beginPath();
		ctx.ellipse(p.x, p.y, p.rx * 0.82, p.ry * 0.74, p.rot, Math.PI * 1.08, Math.PI * 1.72, false);
		ctx.stroke();
	}

	// a seam of pale sand between gravel and soil
	ctx.beginPath();
	for (let i = 0; i < n; i++) {
		const x = X0 + i * STEP;
		if (i === 0) ctx.moveTo(x, s.soilEnd[i]);
		else ctx.lineTo(x, s.soilEnd[i]);
	}
	for (let i = n - 1; i >= 0; i--)
		ctx.lineTo(X0 + i * STEP, s.soilEnd[i] + s.sandH + Math.sin(i * 0.9) * 0.8);
	ctx.closePath();
	ctx.fillStyle = rgb(pal.sand);
	ctx.fill();

	// flecks in the soil
	for (const light of [false, true]) {
		ctx.fillStyle = light ? rgb(pal.stone1, 0.7) : rgb(pal.soil3, 0.75);
		ctx.beginPath();
		for (const k of s.specks) {
			if (k.light !== light) continue;
			ctx.moveTo(k.x + k.r, k.y);
			ctx.arc(k.x, k.y, k.r, 0, TAU);
		}
		ctx.fill();
	}

	// the lip of the soil where it meets the carpet
	crest(ctx, near, near.cap);
	ctx.strokeStyle = rgb(pal.ink, 0.24);
	ctx.lineWidth = 1.1;
	ctx.stroke();
}

/** `grow` runs 0..1 as the cushion spreads from its centre. */
export function drawMoss(ctx: CanvasRenderingContext2D, m: Moss, pal: Palette, grow: number) {
	if (grow <= 0) return;
	const s = grow;
	const c2 = hazed(pal.moss2, pal, m.z);
	ctx.fillStyle = rgb(hazed(pal.ink, pal, m.z), 0.2 * grow);
	ctx.beginPath();
	ctx.ellipse(m.x, m.y + 1.5, m.r * 0.95 * s, m.r * 0.15 * s, 0, 0, TAU);
	ctx.fill();

	ctx.fillStyle = rgb(c2);
	ctx.beginPath();
	for (const l of m.lobes) {
		const x = m.x + l.dx * s;
		const y = m.y + l.dy * s;
		ctx.moveTo(x + l.rx * s, y);
		ctx.ellipse(x, y, l.rx * s, l.ry * s, 0, 0, TAU);
	}
	ctx.fill();

	for (const light of [false, true]) {
		ctx.fillStyle = rgb(hazed(light ? pal.moss3 : pal.moss1, pal, m.z), light ? 0.9 : 0.7);
		ctx.beginPath();
		for (const d of m.dots) {
			if (d.light !== light || d.d > grow * 1.15) continue;
			const x = m.x + d.dx * s;
			const y = m.y + d.dy * s;
			ctx.moveTo(x + d.r, y);
			ctx.arc(x, y, d.r, 0, TAU);
		}
		ctx.fill();
	}
}
