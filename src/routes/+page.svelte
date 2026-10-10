<script lang="ts">
	import Terrarium from '#lib/components/Terrarium.svelte';
	import ModelCard from '#lib/components/ModelCard.svelte';
	import { reveal } from '#lib/actions/reveal';
	import { collection } from '#lib/data/collection';
	import { whatsapp } from '#lib/data/site';

	const allDims = collection.flatMap((m) => [m.dimensions.w, m.dimensions.h, m.dimensions.d]);
	const minDim = Math.min(...allDims);
	const maxDim = Math.max(...allDims);
	const preview = collection.slice(0, 3);

	const values = [
		{ t: 'Handmade', d: 'No two pieces are the same.', i: 'hand' },
		{ t: 'Plant-first', d: 'Real plants only. No animals.', i: 'leaf' },
		{ t: 'Easy care', d: 'Hardy plants that are simple to look after.', i: 'drop' },
		{ t: 'Gift-ready', d: 'Wrapped with a care card and a message card.', i: 'gift' },
		{ t: 'Table-sized', d: 'Fits on a desk, shelf or counter.', i: 'table' },
		{ t: 'Careful delivery', d: 'We carry each piece upright to your door.', i: 'truck' }
	];

	const icons: Record<string, string> = {
		hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1v-.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v3a5 5 0 0 1-5 5h-1.5a4 4 0 0 1-3-1.4L4 15',
		leaf: 'M5 19c0-8 5-13 14-13 0 9-5 14-14 13Zm2-2c3-5 6-7 9-8',
		drop: 'M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3Z',
		gift: 'M4 11h16v9H4v-9Zm-1-4h18v4H3V7Zm9 0v13M12 7S9 2 6.5 4 9 7 12 7Zm0 0s3-5 5.5-3S15 7 12 7Z',
		table: 'M4 10h16M6 10v9m12-9v9M4 10 7 5h10l3 5',
		truck:
			'M3 6h11v9H3V6Zm11 3h4l3 3v3h-7V9ZM7 18.5A1.5 1.5 0 1 1 7 15.5a1.5 1.5 0 0 1 0 3Zm11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z'
	};

	const steps = [
		{ n: 1, t: 'Tell us', d: 'Where it will go, the size you want and your budget.' },
		{ n: 2, t: 'Choose', d: 'We suggest the best model for your space.' },
		{
			n: 3,
			t: 'Pay',
			d: 'Ready-made: pay in full to reserve. Made to order: 50% deposit, balance before delivery.'
		},
		{ n: 4, t: 'Receive', d: 'We send you a photo first. Then we deliver it with a care card.' }
	];
</script>

<svelte:head>
	<title>WILDGLASS | Tiny Wild Worlds</title>
	<meta
		name="description"
		content="WILDGLASS makes handmade living landscapes in glass: terrariums, water gardens and paludariums for homes, offices and gifts. Handmade in Colombo, Sri Lanka."
	/>
</svelte:head>

<!-- HERO -->
<section class="hero">
	<div class="wrap hero-grid">
		<div class="hero-copy">
			<span class="eyebrow" use:reveal>Handmade living landscapes &middot; Colombo</span>
			<h1 use:reveal={{ delay: 0.05 }}>Bring a tiny wild world to your table.</h1>
			<p class="lead" use:reveal={{ delay: 0.12 }}>
				Living landscapes in glass, built by hand for homes, offices and gifts.
			</p>
			<div class="hero-cta" use:reveal={{ delay: 0.18 }}>
				<a class="btn btn--primary" href="/collection">Explore the collection</a>
				<a class="btn btn--ghost" href={whatsapp()} target="_blank" rel="noopener noreferrer"
					>Say hello</a
				>
			</div>
		</div>
		<div class="hero-art">
			<Terrarium />
		</div>
	</div>
</section>

<!-- STORY + STATS -->
<section class="section-pad">
	<div class="wrap story">
		<div class="story-head">
			<span class="eyebrow" use:reveal>About us</span>
			<h2 use:reveal={{ delay: 0.05 }}>Nature, held in glass.</h2>
		</div>
		<div class="story-body" use:reveal={{ delay: 0.1 }}>
			<p><strong>WILDGLASS is a small design studio in Colombo.</strong></p>
			<p>
				We build tiny living landscapes in glass. Each piece uses real plants, stone and wood, and
				every one is made by hand, one at a time.
			</p>
			<p class="quote">&ldquo;Quiet luxury. Wild detail. Small delight.&rdquo;</p>
		</div>
	</div>

	<div class="wrap stats" use:reveal>
		<div class="stat">
			<span class="stat-n tnum">{collection.length}</span>
			<span class="stat-l">models in the collection</span>
		</div>
		<div class="stat">
			<span class="stat-n tnum">{minDim} to {maxDim}&Prime;</span>
			<span class="stat-l">sizes that fit on a table</span>
		</div>
		<div class="stat">
			<span class="stat-n tnum">100%</span>
			<span class="stat-l">handmade in Colombo</span>
		</div>
	</div>
</section>

