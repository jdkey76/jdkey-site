// GET /api/agenda.ics?cle=AGENDA_KEY -> flux iCal des réservations, à ajouter dans l'agenda du téléphone
import { store, getJSON, json, parisNow, addDays } from "../lib/core.mjs";

const SERVICES = { double: "Double de clé", perte: "Perte totale de clés", programmation: "Programmation de clé", demarrage: "Démarrage", coque: "Clé cassée / coque" };
const esc = s => String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const stamp = (d, h) => d.replace(/-/g, "") + "T" + h.replace(":", "") + "00";

export default async (req) => {
  const key = process.env.AGENDA_KEY;
  if (!key || new URL(req.url).searchParams.get("cle") !== key) return json({ error: "Accès refusé" }, 401);
  const st = store();
  const since = addDays(parisNow().date, -7);
  const keys = (await st.list({ prefix: "slot/" })).blobs.map(b => b.key).filter(k => k.slice(5, 15) >= since);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JD KEY//Planning//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:JD KEY – Réservations", "X-WR-TIMEZONE:Europe/Paris", "REFRESH-INTERVAL;VALUE=DURATION:PT15M", "X-PUBLISHED-TTL:PT15M",
    // Définition du fuseau Europe/Paris (indispensable pour l'iPhone)
    "BEGIN:VTIMEZONE", "TZID:Europe/Paris",
    "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
    "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
    "END:VTIMEZONE"];
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  for (const k of keys) {
    const b = await getJSON(st, k); if (!b) continue;
    const endH = String(+b.heure.slice(0, 2) + 1).padStart(2, "0") + ":00";
    lines.push("BEGIN:VEVENT", `UID:${b.id}@jdkey-auto-rouen.fr`, `DTSTAMP:${now}`,
      `DTSTART;TZID=Europe/Paris:${stamp(b.date, b.heure)}`, `DTEND;TZID=Europe/Paris:${stamp(b.date, endH)}`,
      `SUMMARY:${esc(`${SERVICES[b.service] || b.service} – ${b.prenom} ${b.nom}`.trim())}`,
      `LOCATION:${esc(b.lieu === "local" ? "Local – 7 rue Guy de Maupassant, Saint-Étienne-du-Rouvray" : b.adresse)}`,
      `DESCRIPTION:${esc(`Tél : ${b.telephone}\nVéhicule : ${b.marque} ${b.annee} ${b.plaque}\nClé : ${b.typeCle} ${b.modeleCarte}\nEstimation : ${b.estimation}\nMessage : ${b.message}\nRéf. ${b.id}`)}`,
      "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  // Lignes de 75 octets max (norme iCalendar), coupées sans casser les caractères accentués
  const fold = (l) => { const out = []; let cur = "", n = 0; for (const ch of l) { const b = Buffer.byteLength(ch); if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0; } cur += ch; n += b; } out.push(cur); return out.join("\r\n "); };
  return new Response(lines.map(fold).join("\r\n") + "\r\n", { headers: { "content-type": "text/calendar; charset=utf-8", "cache-control": "no-store" } });
};
export const config = { path: "/api/agenda.ics" };
