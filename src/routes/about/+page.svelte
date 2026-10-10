<script lang="ts">
	import FernMark from '#lib/components/FernMark.svelte';
	import { reveal } from '#lib/actions/reveal';
	import { site, whatsapp } from '#lib/data/site';

	const promises = [
		{ t: 'Care card', d: 'Simple steps for your model, in every box.' },
		{ t: 'Check-ins', d: 'We message you on day 3 and day 14.' },
		{ t: 'Maintenance visits', d: 'We can visit to clean, trim and refresh.' },
		{ t: 'Honest care', d: 'Our pieces need little care, but not zero care.' }
	];

	const packaging = [
		{ t: 'Included', d: 'Tissue wrap, logo seal, care card and message card.' },
		{ t: 'Protected', d: 'Foam and corner support. Always carried upright.' },
		{ t: 'For companies', d: 'Your logo on the kraft tag, from 10 pieces.' }
	];
</script>

<svelte:head>
	<title>About | WILDGLASS</title>
	<meta
		name="description"
		content="WILDGLASS is a small design studio in Colombo building tiny living landscapes in glass by hand, one at a time."
	/>
</svelte:head>

<section class="head-sec">
	<div class="wrap intro">
		<div>
			<span class="eyebrow" use:reveal>Our studio</span>
			<h1 use:reveal={{ delay: 0.05 }}>Nature, held in glass.</h1>
		</div>
		<div class="intro-body" use:reveal={{ delay: 0.1 }}>
			<p>
				<strong>WILDGLASS is a small design studio in {site.location}.</strong> We build tiny living landscapes
				in glass.
			</p>
			<p>Each piece uses real plants, stone and wood. Every one is made by hand, one at a time.</p>
			<p class="quote">&ldquo;Quiet luxury. Wild detail. Small delight.&rdquo;</p>
			<p class="by">{site.founder}, founder</p>
		</div>
	</div>
</section>

<section class="section-pad alt">
	<div class="wrap">
		<span class="eyebrow" use:reveal>Gift-ready by design</span>
		<h2 use:reveal={{ delay: 0.05 }}>Beautiful outside. Safe inside.</h2>
		<div class="cards">
			{#each packaging as p, i (p.t)}
				<div class="card" use:reveal={{ delay: i * 0.08 }}>
					<h3>{p.t}</h3>
					<p>{p.d}</p>
				</div>
			{/each}
		</div>
		<p class="note" use:reveal>
			Larger pieces (10 to 12 inches) travel in a strong, reusable crate.
		</p>
	</div>
</section>

<section class="section-pad">
	<div class="wrap">
		<span class="eyebrow" use:reveal>Our promise</span>
		<h2 use:reveal={{ delay: 0.05 }}>We stay with you after delivery.</h2>
		<div class="cards four">
			{#each promises as p, i (p.t)}
				<div class="card" use:reveal={{ delay: (i % 2) * 0.08 }}>
					<h3>{p.t}</h3>
					<p>{p.d}</p>
				</div>
			{/each}
		</div>
		<div class="charm" use:reveal>
			<FernMark size={40} decorative />
			<p>
				<strong>Every world is a little different.</strong> Stone, wood and leaves are natural, so your
				piece will not look exactly like the photo. That is part of its charm.
			</p>
		</div>
	</div>
</section>

<section class="cta-band">
	<div class="wrap cta" use:reveal>
		<h2>Tell us about your space.</h2>
		<p>We&rsquo;ll suggest the best piece for it, and bring one to show you.</p>
		<a class="btn btn--invert" href={whatsapp()} target="_blank" rel="noopener noreferrer"
			>Say hello</a
		>
	</div>
</section>

<style>
	.head-sec {
		padding-block: clamp(2.5rem, 1.5rem + 4vw, 5rem) clamp(3rem, 2rem + 4vw, 5rem);
	}
	.intro {
		display: grid;
		grid-template-columns: 1fr 1.1fr;
		gap: clamp(1.5rem, 1rem + 3vw, 4rem);
		align-items: start;
	}
	.intro h1 {
		max-width: 10ch;
	}
	.intro-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-size: 1.1rem;
		color: var(--text-muted);
		max-width: 52ch;
	}
	.intro-body strong {
		color: var(--text);
	}
	.quote {
		font-family: var(--font-display);
		font-size: clamp(1.4rem, 1.1rem + 1.5vw, 2rem);
		color: var(--brand);
		line-height: 1.2;
		margin-top: 0.75rem;
	}
	.by {
		font-size: 0.95rem;
		color: var(--text-faint);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
		margin-top: clamp(1.5rem, 1rem + 2vw, 2.5rem);
	}
	.cards.four {
		grid-template-columns: repeat(4, 1fr);
	}
	.card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		padding: 1.6rem;
	}
	.card h3 {
		margin-bottom: 0.4rem;
	}
	.card p {
		color: var(--text-muted);
	}
	.note {
		margin-top: 1.5rem;
		color: var(--text-muted);
		font-style: italic;
	}
	.charm {
		display: flex;
		gap: 1.25rem;
		align-items: center;
		margin-top: 2.5rem;
		padding: 1.75rem;
		background: var(--bg-alt);
		border-radius: var(--radius-lg);
		color: var(--brand);
	}
	.charm p {
		color: var(--text-muted);
		font-size: 1.05rem;
	}
	.charm strong {
		color: var(--text);
	}
	.cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1rem;
	}
	.cta h2 {
		max-width: 18ch;
	}
	.cta p {
		font-size: 1.1rem;
		max-width: 40ch;
		margin-bottom: 0.75rem;
	}
	@media (max-width: 900px) {
		.intro {
			grid-template-columns: 1fr;
		}
		.cards,
		.cards.four {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 560px) {
		.cards,
		.cards.four {
			grid-template-columns: 1fr;
		}
		.charm {
			flex-direction: column;
			text-align: center;
		}
	}
</style>
