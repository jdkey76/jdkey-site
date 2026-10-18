# Site JD KEY — mode d'emploi

## Ce qu'il y a dedans
- `src/pages/` : une page = un fichier (`tarifs.html` → /tarifs/).
- `src/partials/` : parties communes à toutes les pages (balise Google, menu, pied de page, simulateur de prix).
- `assets/js/pricing.js` : **la grille de prix**. Modifier un montant ici le change partout (simulateur, réservation).
- `assets/` : style, scripts, photos.
- `netlify/functions/` : le planning de réservation (créneaux, réservation, annulation, espace planning, flux agenda).
- `netlify/lib/core.mjs` : **les règles du planning** (horaires 9h-18h, jours ouverts, délai minimum, horizon de 30 jours).
- `site.config.json` : ID de balise Google Ads et étiquettes de conversion.
- `public/` : site final généré automatiquement. Ne pas modifier à la main.

## Mise en ligne sur Netlify (important)
Le planning utilise des « fonctions Netlify » : le site doit être déployé **depuis un dépôt Git (GitHub)** relié à Netlify,
ou avec la commande `netlify deploy`. Le simple glisser-déposer d'un dossier ne déploie pas les fonctions.
Netlify exécute tout seul `python3 build.py` et installe les dépendances (voir `netlify.toml`, `package.json`).

## Réglages à faire une fois dans Netlify
Site configuration > Environment variables :
| Variable | Rôle |
| --- | --- |
| `ADMIN_PIN` | Code d'accès à l'espace planning `/admin-planning/` (choisir 6 chiffres ou plus) |
| `AGENDA_KEY` | Clé secrète du flux agenda (ex. une suite de lettres au hasard) |
| `GCAL_ICS_URL` | Facultatif : « Adresse secrète au format iCal » de ton Google Agenda. Tes rendez-vous personnels bloquent alors automatiquement les créneaux du site. |

Puis Forms > Form notifications : ajouter une notification e-mail vers jdkey.contact@gmail.com pour les formulaires
`contact` (demande de rappel) et `reservation` (chaque nouveau rendez-vous).

## Voir les réservations
- Sur le téléphone : `https://jdkey-auto-rouen.fr/admin-planning/` (bloquer un créneau ou une journée, annuler, appeler le client).
- Dans l'agenda du téléphone : s'abonner à `https://jdkey-auto-rouen.fr/api/agenda.ics?cle=TA_CLE_AGENDA`
  (iPhone : Réglages > Calendrier > Comptes > Ajouter un calendrier avec abonnement).

## Balise Google Ads
Dans `site.config.json`, renseigner `google_tag_id` (AW-…) et les 4 libellés de conversion. Les 4 conversions ont été
créées dans Google Ads le 18/10/2026 : Site – Clic appel, Site – Clic WhatsApp, Site – Formulaire de rappel,
Site – Réservation en ligne.

## Tester en local
`npm install` puis `npm run dev`, ouvrir http://localhost:8888 (code admin de test : 1234).
