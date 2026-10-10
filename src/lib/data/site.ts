/* Single source of truth for brand + contact details. */

export const site = {
	name: 'WILDGLASS',
	tagline: 'Tiny Wild Worlds',
	domain: 'wildglasslk.com',
	url: 'https://wildglasslk.com',
	location: 'Colombo, Sri Lanka',
	founder: 'Sasmitha Perera',
	email: 'hello@wildglasslk.com',
	phoneDisplay: '+94 74 257 4478',
	phoneIntl: '94742574478', // for wa.me
	instagram: '@wildglass.lk',
	instagramUrl: 'https://instagram.com/wildglass.lk'
} as const;

export const whatsapp = (msg = "Hi WILDGLASS, I'd like to know more about your pieces.") =>
	`https://wa.me/${site.phoneIntl}?text=${encodeURIComponent(msg)}`;

export const mailto = (subject = 'Hello WILDGLASS') =>
	`mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
