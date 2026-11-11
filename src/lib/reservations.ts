import { Redis } from '@upstash/redis';
import { KV_REST_API_TOKEN, KV_REST_API_URL, PLACES_TOTAL } from 'astro:env/server';

// Réservations de l'événement, stockées dans Upstash Redis :
// - `reservation:prises` : nombre de places attribuées (sert aussi de numéro de place) ;
// - `reservation:inscrit:<email>` : une fiche par adresse (numéro, nom, newsletter, date).

export const CLE_PRISES = 'reservation:prises';
export const PREFIXE_INSCRIT = 'reservation:inscrit:';

const redis = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });

// Vérification et attribution en une seule opération atomique : deux envois simultanés
// ne peuvent ni dépasser le total ni réserver deux fois la même adresse.
// Renvoie le numéro de place, -1 si l'adresse est déjà inscrite, -2 si c'est complet.
const reserver = redis.createScript<number>(`
	if redis.call('EXISTS', KEYS[2]) == 1 then return -1 end
	local prises = tonumber(redis.call('GET', KEYS[1]) or '0')
	if prises >= tonumber(ARGV[1]) then return -2 end
	local numero = redis.call('INCR', KEYS[1])
	redis.call('HSET', KEYS[2], 'numero', numero, 'nom', ARGV[2], 'newsletter', ARGV[3], 'date', ARGV[4])
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

export async function reserverPlace(inscription: { email: string; nom: string; newsletter: boolean }): Promise<Resultat> {
	const retour = await reserver.exec(
		[CLE_PRISES, PREFIXE_INSCRIT + inscription.email],
		[String(PLACES_TOTAL), inscription.nom, inscription.newsletter ? '1' : '0', new Date().toISOString()],
	);
	if (retour === -1) return { statut: 'deja-inscrit' };
	if (retour === -2) return { statut: 'complet' };
	return { statut: 'reservee', numero: Number(retour) };
}
