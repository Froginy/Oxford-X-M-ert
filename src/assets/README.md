# Assets graphiques Méert × Oxford

Exportés depuis le Figma du projet (page « Page », maquette desktop 1440). Tous les SVG sont décoratifs : les utiliser avec `alt=""`.

```astro
---
import tampon from '../assets/objets/tampon.svg';
---
<img src={tampon.src} alt="" class="w-48 mix-blend-multiply" />
```

## Dossiers

| Dossier | Contenu |
| --- | --- |
| `logos/` | `oxford.png`, logo Oxford fourni (1027×578). Les logos Méert et collab ne sont pas encore dans le Figma (placeholders « Logo »). |
| `motifs/` | Les 5 grands motifs de fond tracés d'une seule ligne, en sable : `gaufre`, `cahier`, `poche-a-douille`, `fouet`, `crayon`. Non tournés : appliquer la rotation de la maquette en CSS. |
| `objets/` | Les objets du patchwork. Gaufres et cahiers flottants (`gaufre-*`, `cahier-*`), objets de la hero (`tampon`, `sticker`, `doodle`, `ruban`, `timbre`, `papier-gaufres`) et objets des autres sections (`feuille-seyes`, `feuille-petits-carreaux`, `citation-tapee`, `etiquette-numerotee`, `ticket-atelier`, `post-it-reserver`). |
| `pictos/` | Pictos dessinés des 3 piliers (section storytelling) : `transmission` (cahier), `qualite` (fouet), `savoir-faire` (poche). |
| `header/` | `contour-ouvert` (contour gribouillé de la barre ouverte, 1200×84) et `burger` (état réduit, 60×60). |
| `hero/` | Fond de la hero : zone Oxford courbe et ligne de division, une version par maquette (desktop, `-tablette`, `-mobile`). |
| `modale/` | Modale de réservation, direction « Le carnet Oxford » : `papier-petits-carreaux`, `spirale`, `tache-cafe` (anneau + lion), `gaufre-croquee`, `numero-de-place-entoure`. |

## À savoir

- **Rotation et ombre déjà incluses** : les gaufres et cahiers flottants sont exportés à plat, à faire tourner en CSS. Tous les autres objets (`tampon`, `sticker`, `doodle`, `ruban`, `timbre`, `papier-gaufres`, `feuille-*`, `citation-tapee`, `etiquette-numerotee`, `ticket-atelier`, `post-it-reserver`, `tache-cafe`) sont exportés tels qu'ils sont posés dans la maquette, avec leur rotation et leur ombre.
- **Lion teinté** : `tampon` et `tache-cafe` contiennent le lion Oxford teinté en « produit » (multiply) dans Figma. Ajouter la classe `mix-blend-multiply` sur l'image, sinon un rectangle blanc reste visible derrière le lion. `sticker` et `doodle` n'en ont pas besoin.
- **Poids** : `tampon`, `sticker`, `doodle` et `tache-cafe` (~200–285 Ko) embarquent le logo Oxford en PNG.
- **Pas encore dessinés dans le Figma** : « Élément dessiné – Soulignement » et « Élément dessiné – Étoile » (section storytelling) sont des cadres vides.
