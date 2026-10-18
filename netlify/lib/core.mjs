/* =========================================================
   JD KEY — Planning : règles, stockage et outils communs
   ========================================================= */
import { getStore } from "@netlify/blobs";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/* ---------- RÈGLES DU PLANNING (à adapter) ---------- */
export const RULES = {
  tz: "Europe/Paris",
  // Créneaux d'1 heure : début à 9h, dernier créneau 17h-18h
  hours: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
  slotMinutes: 60,
  // Jours ouverts à la réservation : 1 = lundi … 6 = samedi, 0 = dimanche
  openDays: [0, 1, 2, 3, 4, 5, 6],
  leadMinutes: 120,   // délai minimum entre maintenant et le créneau
  horizonDays: 30,    // on peut réserver jusqu'à 30 jours à l'avance
  bookableServices: ["double", "perte", "programmation", "demarrage", "coque"]
};

/* ---------- Stockage : Netlify Blobs en ligne, dossier local en test ---------- */
class FileStore {
  constructor(dir){ this.dir = dir; }
  file(k){ return path.join(this.dir, encodeURIComponent(k)); }
  async get(k){ try { return JSON.parse(await fs.readFile(this.file(k), "utf8")); } catch { return null; } }
  async setJSON(k, v, o = {}){
    await fs.mkdir(this.dir, { recursive: true });
    if (o.onlyIfNew) { try { await fs.writeFile(this.file(k), JSON.stringify(v), { flag: "wx" }); return { modified: true }; } catch { return { modified: false }; } }
    await fs.writeFile(this.file(k), JSON.stringify(v)); return { modified: true };
  }
  async delete(k){ try { await fs.unlink(this.file(k)); } catch {} }
  async list({ prefix = "" } = {}){
    let names = []; try { names = await fs.readdir(this.dir); } catch {}
    return { blobs: names.map(decodeURIComponent).filter(k => k.startsWith(prefix)).map(key => ({ key })) };
  }
}
export function store(){
  if (process.env.JDK_LOCAL_STORE) return new FileStore(process.env.JDK_LOCAL_STORE);
  return getStore({ name: "planning", consistency: "strong" });
}
export async function getJSON(st, key){
  const v = await st.get(key, { type: "json" });
  return v === undefined ? null : v;
}

/* ---------- Dates à l'heure de Paris ---------- */
export function parisNow(){
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: RULES.tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
export function addDays(iso, n){
  const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
export function weekday(iso){ return new Date(iso + "T12:00:00Z").getUTCDay(); }
export function toMin(hhmm){ const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
export function minutesUntil(date, time){
  const now = parisNow();
  const days = Math.round((Date.parse(date + "T00:00:00Z") - Date.parse(now.date + "T00:00:00Z")) / 864e5);
  return days * 1440 + toMin(time) - toMin(now.time);
}
export const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
export const isHour = s => RULES.hours.includes(s);

/* ---------- Agenda Google du gérant (optionnel) ----------
   Variable d'environnement GCAL_ICS_URL = "Adresse secrète au format iCal"
   de son Google Agenda : ses rendez-vous bloquent automatiquement les créneaux. */
let gcalCache = { at: 0, events: [] };
function icsLocal(value, params){
  // Renvoie { date:"YYYY-MM-DD", min: minutes depuis minuit (heure de Paris), allDay }
  if (/VALUE=DATE/.test(params) || /^\d{8}$/.test(value)) return { date: `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}`, min: 0, allDay: true };
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/); if (!m) return null;
  if (value.endsWith("Z")) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: RULES.tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map(x => [x.type, x.value]));
    return { date: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
  }
  return { date: `${m[1]}-${m[2]}-${m[3]}`, min: +m[4] * 60 + +m[5] }; // TZID=Europe/Paris ou heure locale
}
export async function gcalBusy(){
  const url = process.env.GCAL_ICS_URL;
  if (!url) return [];
  if (Date.now() - gcalCache.at < 5 * 60e3) return gcalCache.events;
  try {
    const txt = (await (await fetch(url)).text()).replace(/\r?\n[ \t]/g, "");
    const events = [];
    for (const block of txt.split("BEGIN:VEVENT").slice(1)) {
      if (/TRANSP:TRANSPARENT/.test(block) || /STATUS:CANCELLED/.test(block)) continue;
      const g = k => { const r = block.match(new RegExp("^" + k + "([^:\\n]*):(.*)$", "m")); return r ? icsLocal(r[2].trim(), r[1]) : null; };
      const s = g("DTSTART"), e = g("DTEND") || s;
      if (!s) continue;
      if (s.allDay) {
        // jours entiers bloqués (fin exclusive)
        for (let d = s.date; d < (e.date > s.date ? e.date : addDays(s.date, 1)); d = addDays(d, 1)) events.push({ date: d, from: 0, to: 1440 });
      } else if (e.date === s.date) events.push({ date: s.date, from: s.min, to: e.min });
      else { events.push({ date: s.date, from: s.min, to: 1440 }); events.push({ date: e.date, from: 0, to: e.min }); }
    }
    gcalCache = { at: Date.now(), events };
  } catch (err) { console.error("GCAL", err.message); }
  return gcalCache.events;
}

/* ---------- Disponibilités sur une période ---------- */
export async function availability(fromDate, days){
  const st = store();
  const [taken, blocks, busy] = await Promise.all([st.list({ prefix: "slot/" }), st.list({ prefix: "block/" }), gcalBusy()]);
  const takenSet = new Set(taken.blobs.map(b => b.key.slice(5)));      // "2026-10-20/09:00"
  const blockSet = new Set(blocks.blobs.map(b => b.key.slice(6)));     // "2026-10-20/09:00" ou "2026-10-20/all"
  const out = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    const open = RULES.openDays.includes(weekday(date)) && !blockSet.has(date + "/all");
    const slots = RULES.hours.map(h => {
      const start = toMin(h), end = start + RULES.slotMinutes;
      let state = "free";
      if (!open) state = "closed";
      else if (minutesUntil(date, h) < RULES.leadMinutes) state = "past";
      else if (takenSet.has(date + "/" + h)) state = "taken";
      else if (blockSet.has(date + "/" + h)) state = "blocked";
      else if (busy.some(b => b.date === date && b.from < end && b.to > start)) state = "busy";
      return { h, state };
    });
    out.push({ date, open, slots });
  }
  return out;
}

/* ---------- Divers ---------- */
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
export const newId = () => crypto.randomBytes(5).toString("hex").toUpperCase();
export const newToken = () => crypto.randomBytes(16).toString("hex");
export const clean = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, max);
export function checkAdmin(req){
  const pin = process.env.ADMIN_PIN;
  if (!pin) return "ADMIN_PIN non configuré sur Netlify";
  const given = req.headers.get("x-admin-pin") || "";
  const a = Buffer.from(given), b = Buffer.from(pin);
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? null : "Code incorrect";
}
