#!/usr/bin/env python3
"""
JD KEY — mini générateur de site statique (aucune dépendance).

  src/partials/  : gtag.html (balise Google), header.html, footer.html  -> communs à toutes les pages
  src/pages/     : une page = un fichier. "faq.html" -> /faq/ ; "index.html" -> /
  assets/        : CSS, JS, images (copiés tels quels)
  public/        : site final publié par Netlify (généré, ne pas modifier à la main)

Netlify lance automatiquement `python3 build.py` (voir netlify.toml).
En local : python3 build.py  puis ouvrir public/index.html (ou: cd public && python3 -m http.server).
"""
import os, re, shutil, html, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, OUT, SITE = os.path.join(ROOT, "src"), os.path.join(ROOT, "public"), "https://jdkey-auto-rouen.fr"

def read(p):
    with open(p, encoding="utf-8") as f: return f.read()

PARTS = {n: read(os.path.join(SRC, "partials", n + ".html")) for n in ("gtag", "header", "footer")}

# ---- Balise Google : réglages dans site.config.json ----
import json
CFG = json.loads(read(os.path.join(ROOT, "site.config.json")))
_ids = [i for i in (CFG.get("google_tag_id"), CFG.get("ga4_id")) if i]
_aw = CFG.get("google_tag_id", "")
_conv = {k: (_aw + "/" + v if _aw and v else "") for k, v in CFG.get("conversion_labels", {}).items()}
PARTS["gtag"] = (PARTS["gtag"]
    .replace("{{JDK_CONFIG}}", json.dumps({"conversions": _conv}))
    .replace("{{GTAG_CONFIG}}", "\n".join("  gtag('config', '%s');" % i for i in _ids) or "  // Aucun ID renseigné dans site.config.json")
    .replace("{{GTAG_LOADER}}", '<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>' % _ids[0] if _ids else ""))

HEAD = """<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{url}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#2b3436">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="JD KEY">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{site}/assets/img/og-jdkey.jpg">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
{gtag}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/style.css?v={ver}">
{extra_head}
</head>
<body>"""

def parse(text):
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1); meta[k.strip()] = v.strip()
    body = text[m.end():]
    extra = ""
    h = re.search(r"<!--HEAD-->(.*?)<!--/HEAD-->", body, re.S)
    if h: extra, body = h.group(1).strip(), body[:h.start()] + body[h.end():]
    body = re.sub(r"<!--INCLUDE ([\w-]+)-->", lambda m: read(os.path.join(SRC, "partials", m.group(1) + ".html")), body)
    return meta, extra, body

def main():
    if os.path.exists(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(OUT, "assets"))
    for f in ("robots.txt", "_redirects", "_headers"):
        p = os.path.join(ROOT, f)
        if os.path.exists(p): shutil.copy(p, OUT)
    ver = datetime.datetime.now().strftime("%Y%m%d%H%M")
    sitemap = []
    for name in sorted(os.listdir(os.path.join(SRC, "pages"))):
        if not name.endswith(".html"): continue
        meta, extra, body = parse(read(os.path.join(SRC, "pages", name)))
        path = meta.get("path", "/" if name == "index.html" else "/" + name[:-5].replace("__", "/") + "/")
        noindex = meta.get("noindex") == "true"
        page = HEAD.format(
            title=html.escape(meta["title"]), description=html.escape(meta["description"]),
            og_title=html.escape(meta.get("og_title", meta["title"])), url=SITE + path, site=SITE,
            robots="noindex, follow" if noindex else "index, follow, max-image-preview:large",
            gtag=PARTS["gtag"], extra_head=extra + "\n" + meta.get("head", ""), ver=ver)
        page += "\n" + PARTS["header"].replace(f'href="{path}" class="nav-link"', f'href="{path}" class="nav-link" aria-current="page"')
        page += "<main id=\"contenu\">" + body + PARTS["footer"].replace("/assets/js/", "/assets/js/").replace(".js\" defer", ".js?v=" + ver + "\" defer") + "</body>\n</html>\n"
        dest = os.path.join(OUT, path.strip("/"), "index.html") if path != "/" else os.path.join(OUT, "index.html")
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as f: f.write(page)
        if not noindex: sitemap.append((path, meta.get("priority", "1.0" if path == "/" else "0.8")))
        print("  ", path)
    # Page d'erreur Netlify : /404.html à la racine
    if os.path.exists(os.path.join(OUT, "404", "index.html")):
        shutil.move(os.path.join(OUT, "404", "index.html"), os.path.join(OUT, "404.html")); os.rmdir(os.path.join(OUT, "404"))
    today = datetime.date.today().isoformat()
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    xml += [f"  <url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>" for p, pr in sitemap]
    xml.append("</urlset>")
    with open(os.path.join(OUT, "sitemap.xml"), "w") as f: f.write("\n".join(xml) + "\n")
    print(f"OK : {len(sitemap)} pages indexables -> public/")

if __name__ == "__main__":
    main()
