<script lang="ts">
	import { buildFrond } from '#lib/graphics/fern';

	interface Props {
		size?: number;
		strokeWidth?: number;
		frame?: boolean;
		decorative?: boolean;
		class?: string;
	}

	let {
		size = 40,
		strokeWidth = 1.4,
		frame = true,
		decorative = false,
		class: klass = ''
	}: Props = $props();

	const frond = buildFrond({
		x: 22,
		y: 48,
		length: 42,
		baseAngleDeg: -90,
		archDeg: 7,
		leafCount: 9,
		leafMax: 12.5,
		leafSpreadDeg: 60,
		leafStart: 0.13,
		leafEnd: 0.93
	});
	const h = $derived((size / 44) * 56);
</script>

<svg
	class={klass}
	width={size}
	height={h}
	viewBox="0 0 44 56"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	role={decorative ? 'presentation' : 'img'}
	aria-hidden={decorative}
	aria-label={decorative ? undefined : 'WILDGLASS'}
>
	{#if frame}
		<rect x="2.5" y="2.5" width="39" height="51" rx="1.5" stroke-width="1" opacity="0.9" />
	{/if}
	<path d={frond.rachis} />
	{#each frond.leaflets as lf, i (i)}
		<path d={lf.d} transform={`translate(${lf.x} ${lf.y}) rotate(${lf.deg})`} />
	{/each}
</svg>
