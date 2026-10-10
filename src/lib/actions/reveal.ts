import type { Action } from 'svelte/action';

type RevealOpts = {
	/** stagger delay in seconds */
	delay?: number;
	/** visible fraction (0 to 1) before triggering */
	threshold?: number;
	/** re-hide when scrolled away and replay */
	once?: boolean;
};

/** Reveal-on-scroll. Elements are visible by default (see app.css); this
 * action only adds the hidden starting state when motion is allowed, so
 * no-JS and reduced-motion users always see content. */
export const reveal: Action<HTMLElement, RevealOpts | undefined> = (node, opts = {}) => {
	const { delay = 0, threshold = 0.18, once = true } = opts;
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (reduce || !('IntersectionObserver' in window)) {
		node.classList.add('is-visible');
		return;
	}

	node.setAttribute('data-reveal', '');
	if (delay) node.style.setProperty('--reveal-delay', `${delay}s`);

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('is-visible');
					if (once) io.unobserve(node);
				} else if (!once) {
					node.classList.remove('is-visible');
				}
			}
		},
		{ threshold }
	);

	io.observe(node);

	return {
		destroy() {
			io.disconnect();
		}
	};
};