<!-- WHY -->
<section class="section-pad alt">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>Why WILDGLASS</span>
			<h2 use:reveal={{ delay: 0.05 }}>Small pieces. Real nature.</h2>
		</div>
		<div class="values">
			{#each values as v, i (v.t)}
				<div class="value" use:reveal={{ delay: (i % 3) * 0.08 }}>
					<svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
						<path
							d={icons[v.i]}
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<h3>{v.t}</h3>
					<p>{v.d}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- COLLECTION PREVIEW -->
<section class="section-pad">
	<div class="wrap">
		<div class="sec-head row-head">
			<div>
				<span class="eyebrow" use:reveal>The collection</span>
				<h2 use:reveal={{ delay: 0.05 }}>Tiny worlds, made to order.</h2>
			</div>
			<a class="ulink see-all" href="/collection">See all {collection.length} &rarr;</a>
		</div>
		<div class="grid">
			{#each preview as m, i (m.slug)}
				<ModelCard model={m} delay={i * 0.08} />
			{/each}
		</div>
	</div>
</section>

<!-- PROCESS -->
<section class="section-pad alt">
	<div class="wrap">
		<div class="sec-head">
			<span class="eyebrow" use:reveal>How to order</span>
			<h2 use:reveal={{ delay: 0.05 }}>Four easy steps.</h2>
		</div>
		<ol class="steps">
			{#each steps as s (s.n)}
				<li class="step" use:reveal>
					<span class="step-n tnum">{s.n}</span>
					<div>
						<h3>{s.t}</h3>
						<p>{s.d}</p>
					</div>
				</li>
			{/each}
		</ol>
	</div>
</section>

<!-- CTA -->
<section class="cta-band">
	<div class="wrap cta" use:reveal>
		<h2>See one in your space.</h2>
		<p>Tell us where it will live. We&rsquo;ll bring a piece to show you.</p>
		<div class="hero-cta">
			<a class="btn btn--invert" href={whatsapp()} target="_blank" rel="noopener noreferrer"
				>Message on WhatsApp</a
			>
			<a class="btn btn--ghost" href="/business">For businesses</a>
		</div>
	</div>
</section>

<style>
	/* HERO */
	.hero {
		padding-block: clamp(0.5rem, 2vw, 2rem) clamp(2.5rem, 2rem + 3vw, 4.5rem);
	}
	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.04fr);
		align-items: center;
		gap: clamp(1.5rem, 1rem + 3vw, 3.5rem);
	}
	.hero-copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.4rem;
	}
	.hero h1 {
		max-width: 12ch;
	}
	.hero-cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
	}
	.hero-art {
		min-width: 0;
	}

	/* STORY */
	.story {
		display: grid;
		grid-template-columns: 1fr 1.1fr;
		gap: clamp(1.5rem, 1rem + 3vw, 4rem);
		align-items: start;
	}
	.story-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-size: 1.1rem;
		color: var(--text-muted);
		max-width: 52ch;
	}
	.story-body strong {
		color: var(--text);
	}
	.quote {
		font-family: var(--font-display);
		font-size: clamp(1.4rem, 1.1rem + 1.5vw, 2rem);
		color: var(--brand);
		line-height: 1.2;
		margin-top: 0.75rem;
	}
	:global(:root[data-theme='dark']) .quote {
		color: var(--brand);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-top: clamp(2.5rem, 1.5rem + 4vw, 4.5rem);
		border-top: 1px solid var(--line);
		padding-top: clamp(1.5rem, 1rem + 2vw, 2.5rem);
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.stat-n {
		font-family: var(--font-display);
		font-size: clamp(2.2rem, 1.6rem + 2.5vw, 3.4rem);
		line-height: 1;
		color: var(--text);
	}
	.stat-l {
		font-size: 0.92rem;
		color: var(--text-muted);
	}

	/* shared section heads */
	.sec-head {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		margin-bottom: clamp(2rem, 1.2rem + 3vw, 3.5rem);
	}
	.row-head {
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.see-all {
		color: var(--accent);
		font-weight: 600;
		white-space: nowrap;
	}

	/* WHY */
	.values {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
	}
	.value {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		padding: 1.6rem;
		color: var(--brand);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.value h3 {
		margin-top: 0.4rem;
	}
	.value p {
		color: var(--text-muted);
	}

	/* COLLECTION */
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
	}

	/* PROCESS */
	.steps {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.75rem 2.5rem;
	}
	.step {
		display: flex;
		gap: 1.1rem;
		align-items: flex-start;
		padding-top: 1.25rem;
		border-top: 1px solid var(--line-strong);
	}
	.step-n {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--accent);
		line-height: 1;
	}
	.step h3 {
		font-size: 1.3rem;
		margin-bottom: 0.3rem;
	}
	.step p {
		color: var(--text-muted);
	}

	/* CTA */
	.cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1rem;
	}
	.cta h2 {
		font-size: clamp(2.2rem, 1.6rem + 3vw, 3.6rem);
	}
	.cta p {
		font-size: 1.15rem;
		max-width: 40ch;
	}
	.cta .hero-cta {
		justify-content: center;
		margin-top: 0.75rem;
	}

	/* RESPONSIVE */
	@media (max-width: 900px) {
		.hero-grid,
		.story {
			grid-template-columns: 1fr;
		}
		.hero-art {
			order: -1;
			width: min(100%, 420px);
			margin-inline: auto;
		}
		.values {
			grid-template-columns: repeat(2, 1fr);
		}
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 620px) {
		.stats {
			grid-template-columns: 1fr;
			gap: 1.1rem;
		}
		.values,
		.grid,
		.steps {
			grid-template-columns: 1fr;
		}
	}
</style>
