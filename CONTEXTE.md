# JD KEY — Contexte du projet (pour reprendre dans une nouvelle conversation)
Mis à jour le 21/10/2026.

## L'entreprise
- JD KEY, serrurier automobile agréé SERMI, 7 rue Guy de Maupassant, 76800 Saint-Étienne-du-Rouvray. Tél. 06 98 95 13 99, jdkey.contact@gmail.com, SIRET 938 428 711 00015.
- Intervient 24h/24, 7j/7, Rouen et 30 km. Fiche Google : https://www.google.com/maps?cid=16242274737633797430
- Charte : anthracite mat (#2b3436), or (#b8975f), blanc. Police Montserrat.

## Prix (source unique : assets/js/pricing.js)
- Ouverture : 80 € (7h-19h), 90 € (19h-21h), 110 € (après 21h) ; +20 € double condamnation groupe VW 2020+. Déplacement inclus à Rouen. Même tarif dimanche/fériés.
- Doubles (prix au local, déplacement en supplément au cas par cas) : clone ID46 80 €, clone ID48 90 €, ID46 avant 2010 130 €, ID46 après 2010 135 €, ID48 140 €, carte Renault ID46 (Mégane 3, Scénic 3) 140 €, carte 4A (Clio 4) 150 €, MQB (VW) 160-170 €, récents PSA/Renault 4A 180-230 €, récents groupe VW dès 250 €.
- Perte totale : dès 200 €, prix selon le véhicule, déplacement inclus à Rouen.
- Clé cassée / coque : dès 60 €. Programmation / démarrage : sur devis.

## Le site (en ligne sur https://jdkey-auto-rouen.fr)
- Code : GitHub jdkey76/jdkey-site (branche main) → Netlify déploie automatiquement à chaque envoi.
- Générateur maison : `python3 build.py` (src/pages + src/partials → public/). Pages services et villes générées par tools/gen_services.py et tools/gen_zone.py.
- 20 pages indexées : accueil, ouverture, perte, double, programmation, clé cassée/coque, tarifs (+ simulateur), réservation, FAQ, zone + 7 villes (Rouen, St-Étienne-du-Rouvray, Sotteville, Mont-St-Aignan, Grand-Quevilly, Elbeuf, Barentin), à propos, mentions, confidentialité, 404.
- Réservation sur mesure : créneaux 1 h, 9h-18h, 7j/7 (règles dans netlify/lib/core.mjs). Fonctions Netlify + Netlify Blobs.
- Espace privé : /admin-planning/ (code ADMIN_PIN) avec 3 onglets : Planning, Statistiques du site (mesure anonyme sans cookie), Avis clients (demande d'avis : envoi manuel SMS/WhatsApp en 1 geste ; automatique à 19h30 si BREVO_API_KEY).
- Agenda : flux des réservations /api/agenda.ics?cle=AGENDA_KEY (abonné sur l'iPhone) ; agenda perso iCloud (GCAL_ICS_URL) qui bloque les créneaux, y compris les rendez-vous récurrents.
- Variables Netlify en place : ADMIN_PIN, AGENDA_KEY, GCAL_ICS_URL (lien iCloud renouvelé le 21/10), REVIEW_URL. Pas de BREVO_API_KEY (choix : manuel pour l'instant).
- E-mails : notification Netlify Forms vers jdkey.contact@gmail.com (formulaires contact + reservation).
- SEO : Search Console validée (balise meta), sitemap envoyé, indexation demandée pour 5 pages. Lighthouse 99-100.

## Google Ads (compte 5683132791, via Adspirer)
- Balise AW-18293195563. Conversions du site : Clic appel (b_q1CN7NjqEdEKuG8JJE), WhatsApp (o5vqCKqZh6EdEKuG8JJE), Formulaire (4s3GCPDcj6EdEKuG8JJE), Réservation (b56BCMCdh6EdEKuG8JJE). Configurées dans site.config.json.
- Campagne active : « JD KEY - Search Rouen » (ID 24365638505), 8 €/jour, maximiser les clics (plafond 3 €), 5 groupes d'annonces avec pages d'arrivée dédiées, 5 liens annexes, mot exclu « 72 » (+ 86 négatifs).
- Campagne intelligente « Spécialiste Clé Automobile » (ID 23993848937) : en pause depuis le 19/10.
- Règle : passer en « maximiser les conversions » vers 30 vrais appels. Les conversions « itinéraire » de la campagne intelligente ne sont pas modifiables par l'API.
- Premiers résultats : 19/10 = 6 appels pour 10,58 € ; 20/10 = 11,79 €, 16 clics, 4 demandes (dont 1re réservation en ligne : double 407, jeudi 22/10 14h).

## À faire
Voir A-FAIRE.md. Bilan hebdomadaire Google Ads prévu lundi 26/10 au soir.
