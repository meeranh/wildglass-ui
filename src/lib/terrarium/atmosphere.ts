/* Light and air: the daylight shaft, the lamp at night, drifting pollen,
 * fireflies, and beads of condensation on the inside of the glass. */

import { clamp, lerp, mixRgb, rgb, TAU, type Rng } from './util';
import type { Palette } from './palette';
import { CX, G_BOT, LAMP, THICK, W, insideGlass, radiusAt } from './vessel';

/* ---------- daylight shaft ---------- */

const AX = 186;
const AY = 148;
const BX = 372;
const BY = 632;
const BL = Math.hypot(BX - AX, BY - AY);
const UX = (BX - AX) / BL;
const UY = (BY - AY) / BL;
const NX = -UY;
const NY = UX;
const HW0 = 34;
const HW1 = 78;

/** 0..1: how deep inside the shaft of light a point is. */
export function inBeam(x: number, y: number): number {
	const px = x - AX;
	const py = y - AY;
	const along = clamp((px * UX + py * UY) / BL);
	const across = Math.abs(px * NX + py * NY);
	return clamp(1 - across / lerp(HW0, HW1, along));
}

function quad(ctx: CanvasRenderingContext2D, k0: number, k1: number, off = 0) {
	ctx.beginPath();
	ctx.moveTo(AX + NX * (HW0 * (off + k0)), AY + NY * (HW0 * (off + k0)));
	ctx.lineTo(AX + NX * (HW0 * (off - k0)), AY + NY * (HW0 * (off - k0)));
	ctx.lineTo(BX + NX * (HW1 * (off - k1)), BY + NY * (HW1 * (off - k1)));
	ctx.lineTo(BX + NX * (HW1 * (off + k1)), BY + NY * (HW1 * (off + k1)));
	ctx.closePath();
	ctx.fill();
}

export function drawShaft(ctx: CanvasRenderingContext2D, pal: Palette, t: number, amount: number) {
	if (amount <= 0.01) return;
	ctx.save();
	ctx.globalCompositeOperation = 'screen';
	const g = ctx.createLinearGradient(AX, AY, BX, BY);
	g.addColorStop(0, rgb(pal.light, 1));
	g.addColorStop(1, rgb(pal.light, 0.1));
	ctx.fillStyle = g;
	const breathe = 0.86 + 0.14 * Math.sin(t * 0.45);
	for (const [k, al] of [
		[1, 0.15],
		[0.7, 0.16],
		[0.4, 0.18]
	] as const) {
		ctx.globalAlpha = al * amount * breathe;
		quad(ctx, k, k);
	}
	// individual rays that slowly come and go, as if through leaves
	for (let i = 0; i < 3; i++) {
		ctx.globalAlpha = (0.1 + 0.08 * Math.sin(t * 0.37 + i * 2.1)) * amount;
		quad(ctx, 0.07, 0.05, [-0.56, 0.08, 0.6][i]);
	}
	// where the shaft lands, the moss is warmed by a pool of light
	ctx.globalAlpha = (0.22 + 0.05 * Math.sin(t * 0.52 + 1)) * amount;
	ctx.translate(BX - 34, 546);
	ctx.scale(1, 0.2);
	const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, 86);
	pool.addColorStop(0, rgb(pal.light, 1));
	pool.addColorStop(1, rgb(pal.light, 0));
	ctx.fillStyle = pool;
	ctx.beginPath();
	ctx.arc(0, 0, 86, 0, TAU);
	ctx.fill();
	ctx.restore();
}

/** The cone of light under the lamp, soft at the edges. */
export function drawLampCone(
	ctx: CanvasRenderingContext2D,
	pal: Palette,
	t: number,
	amount: number
) {
	if (amount <= 0.01) return;
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	const g = ctx.createLinearGradient(0, LAMP.y, 0, 600);
	g.addColorStop(0, rgb(pal.glow, 1));
	g.addColorStop(0.55, rgb(pal.glow, 0.3));
	g.addColorStop(1, rgb(pal.glow, 0));
	ctx.fillStyle = g;
	const breathe = 0.94 + 0.06 * Math.sin(t * 0.6);
	for (let i = 0; i < 9; i++) {
		const k = 1 - i * 0.1;
		ctx.globalAlpha = 0.03 * amount * breathe;
		ctx.beginPath();
		ctx.moveTo(LAMP.x - 30 * k, LAMP.y);
		ctx.lineTo(LAMP.x + 30 * k, LAMP.y);
		ctx.lineTo(LAMP.x + 200 * k, 600);
		ctx.lineTo(LAMP.x - 200 * k, 600);
		ctx.closePath();
		ctx.fill();
	}
	ctx.restore();
}

/* ---------- lamp light ---------- */

