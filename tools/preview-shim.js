/* JD KEY — APERÇU UNIQUEMENT (jamais publié sur le vrai site).
   Simule le planning et les formulaires pour naviguer comme sur le site en ligne. */
(function(){
  var BASE = window.JDK_PREVIEW_BASE || "";
  function rel(u){
    if (!u || u.charAt(0) !== "/" || u.charAt(1) === "/") return u;
    var m = u.match(/^([^?#]*)(.*)$/), p = m[1], rest = m[2];
    if (p.indexOf("/assets/") === 0) return BASE + p.slice(1) + rest;
    p = p.replace(/^\/+/, "");
    if (p && p.slice(-1) !== "/" && !/\.html$/.test(p)) p += "/";
    return BASE + p + (/\.html$/.test(p) ? "" : "index.html") + rest;
  }
  window.JDK_REL = rel;

  // Liens créés par script (ex. /reservation/?service=double)
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && a.getAttribute("href").charAt(0) === "/") a.setAttribute("href", rel(a.getAttribute("href")));
  }, true);
  // Formulaire de rappel : pas d'envoi réel, on montre la page de remerciement
  document.addEventListener("submit", function(e){
    if (e.target.getAttribute("name") === "contact") { e.preventDefault(); location.href = rel("/merci/"); }
  }, true);

  // Les fenêtres alert/confirm sont bloquées dans l'aperçu : petit message à la place
  function toast(msg){
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;top:20px;transform:translateX(-50%);z-index:999;background:#1c2224;color:#fff;padding:12px 18px;border-radius:10px;font:600 14px Montserrat,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3);max-width:90vw";
    document.body.appendChild(t); setTimeout(function(){ t.remove(); }, 3500);
  }
  window.alert = toast;
  window.confirm = function(){ return true; };

  // ---- Planning simulé ----
  var HOURS = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
  function load(){ try { return JSON.parse(sessionStorage.getItem("jdk_preview") || "{}"); } catch(e){ return {}; } }
  function save(s){ try { sessionStorage.setItem("jdk_preview", JSON.stringify(s)); } catch(e){} }
  function paris(){
    var p = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
    return { date: p.year + "-" + p.month + "-" + p.day, min: +p.hour * 60 + +p.minute };
  }
  function addDays(iso, n){ var d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function hash(s){ var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function days(from, n){
    var now = paris(), st = load(), out = [], max = addDays(now.date, 30);
    for (var i = 0; i < n; i++) {
      var date = addDays(from, i); if (date > max) break;
      var dayOff = (now.date === date) ? 0 : Math.round((Date.parse(date) - Date.parse(now.date)) / 864e5);
      out.push({ date: date, open: !(st.blocks || {})[date + "/all"], slots: HOURS.map(function(h){
        var k = date + "/" + h, state = "free";
        if ((st.blocks || {})[date + "/all"]) state = "blocked";
        else if (dayOff * 1440 + (+h.slice(0, 2)) * 60 - now.min < 120) state = "past";
        else if ((st.book || {})[k]) state = "taken";
        else if ((st.blocks || {})[k]) state = "blocked";
        else if (hash(k) % 5 === 0) state = "demo";
        return { h: h, state: state };
      }) });
    }
    return out;
  }
  function json(data, status){ return Promise.resolve(new Response(JSON.stringify(data), { status: status || 200, headers: { "content-type": "application/json" } })); }
  var realFetch = window.fetch.bind(window);
  window.fetch = function(url, opt){
    var u = typeof url === "string" ? url : url.url, method = (opt && opt.method) || "GET";
    if (u === "/" && method === "POST") return json({ ok: true });
    if (u.indexOf("/api/") !== 0) return realFetch(rel(u), opt);
    var q = new URL(u, "https://x"), body = {}, st = load(), today = paris().date;
    try { body = opt && opt.body ? JSON.parse(opt.body) : {}; } catch(e){}
    if (q.pathname === "/api/creneaux") {
      var from = q.searchParams.get("from") || today; if (from < today) from = today;
      return json({ hours: HOURS, horizon: addDays(today, 30), days: days(from, +(q.searchParams.get("days") || 14)).map(function(d){
        return { date: d.date, open: d.open, slots: d.slots.map(function(s){ return { h: s.h, free: s.state === "free" }; }) };
      }) });
    }
    if (q.pathname === "/api/reserver") {
      var k = body.date + "/" + body.heure; st.book = st.book || {};
      if (st.book[k]) return json({ error: "Ce créneau vient d'être pris, choisissez-en un autre.", code: "taken" }, 409);
      body.id = ("A" + Date.now().toString(36)).toUpperCase().slice(-8); body.token = "aperçu";
      st.book[k] = body; save(st);
      return json({ ok: true, id: body.id, token: body.token, date: body.date, heure: body.heure });
    }
    if (q.pathname === "/api/annuler") {
      Object.keys(st.book || {}).forEach(function(k){ if (st.book[k].id === body.id) delete st.book[k]; }); save(st);
      return json({ ok: true });
    }
    if (q.pathname === "/api/admin") {
      var pin = opt && opt.headers && opt.headers["x-admin-pin"];
      if (pin !== "1234") return json({ error: "Code incorrect (aperçu : 1234)" }, 401);
      st.blocks = st.blocks || {}; st.book = st.book || {};
      if (method === "POST") {
        var key = body.date + "/" + body.heure;
        if (body.action === "block") st.blocks[key] = 1;
        if (body.action === "unblock") delete st.blocks[key];
        if (body.action === "cancel") delete st.book[key];
        save(st); return json({ ok: true });
      }
      var d = days(q.searchParams.get("from") || today, +(q.searchParams.get("days") || 7));
      d.forEach(function(day){ day.slots.forEach(function(s){
        if (s.state === "taken") s.booking = st.book[day.date + "/" + s.h];
        if (s.state === "demo") { s.state = "taken"; s.booking = { prenom: "Client", nom: "(exemple)", service: "double", telephone: "0600000000", marque: "Renault", annee: "2010-2015", typeCle: "telecommande", estimation: "135 €", lieu: "local" }; }
      }); });
      return json({ hours: HOURS, days: d, dayBlocks: Object.keys(st.blocks).filter(function(k){ return /\/all$/.test(k); }).map(function(k){ return k.slice(0, 10); }) });
    }
    return json({ error: "inconnu" }, 404);
  };
})();
