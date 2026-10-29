/* JD KEY — Espace planning (page /admin-planning/) */
/* « Rester connecté » : le code est gardé dans ce navigateur (localStorage) et recopié dans la session au chargement. */
(function(){ try { if (!sessionStorage.getItem("jdk_pin")) { var k = localStorage.getItem("jdk_pin_keep"); if (k) sessionStorage.setItem("jdk_pin", k); } } catch(e){} })();
document.addEventListener("DOMContentLoaded", function(){
  var el = function(id){ return document.getElementById(id); };
  var pin = ""; try { pin = sessionStorage.getItem("jdk_pin") || ""; } catch(e){}
  var from = null;
  var SERV = { double: "Double de clé", perte: "Perte totale", programmation: "Programmation", demarrage: "Démarrage", coque: "Clé cassée / coque" };
  var esc = function(s){ return String(s || "").replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function api(method, body, qs){
    return fetch("/api/admin" + (qs || ""), { method: method, headers: { "x-admin-pin": pin, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
      .then(function(r){ return r.json().then(function(d){ if (!r.ok) throw new Error(d.error || "Erreur"); return d; }); });
  }
  function longDate(iso){ return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); }
  function load(){
    api("GET", null, "?days=7" + (from ? "&from=" + from : "")).then(function(d){
      el("adm-login").hidden = true; el("adm-app").hidden = false;
      from = d.days[0].date; render(d);
    }).catch(function(e){ el("adm-login").hidden = false; el("adm-app").hidden = true; if (pin) { el("adm-err").textContent = e.message; el("adm-err").hidden = false; try { localStorage.removeItem("jdk_pin_keep"); } catch(x){} } });
  }
  function render(d){
    var html = "", list = "";
    d.days.forEach(function(day){
      var dayBlocked = d.dayBlocks.indexOf(day.date) > -1;
      html += '<div class="adm-day"><div class="adm-day-head"><b>' + longDate(day.date) + '</b>' +
        '<button type="button" class="btn btn-sm ' + (dayBlocked ? "btn-gold" : "btn-ghost") + '" data-act="' + (dayBlocked ? "unblock" : "block") + '" data-date="' + day.date + '" data-h="all">' + (dayBlocked ? "Débloquer la journée" : "Bloquer la journée") + '</button></div><div class="adm-slots">';
      day.slots.forEach(function(s){
        var b = s.booking, label = s.h.replace(":", "h");
        if (s.state === "taken" && b) {
          html += '<button type="button" class="adm-slot taken" data-act="show" data-date="' + day.date + '" data-h="' + s.h + '"><b>' + label + '</b><small>' + esc(b.prenom) + '</small></button>';
          list += '<div class="adm-item"><div><b>' + longDate(day.date) + ' · ' + label + '</b><br>' + esc(SERV[b.service] || b.service) + ' – ' + esc(b.prenom + " " + b.nom) +
            '<br><small>' + esc([b.marque, b.annee, b.typeCle, b.modeleCarte, b.plaque].filter(Boolean).join(" · ")) + (b.estimation ? " · <b>" + esc(b.estimation) + "</b>" : "") + '</small>' +
            '<br><small>' + (b.lieu === "local" ? "Au local" : "📍 " + esc(b.adresse)) + (b.message ? " · « " + esc(b.message) + " »" : "") + '</small></div>' +
            '<div class="adm-actions"><a class="btn btn-gold btn-sm" href="tel:' + esc(b.telephone) + '">Appeler</a>' +
            '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + esc(b.telephone.replace(/^0/, "33").replace(/\D/g, "")) + '">WhatsApp</a>' +
            '<button type="button" class="btn btn-ghost btn-sm" data-act="cancel" data-date="' + day.date + '" data-h="' + s.h + '">Annuler</button></div></div>';
        } else {
          var act = s.state === "free" ? "block" : s.state === "blocked" ? "unblock" : "";
          html += '<button type="button" class="adm-slot ' + s.state + '"' + (act ? ' data-act="' + act + '" data-date="' + day.date + '" data-h="' + s.h + '"' : " disabled") + '><b>' + label + '</b><small>' +
            ({ free: "libre", blocked: "bloqué", busy: "agenda", closed: "fermé", past: "passé" }[s.state] || "") + '</small></button>';
        }
      });
      html += "</div></div>";
    });
    el("adm-days").innerHTML = html;
    el("adm-list").innerHTML = list || '<p style="color:var(--muted)">Aucun rendez-vous cette semaine.</p>';
  }
  document.addEventListener("click", function(e){
    var b = e.target.closest("[data-act]"); if (!b || !el("adm-app").contains(b)) return;
    var act = b.dataset.act, date = b.dataset.date, h = b.dataset.h;
    if (act === "show") { var item = Array.prototype.filter.call(document.querySelectorAll(".adm-item"), function(x){ return x.textContent.indexOf(h.replace(":", "h")) > -1; })[0]; if (item) item.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (act === "cancel" && !confirm("Annuler ce rendez-vous ? Pensez à prévenir le client.")) return;
    b.disabled = true;
    api("POST", { action: act, date: date, heure: h }).then(load).catch(function(err){ alert(err.message); b.disabled = false; });
  });
  el("adm-form").addEventListener("submit", function(e){ e.preventDefault(); pin = el("adm-pin").value; try { sessionStorage.setItem("jdk_pin", pin); if (el("adm-keep") && el("adm-keep").checked) localStorage.setItem("jdk_pin_keep", pin); else localStorage.removeItem("jdk_pin_keep"); } catch(x){} load(); });
  if (el("adm-logout")) el("adm-logout").addEventListener("click", function(){ try { sessionStorage.removeItem("jdk_pin"); localStorage.removeItem("jdk_pin_keep"); } catch(x){} location.reload(); });
  function shift(n){ var d = new Date(from + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); from = d.toISOString().slice(0, 10); load(); }
  el("adm-prev").addEventListener("click", function(){ shift(-7); });
  el("adm-next").addEventListener("click", function(){ shift(7); });
  el("adm-today").addEventListener("click", function(){ from = null; load(); });
  if (pin) load();
});

/* ---------- Statistiques du site ---------- */
document.addEventListener("DOMContentLoaded", function(){
  var el = function(id){ return document.getElementById(id); };
  if (!el("adm-stats")) return;
  var SRC = { ads: "Google Ads", fiche: "Fiche Google (Maps)", google: "Google (naturel)", bing: "Autres moteurs", social: "Réseaux sociaux", direct: "Accès direct", other: "Autres sites" };
  var SERV = { ouverture: "Ouverture", perte: "Perte totale", double: "Double", programmation: "Programmation", demarrage: "Démarrage", coque: "Clé cassée / coque" };
  var esc = function(s){ return String(s).replace(/[&<>]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
  function pin(){ try { return sessionStorage.getItem("jdk_pin") || ""; } catch(e){ return ""; } }
  function sum(days, k){ return days.reduce(function(a, d){ return a + (d[k] || 0); }, 0); }
  function merge(days, k){ var o = {}; days.forEach(function(d){ for (var x in d[k]) o[x] = (o[x] || 0) + d[k][x]; }); return o; }
  function top(o, labels, n){
    var rows = Object.keys(o).sort(function(a, b){ return o[b] - o[a]; }).slice(0, n || 8);
    if (!rows.length) return '<p class="small" style="color:var(--muted)">Pas encore de données.</p>';
    var max = o[rows[0]];
    return rows.map(function(k){ return '<div class="st-row"><span>' + esc(labels && labels[k] || k) + '</span><i style="width:' + Math.max(4, Math.round(o[k] / max * 100)) + '%"></i><b>' + o[k] + '</b></div>'; }).join("");
  }
  function load(n){
    el("adm-stats-body").innerHTML = '<p style="color:var(--muted)">Chargement…</p>';
    fetch("/api/stats?days=" + n, { headers: { "x-admin-pin": pin() } }).then(function(r){ return r.json(); }).then(function(d){
      if (!d.days) { el("adm-stats-body").textContent = d.error || "Erreur"; return; }
      var D = d.days, v = sum(D, "visites"), contacts = sum(D, "call") + sum(D, "whatsapp") + sum(D, "form") + sum(D, "booking");
      var kpi = function(label, val, sub){ return '<div class="st-kpi"><b>' + val + '</b><span>' + label + '</span>' + (sub ? '<small>' + sub + '</small>' : "") + '</div>'; };
      var html = '<div class="st-kpis">' +
        kpi("Visites", v, sum(D, "pages") + " pages vues") +
        kpi("Clics « Appeler »", sum(D, "call")) + kpi("Clics WhatsApp", sum(D, "whatsapp")) +
        kpi("Réservations", sum(D, "booking")) + kpi("Demandes de rappel", sum(D, "form")) +
        kpi("Taux de contact", v ? Math.round(contacts / v * 100) + " %" : "–", "visites qui contactent") +
        kpi("Sur mobile", v ? Math.round(sum(D, "mobile") / v * 100) + " %" : "–") + '</div>';
      if (D.length > 1) {
        var mx = Math.max.apply(null, D.map(function(x){ return x.visites; }).concat([1]));
        html += '<div class="adm-card st-block"><h3>Visites par jour</h3><div class="st-bars">' + D.map(function(x){
          return '<div title="' + x.date + " : " + x.visites + ' visites"><i style="height:' + Math.round(x.visites / mx * 100) + '%"></i><span>' + x.date.slice(8) + '</span></div>'; }).join("") + '</div></div>';
      }
      html += '<div class="st-grid">' +
        '<div class="adm-card st-block"><h3>D\'où viennent les visiteurs</h3>' + top(merge(D, "sources"), SRC) + '</div>' +
        '<div class="adm-card st-block"><h3>Pages d\'arrivée</h3>' + top(merge(D, "entrees")) + '</div>' +
        '<div class="adm-card st-block"><h3>Pages les plus vues</h3>' + top(merge(D, "pagesTop")) + '</div>' +
        '<div class="adm-card st-block"><h3>Prix consultés (simulateur)</h3>' + top(merge(D, "estimations"), SERV) + '</div>' +
        '<div class="adm-card st-block"><h3>Simulations → contacts</h3>' + (function(){ var a = merge(D, "apresSimulation"), c = (a.call || 0) + (a.whatsapp || 0) + (a.form || 0) + (a.booking || 0), s = sum(D, "estdone");
            return '<div class="st-row"><span>Prix obtenus (véhicule renseigné)</span><b>' + s + '</b></div><div class="st-row"><span>Contacts après une simulation</span><b>' + c + '</b></div><div class="st-row"><span>dont appels / WhatsApp / réservations</span><b>' + (a.call || 0) + ' / ' + (a.whatsapp || 0) + ' / ' + (a.booking || 0) + '</b></div><div class="st-row"><span>Taux simulation → contact</span><b>' + (s ? Math.round(c / s * 100) + " %" : "–") + '</b></div>'; })() + '</div>' +
        '<div class="adm-card st-block"><h3>Véhicules simulés</h3>' + top(merge(D, "vehicules"), null, 10) + '</div>' +
        '<div class="adm-card st-block"><h3>Heures d\'arrivée</h3>' + top(merge(D, "heures"), null, 24).replace(/<span>(\d+)<\/span>/g, "<span>$1 h</span>") + '</div>' +
        '</div><p class="small" style="color:var(--muted);margin-top:10px">Mesure anonyme, sans cookie. Les clics « Appeler » comptent l\'intention d\'appeler depuis le site, pas les appels décrochés.</p>';
      el("adm-stats-body").innerHTML = html;
    }).catch(function(){ el("adm-stats-body").textContent = "Impossible de charger les statistiques."; });
  }
  document.addEventListener("click", function(e){
    var t = e.target.closest("[data-tab]");
    if (t) {
      document.querySelectorAll("[data-tab]").forEach(function(b){ var on = b === t; b.setAttribute("aria-pressed", on); b.className = "btn btn-sm " + (on ? "btn-dark" : "btn-ghost"); });
      el("adm-stats").hidden = t.dataset.tab !== "stats"; el("adm-planning").hidden = t.dataset.tab !== "planning";
      if (t.dataset.tab === "stats") load(7);
    }
    var dd = e.target.closest("[data-days]"); if (dd) load(+dd.dataset.days);
  });
});

/* ---------- Avis clients ---------- */
document.addEventListener("DOMContentLoaded", function(){
  var el = function(id){ return document.getElementById(id); };
  if (!el("adm-avis")) return;
  var SERV = { ouverture: "Ouverture", perte: "Perte totale", double: "Double", programmation: "Programmation", demarrage: "Démarrage", coque: "Clé cassée / coque" };
  var esc = function(s){ return String(s || "").replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  function pin(){ try { return sessionStorage.getItem("jdk_pin") || ""; } catch(e){ return ""; } }
  function api(method, body){
    return fetch("/api/avis", { method: method, headers: { "x-admin-pin": pin(), "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
      .then(function(r){ return r.json().then(function(d){ if (!r.ok) throw new Error(d.error || "Erreur"); return d; }); });
  }
  var auto = false;
  function load(){
    api("GET").then(function(d){
      auto = d.auto;
      el("avis-mode").innerHTML = (d.auto
        ? "Envoi <b>automatique par SMS chaque soir à 19 h 30</b> à tous les clients de la liste (sauf ceux que vous excluez). Les réservations du site y sont ajoutées toutes seules."
        : "Envoi <b>manuel</b> pour l'instant : touchez « SMS » ou « WhatsApp », le message est déjà rédigé. Les réservations du site s'ajoutent toutes seules.")
        + (d.lienConfigure ? "" : " <br><b>Lien d'avis Google à configurer</b> (variable REVIEW_URL).");
      el("avis-list").innerHTML = d.items.length ? d.items.map(function(it){
        var tel = String(it.telephone || "").replace(/\s/g, ""), wa = tel.replace(/^0/, "33").replace(/\D/g, "");
        var state = it.envoye ? '<span class="pill ok">Avis déjà demandé le ' + esc(it.envoye.split("-").reverse().join("/")) + '</span>'
          : !it.mobile ? '<span class="pill">Pas un portable</span>'
          : it.exclu ? '<span class="pill">Exclu</span>'
          : (auto ? '<span class="pill gold">Envoi ce soir 19 h 30</span>' : "");
        var manual = (!auto && it.mobile && !it.envoye && !it.exclu)
          ? '<a class="btn btn-gold btn-sm" data-sent href="sms:' + esc(tel) + '?&body=' + encodeURIComponent(it.message) + '">SMS</a><a class="btn btn-wa btn-sm" data-sent target="_blank" rel="noopener" href="https://wa.me/' + esc(wa) + '?text=' + encodeURIComponent(it.message) + '">WhatsApp</a>' : "";
        return '<div class="adm-item" data-id="' + esc(it.id) + '" data-tel="' + esc(tel) + '" data-prenom="' + esc(it.prenom) + '"><div><b>' + esc(it.prenom) + '</b> · ' + esc(tel) + '<br><small>' + esc(SERV[it.service] || it.service || "") + ' · ' + esc(it.origine) + (it.heure ? " " + esc(it.heure) : "") + '</small><br>' + state + '</div>' +
          '<div class="adm-actions">' + manual + (it.envoye ? "" : '<button type="button" class="btn btn-ghost btn-sm" data-act="' + (it.exclu ? "include" : "exclude") + '">' + (it.exclu ? "Réintégrer" : "Exclure") + '</button>') +
          (it.origine === "saisie" && !it.envoye ? '<button type="button" class="btn btn-ghost btn-sm" data-act="delete">Supprimer</button>' : "") + '</div></div>';
      }).join("") : '<p style="color:var(--muted)">Aucun client pour l\'instant aujourd\'hui.</p>';
      el("avis-hist").innerHTML = d.historique.length ? d.historique.map(function(h){
        return '<div class="st-row" style="grid-template-columns:1fr auto"><span>' + esc(h.date.split("-").reverse().join("/")) + ' · ' + esc(h.prenom) + ' (' + (h.mode === "auto" ? "SMS auto" : "manuel") + ')</span><b>' + (h.ok ? "✓" : "échec") + '</b></div>';
      }).join("") : '<p style="color:var(--muted)">Aucune demande envoyée.</p>';
    }).catch(function(e){ el("avis-list").textContent = e.message; });
  }
  el("avis-form").addEventListener("submit", function(e){
    e.preventDefault(); el("avis-err").hidden = true;
    api("POST", { action: "add", prenom: el("avis-prenom").value, telephone: el("avis-tel").value, service: el("avis-service").value })
      .then(function(){ el("avis-form").reset(); load(); })
      .catch(function(err){ el("avis-err").textContent = err.message; el("avis-err").hidden = false; });
  });
  el("avis-list").addEventListener("click", function(e){
    var row = e.target.closest(".adm-item"); if (!row) return;
    var b = e.target.closest("[data-act]");
    if (b) { b.disabled = true; api("POST", { action: b.dataset.act, id: row.dataset.id }).then(load); }
    if (e.target.closest("[data-sent]")) setTimeout(function(){ api("POST", { action: "sent", id: row.dataset.id, telephone: row.dataset.tel, prenom: row.dataset.prenom }).then(load); }, 800);
  });
  document.addEventListener("click", function(e){
    var t = e.target.closest("[data-tab]"); if (!t) return;
    el("adm-avis").hidden = t.dataset.tab !== "avis";
    if (t.dataset.tab === "avis") load();
  });
});
