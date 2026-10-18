// POST /api/annuler {id, token}  -> le client annule sa réservation (lien reçu à la confirmation)
import { store, getJSON, json, minutesUntil } from "../lib/core.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }
  const st = store();
  const ref = await getJSON(st, `byid/${String(b.id || "").toUpperCase()}`);
  if (!ref || ref.token !== b.token) return json({ error: "Réservation introuvable" }, 404);
  if (minutesUntil(ref.date, ref.heure) < 60) return json({ error: "Moins d'une heure avant le rendez-vous : appelez le 06 98 95 13 99." }, 400);
  const booking = await getJSON(st, `slot/${ref.date}/${ref.heure}`);
  if (booking && booking.id === b.id.toUpperCase()) {
    await st.setJSON(`history/${booking.id}`, { ...booking, cancelledAt: new Date().toISOString(), cancelledBy: "client" });
    await st.delete(`slot/${ref.date}/${ref.heure}`);
  }
  await st.delete(`byid/${b.id.toUpperCase()}`);
  return json({ ok: true });
};
export const config = { path: "/api/annuler" };
