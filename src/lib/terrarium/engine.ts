/* The terrarium engine. Composes a world from a seed, then runs it:
 *   1. the glass is drawn, the lid settles
 *   2. soil rises, stones settle, moss spreads
 *   3. plants grow in (ferns unroll from fiddleheads)
 *   4. light arrives, and the world settles into a slow, breathing idle
 * Everything is deterministic for a given seed, and every colour comes from
 * the theme tokens, so toggling the theme turns day into lamp-lit night.
 *
 * Once the land has finished growing it is baked into offscreen layers, so
 * each frame only redraws what is actually alive. */

import { timer, easeCubicOut, easeCubicInOut, easeBackOut, type Timer } from 'd3';
import { clamp, prog } from './util';
import { mixPalette, type Palette } from './palette';
import {
	W,
	H,
	buildVessel,
	drawBackdrop,
	drawBase,
	drawGlass,
	drawLamp,
	drawLid,
	drawShadow,
	type VesselGeo
} from './vessel';
import { drawHill, drawMoss, drawStrata, type Moss } from './ground';
import { drawRock, type Rock } from './rocks';
import { drawFern, paintFern, type Wind } from './ferns';
import {
	drawCreeper,
	drawRosette,
	drawShroom,
	drawTuft,
	paintCreeper,
	paintRosette,
	paintTuft
} from './plants';
import {
	drawAura,
	drawDrops,
	drawFireflies,
	drawLampCone,
	drawLampLight,
	drawMotes,
	drawRunner,
	drawShaft,
	drawVignette,
	stepMotes
} from './atmosphere';
import { compose, HIGH, LOW, LAYERS, Z_BACK, type Quality, type World } from './world';

const PARALLAX = 13;
// the land is finished growing by now and can be baked
const SETTLED = 4.9;
// the part of the scene the baked layers cover
const BAKE = { x: 84, y: 220, w: 432, h: 428 };

const settle = easeBackOut.overshoot(1.5);

export class Terrarium {
	private ctx: CanvasRenderingContext2D;
	private geo: VesselGeo;
	private world!: World;
	private next: World | null = null;
	private q: Quality = HIGH;
	private scale = 1;

	private clock = 0; // seconds of animation actually shown
	private epoch = 0; // when the current world began
	private veil = 0; // 0 clear .. 1 world hidden (between worlds)
	private veilTo = 0;

	private palFrom!: Palette;
	private palTo!: Palette;
	private pal!: Palette;
	private palT = 1;
	private palK = 1;
	private night = 0;
	private nightFrom = 0;
	private nightTo = 0;
	private dusk = -99; // clock time the lamp last came on

	// baked land, for the current theme and (while re-lighting) the previous one
	private baked: HTMLCanvasElement[] | null = null;
	private bakedOld: HTMLCanvasElement[] | null = null;

	private px = 0;
	private py = 0;
	private tx = 0;
	private ty = 0;
	private lastMove = -99;
	private breeze = 0;
	private tapped = -99;

	private timer: Timer | null = null;
	private last = 0;
	private still = false;
	private frozenAt: number | null = null;
	private ms = 0;

	constructor(
		private canvas: HTMLCanvasElement,
		seed: number,
		pal: Palette,
		dark: boolean
	) {
		this.ctx = canvas.getContext('2d')!;
		this.geo = buildVessel();
		this.palFrom = this.palTo = this.pal = pal;
		this.night = this.nightFrom = this.nightTo = dark ? 1 : 0;
		this.world = compose(seed, this.q);
		this.paint();
	}

	get seed() {
		return this.world.seed;
	}

	get kind() {
		return this.world.kind;
	}

	get frameMs() {
		return this.ms;
	}

	/** Canvas size in CSS pixels, and the device pixel ratio to render at. */
	resize(cssW: number, dpr: number) {
		const ratio = Math.min(2, Math.max(1, dpr));
		const w = Math.max(1, Math.round(cssW * ratio));
		const h = Math.round((w * H) / W);
		if (this.canvas.width !== w || this.canvas.height !== h) {
			this.canvas.width = w;
			this.canvas.height = h;
			this.unbake();
		}
		this.scale = w / W;
		const q = cssW < 520 ? LOW : HIGH;
		if (q !== this.q) {
			this.q = q;
			this.world = compose(this.world.seed, q);
			this.paint();
			this.unbake();
		}
		if (this.still) this.render(0);
	}

