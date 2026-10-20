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
   Variable d'environnement GCAL_ICS_URL = adresse iCal de son agenda : "Adresse secrète au format iCal"
   (Google Agenda) ou lien de "Calendrier public" iCloud (webcal://…). Plusieurs adresses : séparer par une virgule.
   Ses rendez-vous bloquent automatiquement les créneaux. */
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
const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const dayDiff = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5);
const parts = iso => iso.split("-").map(Number);
const mondayOf = iso => addDays(iso, -((weekday(iso) + 6) % 7));

/* Dates d'occurrence d'un événement (gère RRULE quotidien/hebdo/mensuel/annuel, INTERVAL, COUNT, UNTIL) */
function occurrences(startDate, rrule, from, to){
  if (!rrule) return [startDate];
  const R = Object.fromEntries(rrule.split(";").map(x => x.split("=")));
  const freq = R.FREQ, iv = Math.max(1, +(R.INTERVAL || 1)), count = R.COUNT ? +R.COUNT : Infinity;
  const until = R.UNTIL ? `${R.UNTIL.slice(0,4)}-${R.UNTIL.slice(4,6)}-${R.UNTIL.slice(6,8)}` : "9999-12-31";
  const byday = R.BYDAY ? R.BYDAY.split(",").map(x => ({ n: parseInt(x, 10) || 0, d: DAYS.indexOf(x.slice(-2)) })) : null;
  const bymd = R.BYMONTHDAY ? R.BYMONTHDAY.split(",").map(Number) : null;
  const [sy, sm, sd] = parts(startDate), out = [];
  let n = 0;
  for (let d = startDate; d <= to && d <= until && n < count; d = addDays(d, 1)) {
    const [y, m, dd] = parts(d), wd = weekday(d);
    let ok = false;
    if (freq === "DAILY") ok = dayDiff(startDate, d) % iv === 0 && (!byday || byday.some(x => x.d === wd));
    else if (freq === "WEEKLY") ok = (dayDiff(mondayOf(startDate), mondayOf(d)) / 7) % iv === 0 && (byday ? byday.some(x => x.d === wd) : wd === weekday(startDate));
    else if (freq === "MONTHLY" || freq === "YEARLY") {
      const months = (y - sy) * 12 + (m - sm);
      const period = freq === "MONTHLY" ? months % iv === 0 : (m === sm && (y - sy) % iv === 0);
      let dayOk;
      if (bymd) dayOk = bymd.includes(dd);
      else if (byday) {
        const nth = Math.floor((dd - 1) / 7) + 1, last = parts(addDays(d, 7))[1] !== m;
        dayOk = byday.some(x => x.d === wd && (x.n === 0 || x.n === nth || (x.n === -1 && last)));
      } else dayOk = dd === sd;
      ok = period && dayOk;
    } else ok = d === startDate;
    if (!ok) continue;
    n++;
    if (d >= from) out.push(d);
  }
  return out;
}

