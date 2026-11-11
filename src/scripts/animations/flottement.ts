import { gsap, mouvementReduit } from '../gsap';

/**
 * Flottement discret des objets décoratifs : chacun monte et descend de quelques px
 * avec une légère oscillation, à son propre rythme pour éviter un mouvement synchronisé.
 */
export function flottement(elements: Iterable<Element>) {
	if (mouvementReduit()) return;

	for (const element of elements) {
		const duree = gsap.utils.random(3.2, 4.8);
		const tween = gsap.to(element, {
			y: gsap.utils.random(-7, -4),
			x: gsap.utils.random(-2, 2),
			rotation: gsap.utils.random(-1.2, 1.2),
			duration: duree,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
		});
		// Départ à un instant aléatoire du cycle pour désynchroniser les objets
		tween.totalTime(gsap.utils.random(0, duree * 2));
	}
}
