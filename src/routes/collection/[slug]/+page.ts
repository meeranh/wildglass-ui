import { error } from '@sveltejs/kit';
import { collection, getModel } from '#lib/data/collection';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => collection.map((m) => ({ slug: m.slug }));

export const load: PageLoad = ({ params }) => {
	const model = getModel(params.slug);
	if (!model) error(404, 'Piece not found');
	const index = collection.findIndex((m) => m.slug === model.slug);
	const next = collection[(index + 1) % collection.length];
	return { model, next };
};
