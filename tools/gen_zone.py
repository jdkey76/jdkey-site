#!/usr/bin/env python3
"""Génère /zone-intervention/, les pages villes et /a-propos/.
Relancer après modification : python3 tools/gen_zone.py && python3 build.py"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://jdkey-auto-rouen.fr"

# Contenu propre à chaque ville (évite les pages « copier-coller » que Google pénalise)
VILLES = [
  {"slug": "rouen", "nom": "Rouen", "cp": "76000", "km": "environ 7 km",
   "intro": "Rive droite ou rive gauche, centre historique ou hauteurs de la ville : JD KEY intervient partout à Rouen pour les clés de voiture, 24h/24.",
   "contexte": "Dans le centre de Rouen, la voiture est souvent garée dans un parking souterrain ou sur une place payante : une clé enfermée ou perdue devient vite un casse-tête. Nous intervenons directement sur place, y compris en parking, sans remorquage.",
   "lieux": ["Centre historique et Vieux-Marché", "Rive gauche et quartier Saint-Sever", "Gare Rouen Rive-Droite", "Hauts de Rouen", "Quartiers Est et Ouest"],
   "voisins": ["mont-saint-aignan", "sotteville-les-rouen", "grand-quevilly"]},
  {"slug": "saint-etienne-du-rouvray", "nom": "Saint-Étienne-du-Rouvray", "cp": "76800", "km": "notre commune",
   "intro": "Notre local est à Saint-Étienne-du-Rouvray, 7 rue Guy de Maupassant : c'est ici que nous réalisons les doubles et réparations sur rendez-vous, et d'ici que nous partons en urgence.",
   "contexte": "Habitants et salariés de Saint-Étienne-du-Rouvray profitent du délai d'intervention le plus court. Pour un double de clé ou un changement de coque, venez directement au local : pas de frais de déplacement.",
   "lieux": ["Centre-ville", "Technopôle du Madrillet", "Quartier du Château Blanc", "La Houssière", "Zones d'activités"],
   "voisins": ["sotteville-les-rouen", "rouen", "elbeuf"]},
  {"slug": "sotteville-les-rouen", "nom": "Sotteville-lès-Rouen", "cp": "76300", "km": "environ 3 km",
   "intro": "Sotteville-lès-Rouen est à deux pas de notre local : pour une clé enfermée ou perdue, nous arrivons rapidement, de jour comme de nuit.",
   "contexte": "Rues résidentielles, parkings de supermarchés ou abords de la gare de Sotteville : nous ouvrons votre véhicule ou refaisons votre clé là où il se trouve.",
   "lieux": ["Centre-ville et Hôtel de ville", "Quartier de la gare", "Quartiers sud", "Quartiers résidentiels"],
   "voisins": ["saint-etienne-du-rouvray", "rouen", "grand-quevilly"]},
  {"slug": "mont-saint-aignan", "nom": "Mont-Saint-Aignan", "cp": "76130", "km": "environ 10 km",
   "intro": "Sur les hauteurs de Rouen, Mont-Saint-Aignan accueille le campus universitaire et de nombreux quartiers résidentiels : JD KEY y intervient 24h/24 pour toutes les clés de voiture.",
   "contexte": "Étudiants, personnels du campus ou résidents : une clé perdue entre deux cours ou un véhicule verrouillé sur un parking du campus, nous venons à vous.",
   "lieux": ["Campus universitaire", "Village", "Quartiers résidentiels", "Zone d'activités"],
   "voisins": ["rouen", "sotteville-les-rouen", "barentin"]},
  {"slug": "grand-quevilly", "nom": "Le Grand-Quevilly", "cp": "76120", "km": "environ 3 km",
   "intro": "Le Grand-Quevilly est l'une des communes les plus proches de notre local : ouverture de véhicule, perte de clé ou double, nous intervenons rapidement.",
   "contexte": "Zones commerciales, quartiers pavillonnaires ou parkings d'entreprises : nous intervenons partout au Grand-Quevilly et au Petit-Quevilly voisin.",
   "lieux": ["Centre-ville", "Zones commerciales", "Quartiers pavillonnaires", "Le Petit-Quevilly voisin"],
   "voisins": ["rouen", "sotteville-les-rouen", "saint-etienne-du-rouvray"]},
  {"slug": "elbeuf", "nom": "Elbeuf", "cp": "76500", "km": "environ 17 km",
   "intro": "Elbeuf et ses communes voisines (Caudebec-lès-Elbeuf, Saint-Pierre-lès-Elbeuf, Cléon) font partie de notre zone d'intervention : clé enfermée, perdue ou cassée, JD KEY se déplace.",
   "contexte": "Pas besoin de faire remorquer votre voiture jusqu'à une concession de Rouen : nous fabriquons et programmons la clé directement à Elbeuf, là où se trouve le véhicule.",
   "lieux": ["Centre d'Elbeuf", "Caudebec-lès-Elbeuf", "Saint-Pierre-lès-Elbeuf", "Cléon"],
   "voisins": ["saint-etienne-du-rouvray", "grand-quevilly", "rouen"]},
  {"slug": "barentin", "nom": "Barentin", "cp": "76360", "km": "environ 24 km",
   "intro": "Au nord-ouest de Rouen, Barentin et ses environs (Pavilly, Villers-Écalles) sont couverts par JD KEY pour l'ouverture de véhicule, la perte de clé et la programmation.",
   "contexte": "Une clé perdue sur un parking de zone commerciale ou un véhicule bloqué devant chez vous : appelez, nous vous donnons le prix et le délai avant de partir.",
   "lieux": ["Centre de Barentin", "Zone commerciale", "Pavilly", "Villers-Écalles"],
   "voisins": ["mont-saint-aignan", "rouen", "grand-quevilly"]},
]
AUTRES = ["Le Petit-Quevilly", "Bois-Guillaume", "Bihorel", "Maromme", "Déville-lès-Rouen", "Canteleu", "Oissel",
          "Grand-Couronne", "Caudebec-lès-Elbeuf", "Darnétal", "Bonsecours", "Le Mesnil-Esnard", "Franqueville-Saint-Pierre",
          "Isneauville", "Notre-Dame-de-Bondeville", "Petit-Couronne", "Saint-Aubin-lès-Elbeuf", "Cléon", "Pavilly", "Malaunay"]
NOMS = {v["slug"]: v["nom"] for v in VILLES}


def head(title, desc, og, extra_ld):
    return f"---\ntitle: {title}\ndescription: {desc}\nog_title: {og}\npriority: 0.8\n---\n<!-- Page générée par tools/gen_zone.py -->\n<!--HEAD-->\n<script type=\"application/ld+json\">\n{json.dumps(extra_ld, ensure_ascii=False)}\n</script>\n<!--/HEAD-->\n"


def crumbs(items):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(items)]}


SERVICES_BLOCK = '''
<section class="section alt">
  <div class="wrap">
    <div class="section-head center"><h2>Nos prestations à {nom}</h2></div>
    <div class="services">
      <a class="service urgent" href="/ouverture-voiture-rouen/"><span class="ico"><svg><use href="#i-unlock"/></svg></span><h3>Ouverture de véhicule</h3><p>Clé enfermée, porte bloquée. Déplacement inclus.</p><span class="price"><em>dès 80 €</em><span class="more">Voir →</span></span></a>
      <a class="service urgent" href="/perte-cle-voiture-rouen/"><span class="ico"><svg><use href="#i-key"/></svg></span><h3>Perte totale de clés</h3><p>Nouvelle clé sur place. Déplacement inclus.</p><span class="price"><em>dès 200 €</em><span class="more">Voir →</span></span></a>
      <a class="service" href="/double-cle-voiture-rouen/"><span class="ico"><svg><use href="#i-copy"/></svg></span><h3>Double de clé</h3><p>Au local ou chez vous (déplacement en supplément).</p><span class="price"><em>dès 80 €</em><span class="more">Voir →</span></span></a>
    </div>
  </div>
</section>'''


def ville_page(v):
    url = f"/zone-intervention/{v['slug']}/"
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Service", "name": f"Serrurier automobile à {v['nom']}", "serviceType": "Serrurier automobile",
         "provider": {"@id": SITE + "/#entreprise"}, "areaServed": {"@type": "City", "name": v["nom"], "postalCode": v["cp"]}, "url": SITE + url},
        crumbs([("Accueil", "/"), ("Zone d'intervention", "/zone-intervention/"), (v["nom"], url)])]}
    lieux = "".join(f"<li><span>{l}</span></li>" for l in v["lieux"])
    voisins = "".join(f'<li><a href="/zone-intervention/{s}/">{NOMS[s]}</a></li>' for s in v["voisins"])
    return head((f"Serrurier Automobile {v['nom']} – 24h/24 | JD KEY" if len(v['nom']) < 18 else f"Serrurier Auto {v['nom']} – 24h/24 | JD KEY"),
                (lambda d: d if len(d) <= 158 else d.replace(" ☎ 06 98 95 13 99", ""))(f"Serrurier automobile à {v['nom']} : ouverture dès 80 €, perte de clé dès 200 €, double de clé. Agréé SERMI, 24h/24. ☎ 06 98 95 13 99"),
                f"Serrurier automobile à {v['nom']} – JD KEY", ld) + f'''
<section class="hero on-dark">
  <div class="wrap" style="grid-template-columns:1fr">
    <div>
      <span class="eyebrow"><a href="/" style="color:inherit;text-decoration:none">Accueil</a> › <a href="/zone-intervention/" style="color:inherit;text-decoration:none">Zone</a> › {v['nom']}</span>
      <h1>Serrurier automobile à <span>{v['nom']}</span></h1>
      <p class="lead">{v['intro']}</p>
      <div class="hero-ctas">
        <a class="btn btn-gold" href="tel:+33698951399" data-track="ville-{v['slug']}"><svg><use href="#i-phone"/></svg>Appeler le 06 98 95 13 99</a>
        <a class="btn btn-wa" href="https://wa.me/33698951399" target="_blank" rel="noopener" data-track="ville-{v['slug']}"><svg><use href="#i-wa"/></svg>WhatsApp</a>
        <a class="btn btn-ghost" href="/reservation/"><svg><use href="#i-cal"/></svg>Réserver un créneau</a>
      </div>
      <ul class="trust-chips">
        <li><span class="stars" aria-hidden="true">★★★★★</span> 5/5 sur +240 avis Google</li>
        <li><svg><use href="#i-shield"/></svg>Agréé SERMI</li>
        <li><svg><use href="#i-pin"/></svg>{("Notre local est ici" if v['km'].startswith("notre") else v['km'][0].upper() + v['km'][1:] + " de notre local")}</li>
      </ul>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split" style="align-items:start">
    <div>
      <span class="eyebrow">{v['nom']} ({v['cp']})</span>
      <h2>On vient à votre voiture, où qu'elle soit</h2>
      <p>{v['contexte']}</p>
      <p>Comme partout dans notre zone, le prix vous est annoncé au téléphone avant notre départ : <b>80 € pour une ouverture en journée</b> (90 € de 19h à 21h, 110 € après 21h), <b>à partir de 200 € pour une perte totale</b>. Même tarif le dimanche et les jours fériés.</p>
      <p>Avant toute création de clé, nous vérifions la carte grise et une pièce d'identité : c'est une obligation liée à notre agrément SERMI, et votre meilleure protection contre le vol.</p>
    </div>
    <div class="tarif-card">
      <h3>Secteurs couverts à {v['nom']}</h3>
      <ul class="cities" style="margin-bottom:18px">{lieux}</ul>
      <h3>Communes voisines</h3>
      <ul class="cities" style="margin-bottom:0">{voisins}<li><a href="/zone-intervention/">Toutes les communes</a></li></ul>
    </div>
  </div>
</section>
{SERVICES_BLOCK.format(nom=v['nom'])}

<section class="cta-band">
  <div class="wrap">
    <div><h2>Bloqué à {v['nom']} ?</h2><p style="margin:.3em 0 0;font-weight:600">On décroche 24h/24, 7j/7.</p></div>
    <a class="btn btn-dark" href="tel:+33698951399" data-track="ville-{v['slug']}-cta"><svg><use href="#i-phone"/></svg>06 98 95 13 99</a>
  </div>
</section>
'''


def zone_page():
    ld = {"@context": "https://schema.org", "@graph": [crumbs([("Accueil", "/"), ("Zone d'intervention", "/zone-intervention/")])]}
    cartes = "\n".join(
        f'      <a class="service" href="/zone-intervention/{v["slug"]}/"><span class="ico"><svg><use href="#i-pin"/></svg></span><h3>{v["nom"]}</h3><p>{v["cp"]} · {("notre local est ici" if v["km"].startswith("notre") else v["km"] + " du local")}</p><span class="price"><em>24h/24</em><span class="more">Voir →</span></span></a>'
        for v in VILLES)
    autres = "".join(f"<li><span>{a}</span></li>" for a in AUTRES)
    return head("Zone d'Intervention – Rouen et 30 km | JD KEY",
                "JD KEY intervient à Rouen, Saint-Étienne-du-Rouvray, Sotteville, Mont-Saint-Aignan, Grand-Quevilly, Elbeuf, Barentin et dans un rayon de 30 km, 24h/24.",
                "Zone d'intervention JD KEY – Rouen et 30 km autour", ld) + f'''
<section class="page-head on-dark">
  <div class="wrap">
    <span class="eyebrow">Zone d'intervention</span>
    <h1>Rouen et 30 km autour, 24h/24</h1>
    <p class="lead">Depuis notre local de Saint-Étienne-du-Rouvray, nous intervenons dans toute l'agglomération de Rouen et en Seine-Maritime. Au-delà de 30 km, appelez : nous étudions chaque demande.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="services">
{cartes}
    </div>
    <h2 style="margin-top:48px;font-size:1.4rem">Nous intervenons aussi à</h2>
    <ul class="cities">{autres}</ul>
  </div>
</section>

<section class="section alt">
  <div class="wrap split">
    <div>
      <span class="eyebrow">Notre local</span>
      <h2>7 rue Guy de Maupassant, Saint-Étienne-du-Rouvray</h2>
      <p>Doubles de clé, programmation et réparations se font au local, sur rendez-vous, 7 jours sur 7 de 9h à 18h. Pour une ouverture ou une perte de clé, c'est nous qui venons à vous, à toute heure.</p>
      <div class="hero-ctas"><a class="btn btn-dark" href="/reservation/"><svg><use href="#i-cal"/></svg>Réserver au local</a><a class="btn btn-gold" href="https://www.google.com/maps?cid=16242274737633797430" target="_blank" rel="noopener"><svg><use href="#i-pin"/></svg>Itinéraire</a></div>
    </div>
    <div class="map">
      <button class="btn btn-dark" id="map-load" data-src="https://maps.google.com/maps?q=JD%20KEY%20Auto%20Rouen%2C%2049.399319%2C1.06696&amp;z=10&amp;hl=fr&amp;output=embed"><svg><use href="#i-pin"/></svg>Afficher la carte</button>
    </div>
  </div>
</section>
'''


def apropos_page():
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "AboutPage", "url": SITE + "/a-propos/", "about": {"@id": SITE + "/#entreprise"}},
        crumbs([("Accueil", "/"), ("À propos", "/a-propos/")])]}
    return head("À Propos – Serrurier Automobile Agréé SERMI | JD KEY",
                "JD KEY, serrurier automobile agréé SERMI à Saint-Étienne-du-Rouvray : un seul métier, la clé de voiture. Premier exposant au Salon de l'Auto de Rouen.",
                "À propos de JD KEY, serrurier automobile à Rouen", ld) + '''
<section class="page-head on-dark">
  <div class="wrap">
    <span class="eyebrow">À propos</span>
    <h1>Un seul métier : la clé de voiture</h1>
    <p class="lead">JD KEY est une entreprise artisanale de Saint-Étienne-du-Rouvray, spécialisée dans la clé automobile. L'alternative à la concession : plus rapide, plus économique.</p>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div>
      <h2>Un artisan, pas une centrale d'appel</h2>
      <p>Quand vous appelez JD KEY, vous parlez directement à celui qui intervient. Pas de plateforme, pas de sous-traitant, pas de prix qui change à l'arrivée : le tarif est annoncé avant de partir, et c'est celui que vous payez.</p>
      <p>Nous ne faisons que des clés de voiture : ouverture de véhicule, double, programmation, perte totale, réparation. Ce choix nous permet d'investir dans le matériel professionnel adapté à chaque marque et de rester à jour sur les technologies récentes (cartes, clés mains libres, plateformes MQB, clés 4A).</p>
      <h2 style="margin-top:32px">Agréé SERMI</h2>
      <p>L'agrément SERMI est le dispositif européen qui autorise les professionnels indépendants à accéder aux informations de sécurité des constructeurs. Il impose une identification du technicien et une vérification systématique du propriétaire du véhicule : carte grise et pièce d'identité avant toute création de clé.</p>
      <h2 style="margin-top:32px">Premier serrurier auto au Salon de l'Auto de Rouen</h2>
      <p>JD KEY a été le premier serrurier automobile à exposer au Salon de l'Auto de Rouen, aux côtés des concessionnaires de la région. L'occasion de montrer notre savoir-faire en direct et de rencontrer des centaines de conducteurs.</p>
      <div class="hero-ctas"><a class="btn btn-gold" href="tel:+33698951399" data-track="apropos"><svg><use href="#i-phone"/></svg>06 98 95 13 99</a><a class="btn btn-dark" href="/#avis">Lire les avis clients</a></div>
    </div>
    <div class="photo-duo">
      <figure class="ph-main">
        <picture>
          <source type="image/webp" srcset="/assets/img/jdkey-salon-auto-rouen-600.webp 600w, /assets/img/jdkey-salon-auto-rouen-1000.webp 1000w" sizes="(max-width:900px) 90vw, 460px">
          <img src="/assets/img/jdkey-salon-auto-rouen-1000.jpg" width="1000" height="1333" loading="lazy" decoding="async" alt="JD KEY sur son stand au Salon de l'Auto de Rouen">
        </picture>
        <figcaption>Salon de l'Auto de Rouen</figcaption>
      </figure>
      <figure class="ph-small">
        <picture>
          <source type="image/webp" srcset="/assets/img/jdkey-local-saint-etienne-du-rouvray-600.webp">
          <img src="/assets/img/jdkey-local-saint-etienne-du-rouvray-1000.jpg" width="1000" height="1333" loading="lazy" decoding="async" alt="Le local JD KEY à Saint-Étienne-du-Rouvray">
        </picture>
        <figcaption>Le local</figcaption>
      </figure>
      <div class="ph-badge"><svg viewBox="0 0 24 24"><use href="#i-shield"/></svg><span><b>Agréé SERMI</b>+240 avis 5 étoiles</span></div>
    </div>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="trustbar" style="border-radius:18px;overflow:hidden"><div class="wrap" style="padding:0">
      <div class="item"><svg><use href="#i-clock"/></svg><div><b>24h/24 · 7j/7</b><span>Même tarif le dimanche</span></div></div>
      <div class="item"><svg><use href="#i-shield"/></svg><div><b>Agréé SERMI</b><span>Technicien identifié</span></div></div>
      <div class="item"><svg><use href="#i-star"/></svg><div><b>5/5 · +240 avis</b><span>Avis Google vérifiés</span></div></div>
      <div class="item"><svg><use href="#i-card"/></svg><div><b>Prix annoncé avant</b><span>CB, espèces, Wero</span></div></div>
    </div></div>
  </div>
</section>
'''


pages = {"zone-intervention": zone_page(), "a-propos": apropos_page()}
for v in VILLES:
    pages["zone-intervention__" + v["slug"]] = ville_page(v)
for name, content in pages.items():
    with open(os.path.join(ROOT, "src", "pages", name + ".html"), "w", encoding="utf-8") as f:
        f.write(content)
    print("page", name)
