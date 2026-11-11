// Fin de l'écran de chargement (composant Chargement) : les animations de page démarrent après.
export const EVENEMENT_CHARGEMENT_FINI = 'chargement:fini';

/** Exécute `rappel` une fois le rideau ouvert (ou tout de suite s'il n'y a pas d'écran de chargement). */
export function apresChargement(rappel: () => void) {
	const enCours = document.documentElement.dataset.chargement === 'en-cours';
	if (enCours) {
		window.addEventListener(EVENEMENT_CHARGEMENT_FINI, rappel, { once: true });
	} else {
		rappel();
	}
}
