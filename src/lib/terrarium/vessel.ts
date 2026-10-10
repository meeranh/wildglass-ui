/* The glass: a hand-blown teardrop with a wooden lamp lid, on a turned
 * wooden base. Everything is drawn in "scene units" (600 x 720). */

import { interpolateBasis, easeCubicOut } from 'd3';
import { clamp, rgb, mixRgb, TAU, type Pt } from './util';
import type { Palette } from './palette';

export const W = 600;
export const H = 720;
export const CX = 300;
export const G_TOP = 112; // mouth of the glass
export const G_BOT = 612; // foot of the glass
export const THICK = 6;
const FOOT_RY = 17.5;

export const BASE = { cy: 616, rx: 188, ry: 21, h: 27 };
export const LID = { topY: 86, botY: 114, rxTop: 77, rxBot: 81, ryTop: 8.5, ryBot: 9 };
export const LAMP = { x: CX, y: 122 };

// half-width of the glass from mouth (0) to foot (1)
const profile = interpolateBasis([74, 122, 157, 180, 192, 196, 191, 178, 156]);
export const radiusAt = (y: number) => profile(clamp((y - G_TOP) / (G_BOT - G_TOP)));

/** Is a point inside the glass, with some breathing room? */
export const insideGlass = (x: number, y: number, margin = 0) =>
	y > G_TOP + 8 && y < G_BOT && Math.abs(x - CX) < radiusAt(y) - THICK - margin;

function side(sign: 1 | -1, inset: number, y0: number, y1: number, n = 64): Pt[] {
	const pts: Pt[] = [];
	for (let i = 0; i <= n; i++) {
		const y = y0 + ((y1 - y0) * i) / n;
		pts.push([CX + sign * (radiusAt(y) - inset), y]);
	}
	return pts;
}

/** A ribbon that follows the glass wall between two insets. */
function band(sign: 1 | -1, in0: number, in1: number, y0: number, y1: number): Path2D {
	const a = side(sign, in0, y0, y1, 28);
	const b = side(sign, in1, y1, y0, 28);
	const p = new Path2D();
	p.moveTo(a[0][0], a[0][1]);
	for (const q of a) p.lineTo(q[0], q[1]);
	for (const q of b) p.lineTo(q[0], q[1]);
	p.closePath();
	return p;
}

export interface VesselGeo {
	outer: Path2D;
	inner: Path2D;
	left: Pt[]; // outer wall, foot to mouth
	right: Pt[];
	innerLeft: Path2D;
	innerRight: Path2D;
}

export function buildVessel(): VesselGeo {
	const left = side(-1, 0, G_BOT, G_TOP);
	const right = side(1, 0, G_BOT, G_TOP);
	const rb = radiusAt(G_BOT);

	const outer = new Path2D();
	outer.moveTo(left[0][0], left[0][1]);
	for (const p of left) outer.lineTo(p[0], p[1]);
	for (let i = right.length - 1; i >= 0; i--) outer.lineTo(right[i][0], right[i][1]);
	outer.ellipse(CX, G_BOT, rb, FOOT_RY, 0, 0, Math.PI, false);
	outer.closePath();

	const il = side(-1, THICK, G_BOT, G_TOP + 3);
	const ir = side(1, THICK, G_BOT, G_TOP + 3);
	const inner = new Path2D();
	inner.moveTo(il[0][0], il[0][1]);
	for (const p of il) inner.lineTo(p[0], p[1]);
	for (let i = ir.length - 1; i >= 0; i--) inner.lineTo(ir[i][0], ir[i][1]);
	inner.ellipse(CX, G_BOT, rb - THICK, (FOOT_RY * (rb - THICK)) / rb, 0, 0, Math.PI, false);
	inner.closePath();

	const line = (pts: Pt[]) => {
		const p = new Path2D();
		p.moveTo(pts[0][0], pts[0][1]);
		for (const q of pts) p.lineTo(q[0], q[1]);
		return p;
	};

	return { outer, inner, left, right, innerLeft: line(il), innerRight: line(ir) };
}

