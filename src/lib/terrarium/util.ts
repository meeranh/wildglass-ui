/* Small maths, colour and seeded-random helpers for the terrarium engine. */

import { randomLcg, randomNormal, color as d3color } from 'd3';

export type Pt = [number, number];
export type RGB = [number, number, number];

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
	const t = clamp((v - a) / (b - a));
	return t * t * (3 - 2 * t);
};
/** 0 to 1 progress of `t` through a window starting at `start` lasting `dur`. */
export const prog = (t: number, start: number, dur: number) => clamp((t - start) / dur);

/* ---------- colour ---------- */

export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
	a[0] + (b[0] - a[0]) * t,
	a[1] + (b[1] - a[1]) * t,
	a[2] + (b[2] - a[2]) * t
];

export const rgb = (c: RGB, alpha = 1) =>
	alpha >= 1
		? `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
		: `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha.toFixed(3)})`;

export function parseColor(str: string): RGB {
	const c = d3color(str.trim())?.rgb();
	return c ? [c.r, c.g, c.b] : [128, 128, 128];
}

/** Sample a ramp of colours at t in 0..1 (linear between stops). */
export function ramp(stops: RGB[], t: number): RGB {
	const n = stops.length - 1;
	const x = clamp(t) * n;
	const i = Math.min(n - 1, Math.floor(x));
	return mixRgb(stops[i], stops[i + 1], x - i);
}

/* ---------- seeded randomness ---------- */

export interface Rng {
	(): number;
	range(a: number, b: number): number;
	int(a: number, b: number): number;
	pick<T>(arr: readonly T[]): T;
	normal(mu?: number, sd?: number): number;
	chance(p: number): boolean;
	sign(): 1 | -1;
}

/** Deterministic generator: the same seed always grows the same world. */
export function makeRng(seed: number): Rng {
	// scramble so neighbouring seeds do not produce neighbouring worlds
	let h = (seed | 0) ^ 0x9e3779b9;
	h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
	h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
	h ^= h >>> 16;
	const base = randomLcg(h >>> 0);
	for (let i = 0; i < 4; i++) base();
	const norm = randomNormal.source(base)(0, 1);

	const r = (() => base()) as Rng;
	r.range = (a, b) => a + (b - a) * base();
	r.int = (a, b) => Math.floor(a + (b - a + 1) * base());
	r.pick = (arr) => arr[Math.floor(base() * arr.length)];
	r.normal = (mu = 0, sd = 1) => mu + sd * norm();
	r.chance = (p) => base() < p;
	r.sign = () => (base() < 0.5 ? -1 : 1);
	return r;
}

/** Smooth 1D value noise in -1..1. */
export function makeNoise(rng: Rng) {
	const tab = new Float32Array(256);
	for (let i = 0; i < 256; i++) tab[i] = rng() * 2 - 1;
	return (x: number) => {
		const xi = Math.floor(x);
		const f = x - xi;
		const a = tab[xi & 255];
		const b = tab[(xi + 1) & 255];
		return a + (b - a) * (f * f * (3 - 2 * f));
	};
}

/** Gaussian bump, 1 at u = 0. */
export const bump = (u: number) => Math.exp(-u * u);
