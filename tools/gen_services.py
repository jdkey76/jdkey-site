#!/usr/bin/env python3
"""Génère les pages de services (src/pages/*.html) à partir des contenus ci-dessous.
Relancer après modification : python3 tools/gen_services.py && python3 build.py"""
import json, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://jdkey-auto-rouen.fr"
TEL = '<a class="btn btn-gold" href="tel:+33698951399" data-track="{t}"><svg><use href="#i-phone"/></svg>{label}</a>'
WA = '<a class="btn btn-wa" href="https://wa.me/33698951399?text={msg}" target="_blank" rel="noopener" data-track="{t}"><svg><use href="#i-wa"/></svg>WhatsApp</a>'
BOOK = '<a class="btn btn-ghost" href="/reservation/?service={s}"><svg><use href="#i-cal"/></svg>Réserver un créneau</a>'

OTHERS = {
    "ouverture": ("/ouverture-voiture-rouen/", "i-unlock", "Ouverture de véhicule", "Clé enfermée, porte bloquée.", "dès 80 €"),
    "perte": ("/perte-cle-voiture-rouen/", "i-key", "Perte totale de clés", "Nouvelle clé sur place.", "dès 200 €"),
    "double": ("/double-cle-voiture-rouen/", "i-copy", "Double de clé", "Télécommande, carte, puce.", "dès 80 €"),
    "programmation": ("/programmation-cle-voiture-rouen/", "i-remote", "Programmation de clé", "Télécommande, carte, démarrage.", "sur devis"),
    "coque": ("/cle-cassee-reparation-coque/", "i-tool", "Clé cassée, coque", "Réparation et remplacement.", "dès 60 €"),
}