/* ---------- table shadow + wooden base ---------- */

export function drawShadow(ctx: CanvasRenderingContext2D, pal: Palette, night: number, a: number) {
	if (a <= 0) return;
	ctx.save();
	ctx.translate(CX, BASE.cy + BASE.h + 12);
	ctx.scale(1, 0.13);
	const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 262);
	g.addColorStop(0, rgb(pal.shadow, (0.26 + night * 0.3) * a));
	g.addColorStop(0.55, rgb(pal.shadow, (0.1 + night * 0.16) * a));
	g.addColorStop(1, rgb(pal.shadow, 0));
	ctx.fillStyle = g;
	ctx.beginPath();
	ctx.arc(0, 0, 262, 0, TAU);
	ctx.fill();
	ctx.restore();
}

function woodSide(ctx: CanvasRenderingContext2D, pal: Palette, x0: number, x1: number) {
	const g = ctx.createLinearGradient(x0, 0, x1, 0);
	g.addColorStop(0, rgb(pal.wood2));
	g.addColorStop(0.2, rgb(pal.wood1));
	g.addColorStop(0.55, rgb(pal.wood2));
	g.addColorStop(1, rgb(pal.wood3));
	return g;
}

export function drawBase(ctx: CanvasRenderingContext2D, pal: Palette, a: number, rise: number) {
	if (a <= 0) return;
	const { cy, rx, ry, h } = BASE;
	ctx.save();
	ctx.globalAlpha = a;
	ctx.translate(0, rise);

	// side
	ctx.beginPath();
	ctx.moveTo(CX - rx, cy);
	ctx.lineTo(CX - rx, cy + h);
	ctx.ellipse(CX, cy + h, rx, ry, 0, Math.PI, 0, true);
	ctx.lineTo(CX + rx, cy);
	ctx.ellipse(CX, cy, rx, ry, 0, 0, Math.PI, false);
	ctx.closePath();
	ctx.fillStyle = woodSide(ctx, pal, CX - rx, CX + rx);
	ctx.fill();

	// grain
	ctx.lineWidth = 0.9;
	ctx.strokeStyle = rgb(pal.wood3, 0.3);
	const grain: [number, number, number][] = [
		[0.3, 0.12, 0.62],
		[0.56, 0.3, 0.9],
		[0.8, 0.08, 0.5]
	];
	for (const [off, s, e] of grain) {
		ctx.beginPath();
		ctx.ellipse(CX, cy + h * off, rx, ry, 0, Math.PI * s, Math.PI * e, false);
		ctx.stroke();
	}

	// top face
	ctx.beginPath();
	ctx.ellipse(CX, cy, rx, ry, 0, 0, TAU);
	const tg = ctx.createLinearGradient(CX - rx, 0, CX + rx, 0);
	tg.addColorStop(0, rgb(pal.wood1));
	tg.addColorStop(1, rgb(mixRgb(pal.wood1, pal.wood2, 0.75)));
	ctx.fillStyle = tg;
	ctx.fill();

	// lit front edge + the seat the glass rests in
	ctx.beginPath();
	ctx.ellipse(CX, cy, rx, ry, 0, Math.PI * 0.12, Math.PI * 0.88, false);
	ctx.strokeStyle = rgb(mixRgb(pal.wood1, pal.glassHi, 0.45), 0.7);
	ctx.lineWidth = 1.2;
	ctx.stroke();
	ctx.beginPath();
	ctx.ellipse(CX, G_BOT + 1, radiusAt(G_BOT) + 3, FOOT_RY + 1, 0, 0, TAU);
	ctx.strokeStyle = rgb(pal.wood3, 0.45);
	ctx.lineWidth = 1.4;
	ctx.stroke();
	ctx.restore();
}

/* ---------- the air inside ---------- */

