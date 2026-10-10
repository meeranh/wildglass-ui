# WILDGLASS

The website for WILDGLASS, a studio in Colombo, Sri Lanka that makes living landscapes in
glass: terrariums, water gardens and paludariums.

Built with SvelteKit and Svelte 5, deployed to Cloudflare Pages. The hero on the home page
is a terrarium that grows itself on a canvas, driven by D3 (see `src/lib/terrarium/`).

## Develop

```sh
bun install
bun run dev
```

## Build

```sh
bun run build     # output in .svelte-kit/cloudflare
bun run preview
```

Cloudflare Pages settings: build command `bun run build`, output directory
`.svelte-kit/cloudflare`. The bun and Node versions the Pages build uses are pinned in
`wrangler.jsonc` (`BUN_VERSION`) and `.node-version`.

## Where things are

- `src/lib/data/collection.ts`: the models. The grid, size diagram and detail pages all
  derive from this one file.
- `src/lib/data/site.ts`: contact details.
- `src/lib/styles/tokens.css`: colours for both themes, including the terrarium's.
- `src/lib/terrarium/`: the hero engine.
- `CLAUDE.md`: fuller notes on the design system and how the hero works.
