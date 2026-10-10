/* Composing a world. A seed picks one of three kinds of landscape and then
 * every measurement inside it, so each number grows one particular world and
 * no two are the same. The kinds follow how these are really laid out:
 *   fern   a single large fern balanced against a tall stone
 *   stone  an iwagumi garden: three stones, low planting, open air
 *   grove  two ferns crowding a small stone, the lushest of the three   */

import { clamp, makeNoise, makeRng } from './util';
import { CX } from './vessel';
import { makeGround, makeMoss, type Ground, type Hill, type Moss } from './ground';
import { makeRock, type Rock } from './rocks';
import { makeFern, type Fern, type FernOpts } from './ferns';
import {
	makeCreeper,
	makeRosette,
	makeShroom,
	makeTuft,
	type Creeper,
	type Rosette,
	type Shroom,
	type Tuft
} from './plants';
import {
	makeDrops,
	makeFireflies,
	makeMotes,
	type Drop,
	type Firefly,
	type Mote
} from './atmosphere';

export interface Quality {
	density: number; // detail multiplier for stipple, gravel, leaflets
	seg: number; // segments per fern stem
	motes: number;
	flies: number;
}

export const HIGH: Quality = { density: 1, seg: 56, motes: 34, flies: 13 };
export const LOW: Quality = { density: 0.62, seg: 40, motes: 20, flies: 8 };

// depth: 0 is the back of the glass, 1 is the front
export const Z_BACK = 0.05;
export const Z_FAR = 0.2;
export const Z_ROCK = 0.42;
export const Z_MID = 0.56;
export const Z_NEAR = 0.88;

/** The four layers of land, back to front, and when each rises into place
 * (the stones keep their own timing). */
export const LAYERS = [
	{ z: Z_FAR, rise: 1.15 },
	{ z: Z_ROCK, rise: -1 },
	{ z: Z_MID, rise: 1.05 },
	{ z: Z_NEAR, rise: 0.95 }
] as const;

export type Kind = 'fern' | 'stone' | 'grove';
type Shade = { x: number; y: number; r: number };
type Four<T> = [T[], T[], T[], T[]];

export interface World {
	seed: number;
	kind: Kind;
	noise: (x: number) => number;
	ground: Ground;
	rocks: Four<Rock>; // per layer
	moss: Four<Moss>;
	shade: [Shade[], Shade[], Shade[]]; // on the far, middle and near hill
	back: Fern[]; // pale ferns against the back of the glass
	ferns: Four<Fern>;
	tufts: Four<Tuft>;
	shrooms: Four<Shroom>;
	creepers: Creeper[];
	rosettes: Rosette[];
	motes: Mote[];
	flies: Firefly[];
	drops: Drop[];
}

const four = <T>(): Four<T> => [[], [], [], []];