export function drawBackdrop(
	ctx: CanvasRenderingContext2D,
	geo: VesselGeo,
	pal: Palette,
	a: number
) {
	if (a <= 0) return;
	const g = ctx.createLinearGradient(0, G_TOP, 0, G_BOT);
	g.addColorStop(0, rgb(pal.haze1, 0.92 * a));
	g.addColorStop(1, rgb(pal.haze2, 0.96 * a));
	ctx.fillStyle = g;
	ctx.fill(geo.inner);
}

/* ---------- the glass itself ---------- */

export interface GlassState {
	draw: number; // 0..1 outline being drawn
	finish: number; // 0..1 reflections fading in
	night: number;
	shift: number; // parallax: reflections slide across the surface
	glint: number; // -1 = none, otherwise 0..1 sweep
}

function partial(ctx: CanvasRenderingContext2D, pts: Pt[], f: number): Pt {
	const n = pts.length - 1;
	const x = clamp(f) * n;
	const i = Math.min(n - 1, Math.floor(x));
	const k = x - i;
	ctx.moveTo(pts[0][0], pts[0][1]);
	for (let j = 1; j <= i; j++) ctx.lineTo(pts[j][0], pts[j][1]);
	const hx = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k;
	const hy = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k;
	ctx.lineTo(hx, hy);
	return [hx, hy];
}

