// Serveur de test local : sert public/ et exécute les fonctions /api/* comme Netlify.
// Usage : npm run dev  (puis http://localhost:8888). Données de test dans .local-store/
import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.JDK_LOCAL_STORE ||= path.join(ROOT, ".local-store");
process.env.ADMIN_PIN ||= "1234";
process.env.AGENDA_KEY ||= "test";
const PORT = +process.env.PORT || 8888;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp", ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain", ".json": "application/json" };

const routes = {};
for (const f of await fs.readdir(path.join(ROOT, "netlify/functions"))) {
  const mod = await import(pathToFileURL(path.join(ROOT, "netlify/functions", f)).href);
  routes[mod.config.path] = mod.default;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (routes[url.pathname]) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await routes[url.pathname](new Request(url, { method: req.method, headers: req.headers, body: req.method === "GET" ? undefined : Buffer.concat(chunks) }));
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  if (req.method === "POST" && url.pathname === "/") { res.writeHead(200); res.end("ok (formulaire Netlify simulé)"); return; }
  let p = path.join(ROOT, "public", decodeURIComponent(url.pathname));
  if (p.endsWith("/")) p += "index.html";
  try { const data = await fs.readFile(p); res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" }); res.end(data); }
  catch { res.writeHead(404); res.end("404"); }
}).listen(PORT, () => console.log(`JD KEY en local : http://localhost:${PORT}  (admin : code ${process.env.ADMIN_PIN})`));
