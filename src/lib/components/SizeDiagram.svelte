<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import 'd3-transition';
	import { collection } from '#lib/data/collection';

	let root = $state<SVGSVGElement | null>(null);

	onMount(() => {
		if (!root) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const data = collection;
		const n = data.length;

		const drawH = 200;
		const gap = 46;
		const padX = 26;
		const topPad = 18;
		const labelH = 56;
		const maxInH = d3.max(data, (m) => m.dimensions.h) ?? 12;
		const ppi = drawH / maxInH;

		const widths = data.map((m) => Math.max(m.dimensions.w * ppi, 26));
		const totalW = d3.sum(widths) + gap * (n - 1) + padX * 2;
		const baseline = topPad + drawH;
		const height = baseline + labelH;

		const svg = d3.select(root).attr('viewBox', `0 0 ${totalW} ${height}`);
		svg.selectAll('*').remove();

		svg
			.append('line')
			.attr('class', 'ground')
			.attr('x1', padX * 0.4)
			.attr('y1', baseline)
			.attr('x2', totalW - padX * 0.4)
			.attr('y2', baseline);

		const vessels: d3.Selection<SVGGElement, unknown, null, undefined>[] = [];
		let x = padX;
		data.forEach((m, i) => {
			const w = widths[i];
			const h = m.dimensions.h * ppi;
			const cx = x + w / 2;

			const g = svg
				.append('g')
				.attr('class', 'vessel')
				.style('transform-box', 'view-box')
				.style('transform-origin', `${cx}px ${baseline}px`);

			g.append('rect')
				.attr('class', 'glass')
				.attr('x', x)
				.attr('y', baseline - h)
				.attr('width', w)
				.attr('height', h)
				.attr('rx', 7);
			g.append('line')
				.attr('class', 'rim')
				.attr('x1', x + 2)
				.attr('y1', baseline - h + 7)
				.attr('x2', x + w - 2)
				.attr('y2', baseline - h + 7);
			if (m.water) {
				g.append('line')
					.attr('class', 'waterline')
					.attr('x1', x + 3)
					.attr('y1', baseline - h * 0.46)
					.attr('x2', x + w - 3)
					.attr('y2', baseline - h * 0.46);
			}

			const name = svg
				.append('text')
				.attr('class', 'lbl-name')
				.attr('x', cx)
				.attr('y', baseline + 24)
				.attr('text-anchor', 'middle')
				.text(m.name);
			const dim = svg
				.append('text')
				.attr('class', 'lbl-dim')
				.attr('x', cx)
				.attr('y', baseline + 42)
				.attr('text-anchor', 'middle')
				.text(`${m.dimensions.w} × ${m.dimensions.d} × ${m.dimensions.h} in`);

			if (reduce) {
				g.style('transform', 'none');
			} else {
				g.style('transform', 'scaleY(0)');
				name.style('opacity', 0);
				dim.style('opacity', 0);
			}
			vessels.push(g as unknown as d3.Selection<SVGGElement, unknown, null, undefined>);
			x += w + gap;
		});

		if (reduce) return;

		let played = false;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting || played) continue;
					played = true;
					svg
						.selectAll<SVGGElement, unknown>('.vessel')
						.transition()
						.delay((_, i) => i * 120)
						.duration(780)
						.ease(d3.easeCubicOut)
						.style('transform', 'scaleY(1)');
					svg
						.selectAll<SVGTextElement, unknown>('text.lbl-name, text.lbl-dim')
						.transition()
						.delay((_, i) => 300 + Math.floor(i / 2) * 120)
						.duration(500)
						.style('opacity', null);
					io.disconnect();
				}
			},
			{ threshold: 0.3 }
		);
		io.observe(root);
		return () => io.disconnect();
	});
</script>

<div class="diagram-wrap">
	<svg
		bind:this={root}
		class="diagram"
		role="img"
		aria-label="The collection drawn to scale by size"
	></svg>
</div>

<style>
	.diagram-wrap {
		width: 100%;
		overflow-x: auto;
		overflow-y: hidden;
	}
	.diagram {
		width: 100%;
		min-width: 560px;
		height: auto;
		overflow: visible;
	}
	:global(.diagram .ground) {
		stroke: var(--line-strong);
		stroke-width: 1.5;
	}
	:global(.diagram .glass) {
		fill: color-mix(in srgb, var(--glass) 12%, transparent);
		stroke: var(--glass);
		stroke-width: 1.8;
		transition:
			stroke var(--dur) var(--ease),
			fill var(--dur) var(--ease);
	}
	:global(.diagram .rim),
	:global(.diagram .waterline) {
		stroke: var(--glass-soft);
		stroke-width: 1.3;
		stroke-linecap: round;
	}
	:global(.diagram .waterline) {
		stroke: var(--glass);
	}
	:global(.diagram .vessel:hover .glass) {
		stroke: var(--accent);
		fill: color-mix(in srgb, var(--accent) 10%, transparent);
	}
	:global(.diagram .lbl-name) {
		fill: var(--text);
		font-family: var(--font-display);
		font-size: 15px;
	}
	:global(.diagram .lbl-dim) {
		fill: var(--text-faint);
		font-family: var(--font-body);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}
</style>
