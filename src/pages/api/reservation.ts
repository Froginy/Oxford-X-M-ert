import type { APIRoute } from 'astro';
import { envoyerConfirmation } from '../../lib/email';
import { lirePlaces, reserverPlace } from '../../lib/reservations';
import { verifierCaptcha } from '../../lib/turnstile';

// Réservation d'une place (formulaire de la modale) : validation, anti-robot, attribution atomique, e-mail.
export const prerender = false;

const FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORMAT_CODE_POSTAL = /^[0-9A-Za-z][0-9A-Za-z -]{2,9}$/;

/**
 * Numéro français → « 06 12 34 56 78 » ; international → « +32 470 12 34 56 » (espaces conservés, ou ajoutés
 * après l'indicatif : sans espace, un tableur lirait un nombre et perdrait le « + ») ; sinon null.
 */
function normaliserTelephone(brut: string) {
	const chiffres = brut.replace(/[\s.\-()]/g, '');
	const national = /^0[1-9]\d{8}$/.test(chiffres) ? chiffres : /^(\+|00)33[1-9]\d{8}$/.test(chiffres) ? '0' + chiffres.slice(-9) : null;
	if (national) return national.replace(/(\d{2})(?=\d)/g, '$1 ');
	if (/^(\+|00)[1-9]\d{6,14}$/.test(chiffres)) {
		const lisible = brut.trim().replace(/^00/, '+').replace(/[.\-()]/g, ' ').replace(/\s+/g, ' ');
		return /\s/.test(lisible) ? lisible : lisible.replace(/^(\+\d{2})/, '$1 ');
	}
	return null;
}

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
	const telephone = normaliserTelephone(String(donnees.get('telephone') ?? ''));
	const rue = String(donnees.get('rue') ?? '').trim();
	const codePostal = String(donnees.get('code_postal') ?? '').trim();
	const ville = String(donnees.get('ville') ?? '').trim();

	if (!nom || nom.length > 100) return repondre(400, { erreur: 'invalide', champ: 'nom', message: 'Indiquez votre nom et prénom.' });
	if (email.length > 254 || !FORMAT_EMAIL.test(email)) {
		return repondre(400, { erreur: 'invalide', champ: 'email', message: 'Cette adresse e-mail n’est pas valide.' });
	}
	if (!telephone) {
		return repondre(400, { erreur: 'invalide', champ: 'telephone', message: 'Ce numéro de téléphone n’est pas valide (ex. 06 12 34 56 78).' });
	}
	if (rue.length < 3 || rue.length > 200) return repondre(400, { erreur: 'invalide', champ: 'rue', message: 'Indiquez le numéro et la rue de votre domicile.' });
	if (!FORMAT_CODE_POSTAL.test(codePostal)) return repondre(400, { erreur: 'invalide', champ: 'code_postal', message: 'Ce code postal n’est pas valide.' });
	if (!ville || ville.length > 100) return repondre(400, { erreur: 'invalide', champ: 'ville', message: 'Indiquez votre ville.' });
	if (donnees.get('rgpd') === null) {
		return repondre(400, { erreur: 'invalide', champ: 'rgpd', message: 'Merci d’accepter la politique de confidentialité.' });
	}

	if (!(await verifierCaptcha(String(donnees.get('cf-turnstile-response') ?? ''), clientAddress))) {
		return repondre(403, { erreur: 'captcha', message: 'La vérification anti-robot a échoué. Merci de réessayer.' });
	}

	try {
		const resultat = await reserverPlace({ email, nom, telephone, rue, codePostal, ville });
		const places = await lirePlaces();

		if (resultat.statut === 'deja-inscrit') {
			return repondre(409, { erreur: 'deja-inscrit', champ: 'email', message: 'Cette adresse a déjà réservé sa place. Une seule place par adresse e-mail.', ...places });
		}
		if (resultat.statut === 'complet') {
			return repondre(410, { erreur: 'complet', message: 'Il n’y a plus de place disponible : l’événement est complet.', ...places });
		}

		const emailEnvoye = await envoyerConfirmation({ email, nom, numero: resultat.numero, total: places.total });
		return repondre(200, { numero: resultat.numero, emailEnvoye, ...places });
	} catch (erreur) {
		console.error('[reservation] échec', erreur);
		return repondre(503, { erreur: 'serveur', message: 'La réservation est momentanément indisponible. Merci de réessayer.' });
	}
};