export function drawGlass(
	ctx: CanvasRenderingContext2D,
	geo: VesselGeo,
	pal: Palette,
	s: GlassState
) {
	const { draw, finish, night, shift } = s;
	if (draw <= 0) return;
	const rb = radiusAt(G_BOT);

	// 1. thickness of the glass shows as a soft tint that hugs the wall
	if (finish > 0) {
		ctx.save();
		ctx.clip(geo.outer);
		ctx.strokeStyle = rgb(pal.glassTint, 1);
		for (const [w, al] of [
			[62, 0.07],
			[36, 0.09],
			[16, 0.13]
		] as const) {
			ctx.globalAlpha = al * finish * (1 + night * 0.5);
			ctx.lineWidth = w;
			ctx.stroke(geo.outer);
		}
		ctx.restore();

		// inner wall
		ctx.lineWidth = 1;
		ctx.strokeStyle = rgb(pal.glassEdge, 0.34 * finish);
		ctx.stroke(geo.innerLeft);
		ctx.stroke(geo.innerRight);

		// lamp light caught in the rim of the glass at night
		if (night > 0.01) {
			ctx.lineWidth = 3.2;
			ctx.strokeStyle = rgb(pal.glow, 0.2 * night * finish);
			ctx.stroke(geo.innerLeft);
			ctx.stroke(geo.innerRight);
		}
	}

	// 2. the outline, drawn from the foot upward on first load
	const foot = clamp(draw / 0.16);
	const wall = clamp((draw - 0.1) / 0.9);
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.lineWidth = 2.1;
	ctx.strokeStyle = rgb(pal.glassEdge, 0.95);
	ctx.beginPath();
	ctx.ellipse(CX, G_BOT, rb, FOOT_RY, 0, Math.PI / 2, Math.PI / 2 - (Math.PI / 2) * foot, true);
	ctx.stroke();
	ctx.beginPath();
	ctx.ellipse(CX, G_BOT, rb, FOOT_RY, 0, Math.PI / 2, Math.PI / 2 + (Math.PI / 2) * foot, false);
	ctx.stroke();
	let headL: Pt | null = null;
	let headR: Pt | null = null;
	if (wall > 0) {
		ctx.beginPath();
		headL = partial(ctx, geo.left, wall);
		ctx.stroke();
		ctx.beginPath();
		headR = partial(ctx, geo.right, wall);
		ctx.stroke();
	}
	// the glassblower's spark at the head of each line
	if (draw < 1 && headL && headR) {
		const fade = 1 - clamp((draw - 0.86) / 0.14);
		for (const [hx, hy] of [headL, headR]) {
			const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 16);
			g.addColorStop(0, rgb(pal.glassHi, 0.95 * fade));
			g.addColorStop(0.25, rgb(pal.glow, 0.5 * fade));
			g.addColorStop(1, rgb(pal.glow, 0));
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(hx, hy, 16, 0, TAU);
			ctx.fill();
			// a four-point sparkle
			ctx.strokeStyle = rgb(pal.glassHi, 0.9 * fade);
			ctx.lineWidth = 1.1;
			ctx.beginPath();
			ctx.moveTo(hx - 11, hy);
			ctx.lineTo(hx + 11, hy);
			ctx.moveTo(hx, hy - 11);
			ctx.lineTo(hx, hy + 11);
			ctx.stroke();
		}
	}

	if (finish <= 0) return;

	// 3. reflections
	const hi = pal.glassHi;
	const dim = 1 - night * 0.45;
	const sl = shift * 5;

	// the room, reflected dark along the far wall
	const dg = ctx.createLinearGradient(0, 290, 0, 548);
	dg.addColorStop(0, rgb(pal.glassEdge, 0));
	dg.addColorStop(0.5, rgb(pal.glassEdge, 0.26 * finish));
	dg.addColorStop(1, rgb(pal.glassEdge, 0));
	ctx.fillStyle = dg;
	ctx.fill(band(1, 26 - sl, 31 - sl, 290, 548));

	const lg = ctx.createLinearGradient(0, 196, 0, 536);
	lg.addColorStop(0, rgb(hi, 0));
	lg.addColorStop(0.16, rgb(hi, 0.86 * finish * dim));
	lg.addColorStop(0.7, rgb(hi, 0.6 * finish * dim));
	lg.addColorStop(1, rgb(hi, 0));
	ctx.fillStyle = lg;
	ctx.fill(band(-1, 15 + sl, 30 + sl, 196, 536));

	const lg2 = ctx.createLinearGradient(0, 246, 0, 440);
	lg2.addColorStop(0, rgb(hi, 0));
	lg2.addColorStop(0.3, rgb(hi, 0.92 * finish * dim));
	lg2.addColorStop(1, rgb(hi, 0));
	ctx.fillStyle = lg2;
	ctx.fill(band(-1, 37 + sl, 40.5 + sl, 246, 440));

	const rg = ctx.createLinearGradient(0, 270, 0, 556);
	rg.addColorStop(0, rgb(hi, 0));
	rg.addColorStop(0.4, rgb(hi, 0.34 * finish * dim));
	rg.addColorStop(1, rgb(hi, 0));
	ctx.fillStyle = rg;
	ctx.fill(band(1, 11 - sl, 21 - sl, 270, 556));

	// the glass is thicker where it was cut from the pipe, at the foot
	ctx.beginPath();
	ctx.ellipse(
		CX,
		G_BOT - 11,
		radiusAt(G_BOT - 11) - 1,
		FOOT_RY - 1.5,
		0,
		Math.PI * 0.06,
		Math.PI * 0.94,
		false
	);
	ctx.strokeStyle = rgb(pal.glassEdge, 0.36 * finish);
	ctx.lineWidth = 1;
	ctx.stroke();

	// shoulder catch-light
	const sg = ctx.createLinearGradient(0, 132, 0, 190);
	sg.addColorStop(0, rgb(hi, 0));
	sg.addColorStop(0.5, rgb(hi, 0.42 * finish * dim));
	sg.addColorStop(1, rgb(hi, 0));
	ctx.fillStyle = sg;
	ctx.fill(band(-1, 9 + sl * 0.6, 22 + sl * 0.6, 132, 190));

	// kick of light along the foot
	ctx.beginPath();
	ctx.ellipse(CX, G_BOT - 4, rb - 12, FOOT_RY - 3.5, 0, Math.PI * 0.56, Math.PI * 0.86, false);
	ctx.strokeStyle = rgb(hi, 0.5 * finish * dim);
	ctx.lineWidth = 2;
	ctx.stroke();

	// 4. a glint of light travelling across the surface
	if (s.glint >= 0 && s.glint <= 1) {
		const e = easeCubicOut(s.glint);
		const gx = CX - 290 + e * 580;
		const al = Math.sin(Math.PI * s.glint) * (0.34 - night * 0.1);
		ctx.save();
		ctx.clip(geo.outer);
		ctx.transform(1, 0, -0.34, 1, 0, 0);
		const off = 0.34 * 360;
		const gg = ctx.createLinearGradient(gx - 34 + off, 0, gx + 34 + off, 0);
		gg.addColorStop(0, rgb(hi, 0));
		gg.addColorStop(0.5, rgb(hi, al));
		gg.addColorStop(1, rgb(hi, 0));
		ctx.fillStyle = gg;
		ctx.fillRect(gx - 34 + off, 60, 68, 620);
		ctx.restore();
	}
}

