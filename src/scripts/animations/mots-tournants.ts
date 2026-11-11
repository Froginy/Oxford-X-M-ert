import { gsap, mouvementReduit } from '../gsap';

const PAUSE = 2.4; // temps de lecture d'un mot (s)
const ENTREE = { rotationX: -90, opacity: 0 }; // la lettre arrive en pivotant depuis le dessous
const SORTIE = { rotationX: 90, opacity: 0 }; // et repart en basculant vers le haut

/**
 * Mots qui « tournent » dans `[data-mots-tournants]` : le mot affiché bascule sur un pivot
 * horizontal (comme la face d'un cube) en fondu, et le suivant apparaît par la face du dessous.
 * Les mots `[data-mot]` sont empilés au même endroit (le plus long fixe la largeur).
 */
export function motsTournants(conteneur: HTMLElement) {
	const mots = Array.from(conteneur.querySelectorAll<HTMLElement>('[data-mot]'));
	if (mots.length < 2 || mouvementReduit()) return;

	// Pivot placé derrière les lettres (à une demi-hauteur de texte) pour l'effet de cube
	const profondeur = parseFloat(getComputedStyle(conteneur).fontSize) * 0.5;
	const lettres = mots.map((mot) => Array.from(mot.querySelectorAll<HTMLElement>('[data-lettre]')));
	gsap.set(lettres.flat(), { transformOrigin: `50% 50% ${-profondeur}px`, transformPerspective: 600 });
	gsap.set(mots, { opacity: 1 });
	lettres.slice(1).forEach((groupe) => gsap.set(groupe, ENTREE));

	const boucle = gsap.timeline({ repeat: -1 });
	lettres.forEach((actuel, i) => {
		const suivant = lettres[(i + 1) % lettres.length];
		boucle
			.to(actuel, { ...SORTIE, duration: 0.55, ease: 'power2.in', stagger: 0.04 }, `+=${PAUSE}`)
			// immediateRender: false, sinon le retour au premier mot le masquerait dès la création de la boucle
			.fromTo(suivant, ENTREE, { rotationX: 0, opacity: 1, duration: 0.75, ease: 'power3.out', stagger: 0.05, immediateRender: false }, '-=0.3');
	});
}