	/** Re-light the scene. Animated unless `instant`. */
	setTheme(pal: Palette, dark: boolean, instant = false) {
		const clean = this.palT === 1 && this.baked !== null && this.settled();
		this.palFrom = this.pal;
		this.palTo = pal;
		this.nightFrom = this.night;
		this.nightTo = dark ? 1 : 0;
		if (dark && this.nightFrom < 0.5) this.dusk = this.clock;
		this.palT = instant || this.still ? 1 : 0;
		this.palK = this.palT;
		if (this.palT === 1) {
			this.pal = pal;
			this.night = this.nightTo;
			if (dark) this.dusk = -99;
			this.unbake();
			this.paint();
			if (this.still) this.render(0);
		} else if (clean) {
			// cross-fade the baked land from the old light to the new
			this.bakedOld = this.baked;
			this.baked = this.bake(pal);
		} else {
			this.unbake();
		}
	}

	/** Pointer position relative to the stage, each axis in -1..1. */
	setPointer(nx: number, ny: number) {
		this.tx = clamp(nx, -1, 1);
		this.ty = clamp(ny, -1, 1);
		this.lastMove = this.clock;
	}

	/** A puff of air, e.g. from the pointer sweeping across. */
	nudge(v: number) {
		this.breeze = clamp(this.breeze + v, -1.1, 1.1);
	}

	/** A tap on the glass: the plants rustle and light slides across the surface. */
	tap(dir: number) {
		if (this.still) return;
		this.nudge(dir * 0.55);
		this.tapped = this.clock;
	}

	/** Dissolve this world and grow another. */
	grow(seed: number) {
		this.next = compose(seed, this.q);
		if (this.still) {
			this.swap();
			this.render(0);
		} else {
			this.veilTo = 1;
		}
	}

	start() {
		if (this.timer || this.still) return;
		this.last = performance.now();
		this.timer = timer(() => {
			const now = performance.now();
			const dt = Math.min(0.05, (now - this.last) / 1000);
			this.last = now;
			this.render(dt);
			this.ms += (performance.now() - now - this.ms) * 0.05;
		});
	}

	stop() {
		this.timer?.stop();
		this.timer = null;
	}

	/** Show the finished world as a single still frame (reduced motion). */
	settleStill() {
		this.stop();
		this.still = true;
		this.frozenAt = null;
		this.render(0);
	}

	/** Freeze the timeline at t seconds (for inspecting a single frame). */
	freeze(t: number) {
		this.stop();
		this.still = true;
		this.frozenAt = t;
		this.render(0);
	}

	destroy() {
		this.stop();
		this.unbake();
	}

	private swap() {
		if (!this.next) return;
		this.world = this.next;
		this.next = null;
		this.unbake();
		this.paint();
		this.epoch = this.clock - 0.86; // the glass is already here: start at the soil
		this.veilTo = 0;
	}

	private settled() {
		return !this.still && this.clock - this.epoch > SETTLED && this.veil === 0 && !this.next;
	}

	private unbake() {
		this.baked = null;
		this.bakedOld = null;
	}

	/** Draw the finished land once into four offscreen layers. */
	private bake(pal: Palette): HTMLCanvasElement[] {
		const s = this.scale;
		const out: HTMLCanvasElement[] = [];
		for (let i = 0; i < LAYERS.length; i++) {
			const c = document.createElement('canvas');
			c.width = Math.ceil(BAKE.w * s);
			c.height = Math.ceil(BAKE.h * s);
			const x = c.getContext('2d')!;
			x.setTransform(s, 0, 0, s, -BAKE.x * s, -BAKE.y * s);
			this.land(x, i, pal, 999);
			out.push(c);
		}
		return out;
	}

	private paint() {
		const w = this.world;
		const p = this.pal;
		for (const f of w.back) paintFern(f, p);
		for (const f of w.ferns.flat()) paintFern(f, p);
		for (const t of w.tufts.flat()) paintTuft(t, p);
		for (const c of w.creepers) paintCreeper(c, p);
		for (const r of w.rosettes) paintRosette(r, p);
	}

