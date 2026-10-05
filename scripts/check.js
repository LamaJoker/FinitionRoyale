#!/usr/bin/env node
/* ============================================================
   FINITION ROYALE — Contrôle qualité du site généré
   ------------------------------------------------------------
   Usage : npm run check   (après npm run build)

   Vérifie chaque page de dist/ :
   - SEO : <title> et meta description (présence, longueur,
     unicité), canonical absolue, un seul <h1>, lang="fr"
   - Liens internes et ancres (#id) qui pointent vers du vide
   - Images : alt présent, dimensions déclarées (zéro CLS)
   - JSON-LD valide, IDs uniques, rel="noopener" sur _blank
   - Compatibilité CSP stricte : aucun style/script/handler inline
   - sitemap.xml cohérent avec les pages indexables
   Code de sortie 1 en cas d'erreur (bloque la CI).
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(DIST)) {
  console.error('✗ dist/ introuvable : lancez d\'abord npm run build');
  process.exit(1);
}

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file} : ${msg}`);
const warn = (file, msg) => warnings.push(`${file} : ${msg}`);

const pages = fs.readdirSync(DIST).filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(pages.map((f) => [f, fs.readFileSync(path.join(DIST, f), 'utf8')]));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decode(m[1]) : null;
};
const idsOf = (doc) => [...doc.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);

const routeToFile = (route) => {
  const clean = route.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'index.html';
  const p = clean.slice(1);
  if (fs.existsSync(path.join(DIST, p)) && fs.statSync(path.join(DIST, p)).isFile()) return p;
  if (fs.existsSync(path.join(DIST, p + '.html'))) return p + '.html';
  return null;
};

const titles = new Map();
const descriptions = new Map();

for (const [file, doc] of Object.entries(html)) {
  const isIndexable = !/<meta name="robots" content="noindex/.test(doc);

  // ── SEO de base ──
  if (!/<html lang="fr">/.test(doc)) err(file, 'attribut lang="fr" manquant');
  const title = (doc.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) err(file, '<title> manquant');
  else {
    const len = [...decode(title)].length;
    if (isIndexable && (len < 25 || len > 70)) warn(file, `title de ${len} caractères (idéal 25–70)`);
    if (titles.has(title)) err(file, `title dupliqué avec ${titles.get(title)}`);
    titles.set(title, file);
  }
  const desc = (doc.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!desc) err(file, 'meta description manquante');
  else {
    const len = [...decode(desc)].length;
    if (isIndexable && (len < 70 || len > 170)) warn(file, `description de ${len} caractères (idéal 70–170)`);
    if (descriptions.has(desc)) err(file, `description dupliquée avec ${descriptions.get(desc)}`);
    descriptions.set(desc, file);
  }
  const canonical = (doc.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!canonical || !/^https:\/\//.test(canonical)) err(file, 'canonical absente ou non absolue');
  const h1 = (doc.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(file, `${h1} balise(s) <h1> (attendu : 1)`);
  if (/\{\{|<fr-/.test(doc)) err(file, 'gabarit non résolu ({{…}} ou <fr-…>)');

  // ── Structure ──
  const ids = idsOf(doc);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) err(file, `id dupliqué(s) : ${[...new Set(dup)].join(', ')}`);

  // ── Images ──
  for (const [tag] of doc.matchAll(/<img\b[^>]*>/g)) {
    if (attr(tag, 'alt') === null) err(file, `<img> sans alt : ${attr(tag, 'src')}`);
    if (!attr(tag, 'width') || !attr(tag, 'height')) err(file, `<img> sans width/height : ${attr(tag, 'src')}`);
    const src = attr(tag, 'src');
    if (src && src.startsWith('/') && !routeToFile(src)) err(file, `image introuvable : ${src}`);
  }
  for (const [, set] of doc.matchAll(/srcset="([^"]+)"/g)) {
    for (const candidate of set.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith('/') && !routeToFile(url)) err(file, `srcset introuvable : ${url}`);
    }
  }

  // ── Liens ──
  for (const [tag] of doc.matchAll(/<a\b[^>]*>/g)) {
    const href = attr(tag, 'href');
    if (!href) { err(file, 'lien sans href'); continue; }
    if (attr(tag, 'target') === '_blank' && !/noopener/.test(attr(tag, 'rel') || '')) err(file, `target=_blank sans rel=noopener : ${href}`);
    if (/^(https?:|mailto:|tel:|sms:)/.test(href)) continue;
    const [route, hash] = href.split('#');
    const target = route ? routeToFile(route.split('?')[0]) : file;
    if (!target) { err(file, `lien interne cassé : ${href}`); continue; }
    if (route && /\.html$/.test(route)) warn(file, `lien avec extension .html : ${href}`);
    if (hash && target.endsWith('.html') && !idsOf(html[target] || '').includes(hash)) err(file, `ancre introuvable : ${href}`);
  }

  // ── JSON-LD ──
  for (const [, json] of doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json); } catch (e) { err(file, `JSON-LD invalide : ${e.message}`); }
  }
  if (isIndexable && !/"@type":"BreadcrumbList"/.test(doc) && file !== 'index.html') warn(file, 'pas de BreadcrumbList');

  // ── CSP stricte ──
  if (/\sstyle="/.test(doc)) err(file, 'attribut style inline (bloqué par la CSP)');
  if (/\son[a-z]+="/.test(doc)) err(file, 'gestionnaire d\'événement inline (bloqué par la CSP)');
  for (const [tag] of doc.matchAll(/<script\b[^>]*>/g)) {
    if (!/type="application\/(ld\+)?json"/.test(tag) && !/\ssrc="/.test(tag)) err(file, 'script inline exécutable (bloqué par la CSP)');
  }
  if (/<style[\s>]/.test(doc)) err(file, 'balise <style> inline (bloquée par la CSP)');
}

// ── Sitemap ──
const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const indexable = pages.filter((f) => !/<meta name="robots" content="noindex/.test(html[f]));
if (locs.length !== indexable.length) err('sitemap.xml', `${locs.length} URL pour ${indexable.length} pages indexables`);
for (const loc of locs) {
  const route = new URL(loc).pathname;
  const file = routeToFile(route);
  if (!file) err('sitemap.xml', `URL sans page : ${loc}`);
  else if (/noindex/.test((html[file].match(/<meta name="robots" content="([^"]+)"/) || [])[1] || '')) err('sitemap.xml', `URL noindex dans le sitemap : ${loc}`);
}
for (const f of ['robots.txt', 'site.webmanifest', 'favicon.ico', '404.html', 'llms.txt']) {
  if (!fs.existsSync(path.join(DIST, f))) err(f, 'fichier manquant');
}

// ── Rapport ──
if (warnings.length) console.log(`⚠ ${warnings.length} avertissement(s)\n  - ` + warnings.join('\n  - '));
if (errors.length) {
  console.error(`\n✗ ${errors.length} erreur(s)\n  - ` + errors.join('\n  - '));
  process.exit(1);
}
console.log(`✓ ${pages.length} pages contrôlées · ${locs.length} URL dans le sitemap · 0 erreur`);