PAGES = [
  {
    "slug": "perte-cle-voiture-rouen", "key": "perte", "service": "perte", "urgent": True,
    "title": "Perte de Clé de Voiture Rouen – dès 200 € | JD KEY",
    "description": "Toutes vos clés de voiture perdues à Rouen ? Nouvelle clé faite sur place, même sans double, antidémarrage reprogrammé. Dès 200 €, 24h/24.",
    "og": "Perte de clé de voiture à Rouen : nouvelle clé sur place – JD KEY",
    "crumb": "Perte de clé", "h1": "Clés de voiture perdues ? <span>Nouvelle clé sur place</span>",
    "lead": "Plus aucune clé, même pas de double ? Inutile de faire remorquer la voiture chez le concessionnaire et d'attendre une commande. JD KEY vient à votre véhicule à Rouen et dans le 76, fabrique une clé neuve et reprogramme l'antidémarrage, 24h/24.",
    "chips": ["Agréé SERMI", "Déplacement inclus", "Même sans double"],
    "wa": "Bonjour, j'ai perdu toutes les clés de ma voiture.",
    "card_title": "Tarif perte totale de clés",
    "card_rows": [("Perte totale de clés", "dès 200 €"), ("Clé neuve fabriquée et programmée", "incluse"), ("Anciennes clés désactivées", "incluse"), ("Déplacement à Rouen", "inclus")],
    "card_note": "Le prix exact dépend du véhicule : il vous est annoncé au téléphone, avant notre départ. Même tarif le dimanche.",
    "offer": {"minPrice": 200, "priceCurrency": "EUR"},
    "h2": "Comment on refait une clé quand on n'a plus rien",
    "body": [
        "Votre véhicule enregistre dans son antidémarrage la liste des clés autorisées. Quand toutes les clés sont perdues, il faut fabriquer une clé neuve (lame taillée et électronique), puis l'enregistrer dans le véhicule.",
        "Grâce à l'agrément <b>SERMI</b>, nous accédons aux informations de sécurité du constructeur et effectuons cette programmation directement sur place, avec le même résultat qu'en concession. Les clés perdues sont retirées de la mémoire du véhicule : si quelqu'un les retrouve, elles ne démarreront plus la voiture.",
        "Avant de commencer, nous vérifions que vous êtes bien le propriétaire : <b>carte grise et pièce d'identité</b> obligatoires.",
    ],
    "steps": [("Vous appelez", "Donnez la marque, le modèle, l'année et l'endroit où se trouve la voiture. On vous annonce le prix et le délai."),
              ("On vient à la voiture", "Parking, rue, domicile ou travail, à Rouen et dans tout le 76. Pas de remorquage."),
              ("Clé neuve et programmée", "Lame taillée, télécommande programmée, anciennes clés désactivées. Vous repartez avec votre voiture.")],
    "faq": [("Peut-on refaire une clé de voiture sans le double ?", "Oui. Nous fabriquons une clé neuve à partir des informations du véhicule et l'enregistrons dans l'antidémarrage. Aucune clé d'origine n'est nécessaire."),
            ("Combien coûte une clé de voiture perdue ?", "À partir de 200 €, déplacement à Rouen inclus. Le prix exact dépend du véhicule (marque, année, type de clé) : appelez avec votre immatriculation, il vous est annoncé avant notre départ."),
            ("Mes anciennes clés fonctionneront-elles encore ?", "Non : lors de la programmation, les clés perdues sont effacées de la mémoire du véhicule. C'est une sécurité en cas de vol."),
            ("Combien de temps dure l'intervention ?", "Cela dépend du modèle. Dans la plupart des cas, l'intervention se fait dans la journée, sur place. La durée vous est annoncée au téléphone."),
            ("Faut-il passer par le concessionnaire ?", "Non. Une perte totale chez le concessionnaire implique souvent un remorquage et plusieurs jours d'attente. Nous intervenons directement là où se trouve la voiture.")],
    "others": ["ouverture", "double", "programmation"],
    "cta": ("Toutes vos clés sont perdues ?", "Appelez avec votre immatriculation : prix et délai en 2 minutes."),
  },
  {
    "slug": "double-cle-voiture-rouen", "key": "double", "service": "double", "urgent": False,
    "title": "Double de Clé Voiture Rouen – Refaire une Clé dès 80 € | JD KEY",
    "description": "Double de clé de voiture à Rouen : télécommande, carte Renault, clé à puce. De 80 à 250 € selon le modèle, prix affiché en ligne. RDV 7j/7.",
    "og": "Double de clé de voiture à Rouen – JD KEY",
    "crumb": "Double de clé", "h1": "Double de clé de voiture, <span>prix affiché selon votre modèle</span>",
    "lead": "Faire un double avant de perdre votre unique clé coûte bien moins cher qu'une perte totale. Clé télécommande, carte Renault, clé à puce ou mains libres : JD KEY réalise votre double au local de Saint-Étienne-du-Rouvray, sur rendez-vous 7j/7.",
    "chips": ["Agréé SERMI", "Réservation en ligne 7j/7", "Multimarques"],
    "wa": "Bonjour, je souhaite un double de clé pour ma voiture.",
    "card_title": "Tarifs double de clé",
    "card_rows": [("Clé simple sans boutons (puce ID46 / ID48)", "80 – 90 €"), ("Clé télécommande ID46 (PSA, Renault…)", "130 – 135 €"), ("Clé télécommande ID48 (groupe VW)", "140 €"), ("Carte Renault (Mégane 3, Clio 4…)", "140 – 150 €"), ("Clé plateforme MQB (Golf 7, Polo 6…)", "160 – 170 €"), ("Modèles récents PSA, Renault (4A)", "180 – 230 €"), ("Modèles récents groupe VW", "dès 250 €")],
    "card_note": "Prix au local de Saint-Étienne-du-Rouvray. Déplacement possible en supplément, annoncé avant. <a href=\"/tarifs/\">Toute la grille</a>",
    "offer": {"minPrice": 80, "priceCurrency": "EUR"},
    "h2": "Refaire une clé de voiture, programmée comme l'original",
    "body": [
        "Un double de clé moderne comprend deux parties : la <b>lame</b>, taillée à l'identique, et l'<b>électronique</b> (puce antidémarrage et télécommande d'ouverture), qui doit être enregistrée dans le véhicule.",
        "Le prix dépend de cette électronique. Une clé à puce ID46 (fréquente sur les Peugeot, Renault et Citroën d'avant 2015) se copie rapidement ; une carte Renault 4A ou une clé de Golf 7 (plateforme MQB) demande un matériel plus spécifique. Le simulateur ci-dessous vous donne le prix exact de votre modèle.",
        "Pas de télécommande nécessaire ? Une <b>clé simple</b> (copie de la puce, sans boutons) démarre la voiture pour 80 à 90 € : idéal comme clé de secours.",
    ],
    "estimator": True,
    "steps": [("Estimez et réservez", "Choisissez votre modèle, le prix s'affiche, puis prenez un créneau d'une heure, 7 jours sur 7."),
              ("Venez avec votre clé", "Au local de Saint-Étienne-du-Rouvray, avec la carte grise et une pièce d'identité."),
              ("Repartez avec deux clés", "Le double est taillé, programmé et testé devant vous.")],
    "faq": [("Combien coûte un double de clé de voiture ?", "De 80 € pour une clé simple sans boutons à 250 € et plus pour les modèles récents du groupe Volkswagen. Une clé télécommande classique coûte 130 à 140 €, une carte Renault 140 à 150 €."),
            ("Combien de temps faut-il ?", "La plupart des doubles sont réalisés pendant le créneau d'une heure réservé, en votre présence."),
            ("Pouvez-vous vous déplacer pour un double ?", "Oui, à votre domicile ou sur votre lieu de travail. Le déplacement est alors facturé en supplément ; son prix vous est annoncé avant."),
            ("Faut-il la clé d'origine ?", "Pour un double, oui : on part de votre clé existante. Si vous n'avez plus aucune clé, voyez la <a href=\"/perte-cle-voiture-rouen/\">perte totale de clés</a>."),
            ("Quelles marques ?", "JD KEY est multimarques : Renault, Peugeot, Citroën, Dacia, Volkswagen, Audi, Seat, Skoda, Ford, Toyota, Fiat, Opel… Envoyez votre immatriculation en cas de doute.")],
    "others": ["perte", "programmation", "coque"],
    "cta": ("Une seule clé pour votre voiture ?", "Faites un double avant de la perdre : réservez votre créneau en ligne."),
  },
  {
    "slug": "programmation-cle-voiture-rouen", "key": "programmation", "service": "programmation", "urgent": False,
    "title": "Programmation Clé Voiture Rouen – Télécommande | JD KEY",
    "description": "Télécommande qui ne répond plus, carte Renault non détectée, voiture qui ne démarre plus : JD KEY diagnostique et reprogramme votre clé à Rouen.",
    "og": "Programmation de clé et télécommande de voiture à Rouen – JD KEY",
    "crumb": "Programmation de clé", "h1": "Télécommande ou carte qui ne répond plus ? <span>On la reprogramme</span>",
    "lead": "Bouton sans effet, carte « non détectée », voyant antidémarrage qui clignote : la clé est souvent désynchronisée ou abîmée, pas forcément à remplacer. JD KEY diagnostique et reprogramme votre clé, à Rouen et dans tout le 76.",
    "chips": ["Diagnostic sur place", "Agréé SERMI", "Multimarques"],
    "wa": "Bonjour, ma télécommande de voiture ne fonctionne plus.",
    "card_title": "Programmation et démarrage",
    "card_rows": [("Reprogrammation de télécommande", "sur devis"), ("Carte Renault non détectée", "sur devis"), ("Clé mains libres", "sur devis"), ("Voiture qui ne démarre plus", "sur devis")],
    "card_note": "Le prix dépend du diagnostic. Envoyez marque, modèle, année et symptôme par WhatsApp : devis gratuit en quelques minutes.",
    "offer": None,
    "h2": "Avant de racheter une clé, faites-la diagnostiquer",
    "body": [
        "<b>Commencez par la pile.</b> Une télécommande qui ne fonctionne plus qu'à quelques centimètres de la voiture a souvent simplement besoin d'une pile neuve (CR2032 ou CR2025 dans la majorité des cas).",
        "Si la pile est neuve et que rien ne se passe, la télécommande peut être <b>désynchronisée</b> (après un changement de batterie du véhicule, par exemple), ou son circuit peut être abîmé par une chute ou de l'humidité. Une reprogrammation ou une réparation coûte bien moins cher qu'une clé neuve.",
        "Sur les cartes Renault, le message « carte non détectée » vient souvent de la carte elle-même (pile, soudure) ou du lecteur. Nous testons les deux avant de proposer une solution.",
    ],
    "section_id": "demarrage",
    "extra": ("La voiture ne démarre plus ?", [
        "Le moteur tourne puis cale, ou le voyant de clé clignote au tableau de bord : l'<b>antidémarrage</b> ne reconnaît plus la clé. La puce peut être endommagée, ou la clé avoir été effacée de la mémoire du véhicule.",
        "Nous lisons le système antidémarrage, identifions la cause et reprogrammons la clé sur place, sans remorquage. Si besoin, nous fabriquons une clé neuve. Pour une panne d'antidémarrage, appelez directement : nous intervenons 24h/24.",
    ]),
    "steps": [("Décrivez le symptôme", "Par téléphone ou WhatsApp : marque, modèle, année, ce que fait (ou ne fait plus) la clé."),
              ("Diagnostic", "Pile, synchronisation, circuit, puce ou antidémarrage : on identifie la vraie cause."),
              ("La solution la moins chère", "Reprogrammation, réparation, ou clé neuve seulement si c'est indispensable.")],
    "faq": [("Ma télécommande de voiture ne marche plus, que faire ?", "Changez d'abord la pile. Si rien ne change, la télécommande est sans doute désynchronisée ou abîmée : nous la testons et la reprogrammons ou la réparons."),
            ("Peut-on reprogrammer une clé soi-même ?", "Sur quelques modèles anciens, une procédure existe. Sur la plupart des véhicules récents, la programmation nécessite un outil de diagnostic et un accès aux données du constructeur (agrément SERMI)."),
            ("Pourquoi ma voiture ne démarre plus alors que la clé ouvre les portes ?", "L'ouverture et le démarrage sont deux circuits différents : la télécommande fonctionne, mais la puce antidémarrage n'est plus reconnue. C'est un problème de transpondeur ou d'antidémarrage, que nous diagnostiquons sur place."),
            ("Combien coûte une reprogrammation ?", "Le prix dépend du diagnostic et du modèle. Il vous est annoncé avant toute intervention, gratuitement.")],
    "others": ["double", "coque", "perte"],
    "cta": ("Votre clé ne répond plus ?", "Décrivez le problème, on vous dit ce qu'il en est et combien ça coûte."),
  },
  {
    "slug": "cle-cassee-reparation-coque", "key": "coque", "service": "coque", "urgent": False,
    "title": "Clé de Voiture Cassée Rouen – Réparation dès 60 € | JD KEY",
    "description": "Clé de voiture cassée, lame tordue, boutons usés ou coque fendue à Rouen ? JD KEY répare votre clé ou change la coque dès 60 €, en gardant votre électronique.",
    "og": "Réparation de clé de voiture cassée à Rouen – JD KEY",
    "crumb": "Clé cassée, coque", "h1": "Clé cassée ou coque usée ? <span>Réparation dès 60 €</span>",
    "lead": "Lame cassée, boutons percés, coque fendue qui laisse tomber la pile : inutile de racheter une clé complète. JD KEY transfère votre électronique dans une coque neuve et taille une nouvelle lame, au local de Saint-Étienne-du-Rouvray.",
    "chips": ["dès 60 €", "Électronique d'origine conservée", "Réservation 7j/7"],
    "wa": "Bonjour, ma clé de voiture est cassée.",
    "card_title": "Réparation de clé",
    "card_rows": [("Changement de coque", "dès 60 €"), ("Lame neuve taillée", "inclus avec la coque"), ("Clé cassée dans la serrure (extraction)", "sur devis")],
    "card_note": "Prix au local de Saint-Étienne-du-Rouvray. Déplacement possible en supplément, annoncé avant.",
    "offer": {"minPrice": 60, "priceCurrency": "EUR"},
    "h2": "On garde ce qui marche, on remplace ce qui est usé",
    "body": [
        "L'électronique d'une clé (puce antidémarrage et télécommande) est rarement abîmée quand la coque casse. En la transférant dans une <b>coque neuve</b>, votre clé retrouve un aspect neuf <b>sans reprogrammation</b> : c'est la solution la plus économique.",
        "La nouvelle lame est taillée à l'identique de l'ancienne. Si la lame d'origine est cassée en deux, nous la reconstituons à partir des morceaux ou du code de la serrure.",
        "Clé cassée <b>dans la serrure</b> ou le contacteur ? Ne forcez pas : nous extrayons le morceau sans abîmer le barillet, puis réparons la clé.",
    ],
    "steps": [("Réservez ou appelez", "Prenez un créneau en ligne, ou appelez si la clé est cassée dans la serrure."),
              ("Transfert de l'électronique", "La puce et le circuit passent dans une coque neuve, la lame est taillée."),
              ("Test complet", "Ouverture, fermeture et démarrage testés devant vous.")],
    "faq": [("Combien coûte un changement de coque de clé ?", "À partir de 60 €, au local de Saint-Étienne-du-Rouvray. L'électronique d'origine est conservée."),
            ("Faut-il reprogrammer la clé après un changement de coque ?", "En général non : la puce et la télécommande d'origine sont simplement transférées. Si un composant est abîmé, nous vous le disons avant."),
            ("Ma clé est cassée dans la serrure, que faire ?", "Ne forcez pas avec une pince : vous risquez d'enfoncer le morceau. Appelez-nous, nous l'extrayons sans abîmer la serrure."),
            ("Les boutons de ma clé sont usés, est-ce réparable ?", "Oui, une coque neuve remplace les boutons usés ou percés.")],
    "others": ["double", "programmation", "ouverture"],
    "cta": ("Votre clé tombe en morceaux ?", "Réservez votre créneau : réparation pendant que vous attendez."),
  },
]


