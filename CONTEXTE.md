# JD KEY — Contexte du projet (pour reprendre dans une nouvelle conversation)
Mis à jour le 21/10/2026.

## L'entreprise
- JD KEY, serrurier automobile agréé SERMI, 7 rue Guy de Maupassant, 76800 Saint-Étienne-du-Rouvray. Tél. 06 98 95 13 99, jdkey.contact@gmail.com, SIRET 938 428 711 00015.
- Intervient 24h/24, 7j/7, Rouen et 30 km. Fiche Google : https://www.google.com/maps?cid=16242274737633797430
- Charte : anthracite mat (#2b3436), or (#b8975f), blanc. Police Montserrat.
- Logo officiel : clé + télécommande au-dessus de « JD KEY » (assets/img/logo-jdkey-600.png). Pictogramme seul : logo-jdkey-symbole.png (en-tête/pied du site) ; icônes : /favicon.ico, favicon-jdkey-192/512.png, apple-touch-icon-jdkey.png (depuis le 21/10).

## Prix (source unique : assets/js/pricing.js)
- Ouverture : 80 € (7h-19h), 90 € (19h-21h), 110 € (après 21h) ; +20 € double condamnation groupe VW 2020+. Déplacement inclus à Rouen. Même tarif dimanche/fériés.
- Doubles (prix au local, déplacement en supplément au cas par cas) : clone ID46 80 €, clone ID48 90 €, ID46 avant 2010 130 €, ID46 après 2010 135 €, ID48 140 €, carte Renault ID46 (Mégane 3, Scénic 3) 140 €, carte 4A (Clio 4) 150 €, MQB (VW) 160-170 €, récents PSA/Renault 4A 180-230 €, récents groupe VW dès 250 €.
- Perte totale : dès 200 €, prix selon le véhicule, déplacement inclus à Rouen.
- Clé cassée / coque : dès 60 €. Programmation / démarrage : sur devis.

## Le site (en ligne sur https://jdkey-auto-rouen.fr)
- Code : GitHub jdkey76/jdkey-site (branche main) → Netlify déploie automatiquement à chaque envoi.
- Générateur maison : `python3 build.py` (src/pages + src/partials → public/). Pages services et villes générées par tools/gen_services.py et tools/gen_zone.py.
- 21 pages indexées (dont, depuis le 22/10, /cle-perdue-remboursement-assurance/ : plafonds clés par banque, relevés le 22/10/2026, à revérifier tous les 6 mois) : accueil, ouverture, perte, double, programmation, clé cassée/coque, tarifs (+ simulateur), réservation, FAQ, zone + 7 villes (Rouen, St-Étienne-du-Rouvray, Sotteville, Mont-St-Aignan, Grand-Quevilly, Elbeuf, Barentin), à propos, mentions, confidentialité, 404.
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

## Journal des demandes (suivi commercial)
- Page privée Claude : https://claude.ai/artifact/G1yBE2EoszJLLr38nf97vk (base « demandes », 1 document par appel : date, véhicule, année, prestation, lieu, prix, statut attente/gagné/perdu, source, raison).
- JD KEY envoie un récap chaque soir → Claude l'enregistre. Aux bilans, Claude lit toute la base (ArtifactData list « demandes ») pour l'analyse.
- Groupe d'annonces « 5 – Marque JD KEY » mis en pause le 21/10 (déjà n°1 en naturel sur le nom).

## Prospection LinkedIn (depuis le 22/10)
- Page privée : https://claude.ai/artifact/2LMAphLGV6XXxNzK9hf2UL (base « prospects » : 20 cibles — loueurs, flottes LLD, public, assisteurs, concessions, garages, auto-école — avec invitation et message personnalisés, statut, suivi). JD KEY envoie lui-même (5 invitations/jour) ; Claude prépare une nouvelle liste chaque semaine.
- Meta Ads : en attente. Point programmé le 30/11/2026 à 20 h dans cette conversation.

## Inokey
- Abonnement 130 €/mois : envoie toutes les demandes de doubles et pertes totales de la région, avec les coordonnées des clients (1er client connu : Kadjar 2017, 280 €, le 22/10). À comparer chaque mois à Google Ads.

## Bilan au 29/10 (journal + Google Ads + site)
- Journal 17-29/10 : 42 demandes (+2 appels manqués). 12 gagnées = 2 050 € (panier moyen 171 €), 11 RDV/commandes à venir = 1 420 €, 11 en attente = 2 200 €, 8 perdues.
- Semaine 23-29/10 : 24 demandes, 8 gagnées, 1 410 € (contre 18 / 4 / 640 € la semaine d'avant).
- Par prestation : double 15 demandes (2 faites, 7 RDV : délai long), perte totale 9 (3 gagnées à 190-300 €, 3 perdues sur le prix ou sans réponse), ouverture 4 (3 gagnées), programmation/démarrage 5 (3 gagnées).
- Sources connues des gagnés : Google 4 (680 €), site 2 (230 €), partenaire dépanneur 1 (300 €), Inokey 1 (280 €), bouche-à-oreille 1 (190 €). 25 demandes sans source notée.
- Google Ads Search 19-29/10 : 83,32 € (+5,59 € campagne intelligente le 19/10), 0,51-0,59 €/clic, CTR 15 %. Semaine 23-29 : 49,81 €, 97 clics, budget perdu 27 %. La requête « jd key auto rouen » déclenche encore les groupes Double et Urgence (3,39 € sur la semaine) → exclure « jd key ».
- Site 21-29/10 : 212 visites (114 annonce, 49 Google naturel), 104 simulations « double », 12 clics appel, 7 WhatsApp, 3 réservations.
- Search Console 20-26/10 vs semaine d'avant : 26 clics (+24 %), 944 affichages (+87 %) ; l'accueil reste en position 1-4 sur « serrurier automobile rouen ».
- ⚠ Netlify (offre gratuite, 300 crédits/mois, 15 crédits par mise en ligne = 20 mises en ligne/mois) : crédits épuisés le 22/10 → envois du 23/10 « Skipped ». Depuis le 29/10 : les commits qui ne touchent que des .md ne déclenchent plus de build (netlify.toml, ignore). Règle : regrouper les modifications du site en une seule mise en ligne.
- Google Ads : mots exclus « jd key », « jdkey », « jd keys » (expression) ajoutés le 29/10 au niveau campagne.

## Bilan au 21/10 (pour reprendre)
- 19-21/10 : 30,61 € de pub, 15 contacts (~2 €/contact), 2 gagnés (Fiesta 130 €, ouverture 207 80 €), 1 perdu (Clio 3, concurrent à 150 € selon le client), ~1 460 € de devis en attente. Google Ads ne compte que ~4 contacts sur 15 : le reste vient de la fiche Google / du site → demander la source à chaque appel.
- Stats du site (mesure active depuis le 20/10 23 h) : 21/10 = 32 visites (11 annonce, 4 Google naturel, 17 directes dont visites perso), 14 simulations dont 11 double, 2 clics appel, 9 vues réservation sans réservation. Lecture : navigateur de l'app Claude (case « Rester connecté » depuis le 22/10, sinon code saisi par JD KEY), puis fetch /api/stats?days=N avec x-admin-pin.

## À faire
Voir A-FAIRE.md. Bilan hebdomadaire Google Ads prévu lundi 26/10 au soir.