	private wind: Wind = (x, t, phase) => {
		const gust = 0.56 + 0.44 * this.world.noise(t * 0.19);
		return (
			gust *
				(0.6 * Math.sin(t * 0.83 - x * 0.012 + phase * 0.3) +
					0.3 * Math.sin(t * 1.71 - x * 0.021 + phase) +
					0.1 * Math.sin(t * 3.3 + phase * 2)) +
			this.breeze
		);
	};

	/** The parts of a layer that stop changing once they have grown in. */
	private land(ctx: CanvasRenderingContext2D, i: number, pal: Palette, tw: number) {
		const w = this.world;
		const [far, mid, near] = w.ground.hills;
		const moss = (m: Moss) => drawMoss(ctx, m, pal, easeCubicOut(prog(tw, m.start, 0.9)));
		const rock = (r: Rock) => drawRock(ctx, r, pal, prog(tw, r.start, 0.95));
		// stones stand behind the ground they rest on, so their feet are buried
		w.rocks[i].forEach(rock);
		if (i === 0) drawHill(ctx, far, pal, w.shade[0]);
		else if (i === 2) drawHill(ctx, mid, pal, w.shade[1]);
		else if (i === 3) {
			drawHill(ctx, near, pal, w.shade[2]);
			drawStrata(ctx, near, w.ground.strata, pal);
		}
		w.moss[i].forEach(moss);
	}

	/** The parts of a layer that keep moving. */
	private life(ctx: CanvasRenderingContext2D, i: number, pal: Palette, tw: number) {
		const w = this.world;
		const wind = this.wind;
		for (const tf of w.tufts[i]) drawTuft(ctx, tf, tw, wind);
		for (const s of w.shrooms[i]) drawShroom(ctx, s, pal, tw, wind);
		if (i === 1) for (const c of w.creepers) drawCreeper(ctx, c, tw, wind);
		if (i === 3) for (const r of w.rosettes) drawRosette(ctx, r, tw, wind);
		for (const f of w.ferns[i]) drawFern(ctx, f, tw, wind);
	}

