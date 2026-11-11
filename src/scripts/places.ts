// Compteurs « N places restantes » du site (hero, section événement, modale) et boutons « Réserver ».
// Chaque compteur porte data-places-restantes ; à 0, il affiche « Complet » et les boutons sont désactivés.

export type Places = { total: number; restantes: number };

let derniersPlaces: Places | null = null;

export const placesConnues = () => derniersPlaces;

export function afficherPlaces(places: Places) {
	derniersPlaces = places;
	const { restantes } = places;
	const texte = restantes === 0 ? 'Complet' : `${restantes} ${restantes === 1 ? 'place restante' : 'places restantes'}`;
	document.querySelectorAll('[data-places-restantes]').forEach((compteur) => (compteur.textContent = texte));
	document.querySelectorAll('[data-places-total]').forEach((total) => (total.textContent = String(places.total)));

	const complet = restantes === 0;
	document.documentElement.toggleAttribute('data-complet', complet);
	document.querySelectorAll<HTMLButtonElement>('[data-reservation-ouvrir]').forEach((bouton) => {
		bouton.disabled = complet;
		// Boutons coulis : le libellé devient « Complet »
		const libelle = bouton.querySelector<HTMLElement>('.libelle');
		if (!libelle) return;
		libelle.dataset.libelle ??= libelle.textContent ?? '';
		libelle.textContent = complet ? 'Complet' : libelle.dataset.libelle;
	});
}

export async function actualiserPlaces() {
	try {
		const reponse = await fetch('/api/places', { cache: 'no-store' });
		if (!reponse.ok) return;
		afficherPlaces(await reponse.json());
	} catch {
		// Hors ligne ou API indisponible : les compteurs gardent leur texte par défaut
	}
}
