import { RESEND_API_KEY, RESEND_EXPEDITEUR } from 'astro:env/server';

// E-mail de confirmation envoyé via l'API Resend.
// Sans domaine vérifié (mode test), Resend n'accepte que l'adresse du propriétaire du compte comme destinataire :
// pour les autres adresses l'envoi échoue, la réservation reste valable et la modale affiche le numéro.

const echapper = (texte: string) =>
	texte.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function envoyerConfirmation(infos: { email: string; nom: string; numero: number; total: number; newsletter: boolean }): Promise<boolean> {
	if (!RESEND_API_KEY) return false;

	const nom = echapper(infos.nom);
	const html = `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;padding:32px;background:#fffdf8;color:#1b1310">
	<p style="font-family:cursive;color:#6e1e1f;font-size:22px;margin:0 0 8px">C’est noté !</p>
	<h1 style="font-style:italic;font-weight:normal;font-size:28px;margin:0 0 20px">Votre place est réservée</h1>
	<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">Bonjour ${nom},<br>votre réservation pour l’événement Méert × Oxford est confirmée. Cet e-mail fait office de billet&nbsp;: présentez-le à l’entrée.</p>
	<p style="display:inline-block;border:2px solid #6e1e1f;border-radius:999px;padding:10px 24px;font-size:26px;color:#6e1e1f;font-weight:bold">Place n° ${infos.numero} / ${infos.total}</p>
	${infos.newsletter ? '<p style="font-family:Arial,sans-serif;font-size:13px;color:#6b5b4e">Vous recevrez aussi les nouvelles de la collab.</p>' : ''}
	<p style="font-family:Arial,sans-serif;font-size:13px;color:#6b5b4e">À très vite autour d’une gaufre&nbsp;!</p>
</div>`;

	try {
		const reponse = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: RESEND_EXPEDITEUR,
				to: [infos.email],
				subject: `Votre place n° ${infos.numero} — Méert × Oxford`,
				html,
				text: `Bonjour ${infos.nom},\n\nVotre place n° ${infos.numero} / ${infos.total} pour l'événement Méert × Oxford est réservée. Présentez cet e-mail à l'entrée.\n\nÀ très vite autour d'une gaufre !`,
			}),
		});
		if (!reponse.ok) console.error('[resend] envoi refusé', reponse.status, await reponse.text());
		return reponse.ok;
	} catch (erreur) {
		console.error('[resend] envoi impossible', erreur);
		return false;
	}
}