export function drawLampLight(
	ctx: CanvasRenderingContext2D,
	pal: Palette,
	t: number,
	amount: number
) {
	if (amount <= 0.01) return;
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	const breathe = 1 + Math.sin(t * 2.1) * 0.014 + Math.sin(t * 7.3) * 0.006;
	const g = ctx.createRadialGradient(LAMP.x, LAMP.y, 4, LAMP.x, LAMP.y + 60, 400);
	g.addColorStop(0, rgb(pal.glow, 0.5 * amount * breathe));
	g.addColorStop(0.24, rgb(pal.glow, 0.2 * amount * breathe));
	g.addColorStop(0.6, rgb(pal.glow, 0.05 * amount));
	g.addColorStop(1, rgb(pal.glow, 0));
	ctx.fillStyle = g;
	ctx.fillRect(0, 100, W, 560);
	ctx.restore();
}

/** Shade gathers in the lower corners of the glass, deeper at night. */
export function drawVignette(
	ctx: CanvasRenderingContext2D,
	pal: Palette,
	night: number,
	a: number
) {
	if (a <= 0.01) return;
	const g = ctx.createRadialGradient(CX, 330, 150, CX, 380, 372);
	g.addColorStop(0, rgb(pal.ink, 0));
	g.addColorStop(1, rgb(pal.ink, (0.1 + night * 0.5) * a));
	ctx.fillStyle = g;
	ctx.fillRect(0, 100, W, 560);
}

/** Warm light spilling onto the table and into the air around the lamp. */
export function drawAura(ctx: CanvasRenderingContext2D, pal: Palette, night: number) {
	if (night <= 0.01) return;
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	const g = ctx.createRadialGradient(CX, 360, 120, CX, 360, 300);
	g.addColorStop(0, rgb(pal.glow, 0.1 * night));
	g.addColorStop(1, rgb(pal.glow, 0));
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, 720);

	ctx.translate(CX, 652);
	ctx.scale(1, 0.16);
	const tg = ctx.createRadialGradient(0, 0, 120, 0, 0, 296);
	tg.addColorStop(0, rgb(pal.glow, 0.26 * night));
	tg.addColorStop(1, rgb(pal.glow, 0));
	ctx.fillStyle = tg;
	ctx.beginPath();
	ctx.arc(0, 0, 296, 0, TAU);
	ctx.fill();
	ctx.restore();
}

/* ---------- pollen ---------- */

export interface Mote {
	x: number;
	y: number;
	r: number;
	ph: number;
}

function place(m: Mote) {
	// cheap deterministic scatter, re-rolled until it lands inside the glass
	for (let i = 0; i < 8; i++) {
		m.ph += 1.371;
		const x = CX + Math.sin(m.ph * 12.9898) * 170;
		const y = 330 + Math.cos(m.ph * 78.233) * 200;
		if (insideGlass(x, y, 14) && y < 540) {
			m.x = x;
			m.y = y;
			return;
		}
	}
	m.x = CX;
	m.y = 330;
}

export function makeMotes(rng: Rng, n: number): Mote[] {
	const out: Mote[] = [];
	for (let i = 0; i < n; i++) {
		const m: Mote = { x: 0, y: 0, r: rng.range(0.7, 1.7), ph: rng.range(0, 100) };
		place(m);
		out.push(m);
	}
	return out;
}

export function stepMotes(
	motes: Mote[],
	dt: number,
	t: number,
	noise: (x: number) => number,
	breeze: number
) {
	for (const m of motes) {
		m.x += (noise(m.ph + t * 0.13) * 5 + breeze * 26) * dt;
		m.y += (noise(m.ph * 1.7 + 50 + t * 0.11) * 4 - 1.5) * dt;
		if (!insideGlass(m.x, m.y, 8) || m.y > 548) place(m);
	}
}

export function drawMotes(
	ctx: CanvasRenderingContext2D,
	motes: Mote[],
	pal: Palette,
	t: number,
	amount: number,
	night: number
) {
	if (amount <= 0.01) return;
	for (const m of motes) {
		const beam = inBeam(m.x, m.y) * (1 - night);
		const tw = 0.6 + 0.4 * Math.sin(t * 1.7 + m.ph * 3);
		ctx.fillStyle = rgb(
			mixRgb(pal.mote, pal.light, beam * 0.75),
			amount * tw * (0.22 + 0.62 * beam + 0.2 * night)
		);
		ctx.beginPath();
		ctx.arc(m.x, m.y, m.r * (1 + beam * 0.35), 0, TAU);
		ctx.fill();
	}
}

/* ---------- fireflies ---------- */

export interface Firefly {
	cx: number;
	cy: number;
	ax: number;
	ay: number;
	sp: number;
	p1: number;
	p2: number;
	period: number;
	off: number;
	size: number;
	delay: number;
	inside: boolean;
}

export function makeFireflies(rng: Rng, n: number): Firefly[] {
	const out: Firefly[] = [];
	for (let i = 0; i < n; i++) {
		const inside = i < Math.ceil(n * 0.68);
		out.push({
			cx: inside
				? CX + rng.range(-120, 120)
				: rng.chance(0.5)
					? rng.range(40, 110)
					: rng.range(490, 560),
			cy: inside ? rng.range(230, 480) : rng.range(150, 520),
			ax: inside ? rng.range(26, 60) : rng.range(18, 34),
			ay: inside ? rng.range(22, 54) : rng.range(30, 70),
			sp: rng.range(0.1, 0.22),
			p1: rng.range(0, 200),
			p2: rng.range(0, 200),
			period: rng.range(3.4, 7.2),
			off: rng.range(0, 8),
			size: rng.range(1.1, 1.9),
			delay: rng.range(0.2, 2.6),
			inside
		});
	}
	return out;
}

