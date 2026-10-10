<script lang="ts">
	import FernMark from './FernMark.svelte';
	import { site, whatsapp, mailto } from '#lib/data/site';
	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="wrap">
		<div class="top">
			<FernMark size={44} decorative />
			<h2 class="closing">Choose your world.<br />We&rsquo;ll grow it for you.</h2>
			<p class="handmade">Handmade in {site.location}.</p>
		</div>

		<div class="cols">
			<div class="col">
				<span class="label">Call or WhatsApp</span>
				<a href={whatsapp()} target="_blank" rel="noopener noreferrer">{site.phoneDisplay}</a>
			</div>
			<div class="col">
				<span class="label">Email</span>
				<a href={mailto()}>{site.email}</a>
			</div>
			<div class="col">
				<span class="label">Instagram</span>
				<a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">{site.instagram}</a>
			</div>
			<nav class="col links" aria-label="Footer">
				<span class="label">Explore</span>
				<a href="/collection">Collection</a>
				<a href="/business">Business</a>
				<a href="/about">About</a>
			</nav>
		</div>

		<div class="base">
			<span>&copy; {year} {site.name}. {site.tagline}.</span>
			<span class="note"
				>Our illustrated worlds may glow with fireflies at night. Real pieces are plant-first, with
				no animals.</span
			>
		</div>
	</div>
</footer>

<style>
	.footer {
		background: var(--brand-deep);
		color: var(--on-brand);
		padding-block: clamp(3.5rem, 2rem + 6vw, 6rem) 2.5rem;
	}
	.footer :global(svg) {
		color: var(--on-brand);
		opacity: 0.85;
	}
	.top {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1.25rem;
		padding-bottom: clamp(2.5rem, 1.5rem + 4vw, 4rem);
		border-bottom: 1px solid color-mix(in srgb, var(--on-brand) 16%, transparent);
	}
	.closing {
		color: var(--on-brand);
		font-size: clamp(2rem, 1.4rem + 3vw, 3.4rem);
		font-weight: 400;
		line-height: 1.05;
	}
	.handmade {
		color: color-mix(in srgb, var(--on-brand) 72%, transparent);
		font-size: 1.05rem;
	}
	.cols {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2rem;
		padding-block: clamp(2.5rem, 1.5rem + 3vw, 3.5rem);
	}
	.col {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}
	.label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--on-brand) 60%, transparent);
	}
	.col a {
		color: var(--on-brand);
		width: fit-content;
		transition: color var(--dur-fast) var(--ease);
	}
	.col a:hover {
		color: var(--accent);
	}
	.links {
		gap: 0.6rem;
	}
	.base {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
		padding-top: 2rem;
		border-top: 1px solid color-mix(in srgb, var(--on-brand) 16%, transparent);
		font-size: 0.82rem;
		color: color-mix(in srgb, var(--on-brand) 60%, transparent);
	}
	.note {
		max-width: 42ch;
	}

	@media (max-width: 680px) {
		.cols {
			grid-template-columns: repeat(2, 1fr);
			gap: 1.75rem;
		}
	}
</style>
