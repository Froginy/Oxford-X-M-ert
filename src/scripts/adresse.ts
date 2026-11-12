// Adresse du domicile dans le formulaire de réservation :
// - suggestions pendant la saisie (liste déroulante accessible au clavier, rôle combobox) ;
// - bouton « Utiliser ma position » : position de l'appareil → adresse la plus proche.
// Service : API de géocodage de l'IGN (Géoplateforme, successeur de l'API Adresse), gratuit, sans clé.
// France uniquement ; pour une adresse à l'étranger, les champs se remplissent à la main.

const API = 'https://data.geopf.fr/geocodage';
const MINIMUM = 3; // caractères avant de chercher
const ATTENTE = 250; // ms sans frappe avant d'interroger l'API

type Adresse = { label: string; name: string; postcode: string; city: string };

async function geocoder(chemin: string, parametres: Record<string, string>, signal?: AbortSignal): Promise<Adresse[]> {
	const url = `${API}/${chemin}?${new URLSearchParams({ index: 'address', ...parametres })}`;
	const reponse = await fetch(url, { signal });
	if (!reponse.ok) throw new Error(`géocodage ${reponse.status}`);
	const { features } = (await reponse.json()) as { features: { properties: Adresse }[] };
	return features.map((f) => f.properties);
}

export function adresse(bloc: HTMLElement) {
	const rue = bloc.querySelector<HTMLInputElement>('[data-adresse-rue]')!;
	const codePostal = bloc.querySelector<HTMLInputElement>('[data-adresse-cp]')!;
	const ville = bloc.querySelector<HTMLInputElement>('[data-adresse-ville]')!;
	const liste = bloc.querySelector<HTMLUListElement>('[data-adresse-suggestions]')!;
	const position = bloc.querySelector<HTMLButtonElement>('[data-adresse-position]')!;
	const statut = bloc.querySelector<HTMLElement>('[data-adresse-statut]')!;

	let suggestions: Adresse[] = [];
	let active = -1;
	let minuterie: number | undefined;
	let requete: AbortController | undefined;

	const remplir = (a: Adresse) => {
		rue.value = a.name;
		codePostal.value = a.postcode;
		ville.value = a.city;
		[rue, codePostal, ville].forEach((champ) => champ.removeAttribute('aria-invalid'));
	};

	const fermer = () => {
		liste.hidden = true;
		liste.replaceChildren();
		rue.setAttribute('aria-expanded', 'false');
		rue.removeAttribute('aria-activedescendant');
		suggestions = [];
		active = -1;
	};

	const surligner = (index: number) => {
		active = index;
		liste.querySelectorAll('[role="option"]').forEach((option, i) => {
			option.setAttribute('aria-selected', String(i === index));
			if (i === index) option.scrollIntoView({ block: 'nearest' });
		});
		if (index >= 0) rue.setAttribute('aria-activedescendant', `adresse-suggestion-${index}`);
		else rue.removeAttribute('aria-activedescendant');
	};

	const choisir = (index: number) => {
		const choix = suggestions[index];
		if (!choix) return;
		remplir(choix);
		fermer();
		statut.textContent = `Adresse sélectionnée : ${choix.label}.`;
	};

	const afficher = (resultats: Adresse[]) => {
		suggestions = resultats;
		active = -1;
		if (!resultats.length) return fermer();
		liste.replaceChildren(
			...resultats.map((a, i) => {
				const option = document.createElement('li');
				option.id = `adresse-suggestion-${i}`;
				option.setAttribute('role', 'option');
				option.setAttribute('aria-selected', 'false');
				option.className = 'cursor-pointer px-3 py-2 aria-selected:bg-creme-oxford hover:bg-creme-oxford';
				option.textContent = a.label;
				// mousedown (avant la perte de focus du champ) pour que le clic soit pris en compte
				option.addEventListener('mousedown', (e) => {
					e.preventDefault();
					choisir(i);
				});
				return option;
			}),
		);
		liste.hidden = false;
		rue.setAttribute('aria-expanded', 'true');
		statut.textContent = `${resultats.length} adresse${resultats.length > 1 ? 's' : ''} suggérée${resultats.length > 1 ? 's' : ''}, flèches haut et bas pour choisir.`;
	};

	rue.addEventListener('input', () => {
		window.clearTimeout(minuterie);
		requete?.abort();
		const texte = rue.value.trim();
		if (texte.length < MINIMUM) return fermer();
		minuterie = window.setTimeout(async () => {
			requete = new AbortController();
			try {
				afficher(await geocoder('search', { q: texte, autocomplete: '1', limit: '5' }, requete.signal));
			} catch (erreur) {
				if ((erreur as Error).name !== 'AbortError') fermer();
			}
		}, ATTENTE);
	});

	rue.addEventListener('keydown', (e) => {
		if (liste.hidden) return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			const sens = e.key === 'ArrowDown' ? 1 : -1;
			surligner((active + sens + suggestions.length) % suggestions.length);
		} else if (e.key === 'Enter' && active >= 0) {
			e.preventDefault();
			choisir(active);
		} else if (e.key === 'Escape') {
			// la liste se ferme, la modale reste ouverte
			e.preventDefault();
			e.stopPropagation();
			fermer();
		}
	});

	rue.addEventListener('blur', fermer);
	rue.form?.addEventListener('reset', () => {
		fermer();
		statut.textContent = '';
	});

	// Position de l'appareil → adresse la plus proche
	if (!('geolocation' in navigator)) position.hidden = true;
	position.addEventListener('click', () => {
		position.disabled = true;
		statut.textContent = 'Recherche de votre position…';
		navigator.geolocation.getCurrentPosition(
			async ({ coords }) => {
				try {
					const [trouvee] = await geocoder('reverse', { lon: String(coords.longitude), lat: String(coords.latitude), limit: '1' });
					if (trouvee) {
						remplir(trouvee);
						statut.textContent = `Adresse trouvée : ${trouvee.label}. Vérifiez-la avant d’envoyer.`;
					} else {
						statut.textContent = 'Aucune adresse trouvée à cet endroit : saisissez-la à la main.';
					}
				} catch {
					statut.textContent = 'Le service d’adresses ne répond pas : saisissez votre adresse à la main.';
				} finally {
					position.disabled = false;
				}
			},
			(erreur) => {
				position.disabled = false;
				statut.textContent =
					erreur.code === erreur.PERMISSION_DENIED
						? 'Accès à la position refusé : saisissez votre adresse à la main.'
						: 'Position introuvable : saisissez votre adresse à la main.';
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
		);
	});
}
