# WILDGLASS (wildglasslk.com)

Marketing website for **WILDGLASS** ("Tiny Wild Worlds"), a handmade design studio in
Colombo, Sri Lanka that makes living landscapes in glass: terrariums, water gardens
(aquascapes) and paludariums. Positioning is quiet, premium and gift-focused.

Source of truth for brand and content: `brand-source/WILDGLASS_Company_Profile.pdf`.
Photography: `brand-source/Photos.zip` (104 images). The WhatsApp zip is an alternate
profile deck ("WILD GLASS, backed by AQUAGLASS"); WILDGLASS is a rebrand or sub-brand of
the aquarium studio AQUAGLASS. Do **not** ship `brand-source/` raw assets. Curate chosen
photos into `src/lib/assets/` (optimized via enhanced-img). Photos are not wired in yet:
model cards and detail pages still show a placeholder mark.

## Tech stack

- **SvelteKit 3 + Svelte 5 runes** (`$state`, `$derived`, `$effect`, `$props`), TypeScript.
- **`@sveltejs/adapter-cloudflare`**, configured in `vite.config.ts` (there is no
  `svelte.config.js`). Deploy target is **Cloudflare Pages**. Every route is prerendered.
- **`@sveltejs/enhanced-img`** for responsive AVIF/WebP images at build time.
- **D3 v7** for the hero terrarium (canvas) and the collection size diagram (SVG).
- **Lenis** for smooth scroll, View Transitions between routes, Svelte transitions for UI.
- Fonts self-hosted via **Fontsource**: `Fraunces` (display serif) and `Inter` (body, UI).
- Package manager and runtime: **bun**. Use `bun` and `bunx` for everything, not npm or pnpm.

## Commands

- `bun run dev`: local dev server
- `bun run build`: production build (Cloudflare adapter), output in `.svelte-kit/cloudflare`
- `bun run preview`: preview the build with wrangler
- `bun run check`: wrangler types, then svelte-check
- `bunx svelte-check --tsconfig ./tsconfig.json`: type-check only (fast)
- `bun run format`: prettier

Cloudflare Pages settings: build command `bun run build`, output directory
`.svelte-kit/cloudflare`. Commit `bun.lock` so Pages uses bun.

## SvelteKit 3 gotchas (these differ from older SvelteKit)

- Import app code with **`#lib/...`**, not `$lib`. The alias comes from `imports` in
  `package.json`, and `tsconfig.json` repeats it under `paths` so TypeScript resolves it.
- `browser`, `dev`, `building` come from **`$app/env`**, not `$app/environment`.
- Page state is `$app/state` (`page.url`), not `$app/stores`.
- The generated tsconfig lives at `node_modules/$app/tsconfig.json`. If types look stale,
  run `bunx svelte-kit sync`.

## Copy rules

