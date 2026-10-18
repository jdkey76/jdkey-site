/* JD KEY — Espace planning (page /admin-planning/) */
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
    }).catch(function(e){ el("adm-login").hidden = false; el("adm-app").hidden = true; if (pin) { el("adm-err").textContent = e.message; el("adm-err").hidden = false; } });
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
  el("adm-form").addEventListener("submit", function(e){ e.preventDefault(); pin = el("adm-pin").value; try { sessionStorage.setItem("jdk_pin", pin); } catch(x){} load(); });
  function shift(n){ var d = new Date(from + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); from = d.toISOString().slice(0, 10); load(); }
  el("adm-prev").addEventListener("click", function(){ shift(-7); });
  el("adm-next").addEventListener("click", function(){ shift(7); });
  el("adm-today").addEventListener("click", function(){ from = null; load(); });
  if (pin) load();
});
