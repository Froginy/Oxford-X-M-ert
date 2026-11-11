import { PUBLIC_TURNSTILE_SITE_KEY } from 'astro:env/client';

// Widget anti-robot Cloudflare Turnstile, chargé à la première ouverture de la modale (rendu explicite).
// Le widget ajoute au formulaire un champ caché `cf-turnstile-response`, vérifié par /api/reservation.

type Turnstile = {
	render: (conteneur: HTMLElement, options: Record<string, unknown>) => string;
	reset: (id: string) => void;
};

declare global {
	interface Window {
		turnstile?: Turnstile;
	}
}

let chargement: Promise<Turnstile> | null = null;
let widget: string | null = null;

function chargerTurnstile() {
	chargement ??= new Promise((resoudre, rejeter) => {
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
		script.async = true;
		script.onload = () => (window.turnstile ? resoudre(window.turnstile) : rejeter());
		script.onerror = () => {
			chargement = null;
			rejeter();
		};
		document.head.append(script);
	});
	return chargement;
}

export async function afficherCaptcha(conteneur: HTMLElement) {
	// Déjà rendu : nouveau jeton à chaque ouverture (le précédent a pu servir ou expirer)
	if (widget) return relancerCaptcha();
	try {
		const turnstile = await chargerTurnstile();
		if (widget) return;
		conteneur.replaceChildren();
		widget = turnstile.render(conteneur, { sitekey: PUBLIC_TURNSTILE_SITE_KEY, language: 'fr', theme: 'light' });
	} catch {
		conteneur.textContent = 'La vérification anti-robot n’a pas pu se charger. Vérifiez votre connexion puis rouvrez la fenêtre.';
	}
}

/** Un jeton ne sert qu'une fois : on relance le widget après un envoi refusé (formulaire visible). */
export function relancerCaptcha() {
	if (widget) window.turnstile?.reset(widget);
}
