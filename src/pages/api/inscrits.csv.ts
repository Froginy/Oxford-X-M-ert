import type { APIRoute } from 'astro';
import { EXPORT_INSCRITS_CLE } from 'astro:env/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { lireInscrits } from '../../lib/reservations';

// Liste des inscrits au format CSV, protégée par une clé secrète (EXPORT_INSCRITS_CLE) :
// - Google Sheets : =IMPORTDATA("https://…/api/inscrits.csv?cle=…") — tableau tenu à jour automatiquement ;
// - Excel : https://…/api/inscrits.csv?cle=…&excel=1 — fichier téléchargé, séparateur « ; » et accents corrects.
export const prerender = false;

const COLONNES = ['N° de place', 'Nom et prénom', 'E-mail', 'Téléphone', 'Numéro et rue', 'Code postal', 'Ville', 'Newsletter', 'Inscrit le'];

const empreinte = (texte: string) => createHash('sha256').update(texte).digest();
// comparaison à temps constant (empreintes de même longueur)
const cleValide = (cle: string) => !!EXPORT_INSCRITS_CLE && timingSafeEqual(empreinte(cle), empreinte(EXPORT_INSCRITS_CLE));

const dateFr = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' });

/**
 * Cellule CSV : guillemets échappés ; un texte libre qui commence par = + - @ est neutralisé (injection de
 * formule). Le téléphone, déjà validé par le serveur (chiffres, espaces, « + »), n'est pas concerné.
 */
function cellule(valeur: string | number, separateur: string, libre = true) {
	let texte = String(valeur);
	if (libre && /^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
	return /["\n\r]/.test(texte) || texte.includes(separateur) ? `"${texte.replaceAll('"', '""')}"` : texte;
}

export const GET: APIRoute = async ({ url }) => {
	if (!cleValide(url.searchParams.get('cle') ?? '')) {
		return new Response('Accès refusé.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
	}

	const excel = url.searchParams.has('excel');
	const separateur = excel ? ';' : ',';
	const inscrits = await lireInscrits();
	const lignes = [
		COLONNES,
		...inscrits.map((i) => [i.numero, i.nom, i.email, i.telephone, i.rue, i.codePostal, i.ville, i.newsletter ? 'oui' : 'non', i.date ? dateFr.format(new Date(i.date)) : '']),
	].map((ligne) => ligne.map((v, colonne) => cellule(v, separateur, colonne !== 3)).join(separateur));

	return new Response((excel ? '\uFEFF' : '') + lignes.join('\r\n') + '\r\n', {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `${excel ? 'attachment' : 'inline'}; filename="inscrits-meert-oxford.csv"`,
			'Cache-Control': 'no-store',
			'X-Robots-Tag': 'noindex',
		},
	});
};
