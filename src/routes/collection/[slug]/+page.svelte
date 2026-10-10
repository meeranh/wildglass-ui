<script lang="ts">
	import FernMark from '#lib/components/FernMark.svelte';
	import { reveal } from '#lib/actions/reveal';
	import { formatLKR, dims } from '#lib/data/collection';
	import { whatsapp } from '#lib/data/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const m = $derived(data.model);

	const specs = $derived(
		[
			{ l: 'Size', v: dims(m) },
			{ l: 'Care', v: m.care },
			{ l: 'Power', v: m.power },
			{ l: 'Ready in', v: m.readyIn },
			m.plants ? { l: 'Plants', v: m.plants } : null,
			{ l: 'Best for', v: m.bestFor }
		].filter((x): x is { l: string; v: string } => x !== null)
	);
</script>

<svelte:head>
	<title>{m.name} | WILDGLASS</title>
	<meta name="description" content={`${m.name}: ${m.blurb} ${dims(m)}, ${formatLKR(m.price)}.`} />
</svelte:head>

<article class="wrap detail">
	<a class="back ulink" href="/collection">&larr; Collection</a>

	<div class="grid">
		<div class="visual" data-water={m.water} use:reveal>
			<FernMark size={92} decorative />
			{#if m.madeToOrder}<span class="tag">Made to order</span>{/if}
			<span class="code">{m.code}</span>
		</div>

		<div class="info">
			<span class="eyebrow" use:reveal>{m.type}</span>
			<h1 use:reveal={{ delay: 0.05 }}>{m.name}</h1>
			<p class="price tnum" use:reveal={{ delay: 0.08 }}>{formatLKR(m.price)}</p>
			<p class="blurb" use:reveal={{ delay: 0.1 }}>{m.blurb}</p>

			<dl class="specs" use:reveal={{ delay: 0.14 }}>
				{#each specs as s (s.l)}
					<div class="spec">
						<dt>{s.l}</dt>
						<dd>{s.v}</dd>
					</div>
				{/each}
			</dl>

			{#if m.moods}
				<div class="moods" use:reveal>
					<span class="moods-l">Choose a mood</span>
					<div class="chips">
						{#each m.moods as mood (mood)}
							<span class="chip">{mood}</span>
						{/each}
					</div>
				</div>
			{/if}

			<div class="cta" use:reveal>
				<a
					class="btn btn--primary"
					href={whatsapp(`Hi WILDGLASS, I'm interested in ${m.name} (${m.code}).`)}
					target="_blank"
					rel="noopener noreferrer">Ask about {m.name}</a
				>
			</div>
		</div>
	</div>

	<a class="next" href={`/collection/${data.next.slug}`}>
		<span class="next-l">Next piece</span>
		<span class="next-n">{data.next.name} &rarr;</span>
	</a>
</article>

<style>
	.detail {
		padding-block: clamp(1.5rem, 1rem + 2vw, 3rem) clamp(3rem, 2rem + 4vw, 5rem);
	}
	.back {
		display: inline-block;
		font-size: 0.9rem;
		color: var(--text-muted);
		margin-bottom: 2rem;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(1.5rem, 1rem + 3vw, 3.5rem);
		align-items: start;
	}
	.visual {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 5;
		color: var(--brand);
		background:
			radial-gradient(120% 80% at 50% 12%, var(--surface-2), transparent 70%), var(--bg-alt);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		position: sticky;
		top: 96px;
	}
	.visual[data-water='true'] {
		background:
			radial-gradient(
				120% 80% at 50% 12%,
				color-mix(in srgb, var(--glass) 26%, var(--bg-alt)),
				transparent 70%
			),
			var(--bg-alt);
	}
	.visual :global(svg) {
		opacity: 0.5;
	}
	.visual .code {
		position: absolute;
		top: 1rem;
		left: 1.1rem;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		color: var(--text-faint);
	}
	.tag {
		position: absolute;
		top: 1rem;
		right: 1.1rem;
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--on-brand);
		background: var(--brand);
		padding: 0.3em 0.7em;
		border-radius: var(--radius-pill);
	}
	.info {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.6rem;
	}
	.info h1 {
		font-size: clamp(2.4rem, 1.8rem + 3vw, 3.6rem);
	}
	.price {
		color: var(--accent);
		font-size: 1.5rem;
		font-weight: 600;
	}
	.blurb {
		color: var(--text-muted);
		font-size: 1.15rem;
		margin-top: 0.3rem;
		max-width: 44ch;
	}
	.specs {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1px;
		width: 100%;
		margin-top: 1.5rem;
		background: var(--line);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.spec {
		background: var(--surface);
		padding: 1rem 1.2rem;
	}
	.spec dt {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: 0.25rem;
	}
	.spec dd {
		color: var(--text);
		font-weight: 500;
	}
	.moods {
		margin-top: 1.5rem;
	}
	.moods-l {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-faint);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 0.6rem;
	}
	.chip {
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-pill);
		padding: 0.45em 1.1em;
		font-weight: 500;
	}
	.cta {
		margin-top: 2rem;
	}
	.next {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: clamp(3rem, 2rem + 4vw, 5rem);
		padding-top: 1.5rem;
		border-top: 1px solid var(--line);
		align-items: flex-end;
		text-align: right;
	}
	.next-l {
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-faint);
	}
	.next-n {
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 1.2rem + 2vw, 2.4rem);
		color: var(--text);
		transition: color var(--dur-fast) var(--ease);
	}
	.next:hover .next-n {
		color: var(--accent);
	}

	@media (max-width: 820px) {
		.grid {
			grid-template-columns: 1fr;
		}
		.visual {
			position: static;
			aspect-ratio: 3 / 2;
			max-width: 420px;
		}
	}
</style>
