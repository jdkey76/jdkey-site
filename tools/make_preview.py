#!/usr/bin/env python3
"""Fabrique un APERÇU navigable (dossier preview/) à partir de public/ :
liens relatifs, balise Google retirée, planning et formulaires simulés.
Usage : python3 build.py && python3 tools/make_preview.py"""
import os, re, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB, OUT = os.path.join(ROOT, "public"), os.path.join(ROOT, "preview")
BANNER = ('<div style="background:#b8975f;color:#1c2224;font:600 13px/1.4 Montserrat,system-ui,sans-serif;'
          'text-align:center;padding:8px 16px">Aperçu du nouveau site JD KEY · la réservation et les formulaires '
          'sont simulés : rien n\'est envoyé.</div>')
MAPLINK = ('<a class="btn btn-dark" href="https://www.google.com/maps?cid=16242274737633797430" target="_blank" '
           'rel="noopener" style="position:absolute;inset:0;margin:auto;width:max-content;height:max-content">'
           '<svg><use href="#i-pin"/></svg>Voir sur Google Maps</a>')


def rel_url(u, base):
    m = re.match(r"^([^?#]*)(.*)$", u)
    p, rest = m.group(1), m.group(2)
    if p.startswith("/assets/"):
        return base + p[1:] + rest
    p = p.strip("/")
    return base + (p + "/" if p else "") + "index.html" + rest


def convert(html, base):
    html = re.sub(r"<!-- =+ BALISE GOOGLE.*?FIN BALISE GOOGLE =+ -->",
                  "<script>window.JDK_CONFIG={conversions:{}};</script>", html, flags=re.S)
    html = html.replace('<meta charset="utf-8">',
                        f'<meta charset="utf-8">\n<script>window.JDK_PREVIEW_BASE="{base}";</script>\n'
                        f'<script src="{base}assets/js/preview-shim.js"></script>', 1)
    html = re.sub(r'(href|src|action)="(/(?!/)[^"]*)"', lambda m: f'{m.group(1)}="{rel_url(m.group(2), base)}"', html)
    html = re.sub(r'srcset="([^"]*)"', lambda m: 'srcset="' + re.sub(r"(?<![\w.])/assets/", base + "assets/", m.group(1)) + '"', html)
    html = re.sub(r'<button class="btn btn-dark" id="map-load"[^>]*>.*?</button>', MAPLINK, html, flags=re.S)
    html = html.replace('<a class="skip"', BANNER + '\n<a class="skip"', 1)
    return html


if os.path.exists(OUT):
    shutil.rmtree(OUT)
shutil.copytree(os.path.join(PUB, "assets"), os.path.join(OUT, "assets"),
                ignore=shutil.ignore_patterns("og-jdkey.jpg"))
shutil.copy(os.path.join(ROOT, "tools", "preview-shim.js"), os.path.join(OUT, "assets", "js", "preview-shim.js"))
pages = 0
for dirpath, _, files in os.walk(PUB):
    if "index.html" not in files or "/assets" in dirpath:
        continue
    relp = os.path.relpath(dirpath, PUB)
    depth = 0 if relp == "." else relp.count("/") + 1
    html = convert(open(os.path.join(dirpath, "index.html"), encoding="utf-8").read(), "../" * depth)
    if depth == 0:
        # Page d'entrée de l'artefact : sans <!doctype>/<html>/<head>/<body> (ajoutés à la publication)
        html = re.sub(r"^<!doctype html>\s*<html[^>]*>\s*<head>\s*", "", html)
        html = html.replace("</head>\n<body>", "", 1).replace("</body>\n</html>", "")
        html = re.sub(r"<title>[^<]*</title>", "<title>Aperçu site JD KEY</title>", html, count=1)
    dest = os.path.join(OUT, relp, "index.html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(html)
    pages += 1
print(f"Aperçu : {pages} pages -> preview/")
