<script lang="ts">
	import FernMark from './FernMark.svelte';
	import { reveal } from '#lib/actions/reveal';
	import { formatLKR, dims, type Model } from '#lib/data/collection';

	interface Props {
		model: Model;
		delay?: number;
	}
	let { model, delay = 0 }: Props = $props();
</script>

<a class="card" href={`/collection/${model.slug}`} use:reveal={{ delay }}>
	<div class="thumb" data-water={model.water}>
		<FernMark size={54} decorative />
		{#if model.water}
			<svg class="waves" viewBox="0 0 120 20" aria-hidden="true" preserveAspectRatio="none">
				<path d="M0 10 Q15 2 30 10 T60 10 T90 10 T120 10" />
				<path d="M0 15 Q15 7 30 15 T60 15 T90 15 T120 15" />
			</svg>
		{/if}
		<span class="code">{model.code}</span>
		{#if model.madeToOrder}<span class="tag">Made to order</span>{/if}
	</div>
	<div class="meta">
		<div class="row">
			<h3>{model.name}</h3>
			<span class="price tnum">{formatLKR(model.price)}</span>
		</div>
		<p class="type">{model.type} &middot; {dims(model)}</p>
		<p class="blurb">{model.blurb}</p>
		<span class="more ulink">View piece</span>
	</div>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition:
			transform var(--dur) var(--ease),
			box-shadow var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lift);
		border-color: var(--line-strong);
	}
	.thumb {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 3;
		color: var(--brand);
		background:
			radial-gradient(120% 90% at 50% 15%, var(--surface-2), transparent 70%), var(--bg-alt);
		border-bottom: 1px solid var(--line);
	}
	.thumb[data-water='true'] {
		background:
			radial-gradient(
				120% 90% at 50% 15%,
				color-mix(in srgb, var(--glass) 24%, var(--bg-alt)),
				transparent 70%
			),
			var(--bg-alt);
	}
	.thumb :global(svg) {
		opacity: 0.55;
		transition: transform var(--dur-slow) var(--ease);
	}
	.card:hover .thumb :global(svg) {
		transform: translateY(-4px) scale(1.04);
	}
	.waves {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 18%;
		width: 100%;
		height: 26px;
		fill: none;
		stroke: var(--glass);
		stroke-width: 1.2;
		opacity: 0.6;
	}
	.code {
		position: absolute;
		top: 0.9rem;
		left: 1rem;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		color: var(--text-faint);
	}
	.tag {
		position: absolute;
		top: 0.8rem;
		right: 0.9rem;
		font-size: 0.64rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--on-brand);
		background: var(--brand);
		padding: 0.3em 0.7em;
		border-radius: var(--radius-pill);
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 1.3rem 1.4rem 1.5rem;
	}
	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	.price {
		color: var(--accent);
		font-weight: 600;
		white-space: nowrap;
	}
	.type {
		font-size: 0.85rem;
		color: var(--text-faint);
	}
	.blurb {
		color: var(--text-muted);
		margin-top: 0.4rem;
		font-size: 0.96rem;
	}
	.more {
		margin-top: 0.9rem;
		font-size: 0.9rem;
		color: var(--accent);
		font-weight: 600;
	}
</style>
