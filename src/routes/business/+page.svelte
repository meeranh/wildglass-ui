<script lang="ts">
	import { reveal } from '#lib/actions/reveal';
	import { whatsapp, mailto, site } from '#lib/data/site';

	const offers = [
		{ t: 'Company gifts', d: 'Pocket Wild or Fernhouse, from 10 pieces.' },
		{ t: 'Branded tags', d: 'Your logo or event name on every tag.' },
		{ t: 'Reception pieces', d: 'Riverglass, Mossfall or a signature piece.' },
		{ t: 'Maintenance visits', d: 'We clean, trim and refresh your display on site.' },
		{ t: 'Sample visit', d: 'See a real piece at your place before you order.' },
		{ t: 'Custom quote', d: 'Price depends on number of pieces, design and delivery.' }
	];

	const audiences = [
		'Offices',
		'Cafes & restaurants',
		'Hotels',
		'Interior designers',
		'Gift shops'
	];
</script>

<svelte:head>
	<title>For business | WILDGLASS</title>
	<meta
		name="description"
		content="Living displays, company gifts and branded pieces for offices, cafes, hotels and interior designers. Maintenance and sample visits in Colombo."
	/>
</svelte:head>

<section class="head-sec">
	<div class="wrap">
		<span class="eyebrow" use:reveal>For business</span>
		<h1 use:reveal={{ delay: 0.05 }}>Living displays for your space.</h1>
		<p class="lead" use:reveal={{ delay: 0.1 }}>
			Company gifts people remember, and pieces that make a room feel fresh. Made and maintained by
			hand in {site.location}.
		</p>
		<div class="aud" use:reveal={{ delay: 0.14 }}>
			{#each audiences as a (a)}<span class="pill">{a}</span>{/each}
		</div>
	</div>
</section>

<section class="section-pad">
	<div class="wrap">
		<div class="offers">
			{#each offers as o, i (o.t)}
				<div class="offer" use:reveal={{ delay: (i % 2) * 0.08 }}>
					<h3>{o.t}</h3>
					<p>{o.d}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="cta-band">
	<div class="wrap book" use:reveal>
		<div>
			<h2>Book a sample visit.</h2>
			<p>Tell us about your space. We&rsquo;ll bring a piece to show you.</p>
		</div>
		<div class="book-cta">
			<a
				class="btn btn--invert"
				href={whatsapp("Hi WILDGLASS, I'd like to book a sample visit for my space.")}
				target="_blank"
				rel="noopener noreferrer">WhatsApp us</a
			>
			<a class="contact" href={mailto('Sample visit for WILDGLASS')}>{site.email}</a>
			<a class="contact" href={whatsapp()} target="_blank" rel="noopener noreferrer"
				>{site.phoneDisplay}</a
			>
		</div>
	</div>
</section>

<style>
	.head-sec {
		padding-block: clamp(2.5rem, 1.5rem + 4vw, 5rem) 0;
	}
	.head-sec h1 {
		margin-block: 0.6rem 1rem;
		max-width: 16ch;
	}
	.aud {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1.75rem;
	}
	.pill {
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-pill);
		padding: 0.45em 1.1em;
		font-size: 0.9rem;
		color: var(--text-muted);
	}
	.offers {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}
	.offer {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
	}
	.offer h3 {
		margin-bottom: 0.4rem;
	}
	.offer p {
		color: var(--text-muted);
	}
	.book {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 2rem;
	}
	.book p {
		margin-top: 0.5rem;
		font-size: 1.1rem;
	}
	.book-cta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.8rem;
	}
	.contact {
		color: var(--on-brand);
		font-variant-numeric: tabular-nums;
		text-decoration: underline;
		text-decoration-color: color-mix(in srgb, var(--on-brand) 40%, transparent);
		text-underline-offset: 0.25em;
		transition: text-decoration-color var(--dur-fast) var(--ease);
	}
	.contact:hover {
		text-decoration-color: var(--on-brand);
	}
	@media (max-width: 680px) {
		.offers {
			grid-template-columns: 1fr;
		}
	}
</style>
