import { TURNSTILE_SECRET_KEY } from 'astro:env/server';

// Vérifie côté serveur le jeton du widget anti-robot Cloudflare Turnstile.
// https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
export async function verifierCaptcha(jeton: string, ip?: string): Promise<boolean> {
	if (!jeton) return false;
	const corps = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: jeton });
	if (ip) corps.set('remoteip', ip);

	try {
		const reponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: corps });
		const resultat = (await reponse.json()) as { success?: boolean };
		return resultat.success === true;
	} catch (erreur) {
		console.error('[turnstile] vérification impossible', erreur);
		return false;
	}
}
