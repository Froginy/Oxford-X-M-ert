import { gsap, mouvementReduit } from './gsap';

// Modale de réservation (composant ModaleReservation) : ouverture / fermeture animées et états d'affichage.
// L'envoi du formulaire (POST /api/reservation) est géré dans le composant.

const ecranLarge = () => window.matchMedia('(min-width: 768px)').matches;

function elements() {
	const modale = document.getElementById('modale-reservation') as HTMLDialogElement | null;
	if (!modale) return null;
	return {
		modale,
		voile: modale.querySelector<HTMLElement>('[data-voile]')!,
		feuille: modale.querySelector<HTMLElement>('[data-feuille]')!,
		formulaire: modale.querySelector<HTMLElement>('[data-etat="formulaire"]')!,
		confirmation: modale.querySelector<HTMLElement>('[data-etat="confirmation"]')!,
		champEmail: modale.querySelector<HTMLElement>('[data-champ="email"]')!,
		erreurFormulaire: modale.querySelector<HTMLElement>('[data-erreur-formulaire]')!,
	};
}

export function ouvrirReservation() {
	const el = elements();
	if (!el || el.modale.open) return;
	const { modale, voile, feuille } = el;

	document.documentElement.style.overflow = 'hidden';
	modale.showModal();

	gsap.killTweensOf([voile, feuille]);
	gsap.fromTo(voile, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power1.out' });

	if (mouvementReduit()) {
		gsap.fromTo(feuille, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 });
	} else if (ecranLarge()) {
		// Desktop / tablette : la feuille apparaît en fondu et se redresse (−2° → 0°)
		gsap.fromTo(
			feuille,
			{ autoAlpha: 0, rotation: -2, y: 16 },
			{ autoAlpha: 1, rotation: 0, y: 0, duration: 0.55, ease: 'power3.out' },
		);
	} else {
		// Mobile : la feuille remonte depuis le bas de l'écran
		gsap.fromTo(feuille, { autoAlpha: 1, yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: 'power3.out' });
	}
}

export function fermerReservation() {
	const el = elements();
	if (!el || !el.modale.open) return;
	const { modale, voile, feuille } = el;

	const fin = () => {
		modale.close();
		document.documentElement.style.overflow = '';
		gsap.set(feuille, { clearProps: 'all' });
		afficherFormulaire();
	};

	gsap.killTweensOf([voile, feuille]);
	gsap.to(voile, { autoAlpha: 0, duration: 0.3, ease: 'power1.in' });

	if (mouvementReduit()) {
		gsap.to(feuille, { autoAlpha: 0, duration: 0.2, onComplete: fin });
	} else if (ecranLarge()) {
		gsap.to(feuille, { autoAlpha: 0, rotation: -1, y: 12, duration: 0.3, ease: 'power2.in', onComplete: fin });
	} else {
		gsap.to(feuille, { yPercent: 100, duration: 0.4, ease: 'power2.in', onComplete: fin });
	}
}

/** Revient au formulaire vierge (à la fermeture). */
export function afficherFormulaire() {
	const el = elements();
	if (!el) return;
	el.formulaire.hidden = false;
	el.confirmation.hidden = true;
	el.formulaire.querySelector('form')?.reset();
	el.formulaire.querySelectorAll('[aria-invalid]').forEach((champ) => champ.removeAttribute('aria-invalid'));
	afficherErreurEmail(null);
	afficherErreurFormulaire(null);
}

/** Passe à l'écran « C'est noté ! » avec les informations de la réservation. */
export function afficherConfirmation(infos: { email: string; numero: number; newsletter: boolean; emailEnvoye: boolean }) {
	const el = elements();
	if (!el) return;
	const { formulaire, confirmation, feuille } = el;

	confirmation.querySelectorAll('[data-confirmation-email]').forEach((email) => (email.textContent = infos.email));
	confirmation.querySelector('[data-confirmation-numero]')!.textContent = String(infos.numero);
	confirmation.querySelector<HTMLElement>('[data-confirmation-newsletter]')!.hidden = !infos.newsletter;
	// E-mail non parti (Resend non configuré ou en mode test) : on invite à noter le numéro
	confirmation.querySelector<HTMLElement>('[data-confirmation-mail-envoye]')!.hidden = !infos.emailEnvoye;
	confirmation.querySelector<HTMLElement>('[data-confirmation-mail-absent]')!.hidden = infos.emailEnvoye;

	formulaire.hidden = true;
	confirmation.hidden = false;
	// opacité seule (pas autoAlpha) : un bloc en visibility: hidden ne peut pas recevoir le focus
	if (!mouvementReduit()) gsap.fromTo(confirmation, { opacity: 0 }, { opacity: 1, duration: 0.35 });
	feuille.querySelector('[data-papier]')?.scrollTo({ top: 0 });
	// Le bouton d'envoi vient d'être masqué : on place le focus sur le titre pour que le lecteur d'écran l'annonce
	confirmation.querySelector<HTMLElement>('[data-confirmation-titre]')!.focus();
}

/** Affiche (ou retire avec `null`) l'erreur sous le champ e-mail. */
export function afficherErreurEmail(message: string | null = 'Cette adresse a déjà réservé sa place. Une seule place par adresse e-mail.') {
	const el = elements();
	if (!el) return;
	const { champEmail } = el;
	const saisie = champEmail.querySelector('input')!;

	if (message) {
		champEmail.dataset.erreur = '';
		champEmail.querySelector('[data-message-erreur]')!.textContent = message;
		saisie.setAttribute('aria-invalid', 'true');
	} else {
		delete champEmail.dataset.erreur;
		saisie.removeAttribute('aria-invalid');
	}
}

/** Affiche (ou retire avec `null`) une erreur générale au-dessus du bouton d'envoi (anti-robot, complet, réseau…). */
export function afficherErreurFormulaire(message: string | null) {
	const el = elements();
	if (!el) return;
	el.erreurFormulaire.hidden = !message;
	el.erreurFormulaire.querySelector('[data-message-erreur]')!.textContent = message ?? '';
}
