/* The collection. Model count is intentionally flexible: the grid, the
 * size diagram and the detail pages all derive from this one array, so
 * adding or removing a model updates the whole site. These five are
 * placeholders from the company profile. */

export type Category = 'terrarium' | 'aquascape' | 'paludarium' | 'signature';

export interface Model {
	slug: string;
	code: string; // WG-T01, …
	name: string;
	type: string; // "Small terrarium"
	category: Category;
	/** whether the piece holds water (used for the glass/water accent + fish in the hero) */
	water: boolean;
	dimensions: { w: number; h: number; d: number }; // inches
	price: number; // LKR
	power: string;
	care: string;
	readyIn: string;
	plants?: string;
	bestFor: string;
	blurb: string;
	moods?: string[];
	madeToOrder?: boolean;
}

export const collection: Model[] = [
	{
		slug: 'pocket-wild',
		code: 'WG-T01',
		name: 'Pocket Wild',
		type: 'Small terrarium',
		category: 'terrarium',
		water: false,
		dimensions: { w: 4, h: 5, d: 4 },
		price: 5900,
		power: 'None',
		care: 'Very low',
		readyIn: '2 to 3 days',
		bestFor: 'Small desks and thoughtful gifts',
		blurb: 'A palm-sized forest for small desks and thoughtful gifts.'
	},
	{
		slug: 'fernhouse',
		code: 'WG-T02',
		name: 'Fernhouse',
		type: 'Tall terrarium',
		category: 'terrarium',
		water: false,
		dimensions: { w: 6, h: 8, d: 6 },
		price: 8900,
		power: 'None',
		care: 'Very low',
		readyIn: '3 to 4 days',
		bestFor: 'Homes, offices and gifts',
		blurb: 'A taller woodland scene with more depth and texture.'
	},
	{
		slug: 'riverglass',
		code: 'WG-A01',
		name: 'Riverglass',
		type: 'Water garden',
		category: 'aquascape',
		water: true,
		dimensions: { w: 8, h: 8, d: 8 },
		price: 14900,
		power: 'LED light',
		care: 'Low',
		readyIn: '5 to 7 days',
		plants: 'Hardy water plants and moss',
		bestFor: 'Desks, lounges, studios',
		blurb: 'A small underwater garden of stone and slow-growing plants.'
	},
	{
		slug: 'mossfall',
		code: 'WG-P01',
		name: 'Mossfall',
		type: 'Water and land',
		category: 'paludarium',
		water: true,
		dimensions: { w: 10, h: 12, d: 10 },
		price: 21900,
		power: 'LED + small pump',
		care: 'Low to medium',
		readyIn: '7 to 10 days',
		plants: 'Moss, mini ferns and edge plants',
		bestFor: 'Cafes, hotels, receptions',
		blurb: 'Water and land in one glass, with a small moving waterfall.'
	},
	{
		slug: 'wildglass-no-01',
		code: 'WG-S01',
		name: 'Wildglass No. 01',
		type: 'Signature, made to order',
		category: 'signature',
		water: false,
		dimensions: { w: 12, h: 12, d: 12 },
		price: 24900,
		power: 'LED optional',
		care: 'Low',
		readyIn: '7 to 10 days',
		bestFor: 'Premium offices, hotels, company gifts',
		blurb: 'One of a kind. Built around a special stone or piece of wood.',
		moods: ['Forest', 'Stone', 'Wood'],
		madeToOrder: true
	}
];

export function getModel(slug: string): Model | undefined {
	return collection.find((m) => m.slug === slug);
}

export function formatLKR(n: number): string {
	return 'LKR ' + n.toLocaleString('en-US');
}

/** Width, depth, height: the order the company profile uses ("4 × 4 × 5 in"). */
export function dims(m: Model): string {
	const { w, h, d } = m.dimensions;
	return `${w} × ${d} × ${h} in`;
}
