// GET /api/creneaux?from=YYYY-MM-DD&days=14  -> disponibilités publiques
import { RULES, availability, parisNow, addDays, isDate, json } from "../lib/core.mjs";

export default async (req) => {
  const u = new URL(req.url);
  const today = parisNow().date;
  let from = isDate(u.searchParams.get("from")) ? u.searchParams.get("from") : today;
  if (from < today) from = today;
  const max = addDays(today, RULES.horizonDays);
  let days = Math.min(Math.max(parseInt(u.searchParams.get("days") || "14", 10) || 14, 1), 21);
  const out = (await availability(from, days)).filter(d => d.date <= max).map(d => ({
    date: d.date, open: d.open,
    slots: d.slots.map(s => ({ h: s.h, free: s.state === "free" }))   // le détail (pris, bloqué…) reste privé
  }));
  return json({ hours: RULES.hours, horizon: max, days: out });
};
export const config = { path: "/api/creneaux" };
