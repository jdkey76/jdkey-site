/* =========================================================
   JD KEY — Grille de prix (une seule source pour tout le site)
   Modifier les montants ICI : simulateur d'accueil, page Tarifs
   et réservation se mettent à jour automatiquement.
   ========================================================= */
(function(){
  var P = {
    /* ---- Ouverture de véhicule, selon l'heure ---- */
    ouverture: {
      jour:  { label: "En journée (7h – 19h)", prix: 80 },
      soir:  { label: "En soirée (19h – 21h)", prix: 90 },
      nuit:  { label: "La nuit (21h – 7h)",    prix: 110 },
      doubleCondamnation: 20   // supplément serrure double condamnation : groupe VW à partir de 2020
    },

    /* ---- Clés : prix d'un double selon la technologie ---- */
    cles: {
      "ID46-avant2010": { prix: [130],      tech: "Clé télécommande transpondeur ID46" },
      "ID46-apres2010": { prix: [135],      tech: "Clé télécommande transpondeur ID46" },
      "ID48":           { prix: [140],      tech: "Clé télécommande transpondeur ID48" },
      "clone-ID46":     { prix: [80],       tech: "Clé simple (copie de la puce ID46)" },
      "clone-ID48":     { prix: [90],       tech: "Clé simple (copie de la puce ID48)" },
      "carte-ID46":     { prix: [140],      tech: "Carte Renault ID46" },
      "carte-4A":       { prix: [150],      tech: "Carte Renault 4A" },
      "MQB":            { prix: [160, 170], tech: "Clé plateforme MQB (groupe VW)" },
      "4A-recent":      { prix: [180, 230], tech: "Clé récente 4A (PSA, Renault)" },
      "VW-recent":      { prix: [250],      tech: "Clé récente groupe VW", from: true }
    },

    /* Perte totale : prix de la clé, avec un minimum */
    perteMinimum: 200,

    /* Autres prestations */
    fixes: {
      coque:         { prix: [60], from: true, label: "Clé cassée, changement de coque" },
      programmation: { quote: true, label: "Programmation de clé / télécommande" },
      demarrage:     { quote: true, label: "Voiture qui ne démarre plus" }
    },

    groupes: {
      psa:   ["Peugeot", "Citroën", "DS", "Renault", "Dacia"],
      vw:    ["Volkswagen", "Audi", "Seat", "Cupra", "Skoda"]
    },

    cartesRenault: {
      "megane3": { label: "Mégane 3, Scénic 3, Laguna 3, Fluence", cle: "carte-ID46" },
      "clio4":   { label: "Clio 4, Captur 1, Kadjar, Talisman",    cle: "carte-4A" },
      "recent":  { label: "Clio 5, Mégane 4, Captur 2, Arkana, Austral…", cle: "4A-recent" }
    }
  };

  var SERVICES = {
    ouverture:     { label: "Ouverture de véhicule", urgent: true },
    perte:         { label: "Perte totale de clés", urgent: true },
    double:        { label: "Double de clé" },
    programmation: { label: "Programmation de clé" },
    demarrage:     { label: "Voiture qui ne démarre plus", urgent: true },
    coque:         { label: "Clé cassée, coque" }
  };

  function groupe(marque){
    if (P.groupes.psa.indexOf(marque) > -1) return "psa";
    if (P.groupes.vw.indexOf(marque) > -1) return "vw";
    return marque ? "autre" : "";
  }

  /* Heure de Paris -> créneau tarifaire de l'ouverture */
  function momentActuel(){
    var h = parseInt(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Paris" }).format(new Date()), 10);
    return (h >= 7 && h < 19) ? "jour" : (h >= 19 && h < 21) ? "soir" : "nuit";
  }

  /* Choisit la technologie de clé à partir de ce que le client sait */
  function techCle(o){
    var g = groupe(o.marque), an = o.annee, t = o.typeCle;
    if (t === "carte") {
      if (o.modeleCarte && P.cartesRenault[o.modeleCarte]) return [P.cartesRenault[o.modeleCarte].cle];
      return ["carte-ID46", "carte-4A"];
    }
    if (t === "simple") {
      if (g === "psa" && (an === "avant-2010" || an === "2010-2015")) return ["clone-ID46"];
      if (g === "vw"  && (an === "avant-2010" || an === "2010-2015")) return ["clone-ID48"];
      return null;
    }
    // télécommande ou mains libres
    if (g === "psa") {
      if (t === "mainslibres") return ["4A-recent"];
      if (an === "avant-2010") return ["ID46-avant2010"];
      if (an === "2010-2015")  return ["ID46-apres2010"];
      if (an === "2016-2019")  return ["ID46-apres2010", "4A-recent"];
      if (an === "2020-plus")  return ["4A-recent"];
      return ["ID46-avant2010", "4A-recent"];
    }
    if (g === "vw") {
      if (an === "avant-2010") return ["ID48"];
      if (an === "2010-2015")  return ["ID48", "MQB"];
      if (an === "2016-2019")  return ["MQB"];
      if (an === "2020-plus")  return ["VW-recent"];
      return ["ID48", "VW-recent"];
    }
    return null; // autres marques : sur devis
  }

  /* Calcule { min, max, from, quote, detail } */
  function estimer(o){
    var s = o.service, r;
    if (!s) return null;
    if (s === "ouverture") {
      var m = P.ouverture[o.moment || momentActuel()];
      var vw = groupe(o.marque) === "vw", dc = P.ouverture.doubleCondamnation;
      if (vw && o.annee === "2020-plus") return { min: m.prix + dc, max: m.prix + dc, detail: m.label + " · dont " + dc + " € de supplément double condamnation (VW 2020 et plus)", deplacement: true };
      if (vw && !o.annee) return { min: m.prix, max: m.prix + dc, detail: m.label + " · +" + dc + " € si véhicule de 2020 ou plus (double condamnation)", deplacement: true };
      return { min: m.prix, max: m.prix, detail: m.label, deplacement: true };
    }
    if (P.fixes[s]) {
      var f = P.fixes[s];
      return f.quote ? { quote: true } : { min: f.prix[0], max: f.prix[1] || f.prix[0], from: !!f.from };
    }
    // Perte totale : le prix dépend du véhicule, minimum 200 €
    if (s === "perte") return { min: P.perteMinimum, from: true, deplacement: true,
      detail: "Clé neuve + antidémarrage reprogrammé. Le prix exact dépend du véhicule : il vous est annoncé au téléphone." };
    // double ou perte
    var techs = techCle(o);
    if (!techs) return { quote: true, detail: o.marque ? "Prix selon le modèle exact : envoyez votre immatriculation, réponse en quelques minutes." : "" };
    var min = Infinity, max = 0, from = false, labels = [];
    techs.forEach(function(k){
      var c = P.cles[k]; min = Math.min(min, c.prix[0]); max = Math.max(max, c.prix[1] || c.prix[0]);
      if (c.from) from = true; if (labels.indexOf(c.tech) < 0) labels.push(c.tech);
    });
    r = { min: min, max: max, from: from, detail: labels.join(" ou ") };
    if (false) {
      r.detail = "Clé neuve + antidémarrage reprogrammé · " + r.detail; r.deplacement = true;
    }
    return r;
  }

  function format(r){
    if (!r) return "";
    if (r.quote) return "Sur devis gratuit";
    if (r.from) return "dès " + r.min + " €";
    if (r.max > r.min) return r.min + " – " + r.max + " €";
    return r.min + " €";
  }

  window.JDKPrice = { P: P, SERVICES: SERVICES, estimer: estimer, format: format, momentActuel: momentActuel, groupe: groupe };
})();