- **No em dashes anywhere** (the owner's rule), and no en dashes either. Rewrite the
  sentence, or use a comma, full stop or colon. Page titles use a pipe: `Collection | WILDGLASS`.
- Ranges are written out: `2 to 3 days`, `4 to 12″`.
- Keep copy plain and specific. Use the profile's own wording where it fits.
- Prices: `LKR 5,900` (tabular numerals). Sizes in inches as width × depth × height,
  the order the profile uses: `4 × 4 × 5 in`.
- Before finishing any copy change, check for stray dashes:
  `grep -rnP '\x{2014}|\x{2013}|&mdash;|&ndash;' src`

## Theme

- **Light is the default on every load.** The site never follows the OS setting.
- Dark is only ever an explicit choice made with the toggle. It is remembered in
  `localStorage` (`wg-theme`) and re-applied before first paint by the inline script in
  `src/app.html`. Logic lives in `src/lib/stores/theme.svelte.ts`.
- Tokens are in `src/lib/styles/tokens.css`: light values on `:root`, dark values on
  `:root[data-theme='dark']`. There is deliberately no `prefers-color-scheme` block.
- Never hardcode a colour in a component. Use the semantic tokens (`--bg`, `--surface`,
  `--text`, `--brand`, `--accent`, `--accent-strong`, `--glass`, `--line`, and so on).
- Light is "daylight studio": ivory, fern green, copper. Dark is "terrarium at night":
  brand-tinted green-black, never pure black, with the copper warmed to clay.

## Typography

- Display and headings: **Fraunces** (variable). Body and UI: **Inter**.
- Eyebrows: Inter, uppercase, wide letter-spacing, copper (`.eyebrow`).
- Headings use `text-wrap: balance`. Body measure is about 62ch.

## The hero: a living terrarium (`src/lib/terrarium/`)

The home page hero is a procedurally grown terrarium drawn on a canvas, mounted by
`src/lib/components/Terrarium.svelte`. It is the showpiece of the site. Treat it with care.

What the visitor sees:

1. The wooden base fades in, then the glass draws itself from the foot upward with a spark
   at the tip of each line. The lamp lid drops on and a glint crosses the glass.
2. Soil rises, stones settle, moss spreads.
3. Plants grow in. Ferns start as fiddleheads (tight spirals) and unroll from base to tip,
   opening their leaflets as the unrolled front passes.
4. Light arrives. From then on the world idles: wind travels through the plants, pollen
   drifts in the light shaft, a bead of condensation runs down the glass now and then,
   two late fronds keep unrolling slowly, and the layers shift with the pointer.

Rules the owner has set for it:

- It must feel **alive but calm**: slow, small movements. Never busy.
- Ferns **and stones**. No frog, no fish, no cartoon creatures. The only "visitors" are
  fireflies at night, which read as points of light. (The footer carries a one-line note
  that real pieces are plant-first with no animals.)
- It must look right in both themes and re-light itself when the theme is toggled.

How it is built:

- `util.ts`: maths, colour mixing, seeded RNG (`makeRng`), value noise.
- `palette.ts`: reads the `--t-*` scene tokens from `tokens.css` into a `Palette`. All scene
  colours live in those tokens, one set per theme, so nothing is hardcoded in drawing code.
- `vessel.ts`: the glass teardrop, lamp lid and wooden base. Scene space is 600 × 720 units.
- `ground.ts`: three receding mossy hills, soil strata seen through the front glass, gravel,
  moss cushions.
- `rocks.ts`: stones. A seeded silhouette is triangulated into facets (d3-delaunay), each
  facet lit by a fake normal, then hatched on the shadow side like an engraving.
- `ferns.ts`: fronds found by integrating a heading along the stem. The straightened part
  follows the final arch, the rest is a shrinking spiral. The same integration runs every
  frame with a wind term, so fronds bend like cantilevers.
- `plants.ts`: grass tufts, creepers, broad-leaved rosettes, copper-capped mushrooms.
- `atmosphere.ts`: daylight shaft, lamp light, pollen, fireflies, condensation.
- `world.ts`: `compose(seed, quality)` builds a `World`. A seed picks one of three kinds
  (`fern`, `stone`, `grove`), may mirror it, and fixes every measurement. Same seed, same
  world. Positions are written for a right-hand stone and mirrored by `fx`.
- `engine.ts`: the `Terrarium` class. Runs the timeline, parallax, theme tween and loop
  (`d3.timer`).

Things worth knowing before changing it:

- **Layers and depth.** Four layers of land (far, stones, middle, near) plus pale ferns at
  the very back. Each layer has a depth `z` (0 back, 1 front). Colours are mixed toward the
  air inside the glass by depth (`hazed`), and the pointer shifts far layers more.
- **Baking.** Once the land has finished growing (about 4.9s in), hills, moss and stones are
  drawn once into four offscreen canvases and reused. Only living things redraw each frame.
  Anything that moves must go in `life()`, not `land()`, or it will freeze when baked.
- **Theme change.** The component reads the new palette and calls `setTheme`. Colours tween
  for about 1.1s, the baked land cross-fades, and `night` runs 0 to 1: the daylight shaft
  fades, the lamp comes on, fireflies appear.
- **Quality.** Below 520 CSS px the engine uses `LOW` (fewer leaflets, stipples, particles).
  Device pixel ratio is capped at 2.
- **Motion preferences.** With `prefers-reduced-motion` it renders the finished world as one
  still frame. It pauses when offscreen or when the tab is hidden.
- **Worlds are numbered.** The caption shows `World No. 0421` and a "Grow another" button.
  `?world=1234` in the URL shows that exact world.
- **Dev only:** `?wt=3.2` freezes the timeline at 3.2 seconds, which makes any frame
  reproducible, for example `/?world=7&wt=3.2`. `window.__wg` reports frame time, seed, kind.
- Budget: about 6ms per frame on desktop in software rendering. Keep it there.

Checking changes visually: there is no browser tool in the CLI, but `chromium` is installed.
Drive it headless with `puppeteer-core` (`executablePath: '/usr/bin/chromium'`) against the
dev server and screenshot frozen frames (`?world=7&wt=30` for the finished world, both
themes, desktop and a 390px mobile viewport). Always look at the result before calling a
visual change done.

## Other motion

- **Collection size diagram** (`SizeDiagram.svelte`): D3 draws each vessel to true scale from
  its dimensions and grows them in on scroll. Adapts to any number of models.
- **Scroll reveals:** `use:reveal` (`src/lib/actions/reveal.ts`). Content is visible without
  JS and with reduced motion.
- **Nav:** transparent, then a blurred bar once scrolled. Mobile menu slides down.
- **Page changes:** View Transitions cross-fade. **Smooth scroll:** Lenis.

## Pages

- `/` home: hero terrarium, story and stats, why, collection preview, process, call to action.
- `/collection`: size diagram, grid of all models, the three kinds of piece in plain words.
- `/collection/[slug]`: one model with specs, moods, WhatsApp enquiry, next piece.
- `/business`: the B2B offer and "Book a sample visit".
- `/about`: studio story, packaging, the after-delivery promise.
- Contact is the copper band that closes each page (`.cta-band`) plus the footer. There is
  no contact page. Nav: Collection, Business, About, Say hello (WhatsApp).

## Data model: the model count is flexible

The five models are placeholders. **Everything renders from `src/lib/data/collection.ts`.**
The grid, the size diagram, the stats and the detail pages all derive from that array, so
adding or removing a model updates the whole site. Current placeholders: Pocket Wild
(WG-T01, 5,900), Fernhouse (WG-T02, 8,900), Riverglass (WG-A01, 14,900), Mossfall (WG-P01,
21,900), Wildglass No. 01 (WG-S01, made to order, 24,900).

Brand and contact details live in `src/lib/data/site.ts`:

- Email: `hello@wildglasslk.com`
- WhatsApp and phone: +94 74 257 4478
- Instagram: @wildglass.lk

There is no cart or checkout. Ordering is by enquiry (WhatsApp first, then email). A
Cloudflare Pages Function form could be added later.