/* ---------- the lamp lid ---------- */

export function drawLamp(ctx: CanvasRenderingContext2D, pal: Palette, night: number, a: number) {
	if (a <= 0) return;
	const c = mixRgb(mixRgb(pal.wood3, pal.ink, 0.35), pal.glassHi, clamp(night * 1.15));
	ctx.fillStyle = rgb(c, a);
	ctx.beginPath();
	ctx.ellipse(LAMP.x, LAMP.y, 31, 4.6, 0, 0, TAU);
	ctx.fill();
	if (night > 0.01) {
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		const g = ctx.createRadialGradient(LAMP.x, LAMP.y, 0, LAMP.x, LAMP.y, 78);
		g.addColorStop(0, rgb(pal.glow, 0.85 * night * a));
		g.addColorStop(0.3, rgb(pal.glow, 0.32 * night * a));
		g.addColorStop(1, rgb(pal.glow, 0));
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(LAMP.x, LAMP.y, 78, 0, TAU);
		ctx.fill();
		ctx.restore();
	}
}

export function drawLid(ctx: CanvasRenderingContext2D, pal: Palette, a: number, drop: number) {
	if (a <= 0) return;
	const { topY, botY, rxTop, rxBot, ryTop, ryBot } = LID;
	ctx.save();
	ctx.globalAlpha = a;
	ctx.translate(0, drop);

	ctx.beginPath();
	ctx.moveTo(CX - rxTop, topY);
	ctx.lineTo(CX - rxBot, botY);
	ctx.ellipse(CX, botY, rxBot, ryBot, 0, Math.PI, 0, true);
	ctx.lineTo(CX + rxTop, topY);
	ctx.ellipse(CX, topY, rxTop, ryTop, 0, 0, Math.PI, false);
	ctx.closePath();
	ctx.fillStyle = woodSide(ctx, pal, CX - rxBot, CX + rxBot);
	ctx.fill();

	ctx.lineWidth = 0.9;
	ctx.strokeStyle = rgb(pal.wood3, 0.32);
	for (const [off, s, e] of [
		[0.36, 0.14, 0.7],
		[0.7, 0.32, 0.92]
	] as const) {
		ctx.beginPath();
		ctx.ellipse(
			CX,
			topY + (botY - topY) * off,
			rxTop + (rxBot - rxTop) * off,
			ryTop,
			0,
			Math.PI * s,
			Math.PI * e,
			false
		);
		ctx.stroke();
	}

	ctx.beginPath();
	ctx.ellipse(CX, topY, rxTop, ryTop, 0, 0, TAU);
	const tg = ctx.createLinearGradient(CX - rxTop, 0, CX + rxTop, 0);
	tg.addColorStop(0, rgb(mixRgb(pal.wood1, pal.glassHi, 0.18)));
	tg.addColorStop(1, rgb(pal.wood2));
	ctx.fillStyle = tg;
	ctx.fill();

	// shadow line where the lid meets the glass
	ctx.beginPath();
	ctx.ellipse(CX, botY, rxBot, ryBot, 0, Math.PI * 0.06, Math.PI * 0.94, false);
	ctx.strokeStyle = rgb(pal.wood3, 0.7);
	ctx.lineWidth = 1.3;
	ctx.stroke();
	ctx.restore();
}
