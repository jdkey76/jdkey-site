// POST /api/reserver  -> crée une réservation (un créneau = une seule réservation, garanti)
import { RULES, store, availability, isDate, isHour, json, newId, newToken, clean } from "../lib/core.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "Requête invalide" }, 400); }
  if (b.website) return json({ ok: true, id: "OK" });                     // pot de miel anti-robot
  const date = b.date, heure = b.heure;
  if (!isDate(date) || !isHour(heure)) return json({ error: "Créneau invalide" }, 400);
  if (!RULES.bookableServices.includes(b.service)) return json({ error: "Cette prestation se traite par téléphone" }, 400);
  const tel = clean(b.telephone, 30).replace(/[^\d+]/g, "");
  if (!clean(b.prenom) || tel.replace(/\D/g, "").length < 9) return json({ error: "Prénom et téléphone obligatoires" }, 400);
  if (b.lieu === "domicile" && clean(b.adresse).length < 5) return json({ error: "Adresse d'intervention manquante" }, 400);

  const [day] = await availability(date, 1);
  const slot = day && day.slots.find(s => s.h === heure);
  if (!slot || slot.state !== "free") return json({ error: "Ce créneau vient d'être pris, choisissez-en un autre.", code: "taken" }, 409);

  const id = newId(), token = newToken();
  const booking = {
    id, token, date, heure, createdAt: new Date().toISOString(),
    service: clean(b.service, 30), marque: clean(b.marque, 40), annee: clean(b.annee, 20),
    typeCle: clean(b.typeCle, 20), modeleCarte: clean(b.modeleCarte, 20), estimation: clean(b.estimation, 60),
    prenom: clean(b.prenom, 60), nom: clean(b.nom, 60), telephone: tel, plaque: clean(b.plaque, 15).toUpperCase(),
    lieu: b.lieu === "local" ? "local" : "domicile", adresse: clean(b.adresse, 200), message: clean(b.message, 800)
  };
  const st = store();
  const res = await st.setJSON(`slot/${date}/${heure}`, booking, { onlyIfNew: true });
  if (!res.modified) return json({ error: "Ce créneau vient d'être pris, choisissez-en un autre.", code: "taken" }, 409);
  await st.setJSON(`byid/${id}`, { date, heure, token });
  return json({ ok: true, id, token, date, heure });
};
export const config = { path: "/api/reserver" };
