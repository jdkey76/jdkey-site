// Envoi automatique des demandes d'avis, chaque soir à 19h30 (heure de Paris), via Brevo (variable BREVO_API_KEY).
// Sans clé Brevo : rien n'est envoyé, l'espace planning propose l'envoi manuel en un geste.
import { store, parisNow, newId, mobileFR, reviewMessage, queueFor } from "../lib/core.mjs";

export default async () => {
  const now = parisNow();
  if (now.time.slice(0, 2) !== "19") return new Response("hors horaire");   // 17h30 ou 18h30 UTC selon été/hiver
  const key = process.env.BREVO_API_KEY;
  if (!key) return new Response("mode manuel");
  const st = store(), items = await queueFor(st, now.date);
  let sent = 0;
  for (const it of items) {
    const tel = mobileFR(it.telephone);
    if (!tel || it.exclu || it.envoye) continue;
    const r = await fetch("https://api.brevo.com/v3/transactionalSMS/send", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: "JDKEY", recipient: tel, content: reviewMessage(it.prenom), type: "transactional", tag: "avis", unicodeEnabled: false })
    });
    const ok = r.ok;
    if (ok) { await st.setJSON(`avis-envoye/${tel}`, { date: now.date, mode: "auto" }); sent++; }
    await st.setJSON(`avis-log/${now.date}/${newId()}`, { date: now.date, prenom: it.prenom, mode: "auto", ok, statut: r.status });
  }
  return new Response(`envoyés : ${sent}`);
};
export const config = { schedule: "30 17,18 * * *" };
