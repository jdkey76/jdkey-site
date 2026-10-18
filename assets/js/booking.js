/* =========================================================
   JD KEY — Réservation en ligne (page /reservation/)
   ========================================================= */
document.addEventListener("DOMContentLoaded", function(){
  var form = document.getElementById("booking-form");
  if (!form || !window.JDKPrice) return;
  var JP = window.JDKPrice;
  var q = function(s){ return form.querySelector(s); };
  var el = function(id){ return document.getElementById(id); };
  var JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var state = { from: null, days: [], date: null, heure: null, estimate: null, values: {} };
  var params = new URLSearchParams(location.search);

  function longDate(iso){
    var d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }

  /* ----- Étape 1 : besoin + prix ----- */
  var est = initEstimator(form, function(v, r){
    state.values = v; state.estimate = r;
    var urgent = v.service === "ouverture";
    el("urgent-box").hidden = !urgent;
    el("step-2").classList.toggle("disabled", !v.service || urgent);
    el("step-3").classList.toggle("disabled", !v.service || urgent);
    var incl = r && r.deplacement;
    el("lieu-depl").textContent = incl ? "déplacement inclus à Rouen" : "déplacement en supplément";
    var dom = form.querySelector("[name=lieu]:checked");
    el("s-depl").textContent = dom && dom.value === "domicile" && !incl ? "Déplacement en supplément, le prix vous est annoncé avant. " : "";
    summary();
  });
  if (!params.get("service")) { q("[name=service]").value = ""; est.update(true); }

  /* ----- Étape 2 : calendrier ----- */
  function load(from){
    el("cal-days").innerHTML = '<span class="cal-loading">Chargement des disponibilités…</span>';
    fetch("/api/creneaux?days=14" + (from ? "&from=" + from : ""))
      .then(function(r){ return r.json(); })
      .then(function(data){
        state.days = data.days; state.from = data.days.length ? data.days[0].date : from; state.horizon = data.horizon;
        renderDays();
        var pick = params.get("date");
        var first = data.days.filter(function(d){ return d.slots.some(function(s){ return s.free; }); })[0];
        var target = (pick && data.days.some(function(d){ return d.date === pick; })) ? pick : (state.date && data.days.some(function(d){ return d.date === state.date; }) ? state.date : (first && first.date));
        params.delete("date");
        selectDay(target);
      })
      .catch(function(){ el("cal-days").innerHTML = '<span class="cal-loading">Impossible de charger le planning. Appelez le <a href="tel:+33698951399">06 98 95 13 99</a>.</span>'; });
  }
  function renderDays(){
    var box = el("cal-days"); box.innerHTML = "";
    state.days.forEach(function(d){
      var free = d.slots.filter(function(s){ return s.free; }).length;
      var dt = new Date(d.date + "T12:00:00");
      var b = document.createElement("button");
      b.type = "button"; b.className = "cal-day"; b.dataset.date = d.date; b.setAttribute("role", "option");
      b.disabled = !free;
      b.innerHTML = "<small>" + JOURS[dt.getDay()] + "</small><b>" + dt.getDate() + "</b><small>" + MOIS[dt.getMonth()] + "</small><i>" + (free ? free + " dispo" : (d.open ? "complet" : "fermé")) + "</i>";
      box.appendChild(b);
    });
    var today = new Date(); var iso = today.toISOString().slice(0, 10);
    el("cal-prev").disabled = !state.from || state.from <= iso;
    el("cal-next").disabled = state.horizon && state.days.length && state.days[state.days.length - 1].date >= state.horizon;
  }
  function selectDay(date){
    state.date = date || null;
    Array.prototype.forEach.call(el("cal-days").children, function(b){ b.setAttribute("aria-selected", b.dataset.date === date ? "true" : "false"); });
    var sel = el("cal-days").querySelector('[aria-selected="true"]');
    if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    var day = state.days.filter(function(d){ return d.date === date; })[0];
    var box = el("cal-slots"); box.innerHTML = "";
    el("cal-label").textContent = day ? "Créneaux du " + longDate(date) : "";
    var any = false;
    if (day) day.slots.forEach(function(s){
      var b = document.createElement("button");
      b.type = "button"; b.className = "cal-slot"; b.setAttribute("role", "option");
      var end = String(+s.h.slice(0, 2) + 1).padStart(2, "0") + ":00";
      b.innerHTML = "<b>" + s.h.replace(":", "h") + "</b><small>– " + end.replace(":", "h") + "</small>";
      b.dataset.h = s.h; b.disabled = !s.free; if (s.free) any = true;
      b.setAttribute("aria-selected", (state.heure === s.h && s.free) ? "true" : "false");
      box.appendChild(b);
    });
    if (!day || !day.slots.some(function(s){ return s.free && s.h === state.heure; })) state.heure = null;
    el("cal-empty").hidden = !day || any;
    summary();
  }
  el("cal-days").addEventListener("click", function(e){ var b = e.target.closest(".cal-day"); if (b && !b.disabled) selectDay(b.dataset.date); });
  el("cal-slots").addEventListener("click", function(e){
    var b = e.target.closest(".cal-slot"); if (!b || b.disabled) return;
    state.heure = b.dataset.h;
    Array.prototype.forEach.call(el("cal-slots").children, function(x){ x.setAttribute("aria-selected", x === b ? "true" : "false"); });
    summary();
    if (window.matchMedia("(max-width:980px)").matches) el("step-3").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  el("cal-prev").addEventListener("click", function(){
    var d = new Date(state.from + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() - 14); load(d.toISOString().slice(0, 10));
  });
  el("cal-next").addEventListener("click", function(){
    var d = new Date(state.from + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 14); load(d.toISOString().slice(0, 10));
  });

  /* ----- Étape 3 : lieu ----- */
  form.addEventListener("change", function(e){
    if (e.target.name === "lieu") {
      el("adresse-field").hidden = e.target.value === "local";
      el("s-depl").textContent = e.target.value === "domicile" && !(state.estimate && state.estimate.deplacement) ? "Déplacement en supplément, le prix vous est annoncé avant. " : "";
    }
  });

  /* ----- Récapitulatif ----- */
  function vehicule(v){
    var t = { telecommande: "clé à boutons", carte: "carte", mainslibres: "clé mains libres", simple: "clé simple" }[v.typeCle] || "";
    var an = { "avant-2010": "avant 2010", "2010-2015": "2010-2015", "2016-2019": "2016-2019", "2020-plus": "2020 et +" }[v.annee] || "";
    return [v.marque, an, (v.service === "double" || v.service === "perte") ? t : ""].filter(Boolean).join(" · ") || "—";
  }
  function summary(){
    var v = state.values;
    el("s-service").textContent = v.service ? JP.SERVICES[v.service].label : "—";
    el("s-vehicule").textContent = vehicule(v);
    el("s-creneau").textContent = state.date && state.heure ? longDate(state.date) + " à " + state.heure.replace(":", "h") : (state.date ? longDate(state.date) + " (choisir l'heure)" : "—");
    el("s-prix").textContent = state.estimate ? JP.format(state.estimate) : "—";
  }

  /* ----- Envoi ----- */
  function error(msg){ var e = el("b-error"); e.textContent = msg; e.hidden = !msg; if (msg) e.scrollIntoView({ behavior: "smooth", block: "center" }); }
  form.addEventListener("submit", function(e){
    e.preventDefault(); error("");
    var v = state.values, f = function(n){ var x = form.querySelector("[name=" + n + "]:checked") || form.querySelector("[name=" + n + "]"); return x ? x.value.trim() : ""; };
    if (!v.service || v.service === "ouverture") return error("Choisissez une prestation (étape 1).");
    if (!state.date || !state.heure) return error("Choisissez un jour et une heure (étape 2).");
    if (!f("prenom")) return error("Indiquez votre prénom.");
    if (f("telephone").replace(/\D/g, "").length < 9) return error("Indiquez un numéro de téléphone valide.");
    if (f("lieu") === "domicile" && f("adresse").length < 5) return error("Indiquez l'adresse d'intervention.");
    if (!el("b-docs").checked) return error("Merci de cocher la case : la carte grise et une pièce d'identité sont obligatoires.");
    var payload = {
      date: state.date, heure: state.heure, service: v.service, marque: v.marque, annee: v.annee, typeCle: v.typeCle, modeleCarte: v.modeleCarte,
      estimation: state.estimate ? JP.format(state.estimate) : "", prenom: f("prenom"), nom: f("nom"), telephone: f("telephone"),
      plaque: f("plaque"), lieu: f("lieu"), adresse: f("lieu") === "local" ? "" : f("adresse"), message: f("message"), website: f("website")
    };
    var btn = el("b-submit"); btn.disabled = true; btn.lastChild.textContent = "Envoi…";
    fetch("/api/reserver", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
      .then(function(r){ return r.json().then(function(d){ return { ok: r.ok, d: d }; }); })
      .then(function(res){
        btn.disabled = false; btn.lastChild.textContent = "Confirmer le rendez-vous";
        if (!res.ok) { error(res.d.error || "Erreur, réessayez ou appelez-nous."); if (res.d.code === "taken") load(state.from); return; }
        done(payload, res.d);
      })
      .catch(function(){ btn.disabled = false; btn.lastChild.textContent = "Confirmer le rendez-vous"; error("Connexion impossible. Réessayez ou appelez le 06 98 95 13 99."); });
  });

  function done(p, d){
    // 1. E-mail au gérant via Netlify Forms
    var fd = new URLSearchParams({
      "form-name": "reservation", reference: d.id, creneau: longDate(p.date) + " à " + p.heure,
      prestation: JP.SERVICES[p.service].label, vehicule: vehicule(p), estimation: p.estimation,
      prenom: p.prenom, nom: p.nom, telephone: p.telephone, plaque: p.plaque,
      lieu: p.lieu === "local" ? "Au local" : "Déplacement", adresse: p.adresse, message: p.message
    });
    fetch("/", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: fd.toString() }).catch(function(){});
    // 2. Conversion Google Ads
    if (typeof trackConversion === "function") trackConversion("booking", p.service);
    // 3. Écran de confirmation
    form.hidden = true; el("summary").hidden = true; el("booking-done").hidden = false;
    el("done-text").textContent = JP.SERVICES[p.service].label + " le " + longDate(p.date) + " à " + p.heure.replace(":", "h") + (p.lieu === "local" ? ", au local de Saint-Étienne-du-Rouvray." : ", à votre adresse.");
    el("done-ref").textContent = d.id;
    var st = p.date.replace(/-/g, "") + "T" + p.heure.replace(":", "") + "00";
    var en = p.date.replace(/-/g, "") + "T" + String(+p.heure.slice(0, 2) + 1).padStart(2, "0") + "0000";
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JD KEY//RDV//FR", "BEGIN:VEVENT", "UID:" + d.id + "@jdkey-auto-rouen.fr",
      "DTSTART;TZID=Europe/Paris:" + st, "DTEND;TZID=Europe/Paris:" + en, "SUMMARY:RDV JD KEY – " + JP.SERVICES[p.service].label,
      "LOCATION:" + (p.lieu === "local" ? "7 rue Guy de Maupassant\\, 76800 Saint-Étienne-du-Rouvray" : p.adresse.replace(/,/g, "\\,")),
      "DESCRIPTION:Apporter la carte grise et une pièce d'identité. JD KEY : 06 98 95 13 99", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    el("done-ics").href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    el("done-cancel").onclick = function(e){
      e.preventDefault();
      if (!confirm("Annuler votre rendez-vous du " + longDate(p.date) + " à " + p.heure + " ?")) return;
      fetch("/api/annuler", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: d.id, token: d.token }) })
        .then(function(r){ return r.json(); })
        .then(function(x){ alert(x.ok ? "Votre rendez-vous est annulé." : (x.error || "Annulation impossible, appelez-nous.")); if (x.ok) location.reload(); });
    };
    try { localStorage.setItem("jdk_last_booking", JSON.stringify({ id: d.id, token: d.token, date: p.date, heure: p.heure })); } catch(e){}
    window.scrollTo({ top: el("booking-done").getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  }

  load(null);
});
