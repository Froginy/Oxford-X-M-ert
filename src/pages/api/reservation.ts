import type { APIRoute } from 'astro';
import { envoyerConfirmation } from '../../lib/email';
import { lirePlaces, reserverPlace } from '../../lib/reservations';
import { verifierCaptcha } from '../../lib/turnstile';

// Réservation d'une place (formulaire de la modale) : validation, anti-robot, attribution atomique, e-mail.
export const prerender = false;

const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const repondre = (statut: number, corps: Record<string, unknown>) =>
	Response.json(corps, { status: statut, headers: { 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
	let donnees: FormData;
	try {
		donnees = await request.formData();
	} catch {
		return repondre(400, { erreur: 'invalide', message: 'Formulaire illisible.' });
	}

	const nom = String(donnees.get('nom') ?? '').trim();
	const email = String(donnees.get('email') ?? '').trim().toLowerCase();
	const newsletter = donnees.get('newsletter') !== null;

	if (!nom || nom.length > 100) return repondre(400, { erreur: 'invalide', champ: 'nom', message: 'Indiquez votre nom et prénom.' });
	if (email.length > 254 || !FORMAT_EMAIL.test(email)) {
		return repondre(400, { erreur: 'invalide', champ: 'email', message: 'Cette adresse e-mail n’est pas valide.' });
	}
	if (donnees.get('rgpd') === null) {
		return repondre(400, { erreur: 'invalide', champ: 'rgpd', message: 'Merci d’accepter la politique de confidentialité.' });
	}

	if (!(await verifierCaptcha(String(donnees.get('cf-turnstile-response') ?? ''), clientAddress))) {
		return repondre(403, { erreur: 'captcha', message: 'La vérification anti-robot a échoué. Merci de réessayer.' });
	}

	try {
		const resultat = await reserverPlace({ email, nom, newsletter });
		const places = await lirePlaces();

		if (resultat.statut === 'deja-inscrit') {
			return repondre(409, { erreur: 'deja-inscrit', champ: 'email', message: 'Cette adresse a déjà réservé sa place. Une seule place par adresse e-mail.', ...places });
		}
		if (resultat.statut === 'complet') {
			return repondre(410, { erreur: 'complet', message: 'Il n’y a plus de place disponible : l’événement est complet.', ...places });
		}

		const emailEnvoye = await envoyerConfirmation({ email, nom, numero: resultat.numero, total: places.total, newsletter });
		return repondre(200, { numero: resultat.numero, emailEnvoye, ...places });
	} catch (erreur) {
		console.error('[reservation] échec', erreur);
		return repondre(503, { erreur: 'serveur', message: 'La réservation est momentanément indisponible. Merci de réessayer.' });
	}
};