export function compose(seed: number, q: Quality): World {
	const rng = makeRng(seed);
	const noise = makeNoise(rng);
	const flip = rng.chance(0.5);
	const kind = rng.pick<Kind>(['fern', 'fern', 'stone', 'grove']);
	const fx = (x: number) => (flip ? 2 * CX - x : x);
	const dir = flip ? -1 : 1;
	const r = (a: number, b: number) => rng.range(a, b);

	const ground = makeGround(rng, noise, flip, q.density);
	const [far, mid, near] = ground.hills;
	const w: World = {
		seed,
		kind,
		noise,
		ground,
		rocks: four(),
		moss: four(),
		shade: [[], [], []],
		back: [],
		ferns: four(),
		tufts: four(),
		shrooms: four(),
		creepers: [],
		rosettes: [],
		motes: makeMotes(rng, q.motes),
		flies: makeFireflies(rng, q.flies),
		drops: makeDrops(rng, Math.round(18 * q.density))
	};

	// which hill a layer stands on, and where its shadows fall
	const hillOf = (layer: number): [Hill, number] =>
		layer === 0 ? [far, 0] : layer === 3 ? [near, 2] : [mid, 1];
	const zOf = [Z_FAR, Z_ROCK, Z_MID, Z_NEAR];
	let mossAt = 2.5;

	/* All positions below are written for a world whose stone is on the right;
	 * `fx` mirrors them for the other half of the seeds. */

	const rock = (
		layer: 0 | 1 | 3,
		x: number,
		width: number,
		height: number,
		lean: number,
		start: number
	) => {
		const [hill, si] = hillOf(layer);
		const X = fx(x);
		const k = makeRock(
			rng,
			X,
			hill.yAt(X) + (layer === 1 ? 12 : 9),
			width,
			height,
			dir * lean,
			zOf[layer],
			start
		);
		w.rocks[layer].push(k);
		w.shade[si].push({ x: X, y: hill.yAt(X), r: width * 0.63 });
		if (layer === 1) {
			for (const top of k.tops) {
				w.moss[1].push(
					makeMoss(
						rng,
						top.x,
						top.y + 2,
						clamp(top.len * 0.4, 8, 26),
						Z_ROCK,
						mossAt,
						q.density,
						0.46
					)
				);
				mossAt += 0.13;
			}
			w.moss[1].push(
				makeMoss(rng, k.peak[0], k.peak[1] + 5, k.w * 0.085, Z_ROCK, mossAt + 0.1, q.density, 0.5)
			);
		}
		return k;
	};

	const fern = (
		layer: 0 | 2 | 3,
		x: number,
		z: number,
		scale: number,
		o: Partial<FernOpts> = {}
	) => {
		const [hill, si] = hillOf(layer);
		const X = fx(x);
		const small = layer !== 2;
		const f = makeFern(rng, {
			x: X,
			y: hill.yAt(X) + (layer === 0 ? 2 : 3),
			z,
			scale,
			count: small ? (layer === 0 ? 6 : 5) : 9,
			spread: 1,
			start: 2.7,
			seg: small ? Math.round(q.seg * 0.62) : q.seg,
			detail: !small,
			density: small ? 0.85 * q.density : q.density < 1 ? 0.8 : 1,
			croziers: 0,
			late: [],
			...o
		});
		w.ferns[layer].push(f);
		w.ferns[layer].sort((a, b) => a.z - b.z);
		w.shade[si].push({ x: X, y: f.y, r: clamp(scale * 0.12, 16, 32) });
		return f;
	};

	// tall and pale at the very back, half lost in the air: this gives the glass its depth
	const backFern = (x: number, scale: number) => {
		const X = fx(x);
		w.back.push(
			makeFern(rng, {
				x: X,
				y: far.yAt(X) + 10,
				z: Z_BACK,
				scale,
				count: 5,
				spread: 0.78,
				start: 2.2,
				seg: Math.round(q.seg * 0.72),
				detail: false,
				density: 0.78 * q.density,
				croziers: 0,
				late: []
			})
		);
	};

	const tuft = (layer: 0 | 2 | 3, x: number, size: number, count: number, start: number) => {
		const [hill, si] = hillOf(layer);
		const X = fx(x);
		w.tufts[layer].push(makeTuft(rng, X, hill.yAt(X) + 2, zOf[layer], start, size, count));
		if (layer === 3) w.shade[si].push({ x: X, y: hill.yAt(X), r: 13 });
	};

	const cushions = (layer: 0 | 2 | 3, xs: number[], r0: number, r1: number, at: number) => {
		const [hill] = hillOf(layer);
		for (const x of xs) {
			const X = fx(x);
			w.moss[layer].push(
				makeMoss(rng, X, hill.yAt(X) + 2.2, r(r0, r1), zOf[layer], at + r(0, 0.6), q.density)
			);
		}
	};

	const rosette = (x: number, size: number, start: number) => {
		const X = fx(x);
		w.rosettes.push(makeRosette(rng, X, near.yAt(X) + 2, 0.9, start, size));
		w.shade[2].push({ x: X, y: near.yAt(X), r: size * 0.5 });
	};

	const shroom = (layer: 2 | 3, x: number, size: number, start: number) => {
		const [hill] = hillOf(layer);
		const X = fx(x);
		w.shrooms[layer].push(makeShroom(rng, X, hill.yAt(X) + 1.5, zOf[layer], start, size));
	};

	const creeper = (
		k: Rock,
		from: 'peak' | 'ledge',
		strands: number,
		length: number,
		bias: number,
		start: number
	) => {
		const ledge = k.tops[0];
		const at: [number, number] =
			from === 'ledge' && ledge ? [ledge.x, ledge.y] : [k.peak[0], k.peak[1] + 5];
		w.creepers.push(makeCreeper(rng, at, Z_ROCK + 0.04, start, strands, length, bias));
	};

	// small stones scattered along the front, common to every kind
	const pebbles = () => {
		rock(3, r(150, 172), r(40, 52), r(24, 34), r(-0.12, 0.12), 2.0);
		rock(3, r(442, 462), r(30, 40), r(17, 25), r(-0.12, 0.12), 2.15);
		rock(3, r(256, 276), r(20, 26), r(11, 15), r(-0.12, 0.12), 2.25);
	};

	if (kind === 'fern') {
		const mainX = r(374, 398);
		const main = rock(1, mainX, r(138, 164), r(206, 244), r(-0.14, 0.02), 1.6);
		const side = rock(
			1,
			mainX - main.w * r(0.56, 0.66),
			r(84, 104),
			r(90, 116),
			r(-0.04, 0.2),
			1.85
		);
		rock(0, r(176, 206), r(52, 66), r(48, 62), r(-0.1, 0.1), 1.75);
		pebbles();

		backFern(r(336, 388), r(318, 352));
		fern(0, r(436, 452), 0.24, r(108, 128), { spread: 0.92, start: 2.5 });
		fern(2, r(226, 248), 0.8, r(248, 284), {
			count: q.density < 1 ? 8 : rng.int(9, 10),
			spread: 1.05,
			croziers: 2,
			late: [8.5, 15.5]
		});
		fern(3, r(420, 436), 0.94, r(76, 92), { spread: 0.98, start: 3.5, croziers: 1 });

		tuft(0, r(150, 172), 30, 9, 2.4);
		tuft(2, r(176, 194), 38, 10, 2.5);
		tuft(3, r(140, 156), r(48, 60), 15, 2.6);
		tuft(3, r(462, 474), r(40, 50), 12, 2.8);
		rosette(r(304, 330), r(34, 42), 3.1);
		creeper(side, 'peak', 3, r(54, 72), -dir, 3.0);
		creeper(main, 'ledge', 4, r(84, 112), dir, 3.4);

		const sx = mainX + main.w * 0.4;
		[9.5, 7.2, 5.4].forEach((size, i) => shroom(2, sx + i * r(7, 10), size, 4.6 + i * 0.22));
		shroom(3, r(206, 222), 7, 5.3);

		cushions(0, [r(118, 150), r(272, 300), r(452, 478)], 13, 22, 2.2);
		cushions(2, [r(150, 176), r(282, 300), r(338, 356), r(446, 470)], 13, 24, 2.3);
		cushions(3, [r(196, 214), r(232, 250), r(352, 376), r(400, 422)], 12, 21, 2.4);
	} else if (kind === 'stone') {
		const mainX = r(322, 350);
		const main = rock(1, mainX, r(134, 156), r(236, 268), r(-0.09, 0.05), 1.6);
		const second = rock(1, r(214, 236), r(96, 116), r(128, 156), r(0.06, 0.2), 1.82);
		const third = rock(1, r(432, 452), r(74, 92), r(76, 100), r(-0.2, -0.05), 2.02);
		rock(0, r(140, 168), r(50, 62), r(44, 58), r(-0.1, 0.1), 1.75);
		pebbles();

		backFern(r(292, 356), r(300, 338));
		fern(0, r(456, 472), 0.24, r(94, 114), { spread: 0.9, start: 2.5 });
		fern(2, r(150, 170), 0.78, r(126, 150), { count: 7, start: 2.8, croziers: 1, late: [9.5] });
		fern(3, r(384, 404), 0.94, r(70, 86), { spread: 0.98, start: 3.4, croziers: 1 });

		tuft(0, r(382, 410), 28, 9, 2.4);
		tuft(2, r(270, 288), 44, 12, 2.5);
		tuft(2, r(392, 408), 34, 9, 2.7);
		tuft(3, r(134, 148), r(50, 60), 15, 2.6);
		tuft(3, r(468, 478), r(42, 50), 12, 2.8);
		tuft(3, r(300, 320), 30, 9, 2.9);
		rosette(r(236, 260), r(36, 44), 3.1);
		rosette(r(438, 452), r(26, 32), 3.3);
		creeper(main, 'ledge', 4, r(98, 128), dir, 3.2);
		creeper(second, 'peak', 3, r(58, 80), -dir, 3.0);
		creeper(third, 'peak', 2, r(40, 56), dir, 3.5);

		const sx = r(256, 268);
		[9, 6.8].forEach((size, i) => shroom(2, sx + i * r(7, 10), size, 4.6 + i * 0.22));
		shroom(3, r(196, 214), 7.5, 5.2);
		shroom(3, r(346, 362), 6, 5.4);

		cushions(0, [r(210, 240), r(300, 330), r(410, 440)], 13, 22, 2.2);
		cushions(2, [r(118, 140), r(196, 216), r(296, 316), r(456, 474)], 13, 24, 2.3);
		cushions(3, [r(180, 200), r(268, 290), r(340, 364), r(412, 430)], 12, 21, 2.4);
	} else {
		const stoneX = r(328, 352);
		const stone = rock(1, stoneX, r(104, 126), r(118, 146), r(-0.1, 0.1), 1.6);
		const small = rock(1, stoneX - stone.w * r(0.62, 0.74), r(62, 78), r(54, 72), r(0, 0.2), 1.85);
		rock(0, r(450, 474), r(50, 62), r(44, 58), r(-0.1, 0.1), 1.75);
		pebbles();

		backFern(r(286, 334), r(322, 356));
		fern(0, r(296, 330), 0.22, r(100, 118), { spread: 0.9, start: 2.5 });
		fern(2, r(408, 426), 0.7, r(176, 204), { count: 8, start: 2.9, croziers: 1, late: [14] });
		fern(2, r(188, 208), 0.8, r(232, 262), { spread: 1.02, croziers: 2, late: [8.5] });
		fern(3, r(296, 322), 0.94, r(66, 80), { start: 3.5, croziers: 1 });

		tuft(0, r(150, 172), 30, 9, 2.4);
		tuft(2, r(296, 314), 36, 10, 2.5);
		tuft(3, r(138, 152), r(46, 56), 14, 2.6);
		tuft(3, r(464, 476), r(40, 50), 12, 2.8);
		rosette(r(236, 252), r(32, 40), 3.1);
		rosette(r(372, 390), r(30, 36), 3.3);
		creeper(stone, 'ledge', 3, r(60, 84), dir, 3.2);
		creeper(small, 'peak', 2, r(40, 54), -dir, 3.0);

		[8.5, 6.4].forEach((size, i) => shroom(2, r(266, 276) + i * r(7, 9), size, 4.6 + i * 0.22));
		shroom(3, r(200, 216), 7, 5.3);
		shroom(3, r(424, 438), 6, 5.5);

		cushions(0, [r(118, 150), r(230, 260), r(380, 420)], 13, 22, 2.2);
		cushions(2, [r(132, 154), r(250, 268), r(350, 368), r(458, 474)], 13, 24, 2.3);
		cushions(3, [r(176, 196), r(262, 282), r(340, 362), r(404, 424)], 12, 21, 2.4);
	}

	return w;
}
