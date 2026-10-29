/* =========================================================
   JD KEY — Script principal (léger, sans dépendance)
   1. Réglages à compléter (conversions Google Ads, prix)
   2. Consentement cookies (Consent Mode v2 — obligatoire CNIL)
   3. Suivi des conversions : appel, WhatsApp, formulaire
   4. Simulateur de prix
   5. Aperçu du planning de réservation
   6. Menu mobile, carte au clic, année
   ========================================================= */

/* ---------- 1. RÉGLAGES ---------- */
// L'ID de balise et les étiquettes de conversion se règlent dans site.config.json
// (injectés par build.py dans window.JDK_CONFIG). Les prix sont dans pricing.js.
var JDK = { phone: "+33698951399", conversions: (window.JDK_CONFIG && window.JDK_CONFIG.conversions) || {} };

/* ---------- utilitaires ---------- */
function gtagSafe(){ if (typeof window.gtag === "function") window.gtag.apply(null, arguments); }
function $(s, c){ return (c || document).querySelector(s); }
function $all(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
function store(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }

/* ---------- STATISTIQUES DU SITE (sans cookie, anonymes) ---------- */
var JDK_STAT = (function(){
  var ref = document.referrer, host = ref ? (function(){ try { return new URL(ref).hostname; } catch(e){ return ""; } })() : "";
  var q = location.search, entry = host !== location.hostname;
  var src = /[?&](gclid|gbraid|wbraid)=/.test(q) || /utm_medium=cpc/.test(q) ? "ads"
    : /utm_source=gbp/.test(q) ? "fiche"   // lien « Site web » de la fiche Google (UTM ajouté sur la fiche)
    : !entry ? "interne" : !host ? "direct" : /google\./.test(host) ? "google" : /bing\.|qwant|duckduckgo|ecosia|yahoo/.test(host) ? "bing"
    : /facebook|instagram|tiktok|snapchat|whatsapp|linkedin|t\.co/.test(host) ? "social" : "other";
  var mob = window.matchMedia && matchMedia("(max-width:820px)").matches ? 1 : 0;
  function send(t, extra){
    if (navigator.webdriver || /^\/admin/.test(location.pathname)) return;
    var d = { t: t, p: location.pathname, src: src, m: mob, e: (t === "pv" && entry) ? 1 : 0 };
    for (var k in (extra || {})) d[k] = extra[k];
    var body = JSON.stringify(d);
    try { if (!(navigator.sendBeacon && navigator.sendBeacon("/api/stats", body))) fetch("/api/stats", { method: "POST", body: body, keepalive: true }); } catch(e){}
  }
  send("pv");
  return send;
})();

/* ---------- 2. CONSENTEMENT ---------- */
(function(){
  var banner = $("#consent");
  if (!banner) return;
  var choice = store("jdk_consent");
  if (choice === "granted") grant();
  else if (!choice) banner.classList.add("show");

  function grant(){
    gtagSafe("consent", "update", {
      ad_storage: "granted", analytics_storage: "granted",
      ad_user_data: "granted", ad_personalization: "granted"
    });
  }
  $("#consent-accept").addEventListener("click", function(){ store("jdk_consent", "granted"); grant(); banner.classList.remove("show"); });
  $("#consent-refuse").addEventListener("click", function(){ store("jdk_consent", "denied"); banner.classList.remove("show"); });
  $all("[data-open-consent]").forEach(function(b){ b.addEventListener("click", function(e){ e.preventDefault(); banner.classList.add("show"); }); });
})();

/* ---------- Formulaire de rappel : ne compter que les envois faits par une personne ----------
   Un robot remplit et envoie en une fraction de seconde, sans frappe ni toucher.
   On marque l'envoi comme « humain » (lu par /merci/) seulement après une vraie saisie d'au moins 4 s. */
(function(){
  var f = document.querySelector('form[name="contact"]');
  if (!f) return;
  var first = 0, touches = 0;
  function mark(){ touches++; if (!first) first = Date.now(); }
  f.addEventListener("keydown", mark); f.addEventListener("pointerdown", mark);
  f.addEventListener("submit", function(){
    try {
      if (touches >= 3 && Date.now() - first >= 4000) sessionStorage.setItem("jdk_form_ok", "1");
      else sessionStorage.removeItem("jdk_form_ok");
    } catch(e){}
  });
})();

/* ---------- 3. SUIVI DES CONVERSIONS ---------- */
function trackConversion(kind, place){
  var sim = ""; try { sim = sessionStorage.getItem("jdk_sim") ? "sim" : ""; } catch(e){}
  JDK_STAT(kind, sim ? { s: sim } : null);   // « sim » = le visiteur a obtenu un prix avec le simulateur avant de contacter
  // Événement GA4 / balise Google (toujours envoyé)
  gtagSafe("event", kind === "call" ? "click_call" : kind === "whatsapp" ? "click_whatsapp" : kind === "booking" ? "book_appointment" : "generate_lead", {
    event_category: "contact", event_label: place || "", page_path: location.pathname
  });
  // Conversion Google Ads (si l'étiquette est renseignée)
  var sendTo = JDK.conversions[kind];
  if (sendTo) gtagSafe("event", "conversion", { send_to: sendTo });
}
document.addEventListener("click", function(e){
  var a = e.target.closest ? e.target.closest("a") : null;
  if (!a) return;
  var href = a.getAttribute("href") || "";
  var place = a.getAttribute("data-track") || "";
  if (href.indexOf("tel:") === 0) trackConversion("call", place);
  else if (href.indexOf("wa.me") > -1 || href.indexOf("whatsapp") > -1) trackConversion("whatsapp", place);
}, true);

/* ---------- 4. SIMULATEUR DE PRIX ---------- */
function initEstimator(form, onChange){
  if (!form || !window.JDKPrice) return null;
  var JP = window.JDKPrice;
  var sSel = $("[name=service]", form), mSel = $("[name=moment]", form);
  if (sSel.options.length < 2) Object.keys(JP.SERVICES).forEach(function(k){
    var o = document.createElement("option"); o.value = k; o.textContent = JP.SERVICES[k].label; sSel.appendChild(o);
  });
  if (mSel && mSel.options.length === 0) ["jour", "soir", "nuit"].forEach(function(k){
    var o = document.createElement("option"); o.value = k; o.textContent = JP.P.ouverture[k].label + " · " + JP.P.ouverture[k].prix + " €"; mSel.appendChild(o);
  });
  if (mSel) mSel.value = JP.momentActuel();

  function values(){
    var t = $("[name=typeCle]:checked", form);
    return {
      service: sSel.value, moment: mSel ? mSel.value : "",
      marque: ($("[name=marque]", form) || {}).value || "", annee: ($("[name=annee]", form) || {}).value || "",
      typeCle: t ? t.value : "", modeleCarte: ($("[name=modeleCarte]", form) || {}).value || ""
    };
  }
  function update(silent){
    var v = values();
    $all("[data-show]", form).forEach(function(el){ el.classList.toggle("on", !!v.service && el.getAttribute("data-show").split(" ").indexOf(v.service) > -1); });
    $all("[data-show-carte]", form).forEach(function(el){ el.classList.toggle("on", (v.service === "double" || v.service === "perte") && v.typeCle === "carte"); });
    var box = $("#est-result", form), r = JP.estimer(v);
    if (!r) { if (box) box.classList.remove("show"); if (onChange) onChange(v, null); return; }
    if (box) {
      $("#est-price", form).textContent = JP.format(r);
      $("#est-detail", form).textContent = r.detail || "";
      $("#est-note", form).textContent = r.quote
        ? "Envoyez votre immatriculation par WhatsApp ou appelez : devis gratuit en quelques minutes."
        : (r.deplacement ? "Déplacement à Rouen inclus. " : "Prix au local de Saint-Étienne-du-Rouvray ; déplacement possible en supplément, annoncé avant. ")
          + "Le prix exact est confirmé avant toute intervention.";
      box.classList.add("show");
    }
    if (!silent) gtagSafe("event", "price_estimate", { service: v.service, marque: v.marque, annee: v.annee, type_cle: v.typeCle });
    if (!silent && v.service && !(initEstimator.sent = initEstimator.sent || {})[v.service]) { initEstimator.sent[v.service] = 1; JDK_STAT("estimate", { s: v.service }); }
    // Simulation « terminée » : un prix s'affiche pour une marque et une année. Compté une fois par véhicule et par visite.
    if (!silent && r && v.service && v.marque && v.annee) {
      var key = [v.service, v.marque, v.annee, v.typeCle || ""].join("|");
      var done = {}; try { done = JSON.parse(sessionStorage.getItem("jdk_est_done") || "{}"); } catch(e){}
      if (!done[key]) { done[key] = 1; try { sessionStorage.setItem("jdk_est_done", JSON.stringify(done)); sessionStorage.setItem("jdk_sim", "1"); } catch(e){}
        JDK_STAT("estdone", { s: v.service, mk: v.marque, an: v.annee, tc: v.typeCle || "" }); }
    }
    if (onChange) onChange(v, r);
  }
  form.addEventListener("change", function(){ update(false); });
  form.addEventListener("submit", function(e){ if (form.id === "estimator-form") { e.preventDefault(); update(false); } });
  // Pré-remplissage par l'URL (?service=double&marque=Renault…)
  var q = new URLSearchParams(location.search);
  ["service", "marque", "annee", "modeleCarte", "moment"].forEach(function(k){ var el = $("[name=" + k + "]", form); if (el && q.get(k)) el.value = q.get(k); });
  if (q.get("typeCle")) { var r0 = $("[name=typeCle][value=" + q.get("typeCle") + "]", form); if (r0) r0.checked = true; }
  update(true);
  return { values: values, update: update };
}

(function(){
  var form = $("#estimator-form");
  if (!form) return;
  var book = $("#est-book"), call = $("#est-call"), actions = $(".est-actions", form);
  initEstimator(form, function(v, r){
    var urgent = v.service && window.JDKPrice.SERVICES[v.service].urgent;
    var p = new URLSearchParams();
    ["service", "marque", "annee", "typeCle", "modeleCarte"].forEach(function(k){ if (v[k]) p.set(k, v[k]); });
    book.href = "/reservation/?" + p.toString();
    book.style.display = urgent ? "none" : "";
    actions.style.gridTemplateColumns = urgent ? "1fr" : "";
    call.lastChild.textContent = urgent ? "Appeler maintenant" : "Appeler";
  });
})();

/* ---------- 5. APERÇU DU PLANNING (vraies disponibilités) ---------- */
(function(){
  var daysEl = $("#planner-days"), slotsEl = $("#planner-slots"), go = $("#planner-go");
  if (!daysEl) return;
  var JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  var data = [], selDate = null, selHour = null;
  fetch("/api/creneaux?days=10").then(function(r){ return r.json(); }).then(function(d){
    data = d.days.filter(function(x){ return x.slots.some(function(s){ return s.free; }); }).slice(0, 5);
    if (!data.length) { $(".planner").hidden = true; return; }
    data.forEach(function(day, i){
      var dt = new Date(day.date + "T12:00:00"), b = document.createElement("button");
      b.type = "button"; b.className = "day"; b.dataset.date = day.date; b.setAttribute("aria-pressed", i ? "false" : "true");
      b.innerHTML = JOURS[dt.getDay()] + "<b>" + dt.getDate() + "</b>"; daysEl.appendChild(b);
    });
    pick(data[0].date);
  }).catch(function(){ var pl = $(".planner"); if (pl) pl.hidden = true; });
  function pick(date){
    selDate = date; selHour = null; slotsEl.innerHTML = "";
    $all(".day", daysEl).forEach(function(x){ x.setAttribute("aria-pressed", x.dataset.date === date ? "true" : "false"); });
    data.filter(function(d){ return d.date === date; })[0].slots.slice(0, 8).forEach(function(sl){
      var s = document.createElement("button");
      s.type = "button"; s.className = "slot"; s.textContent = sl.h.replace(":", "h"); s.dataset.h = sl.h;
      s.disabled = !sl.free; s.setAttribute("aria-pressed", "false"); slotsEl.appendChild(s);
    });
    link();
  }
  daysEl.addEventListener("click", function(e){ var b = e.target.closest(".day"); if (b) pick(b.dataset.date); });
  slotsEl.addEventListener("click", function(e){
    var s = e.target.closest(".slot"); if (!s || s.disabled) return;
    $all(".slot", slotsEl).forEach(function(x){ x.setAttribute("aria-pressed", "false"); });
    s.setAttribute("aria-pressed", "true"); selHour = s.dataset.h; link();
  });
  function link(){
    go.href = "/reservation/?date=" + selDate;
    go.textContent = selHour ? "Réserver le " + selDate.split("-").reverse().slice(0, 2).join("/") + " à " + selHour.replace(":", "h") : "Voir tous les créneaux";
  }
})();

/* ---------- 6. DIVERS ---------- */
(function(){
  var t = $(".nav-toggle"), nav = $("#nav");
  if (t) t.addEventListener("click", function(){
    var open = nav.classList.toggle("open"); t.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $all("#nav a").forEach(function(a){ a.addEventListener("click", function(){ nav.classList.remove("open"); }); });

  // Carte Google chargée seulement au clic (vitesse + pas de cookie tiers avant accord)
  var mapBtn = $("#map-load");
  if (mapBtn) mapBtn.addEventListener("click", function(){
    var f = document.createElement("iframe");
    f.src = mapBtn.getAttribute("data-src"); f.loading = "lazy"; f.title = "Zone d'intervention JD KEY autour de Rouen";
    f.referrerPolicy = "no-referrer-when-downgrade";
    mapBtn.parentNode.replaceChild(f, mapBtn);
  });

  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