def card_rows(rows):
    return "\n".join(f'        <tr><th>{a}</th><td>{b}</td></tr>' for a, b in rows)


def page(p):
    url = f"{SITE}/{p['slug']}/"
    svc = {"@type": "Service", "name": p["crumb"], "serviceType": p["crumb"], "provider": {"@id": SITE + "/#entreprise"},
           "areaServed": {"@type": "AdministrativeArea", "name": "Seine-Maritime"}, "url": url}
    if p.get("offer"):
        svc["offers"] = {"@type": "Offer", "priceSpecification": {"@type": "PriceSpecification", **p["offer"]}}
    graph = [svc,
             {"@type": "BreadcrumbList", "itemListElement": [
                 {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE + "/"},
                 {"@type": "ListItem", "position": 2, "name": p["crumb"], "item": url}]},
             {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": html.unescape(__import__("re").sub("<[^>]+>", "", a))}} for q, a in p["faq"]]}]
    t = p["slug"]
    ctas = [TEL.format(t=t + "-hero", label="Appeler le 06 98 95 13 99"), WA.format(t=t + "-hero", msg=__import__("urllib.parse").parse.quote(p["wa"]))]
    if not p["urgent"]:
        ctas.append(BOOK.format(s=p["service"]))
    card_cta = (TEL.format(t=t + "-carte", label="Appeler maintenant").replace("btn btn-gold", "btn btn-gold btn-block") if p["urgent"]
                else f'<a class="btn btn-gold btn-block" href="/reservation/?service={p["service"]}"><svg><use href="#i-cal"/></svg>Réserver un créneau</a>')
    chips = "\n".join(f'        <li><svg><use href="#i-shield"/></svg>{c}</li>' for c in p["chips"])
    body = "\n".join(f"      <p>{x}</p>" for x in p["body"])
    extra = ""
    if p.get("extra"):
        h, paras = p["extra"]
        extra = f'\n      <h2 id="{p.get("section_id", "")}" style="margin-top:32px;scroll-margin-top:90px">{h}</h2>\n' + "\n".join(f"      <p>{x}</p>" for x in paras)
    est = ""
    if p.get("estimator"):
        est = f'''
<section class="section alt" id="estimation">
  <div class="wrap" style="max-width:720px">
    <div class="estimator" style="box-shadow:var(--shadow)">
      <h2>Le prix exact de votre double</h2>
      <p class="small">Marque, année, type de clé : le prix s'affiche.</p>
      <form id="estimator-form" novalidate>
        <!--INCLUDE estimator-fields-->
        <div class="est-actions">
          <a class="btn btn-gold" id="est-call" href="tel:+33698951399" data-track="{t}-estimateur"><svg><use href="#i-phone"/></svg>Appeler</a>
          <a class="btn btn-dark" id="est-book" href="/reservation/?service=double"><svg><use href="#i-cal"/></svg>Réserver</a>
        </div>
      </form>
    </div>
  </div>
</section>
<script>document.addEventListener("DOMContentLoaded",function(){{var s=document.querySelector("#estimator-form [name=service]");if(s&&!s.value){{s.value="double";s.dispatchEvent(new Event("change",{{bubbles:true}}));}}}});</script>'''
    steps = "\n".join(f'      <div class="step"><h3>{a}</h3><p>{b}</p></div>' for a, b in p["steps"])
    faq = "\n".join(f'      <details{" open" if i == 0 else ""}><summary>{q}</summary><p>{a}</p></details>' for i, (q, a) in enumerate(p["faq"]))
    others = "\n".join(
        f'      <a class="service" href="{OTHERS[k][0]}"><span class="ico"><svg><use href="#{OTHERS[k][1]}"/></svg></span><h3>{OTHERS[k][2]}</h3><p>{OTHERS[k][3]}</p><span class="price"><em>{OTHERS[k][4]}</em><span class="more">Voir →</span></span></a>'
        for k in p["others"])
    cta_btn = TEL.format(t=t + "-cta", label="06 98 95 13 99").replace("btn btn-gold", "btn btn-dark") if p["urgent"] else \
        f'<a class="btn btn-dark" href="/reservation/?service={p["service"]}"><svg><use href="#i-cal"/></svg>Réserver un créneau</a>'
    return f'''---
title: {p["title"]}
description: {p["description"]}
og_title: {p["og"]}
priority: 0.9
---
<!-- Page générée par tools/gen_services.py : modifier le contenu là-bas -->
<!--HEAD-->
<script type="application/ld+json">
{json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)}
</script>
<!--/HEAD-->

<section class="hero on-dark">
  <div class="wrap">
    <div>
      <span class="eyebrow"><a href="/" style="color:inherit;text-decoration:none">Accueil</a> › {p["crumb"]}</span>
      <h1>{p["h1"]}</h1>
      <p class="lead">{p["lead"]}</p>
      <div class="hero-ctas">
        {chr(10).join("        " + c if i else c for i, c in enumerate(ctas))}
      </div>
      <ul class="trust-chips">
        <li><span class="stars" aria-hidden="true">★★★★★</span> 5/5 sur +240 avis Google</li>
{chips}
      </ul>
    </div>
    <div class="estimator">
      <h2>{p["card_title"]}</h2>
      <table class="price-table">
{card_rows(p["card_rows"])}
      </table>
      <p class="est-note" style="margin-bottom:14px">{p["card_note"]}</p>
      {card_cta}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap split" style="align-items:start">
    <div>
      <span class="eyebrow">Notre méthode</span>
      <h2>{p["h2"]}</h2>
{body}{extra}
    </div>
    <div class="faq" style="margin:0">
      <h2 style="font-size:1.3rem">Questions fréquentes</h2>
{faq}
    </div>
  </div>
</section>
{est}
<section class="section dark on-dark">
  <div class="wrap">
    <div class="section-head center"><span class="eyebrow">En 3 étapes</span><h2>Comment ça se passe</h2></div>
    <div class="steps">
{steps}
    </div>
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    <div class="section-head center"><h2>Autres prestations</h2></div>
    <div class="services">
{others}
    </div>
  </div>
</section>

<section class="cta-band">
  <div class="wrap">
    <div><h2>{p["cta"][0]}</h2><p style="margin:.3em 0 0;font-weight:600">{p["cta"][1]}</p></div>
    {cta_btn}
  </div>
</section>
'''


for p in PAGES:
    with open(os.path.join(ROOT, "src", "pages", p["slug"] + ".html"), "w", encoding="utf-8") as f:
        f.write(page(p))
    print("page", p["slug"])
