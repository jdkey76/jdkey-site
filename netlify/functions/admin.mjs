// /api/admin  (en-tête x-admin-pin = variable ADMIN_PIN)
//  GET  ?from=YYYY-MM-DD&days=14 -> planning détaillé + réservations
//  POST {action:"block"|"unblock", date, heure|"all"}  /  {action:"cancel", date, heure}
import { RULES, store, getJSON, availability, parisNow, isDate, isHour, json, checkAdmin } from "../lib/core.mjs";

export default async (req) => {
  const err = checkAdmin(req);
  if (err) return json({ error: err }, 401);
  const st = store();
  if (req.method === "GET") {
    const u = new URL(req.url);
    const from = isDate(u.searchParams.get("from")) ? u.searchParams.get("from") : parisNow().date;
    const days = Math.min(parseInt(u.searchParams.get("days") || "14", 10) || 14, 31);
    const avail = await availability(from, days);
    for (const d of avail) for (const s of d.slots) if (s.state === "taken") s.booking = await getJSON(st, `slot/${d.date}/${s.h}`);
    const dayBlocks = (await st.list({ prefix: "block/" })).blobs.map(b => b.key.slice(6)).filter(k => k.endsWith("/all")).map(k => k.slice(0, 10));
    return json({ hours: RULES.hours, days: avail, dayBlocks });
  }
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const b = await req.json().catch(() => ({}));
  if (!isDate(b.date) || !(isHour(b.heure) || b.heure === "all")) return json({ error: "Paramètres invalides" }, 400);
  const key = `${b.date}/${b.heure}`;
  if (b.action === "block")   { await st.setJSON(`block/${key}`, { at: new Date().toISOString() }); return json({ ok: true }); }
  if (b.action === "unblock") { await st.delete(`block/${key}`); return json({ ok: true }); }
  if (b.action === "cancel" && b.heure !== "all") {
    const booking = await getJSON(st, `slot/${key}`);
    if (booking) {
      await st.setJSON(`history/${booking.id}`, { ...booking, cancelledAt: new Date().toISOString(), cancelledBy: "jdkey" });
      await st.delete(`byid/${booking.id}`);
    }
    await st.delete(`slot/${key}`);
    return json({ ok: true });
  }
  return json({ error: "Action inconnue" }, 400);
};
export const config = { path: "/api/admin" };
