import { Redis } from '@upstash/redis';

// Remet le compteur de places à zéro et efface toutes les réservations (démo, tests).
// Usage : `bun run places:reinitialiser` (lit KV_REST_API_URL / KV_REST_API_TOKEN dans .env.local).

const redis = Redis.fromEnv();

let curseur = '0';
let effacees = 0;
do {
	const [suivant, cles] = await redis.scan(curseur, { match: 'reservation:inscrit:*', count: 100 });
	if (cles.length) effacees += await redis.del(...cles);
	curseur = String(suivant);
} while (curseur !== '0');
await redis.del('reservation:prises');

console.log(`${effacees} réservation(s) effacée(s), compteur remis à zéro.`);