export async function gcalBusy(){
  const url = process.env.GCAL_ICS_URL;
  if (!url) return [];
  if (Date.now() - gcalCache.at < 5 * 60e3) return gcalCache.events;
  try {
    // Une ou plusieurs adresses (séparées par des virgules), Google Agenda ou iCloud (webcal://)
    const urls = url.split(/[\s,]+/).filter(Boolean).map(u => u.replace(/^webcal:/i, "https:"));
    const txt = (await Promise.all(urls.map(async u => (await fetch(u)).text()))).join("\n").replace(/\r?\n[ \t]/g, "");
    const today = parisNow().date, from = addDays(today, -1), to = addDays(today, RULES.horizonDays + 2);
    const blocks = txt.split("BEGIN:VEVENT").slice(1).map(x => x.split("END:VEVENT")[0]);
    const get = (block, k) => { const r = block.match(new RegExp("^" + k + "([^:\\n]*):(.*)$", "m")); return r ? { params: r[1], value: r[2].trim() } : null; };
    // Occurrences modifiées individuellement (RECURRENCE-ID) : on retire l'occurrence d'origine
    const moved = new Set();
    for (const bl of blocks) { const rid = get(bl, "RECURRENCE-ID"), uid = get(bl, "UID"); if (rid && uid) { const x = icsLocal(rid.value, rid.params); if (x) moved.add(uid.value + "|" + x.date); } }
    const events = [];
    for (const bl of blocks) {
      if (/TRANSP:TRANSPARENT/.test(bl) || /STATUS:CANCELLED/.test(bl)) continue;
      const S = get(bl, "DTSTART"), E = get(bl, "DTEND");
      const s = S && icsLocal(S.value, S.params); if (!s) continue;
      const e = (E && icsLocal(E.value, E.params)) || (s.allDay ? { date: addDays(s.date, 1), min: 0, allDay: true } : s);
      const uid = (get(bl, "UID") || {}).value || "", isOverride = !!get(bl, "RECURRENCE-ID");
      const rr = get(bl, "RRULE"), ex = new Set();
      for (const line of bl.match(/^EXDATE[^:\n]*:.*$/gm) || []) {
        const [pp, vv] = [line.slice(6, line.indexOf(":")), line.slice(line.indexOf(":") + 1)];
        for (const v of vv.split(",")) { const x = icsLocal(v.trim(), pp); if (x) ex.add(x.date); }
      }
      const span = dayDiff(s.date, e.date);
      for (const d of occurrences(s.date, rr && rr.value, from, to)) {
        if (ex.has(d) || (!isOverride && rr && moved.has(uid + "|" + d))) continue;
        let os = s, oe = e;
        if (rr && !s.allDay && /Z$/.test(S.value)) {
          // Heure UTC : on recalcule l'heure de Paris à la date de chaque occurrence (été / hiver)
          const shift = dayDiff(s.date, d), toUtc = (v) => addDays(`${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`, shift).replace(/-/g, "") + v.slice(8);
          os = icsLocal(toUtc(S.value), S.params) || s; oe = (E && icsLocal(toUtc(E.value), E.params)) || os;
        }
        const end = addDays(d, span);
        if (s.allDay) { for (let x = d; x < (end > d ? end : addDays(d, 1)); x = addDays(x, 1)) events.push({ date: x, from: 0, to: 1440 }); }
        else if (end === d) events.push({ date: d, from: os.min, to: oe.min });
        else { events.push({ date: d, from: os.min, to: 1440 }); for (let x = addDays(d, 1); x < end; x = addDays(x, 1)) events.push({ date: x, from: 0, to: 1440 }); events.push({ date: end, from: 0, to: oe.min }); }
      }
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

/* ---------- Demandes d'avis Google ---------- */
// Numéro français -> format international sans "+" (ex. 0612345678 -> 33612345678). Mobiles uniquement (06/07).
export function mobileFR(tel){
  let d = String(tel || "").replace(/\D/g, "");
  if (d.startsWith("0033")) d = d.slice(2);
  if (d.startsWith("0") && d.length === 10) d = "33" + d.slice(1);
  return /^33[67]\d{8}$/.test(d) ? d : null;
}
export function reviewUrl(){ return process.env.REVIEW_URL || "https://www.google.com/maps?cid=16242274737633797430"; }
// Message en caractères SMS standards (pas d'accents hors é/è/à) pour rester sur un seul SMS autant que possible
export function reviewMessage(prenom){
  const p = String(prenom || "").split(" ")[0].replace(/[^\p{L}\-']/gu, "").slice(0, 20);
  return `Bonjour${p ? " " + p : ""}, merci d'avoir choisi JD KEY ! Votre avis Google m'aiderait beaucoup : ${reviewUrl()} Bonne soirée !`;
}

export async function queueFor(st, date){
  const items = [];
  for (const b of (await st.list({ prefix: `avis/${date}/` })).blobs) { const x = await getJSON(st, b.key); if (x) items.push(x); }
  for (const b of (await st.list({ prefix: `slot/${date}/` })).blobs) {
    const r = await getJSON(st, b.key); if (!r) continue;
    const ex = await getJSON(st, `avis-exclu/${r.id}`);
    items.push({ id: "R" + r.id, date, origine: "réservation site", prenom: r.prenom, telephone: r.telephone, service: r.service, heure: r.heure, exclu: !!ex });
  }
  for (const it of items) {
    const tel = mobileFR(it.telephone);
    it.mobile = !!tel;
    const sent = tel ? await getJSON(st, `avis-envoye/${tel}`) : null;
    it.envoye = sent ? sent.date : null;
    it.message = reviewMessage(it.prenom);
  }
  return items.sort((a, b) => (a.heure || "99").localeCompare(b.heure || "99"));
}