export function drawFireflies(
	ctx: CanvasRenderingContext2D,
	flies: Firefly[],
	pal: Palette,
	t: number,
	night: number,
	sinceDusk: number,
	noise: (x: number) => number,
	inside: boolean
) {
	if (night <= 0.01) return;
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	for (const f of flies) {
		if (f.inside !== inside) continue;
		const u = ((t + f.off) % f.period) / f.period;
		const blink = u < 0.56 ? Math.pow(Math.sin((Math.PI * u) / 0.56), 2) : 0;
		const a = night * blink * clamp((sinceDusk - f.delay) / 1.2);
		if (a <= 0.01) continue;
		const x = f.cx + noise(f.p1 + t * f.sp) * f.ax;
		const y = f.cy + noise(f.p2 + t * f.sp * 0.9) * f.ay;
		const r = f.size * 8;
		const g = ctx.createRadialGradient(x, y, 0, x, y, r);
		g.addColorStop(0, rgb(pal.firefly, 0.85 * a));
		g.addColorStop(0.22, rgb(pal.firefly, 0.32 * a));
		g.addColorStop(1, rgb(pal.firefly, 0));
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, TAU);
		ctx.fill();
		ctx.fillStyle = rgb(pal.glassHi, a);
		ctx.beginPath();
		ctx.arc(x, y, f.size * 0.8, 0, TAU);
		ctx.fill();
	}
	ctx.restore();
}

/* ---------- condensation ---------- */

export interface Drop {
	x: number;
	y: number;
	r: number;
}

export function makeDrops(rng: Rng, n: number): Drop[] {
	const out: Drop[] = [];
	for (let i = 0; i < n; i++) {
		const y = rng.range(170, 470);
		const side = rng.chance(0.62) ? -1 : 1;
		const inset = THICK + 6 + Math.pow(rng(), 1.7) * 70;
		out.push({ x: CX + side * (radiusAt(y) - inset), y, r: rng.range(1, 2.5) });
	}
	return out;
}

export function drawDrops(ctx: CanvasRenderingContext2D, drops: Drop[], pal: Palette, a: number) {
	if (a <= 0.01) return;
	for (const d of drops) {
		ctx.fillStyle = rgb(pal.glassHi, 0.34 * a);
		ctx.beginPath();
		ctx.arc(d.x, d.y, d.r, 0, TAU);
		ctx.fill();
		ctx.strokeStyle = rgb(pal.glassEdge, 0.55 * a);
		ctx.lineWidth = 0.7;
		ctx.beginPath();
		ctx.arc(d.x, d.y, d.r, Math.PI * 0.1, Math.PI * 0.9);
		ctx.stroke();
	}
}

const frac = (v: number) => v - Math.floor(v);
const hash = (n: number) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);

/** Every so often one bead gathers enough weight to run down the glass. */
export function drawRunner(
	ctx: CanvasRenderingContext2D,
	pal: Palette,
	t: number,
	seed: number,
	a: number
) {
	const period = 11.5;
	const k = Math.floor((t - 6) / period);
	if (k < 0 || a <= 0.01) return;
	const u = (t - 6 - k * period) / 4.6;
	if (u < 0 || u > 1) return;
	const h1 = hash(k * 3.1 + seed);
	const h2 = hash(k * 7.7 + seed + 2);
	const side = h1 < 0.6 ? -1 : 1;
	const inset = THICK + 8 + h2 * 34;
	const y0 = 190 + hash(k + seed * 3) * 110;
	const y1 = Math.min(G_BOT - 70, y0 + 240);
	const fall = Math.pow(u, 2.1);
	const yh = lerp(y0, y1, fall);
	const xAt = (y: number) => CX + side * (radiusAt(y) - inset) + Math.sin(y * 0.085 + h2 * 9) * 1.5;
	const fade = (1 - Math.pow(u, 6)) * a;

	// the wet trail it leaves, fading from the top
	const steps = 14;
	ctx.lineWidth = 1.1;
	ctx.lineCap = 'round';
	for (let i = 0; i < steps; i++) {
		const ya = lerp(y0, yh, i / steps);
		const yb = lerp(y0, yh, (i + 1) / steps);
		ctx.strokeStyle = rgb(pal.glassHi, 0.3 * fade * Math.pow((i + 1) / steps, 2));
		ctx.beginPath();
		ctx.moveTo(xAt(ya), ya);
		ctx.lineTo(xAt(yb), yb);
		ctx.stroke();
	}
	ctx.fillStyle = rgb(pal.glassHi, 0.62 * fade);
	ctx.beginPath();
	ctx.ellipse(xAt(yh), yh, 2.1, 3, 0, 0, TAU);
	ctx.fill();
}
