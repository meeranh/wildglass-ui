<script lang="ts">
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import FernMark from './FernMark.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { whatsapp } from '#lib/data/site';

	let scrolled = $state(false);
	let menuOpen = $state(false);

	const links = [
		{ href: '/collection', label: 'Collection' },
		{ href: '/business', label: 'Business' },
		{ href: '/about', label: 'About' }
	];

	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(href + '/');

	// close the mobile menu whenever the route changes
	$effect(() => {
		page.url.pathname;
		menuOpen = false;
	});
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 16)} />

<header class="nav" class:scrolled class:open={menuOpen}>
	<div class="nav-inner wrap">
		<a class="brand" href="/" aria-label="WILDGLASS home">
			<FernMark size={28} frame={false} decorative />
			<span class="wordmark">WILDGLASS</span>
		</a>

		<nav class="links" aria-label="Primary">
			{#each links as l (l.href)}
				<a href={l.href} class="ulink" class:active={isActive(l.href)}>{l.label}</a>
			{/each}
		</nav>

		<div class="actions">
			<ThemeToggle />
			<a class="btn btn--primary hello" href={whatsapp()} target="_blank" rel="noopener noreferrer"
				>Say hello</a
			>
			<button
				class="burger"
				aria-label="Menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span></span><span></span>
			</button>
		</div>
	</div>

	{#if menuOpen}
		<div class="sheet" transition:slide={{ duration: 300 }}>
			<nav class="sheet-links wrap" aria-label="Mobile">
				{#each links as l (l.href)}
					<a href={l.href} class:active={isActive(l.href)}>{l.label}</a>
				{/each}
				<a class="btn btn--primary" href={whatsapp()} target="_blank" rel="noopener noreferrer"
					>Say hello</a
				>
			</nav>
		</div>
	{/if}
</header>

<style>
	.nav {
		position: sticky;
		top: env(safe-area-inset-top, 0px);
		z-index: 50;
		transition:
			background-color var(--dur) var(--ease),
			border-color var(--dur) var(--ease),
			box-shadow var(--dur) var(--ease);
		border-bottom: 1px solid transparent;
	}
	.nav.scrolled,
	.nav.open {
		background: color-mix(in srgb, var(--bg) 82%, transparent);
		backdrop-filter: blur(14px) saturate(1.2);
		-webkit-backdrop-filter: blur(14px) saturate(1.2);
		border-bottom-color: var(--line);
	}
	.nav-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		height: 72px;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--brand);
	}
	:global(:root[data-theme='dark']) .brand {
		color: var(--brand);
	}
	.wordmark {
		font-family: var(--font-display);
		font-weight: 500;
		font-size: 1.28rem;
		letter-spacing: 0.22em;
		color: var(--text);
		padding-left: 0.1em;
	}
	.links {
		display: flex;
		gap: 2rem;
		margin-inline: auto;
	}
	.links .active {
		color: var(--accent);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.burger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		width: 42px;
		height: 42px;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-pill);
		background: transparent;
		cursor: pointer;
	}
	.burger span {
		display: block;
		width: 16px;
		height: 1.6px;
		margin-inline: auto;
		background: var(--text);
		transition: transform var(--dur-fast) var(--ease);
	}
	.sheet {
		overflow: hidden;
		border-bottom: 1px solid var(--line);
	}
	.sheet-links {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-block: 1rem 1.5rem;
	}
	.sheet-links a:not(.btn) {
		font-family: var(--font-display);
		font-size: 1.5rem;
		padding: 0.5rem 0;
		color: var(--text);
	}
	.sheet-links a.active {
		color: var(--accent);
	}
	.sheet-links .btn {
		margin-top: 0.75rem;
		align-self: flex-start;
	}

	@media (max-width: 760px) {
		.links,
		.hello {
			display: none;
		}
		.burger {
			display: flex;
		}
	}
</style>