	private render(dt: number) {
		const ctx = this.ctx;
		const w = this.world;
		const geo = this.geo;
		this.clock += dt;

		// timelines: the glass keeps one clock, each world its own
		const done = this.still && this.frozenAt === null;
		const tg = done ? 999 : (this.frozenAt ?? this.clock);
		const tw = done ? 999 : (this.frozenAt ?? this.clock - this.epoch);
		const t = this.frozenAt ?? this.clock; // free-running time for wind and light

		/* theme tween */
		if (this.palT < 1) {
			this.palT = Math.min(1, this.palT + dt / 1.15);
			this.palK = easeCubicInOut(this.palT);
			this.pal = mixPalette(this.palFrom, this.palTo, this.palK);
			this.night = this.nightFrom + (this.nightTo - this.nightFrom) * this.palK;
			this.paint();
			if (this.palT === 1) this.bakedOld = null;
		}
		const pal = this.pal;
		const night = this.night;

		/* between worlds */
		if (this.veil !== this.veilTo) {
			const step = dt / 0.34;
			this.veil =
				this.veilTo > this.veil ? Math.min(1, this.veil + step) : Math.max(0, this.veil - step);
			if (this.veil === 1 && this.next) this.swap();
		}

		/* pointer: ease toward the target, and drift gently when left alone */
		const idle = this.clock - this.lastMove > 2.5;
		const gx = idle ? Math.sin(this.clock * 0.21) * 0.3 : this.tx;
		const gy = idle ? Math.sin(this.clock * 0.16 + 1) * 0.2 : this.ty;
		const ease = 1 - Math.exp(-dt * (idle ? 1.2 : 5.5));
		this.px += (gx - this.px) * ease;
		this.py += (gy - this.py) * ease;
		this.breeze *= Math.exp(-dt * 1.6);
		const px = this.still ? 0 : this.px;
		const py = this.still ? 0 : this.py;

		ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.globalAlpha = 1;
		ctx.globalCompositeOperation = 'source-over';

		/* the object itself */
		const baseP = prog(tg, 0, 0.75);
		drawAura(ctx, pal, night * prog(tg, 1.2, 1.2));
		drawShadow(ctx, pal, night, easeCubicOut(baseP));
		drawBase(ctx, pal, clamp(baseP * 2.2), (1 - easeCubicOut(baseP)) * 14);
		const finish = easeCubicOut(prog(tg, 0.95, 0.9));
		drawBackdrop(ctx, geo, pal, finish);

		/* the world inside */
		ctx.save();
		ctx.clip(geo.inner);
		const shift = (z: number) =>
			ctx.translate(px * PARALLAX * (1 - z), py * PARALLAX * 0.35 * (1 - z));
		drawLampLight(ctx, pal, t, night * 0.62 * finish);

		// the pale ferns at the very back
		ctx.save();
		shift(Z_BACK);
		for (const f of w.back) drawFern(ctx, f, tw, this.wind);
		ctx.restore();

		const settled = this.settled();
		const baked = settled ? this.baked : null;
		for (let i = 0; i < LAYERS.length; i++) {
			const { z, rise } = LAYERS[i];
			const up = rise < 0 ? 1 : easeCubicOut(prog(tw, rise, 0.95));
			if (up <= 0) continue;
			ctx.save();
			shift(z);
			if (up < 1) ctx.translate(0, (1 - up) * 96);

			if (baked && this.palT === 1) {
				ctx.drawImage(
					baked[i],
					BAKE.x,
					BAKE.y,
					baked[i].width / this.scale,
					baked[i].height / this.scale
				);
			} else if (baked && this.bakedOld) {
				const old = this.bakedOld[i];
				ctx.drawImage(old, BAKE.x, BAKE.y, old.width / this.scale, old.height / this.scale);
				ctx.globalAlpha = this.palK;
				ctx.drawImage(
					baked[i],
					BAKE.x,
					BAKE.y,
					baked[i].width / this.scale,
					baked[i].height / this.scale
				);
				ctx.globalAlpha = 1;
			} else {
				this.land(ctx, i, pal, tw);
			}
			this.life(ctx, i, pal, tw);
			ctx.restore();
		}
		if (settled && !this.baked && this.palT === 1) this.baked = this.bake(this.palTo);

		// a new world is on its way: the old one dissolves into the air
		if (this.veil > 0) drawBackdrop(ctx, geo, pal, this.veil);

		/* light and air */
		const lit = easeCubicInOut(prog(tw, 4.4, 1.3));
		drawShaft(ctx, pal, t, lit * (1 - night));
		drawLampCone(ctx, pal, t, night * finish);
		drawLampLight(ctx, pal, t, night * 0.42 * finish);
		drawVignette(ctx, pal, night, finish);
		if (!this.still) stepMotes(w.motes, dt, t, w.noise, this.breeze);
		drawMotes(ctx, w.motes, pal, t, lit, night);
		const sinceDusk = this.still ? 99 : this.clock - this.dusk;
		drawFireflies(ctx, w.flies, pal, t, night * finish, sinceDusk, w.noise, true);
		drawLamp(ctx, pal, night, finish);
		ctx.restore();

		/* glass, lid, and whatever is in the room */
		// a glint as the glass is finished, another when the world has grown, then now and again
		const since = tg - 5.6;
		const fromTap = (this.clock - this.tapped) / 1.1;
		const glint = this.still
			? -1
			: fromTap <= 1
				? fromTap
				: since < 0
					? (tg - 1.45) / 1.3
					: (since % 17) / 1.5;
		drawGlass(ctx, geo, pal, {
			draw: easeCubicInOut(prog(tg, 0, 1.25)),
			finish,
			night,
			shift: px,
			glint: glint > 1 ? -1 : glint
		});
		drawDrops(ctx, w.drops, pal, finish * prog(tw, 3.6, 1.6));
		if (!this.still) drawRunner(ctx, pal, tw, w.seed, finish);

		const lidP = prog(tg, 1.0, 0.62);
		drawLid(ctx, pal, clamp(lidP * 3), (1 - settle(lidP)) * -18);
		drawFireflies(ctx, w.flies, pal, t, night * prog(tg, 1.6, 1.6), sinceDusk, w.noise, false);
	}
}
