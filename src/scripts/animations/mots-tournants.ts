import { gsap, mouvementReduit } from '../gsap';

const PAUSE = 2; // temps de lecture d'un mot (s)
const DUREE = 0.9; // bascule rapide puis mise en place douce (cf. vidéo de référence « text shifting »)
const ENTREE = { rotationX: -75, opacity: 0 }; // le mot suivant arrive par le dessous du tambour
const SORTIE = { rotationX: 75, opacity: 0 }; // le mot affiché part par le dessus

/**
 * Mots qui « tournent » dans `[data-mots-tournants]` : comme sur un tambour, le mot affiché
 * bascule vers le haut sur un pivot horizontal en fondu, pendant que le suivant arrive du bas.
 * Les mots `[data-mot]` sont empilés au même endroit, calés à gauche contre le mot précédent ;
 * la largeur de la pile suit le mot affiché, pour qu'un mot court (« le ») reste collé à « Transmettre ».
 */
export function motsTournants(conteneur: HTMLElement) {
	const mots = Array.from(conteneur.querySelectorAll<HTMLElement>('[data-mot]'));
	if (mots.length < 2 || mouvementReduit()) return;

	// Pivot placé loin derrière le mot (≈ une hauteur de ligne) : les mots défilent comme des rangées sur un tambour
	const profondeur = parseFloat(getComputedStyle(conteneur).fontSize) * 0.9;
	gsap.set(mots, { transformOrigin: `50% 50% ${-profondeur}px`, transformPerspective: 600, opacity: 1 });
	mots.slice(1).forEach((mot) => gsap.set(mot, ENTREE));

	// Sans animation, la pile garde la largeur du mot le plus long ; ici elle prend celle du mot affiché
	const pile = mots[0].parentElement!;
	// en em : la largeur suit la taille du titre d'un point de rupture à l'autre
	const taille = parseFloat(getComputedStyle(pile).fontSize);
	const largeur = (mot: HTMLElement) => `${mot.offsetWidth / taille}em`;
	gsap.set(pile, { width: largeur(mots[0]) });

	const boucle = gsap.timeline({ repeat: -1 });
	mots.forEach((actuel, i) => {
		const suivant = mots[(i + 1) % mots.length];
		boucle
			.to(actuel, { ...SORTIE, duration: DUREE, ease: 'expo.out' }, `+=${PAUSE}`)
			// immediateRender: false, sinon le retour au premier mot le masquerait dès la création de la boucle
			.fromTo(suivant, ENTREE, { rotationX: 0, opacity: 1, duration: DUREE, ease: 'expo.out', immediateRender: false }, '<')
			// la ligne se resserre (ou s'élargit) en même temps, et se recentre en douceur
			.to(pile, { width: largeur(suivant), duration: DUREE, ease: 'expo.out' }, '<');
	});
}
