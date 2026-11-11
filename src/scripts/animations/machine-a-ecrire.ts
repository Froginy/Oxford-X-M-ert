import { gsap, mouvementReduit } from '../gsap';

const PAUSE = 2.2; // temps de lecture d'un mot (s)
const FRAPPE = 0.11; // par caractère tapé
const EFFACEMENT = 0.06; // par caractère effacé

/**
 * Machine à écrire en boucle sur `[data-typewriter]` :
 * le mot `[data-typewriter-mot]` s'efface puis laisse place au suivant de `data-typewriter-mots`.
 */
export function machineAEcrire(conteneur: HTMLElement) {
	const mot = conteneur.querySelector<HTMLElement>('[data-typewriter-mot]');
	const curseur = conteneur.querySelector<HTMLElement>('[data-typewriter-curseur]');
	const mots = (conteneur.dataset.typewriterMots ?? '').split(',').filter(Boolean);
	if (!mot || mots.length < 2 || mouvementReduit()) return;

	if (curseur) {
		gsap.to(curseur, { opacity: 0, duration: 0.5, ease: 'steps(1)', repeat: -1, yoyo: true });
	}

	const boucle = gsap.timeline({ repeat: -1 });
	mots.forEach((actuel, i) => {
		const suivant = mots[(i + 1) % mots.length];
		boucle
			.to(mot, { text: '', duration: actuel.length * EFFACEMENT, ease: 'none' }, `+=${PAUSE}`)
			.to(mot, { text: suivant, duration: suivant.length * FRAPPE, ease: 'none' }, '+=0.15');
	});
}
