<script lang="ts">
	import { theme } from '#lib/stores/theme.svelte';
	const isDark = $derived(theme.resolved === 'dark');
</script>

<button
	class="toggle"
	class:dark={isDark}
	onclick={() => theme.toggle()}
	aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
	title="Toggle theme"
>
	<svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
		<!-- sun -->
		<g class="sun" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
			<circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
			{#each Array(8) as _, i (i)}
				<line x1="12" y1="2.2" x2="12" y2="4.6" transform={`rotate(${i * 45} 12 12)`} />
			{/each}
		</g>
		<!-- moon -->
		<path
			class="moon"
			d="M20 14.5A8 8 0 0 1 9.5 4a0.5 0.5 0 0 0-.7-.6A9 9 0 1 0 20.6 15.2a0.5 0.5 0 0 0-.6-.7Z"
			fill="currentColor"
		/>
	</svg>
</button>

<style>
	.toggle {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border-radius: var(--radius-pill);
		border: 1px solid var(--line-strong);
		background: transparent;
		color: var(--text);
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			background-color var(--dur-fast) var(--ease);
	}
	.toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	svg {
		overflow: visible;
	}
	/* sun and moon share the same viewBox coordinates, so they overlap */
	.sun,
	.moon {
		transform-box: view-box;
		transform-origin: 12px 12px;
		transition:
			opacity 0.5s var(--ease),
			transform 0.6s var(--ease);
	}
	.moon {
		opacity: 0;
		transform: rotate(-55deg) scale(0.5);
	}
	.toggle.dark .sun {
		opacity: 0;
		transform: rotate(55deg) scale(0.5);
	}
	.toggle.dark .moon {
		opacity: 1;
		transform: none;
	}
</style>
