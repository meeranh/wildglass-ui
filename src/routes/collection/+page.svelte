<script lang="ts">
	import SizeDiagram from '#lib/components/SizeDiagram.svelte';
	import ModelCard from '#lib/components/ModelCard.svelte';
	import { reveal } from '#lib/actions/reveal';
	import { collection } from '#lib/data/collection';
	import { whatsapp } from '#lib/data/site';

	const types = [
		{ t: 'Terrarium', d: 'Plants growing in glass. No water to look after.' },
		{ t: 'Water garden', d: 'A small garden under water, also called an aquascape.' },
		{ t: 'Water and land', d: 'Plants above and below the water, also called a paludarium.' }
	];
</script>

<svelte:head>
	<title>Collection | WILDGLASS</title>
	<meta
		name="description"
		content="The WILDGLASS collection: terrariums, water gardens and paludariums, drawn to scale. Handmade in Colombo."
	/>
</svelte:head>

<section class="head-sec">
	<div class="wrap">
		<span class="eyebrow" use:reveal>The collection</span>
		<h1 use:reveal={{ delay: 0.05 }}>Tiny worlds, to scale.</h1>
		<p class="lead" use:reveal={{ delay: 0.1 }}>
			{collection.length} living landscapes in glass, from palm-sized terrariums to signature pieces made
			to order.
		</p>
	</div>
</section>

<section>
	<div class="wrap">
		<div class="diagram-card" use:reveal>
			<SizeDiagram />
		</div>
	</div>
</section>

<section class="section-pad">
	<div class="wrap">
		<div class="grid">
			{#each collection as m, i (m.slug)}
				<ModelCard model={m} delay={(i % 3) * 0.08} />
			{/each}
		</div>
	</div>
</section>

<section class="section-pad alt">
	<div class="wrap">
		<span class="eyebrow" use:reveal>In plain words</span>
		<h2 use:reveal={{ delay: 0.05 }}>Three kinds of world.</h2>
		<div class="types">
			{#each types as ty, i (ty.t)}
				<div class="type-card" use:reveal={{ delay: i * 0.08 }}>
					<h3>{ty.t}</h3>
					<p>{ty.d}</p>
				</div>
			{/each}
		</div>
		<div class="cta-row" use:reveal>
			<a class="btn btn--primary" href={whatsapp()} target="_blank" rel="noopener noreferrer"
				>Ask about a piece</a
			>
		</div>
	</div>
</section>

<style>
	.head-sec {
		padding-block: clamp(2.5rem, 1.5rem + 4vw, 5rem) clamp(1.5rem, 1rem + 2vw, 2.5rem);
	}
	.head-sec h1 {
		margin-block: 0.6rem 1rem;
		max-width: 16ch;
	}
	.diagram-card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		padding: clamp(1.25rem, 1rem + 2vw, 2.5rem);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}
	.types {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
		margin-top: clamp(1.5rem, 1rem + 2vw, 2.5rem);
	}
	.type-card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 1.5rem;
	}
	.type-card p {
		color: var(--text-muted);
		margin-top: 0.4rem;
	}
	.cta-row {
		margin-top: 2.5rem;
	}
	@media (max-width: 900px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.types {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 620px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
