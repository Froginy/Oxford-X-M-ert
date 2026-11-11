import type { APIRoute } from 'astro';
import { lirePlaces } from '../../lib/reservations';

// Compteur de places restantes, lu par le site au chargement et à l'ouverture de la modale
export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const places = await lirePlaces();
		return Response.json({ ...places, complet: places.restantes === 0 }, { headers: { 'Cache-Control': 'no-store' } });
	} catch (erreur) {
		console.error('[places] lecture impossible', erreur);
		return Response.json({ erreur: 'serveur' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
	}
};
