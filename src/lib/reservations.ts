import { Redis } from '@upstash/redis';
import { KV_REST_API_TOKEN, KV_REST_API_URL, PLACES_TOTAL } from 'astro:env/server';

// Réservations de l'événement, stockées dans Upstash Redis :
// - `reservation:prises` : nombre de places attribuées (sert aussi de numéro de place) ;
// - `reservation:inscrit:<email>` : une fiche par adresse (numéro, coordonnées, newsletter, date).

export const CLE_PRISES = 'reservation:prises';
export const PREFIXE_INSCRIT = 'reservation:inscrit:';

// Valeurs lues telles quelles (pas de conversion JSON : un code postal ou un nom reste du texte)
const redis = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN, automaticDeserialization: false });

// Vérification et attribution en une seule opération atomique : deux envois simultanés
// ne peuvent ni dépasser le total ni réserver deux fois la même adresse.
// Renvoie le numéro de place, -1 si l'adresse est déjà inscrite, -2 si c'est complet.
// ARGV[1] = total, puis les champs de la fiche par paires (nom, valeur).
const reserver = redis.createScript<number>(`
	if redis.call('EXISTS', KEYS[2]) == 1 then return -1 end
	local prises = tonumber(redis.call('GET', KEYS[1]) or '0')
	if prises >= tonumber(ARGV[1]) then return -2 end
	local numero = redis.call('INCR', KEYS[1])
	redis.call('HSET', KEYS[2], 'numero', numero, unpack(ARGV, 2))
	return numero
`);

export type Places = { total: number; restantes: number };

export async function lirePlaces(): Promise<Places> {
	const prises = Number((await redis.get<number>(CLE_PRISES)) ?? 0);
	return { total: PLACES_TOTAL, restantes: Math.max(PLACES_TOTAL - prises, 0) };
}

export type Resultat =
	| { statut: 'reservee'; numero: number }
	| { statut: 'deja-inscrit' }
	| { statut: 'complet' };

export type Inscription = {
	email: string;
	nom: string;
	telephone: string;
	rue: string;
	codePostal: string;
	ville: string;
	newsletter: boolean;
};

export async function reserverPlace(inscription: Inscription): Promise<Resultat> {
	const fiche = {
		nom: inscription.nom,
		telephone: inscription.telephone,
		rue: inscription.rue,
		code_postal: inscription.codePostal,
		ville: inscription.ville,
		newsletter: inscription.newsletter ? '1' : '0',
		date: new Date().toISOString(),
	};
	const retour = await reserver.exec(
		[CLE_PRISES, PREFIXE_INSCRIT + inscription.email],
		[String(PLACES_TOTAL), ...Object.entries(fiche).flat()],
	);
	if (retour === -1) return { statut: 'deja-inscrit' };
	if (retour === -2) return { statut: 'complet' };
	return { statut: 'reservee', numero: Number(retour) };
}

export type Inscrit = Omit<Inscription, 'newsletter'> & { numero: number; newsletter: boolean; date: string };

/** Toutes les fiches, par numéro de place (export pour tableur). */
export async function lireInscrits(): Promise<Inscrit[]> {
	const cles: string[] = [];
	let curseur = '0';
	do {
		const [suivant, lot] = await redis.scan(curseur, { match: `${PREFIXE_INSCRIT}*`, count: 200 });
		cles.push(...lot);
		curseur = String(suivant);
	} while (curseur !== '0');
	if (!cles.length) return [];

	const lecture = redis.pipeline();
	cles.forEach((cle) => lecture.hgetall(cle));
	// sans désérialisation automatique, HGETALL renvoie [champ, valeur, champ, valeur…]
	const fiches = ((await lecture.exec()) as (Record<string, string> | string[] | null)[]).map((brut) => {
		if (!Array.isArray(brut)) return brut;
		const fiche: Record<string, string> = {};
		for (let i = 0; i < brut.length; i += 2) fiche[brut[i]] = brut[i + 1];
		return fiche;
	});

	return fiches
		.map((f, i) => ({
			numero: Number(f?.numero ?? 0),
			nom: f?.nom ?? '',
			email: cles[i].slice(PREFIXE_INSCRIT.length),
			telephone: f?.telephone ?? '',
			rue: f?.rue ?? '',
			codePostal: f?.code_postal ?? '',
			ville: f?.ville ?? '',
			newsletter: f?.newsletter === '1',
			date: f?.date ?? '',
		}))
		.sort((a, b) => a.numero - b.numero);
}
