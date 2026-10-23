// Statistiques du site, sans cookie ni donnée personnelle (mesure d'audience exemptée de consentement CNIL).
//  POST /api/stats   {t:"pv"|"call"|"whatsapp"|"form"|"booking"|"estimate", p:"/page/", src:"ads|google|bing|social|direct|other", m:1|0, s:"service"}
//  GET  /api/stats?days=7   (en-tête x-admin-pin) -> agrégats par jour
import { store, json, checkAdmin, parisNow, addDays, newId } from "../lib/core.mjs";

const TYPES = new Set(["pv", "call", "whatsapp", "form", "booking", "estimate", "estdone"]);
const SOURCES = new Set(["ads", "google", "bing", "social", "direct", "other", "interne"]);

export default async (req) => {
  const st = store();
  if (req.method === "POST") {
    let b; try { b = JSON.parse(await req.text()); } catch { return new Response(null, { status: 204 }); }
    if (!TYPES.has(b.t)) return new Response(null, { status: 204 });
    const ua = req.headers.get("user-agent") || "";
    if (/bot|crawl|spider|slurp|headless|lighthouse|preview/i.test(ua)) return new Response(null, { status: 204 });
    const ev = {
      t: b.t,
      p: String(b.p || "/").slice(0, 80).replace(/[^\w\-/]/g, ""),
      src: SOURCES.has(b.src) ? b.src : "other",
      m: b.m ? 1 : 0,
      s: String(b.s || "").slice(0, 30).replace(/[^\w\-]/g, ""),
      e: b.e ? 1 : 0,                 // 1 = première page de la visite (entrée sur le site)
      mk: String(b.mk || "").slice(0, 20).replace(/[^\p{L}\p{N}\- ]/gu, ""),   // marque (simulateur)
      an: String(b.an || "").slice(0, 12).replace(/[^\w\-]/g, ""),     // année ou tranche d'année (simulateur)
      tc: String(b.tc || "").slice(0, 20).replace(/[^\w\-]/g, ""),     // type de clé (simulateur)
      h: +parisNow().time.slice(0, 2)
    };
    await st.setJSON(`stats/${parisNow().date}/${Date.now()}-${newId()}`, ev);
    return new Response(null, { status: 204 });
  }
  const err = checkAdmin(req);
  if (err) return json({ error: err }, 401);
  const days = Math.min(parseInt(new URL(req.url).searchParams.get("days") || "7", 10) || 7, 31);
  const today = parisNow().date, out = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const keys = (await st.list({ prefix: `stats/${date}/` })).blobs.map(x => x.key);
    const evs = (await Promise.all(keys.map(k => st.get(k, { type: "json" })))).filter(Boolean);
    const d = { date, visites: 0, pages: 0, mobile: 0, sources: {}, pagesTop: {}, entrees: {}, call: 0, whatsapp: 0, form: 0, booking: 0, estimate: 0, estimations: {}, heures: {}, estdone: 0, vehicules: {}, apresSimulation: {} };
    for (const e of evs) {
      if (e.t === "pv") {
        d.pages++; d.pagesTop[e.p] = (d.pagesTop[e.p] || 0) + 1;
        if (e.e) { d.visites++; d.mobile += e.m; d.sources[e.src] = (d.sources[e.src] || 0) + 1; d.entrees[e.p] = (d.entrees[e.p] || 0) + 1; d.heures[e.h] = (d.heures[e.h] || 0) + 1; }
      } else if (e.t === "estdone") {
        d.estdone++;
        const k = [e.s, e.mk, e.an, e.tc].filter(Boolean).join(" · ");
        d.vehicules[k] = (d.vehicules[k] || 0) + 1;
      } else {
        d[e.t]++;
        if (e.s === "sim") d.apresSimulation[e.t] = (d.apresSimulation[e.t] || 0) + 1;
        if (e.t === "estimate" && e.s) d.estimations[e.s] = (d.estimations[e.s] || 0) + 1;
      }
    }
    out.push(d);
  }
  return json({ days: out });
};
export const config = { path: "/api/stats" };
