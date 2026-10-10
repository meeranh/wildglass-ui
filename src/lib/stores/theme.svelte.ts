import { browser } from '$app/env';

export type Theme = 'light' | 'dark';
const KEY = 'wg-theme';
const THEME_COLOR: Record<Theme, string> = { light: '#f7f4ee', dark: '#0c1e15' };

/* Light is always the default. Dark is only ever an explicit choice made
 * with the toggle, which we remember for the next visit. */
function createTheme() {
	let resolved = $state<Theme>('light');

	function apply(next: Theme, persist = true) {
		resolved = next;
		if (!browser) return;
		document.documentElement.dataset.theme = next;
		document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[next]);
		if (persist) {
			try {
				localStorage.setItem(KEY, next);
			} catch {
				/* storage may be blocked */
			}
		}
	}

	/** Pick up a saved choice (already applied to <html> by the inline
	 * no-flash script in app.html). No saved choice means light. */
	function init() {
		if (!browser) return;
		let saved: string | null = null;
		try {
			saved = localStorage.getItem(KEY);
		} catch {
			/* ignore */
		}
		apply(saved === 'dark' ? 'dark' : 'light', false);
	}

	function toggle() {
		apply(resolved === 'dark' ? 'light' : 'dark');
	}

	return {
		get resolved() {
			return resolved;
		},
		init,
		toggle,
		apply
	};
}

export const theme = createTheme();
