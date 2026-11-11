import { gsap, mouvementReduit } from '../gsap';

/**
 * Flottement très discret des objets décoratifs : montée et descente verticale de 2 à 3 px,
 * sur un cycle lent. Chaque objet a son propre rythme pour éviter un mouvement synchronisé.
 */
export function flottement(elements: Iterable<Element>) {
	if (mouvementReduit()) return;

	for (const element of elements) {
		const duree = gsap.utils.random(5.5, 7.5); // demi-cycle (montée ou descente)
		const tween = gsap.to(element, {
			y: gsap.utils.random(-3, -2),
			duration: duree,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
		});
		// Départ à un instant aléatoire du cycle pour désynchroniser les objets
		tween.totalTime(gsap.utils.random(0, duree * 2));
	}
}
