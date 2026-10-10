<script lang="ts">
	import '#lib/styles/app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import Nav from '#lib/components/Nav.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import { theme } from '#lib/stores/theme.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// animated cross-fade between pages
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(() => {
		theme.init();

		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce) return;

		let lenis: { raf: (t: number) => void; destroy: () => void } | undefined;
		let raf = 0;
		import('lenis').then(({ default: Lenis }) => {
			lenis = new Lenis({ duration: 1.1, smoothWheel: true });
			const loop = (t: number) => {
				lenis?.raf(t);
				raf = requestAnimationFrame(loop);
			};
			raf = requestAnimationFrame(loop);
		});

		return () => {
			cancelAnimationFrame(raf);
			lenis?.destroy();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Nav />
<main>
	{@render children()}
</main>
<Footer />

<style>
	main {
		min-height: 60vh;
	}
</style>
