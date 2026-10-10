<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/env';
	import { Terrarium } from '#lib/terrarium/engine';
	import { readPalette } from '#lib/terrarium/palette';
	import { theme } from '#lib/stores/theme.svelte';

	let stage = $state<HTMLDivElement | null>(null);
	let canvas = $state<HTMLCanvasElement | null>(null);
	let seed = $state(0);
	let live = $state(false);

	let engine: Terrarium | null = null;
	let shownDark: boolean | null = null;

	const randomSeed = () => 1 + Math.floor(Math.random() * 9998);
	const label = $derived(seed ? String(seed).padStart(4, '0') : '');

	function growAnother() {
		if (!engine) return;
		seed = randomSeed();
		engine.grow(seed);
	}

	onMount(() => {
		if (!stage || !canvas) return;
		const host = stage;
		const params = new URLSearchParams(location.search);
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const dark = document.documentElement.dataset.theme === 'dark';

		// ?world=1234 shows one particular world, so a favourite can be shared
		const asked = Number(params.get('world'));
		seed = asked >= 1 ? Math.floor(asked) : randomSeed();
		const eng = new Terrarium(canvas, seed, readPalette(), dark);
		engine = eng;
		shownDark = dark;

		const view = canvas;
		const fit = () => eng.resize(view.clientWidth, window.devicePixelRatio || 1);
		fit();
		const ro = new ResizeObserver(fit);
		ro.observe(host);

		const frozen = dev ? params.get('wt') : null;
		const still = reduce || frozen !== null;
		if (frozen !== null) eng.freeze(Number(frozen));
		else if (reduce) eng.settleStill();

		// only animate while it can actually be seen
		let onScreen = true;
		const sync = () => {
			if (still) return;
			if (onScreen && !document.hidden) eng.start();
			else eng.stop();
		};
		const io = new IntersectionObserver(
			(entries) => {
				onScreen = entries[0].isIntersecting;
				sync();
			},
			{ threshold: 0.02 }
		);
		io.observe(host);
		document.addEventListener('visibilitychange', sync);
		sync();

		// the pointer shifts the view a little, and stirs the air as it sweeps past
		let lastX = 0;
		let lastT = 0;
		const onMove = (e: PointerEvent) => {
			const r = host.getBoundingClientRect();
			const nx = (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9);
			const ny = (e.clientY - (r.top + r.height / 2)) / (r.height * 0.9);
			eng.setPointer(nx, ny);
			const now = performance.now();
			if (lastT && Math.abs(nx) < 0.7 && Math.abs(ny) < 0.7) {
				const v = (e.clientX - lastX) / Math.max(8, now - lastT);
				eng.nudge(Math.max(-0.1, Math.min(0.1, v * 0.045)));
			}
			lastX = e.clientX;
			lastT = now;
		};
		window.addEventListener('pointermove', onMove, { passive: true });

		// a tap on the glass makes the plants rustle
		const onDown = (e: PointerEvent) => {
			const r = host.getBoundingClientRect();
			if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
				return;
			eng.tap(e.clientX < r.left + r.width / 2 ? 1 : -1);
		};
		window.addEventListener('pointerdown', onDown, { passive: true });

		let stats = 0;
		if (dev) {
			stats = window.setInterval(() => {
				(window as unknown as { __wg: unknown }).__wg = {
					ms: +eng.frameMs.toFixed(2),
					seed: eng.seed,
					kind: eng.kind
				};
			}, 500);
		}

		live = true;
		return () => {
			window.clearInterval(stats);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerdown', onDown);
			document.removeEventListener('visibilitychange', sync);
			io.disconnect();
			ro.disconnect();
			eng.destroy();
			engine = null;
		};
	});

	// day turns to night (and back) when the theme is toggled
	$effect(() => {
		const dark = theme.resolved === 'dark';
		if (!engine || shownDark === null || dark === shownDark) return;
		shownDark = dark;
		// read the new tokens once the attribute change has been applied
		requestAnimationFrame(() => engine?.setTheme(readPalette(), dark));
	});
</script>

<div class="terrarium">
	<div
		class="stage"
		bind:this={stage}
		role="img"
		aria-label="An illustrated glass terrarium on a wooden base, with ferns, moss and stone growing inside"
	>
		<canvas bind:this={canvas} aria-hidden="true"></canvas>
	</div>
	<div class="plate" class:live>
		<span class="no tnum">World No. {label}</span>
		<span class="dot" aria-hidden="true"></span>
		<button type="button" onclick={growAnother}>Grow another</button>
	</div>
</div>

<style>
	.terrarium {
		width: 100%;
		max-width: 600px;
		margin-inline: auto;
	}
	.stage {
		position: relative;
		width: 100%;
		aspect-ratio: 600 / 720;
	}
	/* The canvas is larger than its layout box, so the vessel fills the column
	   while the glow and fireflies have room to spill around it. */
	canvas {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 124%;
		aspect-ratio: 600 / 720;
		transform: translate(-50%, -52%);
		display: block;
		pointer-events: none;
	}
	.plate {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		margin-top: 1.5rem;
		position: relative;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--text-faint);
		opacity: 0;
		transform: translateY(6px);
		transition:
			opacity 1.2s var(--ease) 4.6s,
			transform 1.2s var(--ease) 4.6s;
	}
	.plate.live {
		opacity: 1;
		transform: none;
	}
	.dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--line-strong);
	}
	button {
		font: inherit;
		letter-spacing: inherit;
		text-transform: inherit;
		color: var(--accent);
		background: none;
		border: 0;
		padding: 0.5em 0;
		cursor: pointer;
		position: relative;
	}
	button::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0.35em;
		height: 1px;
		background: currentColor;
		transform: scaleX(0);
		transform-origin: left;
		transition: transform var(--dur) var(--ease);
	}
	button:hover::after,
	button:focus-visible::after {
		transform: scaleX(1);
	}
	@media (prefers-reduced-motion: reduce) {
		.plate {
			transition: none;
		}
	}
</style>
