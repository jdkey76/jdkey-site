// /api/avis (espace planning, en-tête x-admin-pin)
//  GET  ?date=YYYY-MM-DD           -> file d'attente du jour (interventions saisies + réservations du site) et historique
//  POST {action:"add", prenom, telephone, service}  /  {action:"exclude"|"include"|"delete", id}  /  {action:"sent", id}
import { store, getJSON, json, checkAdmin, parisNow, addDays, isDate, newId, clean, mobileFR, reviewUrl, queueFor } from "../lib/core.mjs";

export default async (req) => {
  const err = checkAdmin(req);
  if (err) return json({ error: err }, 401);
  const st = store(), today = parisNow().date;
  if (req.method === "GET") {
    const date = isDate(new URL(req.url).searchParams.get("date")) ? new URL(req.url).searchParams.get("date") : today;
    const hist = [];
    for (let i = 0; i < 7; i++) { const d = addDays(today, -i); for (const b of (await st.list({ prefix: `avis-log/${d}/` })).blobs) { const x = await getJSON(st, b.key); if (x) hist.push(x); } }
    return json({ date, auto: !!process.env.BREVO_API_KEY, lienConfigure: !!process.env.REVIEW_URL, lien: reviewUrl(), items: await queueFor(st, date), historique: hist });
  }
  const b = await req.json().catch(() => ({}));
  if (b.action === "add") {
    if (!mobileFR(b.telephone)) return json({ error: "Numéro de portable invalide (06 ou 07)." }, 400);
    const id = newId();
    await st.setJSON(`avis/${today}/${id}`, { id, date: today, origine: "saisie", prenom: clean(b.prenom, 40), telephone: clean(b.telephone, 20), service: clean(b.service, 30), exclu: false, createdAt: new Date().toISOString() });
    return json({ ok: true, id });
  }
  const id = String(b.id || "");
  if (id.startsWith("R")) {   // réservation du site
    if (b.action === "exclude") await st.setJSON(`avis-exclu/${id.slice(1)}`, { at: today });
    if (b.action === "include") await st.delete(`avis-exclu/${id.slice(1)}`);
  } else {
    const key = `avis/${today}/${id}`, x = await getJSON(st, key);
    if (!x) return json({ error: "Introuvable" }, 404);
    if (b.action === "delete") await st.delete(key);
    if (b.action === "exclude" || b.action === "include") await st.setJSON(key, { ...x, exclu: b.action === "exclude" });
  }
  if (b.action === "sent" && mobileFR(b.telephone)) {   // envoi manuel confirmé depuis le téléphone
    await st.setJSON(`avis-envoye/${mobileFR(b.telephone)}`, { date: today, mode: "manuel" });
    await st.setJSON(`avis-log/${today}/${newId()}`, { date: today, prenom: clean(b.prenom, 40), mode: "manuel", ok: true });
  }
  return json({ ok: true });
};
export const config = { path: "/api/avis" };
