#!/usr/bin/env node
/* ============================================================
   FINITION ROYALE — Générateur de site statique
   ------------------------------------------------------------
   Usage : npm run build

   src/pages/*.html        pages (front-matter + HTML)
   src/components/*.html   gabarit, en-tête, pied de page…
   src/partials/*.html     blocs réutilisables  <fr-include name="…">
   src/icons/*.svg         icônes inline        <fr-icon name="…">
   src/assets/img/         images responsives   <fr-picture name="…">
   src/config.js           source unique de vérité

   Produit dist/ : HTML minifié, CSS/JS minifiés et versionnés
   par empreinte, JSON-LD (@graph), sitemap, robots, manifest,
   .htaccess (hébergement Apache) et llms.txt.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const config = require(path.join(SRC, 'config.js'));

let esbuild = null;
try { esbuild = require('esbuild'); } catch { /* minification désactivée */ }

/* ── Utilitaires ─────────────────────────────────────────── */

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n');
const write = (p, content) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
};
const hash = (content) => crypto.createHash('sha256').update(content).digest('hex').slice(0, 10);
const escapeHtml = (s) => String(s)
  .replace(/&(?!(#\d+|#x[\da-f]+|\w+);)/gi, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (html) => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
const decodeEntities = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, '’').replace(/&minus;/g, '−').replace(/&rarr;/g, '→');
const jsonForHtml = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

function copyDir(src, dst, filter = () => true) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d, filter);
    else if (filter(entry.name)) fs.copyFileSync(s, d);
  }
}

const errors = [];
const fail = (msg) => errors.push(msg);

/* ── URL du site ─────────────────────────────────────────── */

function resolveSiteUrl() {
  const raw = process.env.SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL && 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL)
    || config.siteUrl;
  return raw.replace(/\/+$/, '');
}
const siteUrl = resolveSiteUrl();
const absUrl = (p) => siteUrl + (p === '/' ? '/' : p);

/* ── Front-matter ────────────────────────────────────────── */

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data = {};
  let blockKey = null;
  let block = [];
  const flush = () => {
    if (blockKey) data[blockKey] = block.join('\n').replace(/\s+$/, '');
    blockKey = null;
    block = [];
  };
  for (const line of match[1].split('\n')) {
    if (blockKey && (/^\s/.test(line) || line === '')) {
      block.push(line.replace(/^ {2}/, ''));
      continue;
    }
    flush();
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (value === '|') { blockKey = key; continue; }
    let v = value.trim().replace(/^(["'])(.*)\1$/, '$2');
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    data[key] = v;
  }
  flush();
  return { data, body: match[2] };
}

/* ── Interpolation {{ chemin.vers.valeur }} ──────────────── */

function lookup(ctx, key) {
  return key.split('.').reduce((obj, k) => (obj == null ? undefined : obj[k]), ctx);
}

function interpolate(str, ctx, where) {
  return str.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const v = lookup(ctx, key);
    if (v === undefined || v === null || typeof v === 'object') {
      fail(`${where} : variable inconnue {{${key}}}`);
      return '';
    }
    return String(v);
  });
}

/* ── Shortcodes <fr-*> ───────────────────────────────────── */

// Les valeurs d'attributs peuvent contenir du HTML échappé (&lt;em&gt;) : on le restitue.
const parseAttrs = (s) => {
  const attrs = {};
  for (const m of s.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) {
    attrs[m[1]] = m[2] === undefined ? true
      : m[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  }
  return attrs;
};

const partials = {};
const partialDir = path.join(SRC, 'partials');
if (fs.existsSync(partialDir)) {
  for (const f of fs.readdirSync(partialDir)) partials[path.basename(f, '.html')] = read(path.join(partialDir, f));
}

function expandIncludes(html, ctx, where, depth = 0) {
  return html.replace(/<fr-include\b([^>]*)>(?:<\/fr-include>)?/g, (_, rawAttrs) => {
    const props = parseAttrs(rawAttrs);
    const tpl = partials[props.name];
    if (!tpl) { fail(`${where} : partial inconnu « ${props.name} »`); return ''; }
    if (depth > 5) { fail(`${where} : inclusion trop profonde (${props.name})`); return ''; }
    const out = interpolate(tpl, { ...ctx, props }, `partials/${props.name}`);
    return expandIncludes(out, ctx, where, depth + 1);
  });
}

const icons = {};
for (const f of fs.readdirSync(path.join(SRC, 'icons'))) {
  icons[path.basename(f, '.svg')] = read(path.join(SRC, 'icons', f)).trim();
}

function expandIcons(html, where) {
  return html.replace(/<fr-icon\b([^>]*)>(?:<\/fr-icon>)?/g, (_, rawAttrs) => {
    const a = parseAttrs(rawAttrs);
    const svg = icons[a.name];
    if (!svg) { fail(`${where} : icône inconnue « ${a.name} »`); return ''; }
    const size = a.size || 20;
    const cls = ['icon', a.class].filter(Boolean).join(' ');
    const label = a.label ? ` role="img" aria-label="${escapeHtml(a.label)}"` : ' aria-hidden="true"';
    return svg.replace('<svg', `<svg class="${cls}" width="${size}" height="${size}" focusable="false"${label}`);
  });
}

const imageManifest = JSON.parse(read(path.join(SRC, 'assets', 'img', 'manifest.json')));
const imgUrl = (name, w, ext) => `/assets/img/${name}-${w}.${ext}`;

function bestWidth(name, target) {
  const { widths } = imageManifest[name];
  return widths.find((w) => w >= target) || widths[widths.length - 1];
}

function expandPictures(html, where) {
  return html.replace(/<fr-picture\b([^>]*)>(?:<\/fr-picture>)?/g, (_, rawAttrs) => {
    const a = parseAttrs(rawAttrs);
    const img = imageManifest[a.name];
    if (!img) { fail(`${where} : image inconnue « ${a.name} »`); return ''; }
    if (a.alt === undefined) fail(`${where} : <fr-picture name="${a.name}"> sans alt`);
    const sizes = a.sizes || '100vw';
    const srcset = (ext) => img.widths.map((w) => `${imgUrl(a.name, w, ext)} ${w}w`).join(', ');
    const eager = a.loading === 'eager' || a.priority;
    const imgAttrs = [
      `src="${imgUrl(a.name, bestWidth(a.name, 800), 'jpg')}"`,
      `srcset="${srcset('jpg')}"`,
      `sizes="${sizes}"`,
      `width="${img.width}" height="${img.height}"`,
      `alt="${escapeHtml(a.alt || '')}"`,
      a.class ? `class="${a.class}"` : '',
      eager ? 'loading="eager"' : 'loading="lazy"',
      a.priority ? 'fetchpriority="high"' : '',
      'decoding="async"',
    ].filter(Boolean).join(' ');
    return `<picture${a['picture-class'] ? ` class="${a['picture-class']}"` : ''}>`
      + `<source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}">`
      + `<source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">`
      + `<img ${imgAttrs}></picture>`;
  });
}

/* ── Minification ────────────────────────────────────────── */

async function minify(code, loader) {
  if (!esbuild) return code;
  const out = await esbuild.transform(code, {
    loader,
    minify: true,
    target: loader === 'css' ? ['chrome100', 'safari15', 'firefox100'] : 'es2019',
    legalComments: 'none',
  });
  return out.code;
}

// Typographie française : espace insécable avant « : » et fine insécable avant « ? ! ; »,
// appliquées au texte uniquement (jamais dans les balises, scripts ou styles).
function frenchTypography(html) {
  return html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/g).map((part, i) => {
    if (i % 2 === 1) return part;
    return part
      .replace(/([A-Za-zÀ-ÿ])'([A-Za-zÀ-ÿ])/g, '$1’$2')
      .replace(/"([^"]+)"/g, '« $1 »')
      .replace(/(\d) (€|%|h|km|min|ans|mois|jours)(?![\wÀ-ÿ])/g, '$1 $2')
      .replace(/ ([?!;])/g, ' $1')
      .replace(/ :(?=\s|$)/g, ' :')
      .replace(/« /g, '« ')
      .replace(/ »/g, ' »');
  }).join('');
}

// Prudente : retire commentaires et indentation, garde un espace/saut de ligne
// entre les balises pour ne jamais coller deux mots inline.
const minifyHtml = (html) => html
  .replace(/<!--(?!\[)[\s\S]*?-->/g, '')
  .replace(/[ \t]*\n[\s]*/g, '\n')
  .replace(/[ \t]{2,}/g, ' ')
  .trim();

/* ── Pages ───────────────────────────────────────────────── */

const fmtDate = (iso) => new Date(iso + 'T12:00:00Z')
  .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function loadPages() {
  const dir = path.join(SRC, 'pages');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((file) => {
    const { data, body } = parseFrontmatter(read(path.join(dir, file)));
    const slug = path.basename(file, '.html');
    const urlPath = slug === 'index' ? '/' : '/' + slug;
    const words = stripTags(body).split(/\s+/).filter(Boolean).length;
    return {
      ...data,
      file,
      slug,
      path: urlPath,
      url: absUrl(urlPath),
      crumb: data.crumb || (slug === 'index' ? 'Accueil' : data.title.split(/ [|—] /)[0]),
      readingTime: Math.max(1, Math.round(words / 220)),
      publishedLabel: data.published ? fmtDate(data.published) : '',
      updatedLabel: data.updated ? fmtDate(data.updated) : '',
      body,
    };
  });
}

function breadcrumbTrail(page, bySlug) {
  const trail = [];
  let cur = page;
  const seen = new Set();
  while (cur && !seen.has(cur.slug)) {
    seen.add(cur.slug);
    trail.unshift(cur);
    cur = cur.parent ? bySlug[cur.parent] : (cur.slug === 'index' ? null : bySlug.index);
    if (page.parent && cur === undefined) fail(`${page.file} : parent inconnu « ${page.parent} »`);
  }
  return trail;
}

function breadcrumbHtml(trail) {
  if (trail.length < 2) return '';
  const items = trail.map((p, i) => (i === trail.length - 1
    ? `<li><span aria-current="page">${p.crumb}</span></li>`
    : `<li><a href="${p.path}">${p.crumb}</a></li>`));
  return `<nav class="breadcrumb" aria-label="Fil d'Ariane"><ol>${items.join('')}</ol></nav>`;
}

/* ── Cartes d'articles (blog, « À lire aussi ») ──────────── */

function postCard(p, headingTag = 'h2') {
  const media = p.image
    ? `<fr-picture name="${p.image}" sizes="(min-width: 900px) 560px, 100vw" alt=""></fr-picture>`
    : `<div class="post-card__cover"><fr-icon name="${p.icon || 'sparkles'}" size="64"></fr-icon></div>`;
  return `<article class="post-card">
  <div class="post-card__media">${media}</div>
  <div class="post-card__body">
    <p class="post-card__meta"><b>${p.category}</b><span>${p.readingTime} min de lecture</span></p>
    <${headingTag}><a href="${p.path}">${p.headline || p.crumb}</a></${headingTag}>
    <p>${p.description}</p>
    <span class="link-arrow" aria-hidden="true">Lire l'article <fr-icon name="arrow-right" size="16"></fr-icon></span>
  </div>
</article>`;
}

/* ── Données structurées ─────────────────────────────────── */

function businessNode() {
  const minPrice = Math.min(...config.offers.flatMap((o) => Object.values(o.prices)));
  const maxPrice = Math.max(...config.offers.flatMap((o) => Object.values(o.prices)));
  const sameAs = Object.values(config.social).filter(Boolean);
  return {
    '@type': 'AutoWash',
    '@id': siteUrl + '/#business',
    name: config.brand,
    description: `${config.tagline} à ${config.city} et dans le ${config.region} : polish, protection céramique et nettoyage intérieur, sur votre place de stationnement.`,
    url: siteUrl + '/',
    logo: { '@type': 'ImageObject', url: siteUrl + '/assets/logo.png', width: 512, height: 512 },
    image: siteUrl + '/assets/og-image.jpg',
    telephone: config.phoneTel,
    email: config.email,
    priceRange: `${minPrice} € – ${maxPrice} €`,
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Carte bancaire, espèces, virement',
    foundingDate: config.legal.foundedDate,
    founder: { '@type': 'Person', name: config.legal.director },
    address: {
      '@type': 'PostalAddress',
      addressLocality: config.legal.locality,
      postalCode: config.legal.postalCode,
      addressRegion: config.bigRegion,
      addressCountry: 'FR',
    },
    areaServed: [
      ...config.zones.map((z) => ({ '@type': 'City', name: z.name })),
      {
        '@type': 'GeoCircle',
        geoMidpoint: { '@type': 'GeoCoordinates', latitude: config.zones[0].lat, longitude: config.zones[0].lng },
        geoRadius: config.serviceRadiusKm * 1000,
      },
    ],
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '19:00',
    }],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Formules de detailing automobile à domicile',
      itemListElement: config.offers.map((o) => ({
        '@type': 'Offer',
        name: o.name,
        url: `${siteUrl}/prestations#${o.anchor || o.id}`,
        itemOffered: { '@type': 'Service', name: `${o.name} — ${o.summary}`, serviceType: 'Detailing automobile' },
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'EUR',
          minPrice: Math.min(...Object.values(o.prices)),
          maxPrice: Math.max(...Object.values(o.prices)),
        },
      })),
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

function pageGraph(page, trail) {
  const imageUrl = page.image ? siteUrl + imgUrl(page.image, bestWidth(page.image, 1200), 'jpg') : siteUrl + '/assets/og-image.jpg';
  const graph = [
    {
      '@type': 'WebSite',
      '@id': siteUrl + '/#website',
      url: siteUrl + '/',
      name: config.brand,
      inLanguage: 'fr-FR',
      publisher: { '@id': siteUrl + '/#business' },
    },
    businessNode(),
    {
      '@type': page.schemaType || 'WebPage',
      '@id': page.url + '#webpage',
      url: page.url,
      name: page.title,
      description: page.description,
      inLanguage: 'fr-FR',
      isPartOf: { '@id': siteUrl + '/#website' },
      about: { '@id': siteUrl + '/#business' },
      primaryImageOfPage: { '@type': 'ImageObject', url: imageUrl },
      ...(trail.length > 1 ? { breadcrumb: { '@id': page.url + '#breadcrumb' } } : {}),
    },
  ];
  if (page.faqSchema) {
    // Questions extraites du HTML rendu : le balisage reflète exactement le contenu visible.
    const clean = (s) => decodeEntities(stripTags(s)).replace(/\s+/g, ' ').trim();
    const questions = [...page.renderedBody.matchAll(
      /<details class="faq__item"[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="faq__answer">([\s\S]*?)<\/div>\s*<\/details>/g,
    )].map(([, q, a]) => ({ '@type': 'Question', name: clean(q), acceptedAnswer: { '@type': 'Answer', text: clean(a) } }));
    if (!questions.length) fail(`${page.file} : faqSchema sans question détectée`);
    graph[2].mainEntity = questions;
  }
  if (trail.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': page.url + '#breadcrumb',
      itemListElement: trail.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.crumb, item: p.url })),
    });
  }
  if (page.type === 'article') {
    graph.push({
      '@type': 'BlogPosting',
      '@id': page.url + '#article',
      headline: page.headline || page.title,
      description: page.description,
      image: imageUrl,
      datePublished: page.published,
      dateModified: page.updated || page.published,
      inLanguage: 'fr-FR',
      wordCount: stripTags(page.body).split(/\s+/).filter(Boolean).length,
      articleSection: page.category,
      author: { '@type': 'Person', name: config.legal.director, url: siteUrl + '/a-propos' },
      publisher: { '@id': siteUrl + '/#business' },
      mainEntityOfPage: { '@id': page.url + '#webpage' },
    });
  }
  if (page.zone) {
    const z = config.zones.find((x) => x.name === page.zone);
    if (!z) fail(`${page.file} : zone inconnue « ${page.zone} »`);
    else {
      graph.push({
        '@type': 'Service',
        '@id': page.url + '#service',
        name: `Detailing automobile à domicile à ${z.name}`,
        serviceType: 'Detailing automobile à domicile',
        provider: { '@id': siteUrl + '/#business' },
        areaServed: { '@type': 'City', name: z.name, address: { '@type': 'PostalAddress', postalCode: z.postalCode, addressCountry: 'FR' } },
        url: page.url,
      });
    }
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

/* ── <head> ──────────────────────────────────────────────── */

function renderHead(page, trail, assets) {
  const e = escapeHtml;
  const ogImage = page.image
    ? { url: siteUrl + imgUrl(page.image, bestWidth(page.image, 1200), 'jpg'), w: bestWidth(page.image, 1200) }
    : { url: siteUrl + '/assets/og-image.jpg', w: 1200, h: 630 };
  if (page.image) ogImage.h = Math.round(imageManifest[page.image].height * ogImage.w / imageManifest[page.image].width);
  const isArticle = page.type === 'article';
  const robots = page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1';

  const tags = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    `<title>${e(page.title)}</title>`,
    `<meta name="description" content="${e(page.description)}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${page.url}">`,
    `<meta name="theme-color" content="${config.themeColor}">`,
    '<meta name="color-scheme" content="dark">',
    '<meta name="format-detection" content="telephone=no">',
    `<link rel="preload" href="/assets/fonts/dm-sans-variable.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="preload" href="/assets/fonts/cormorant-garamond-700.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="stylesheet" href="${assets.css}">`,
    '<link rel="icon" href="/favicon.ico" sizes="48x48">',
    '<link rel="icon" href="/assets/logo-mark.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    `<meta property="og:site_name" content="${e(config.brand)}">`,
    `<meta property="og:locale" content="${config.locale}">`,
    `<meta property="og:type" content="${isArticle ? 'article' : 'website'}">`,
    `<meta property="og:title" content="${e(page.ogTitle || page.title)}">`,
    `<meta property="og:description" content="${e(page.description)}">`,
    `<meta property="og:url" content="${page.url}">`,
    `<meta property="og:image" content="${ogImage.url}">`,
    `<meta property="og:image:width" content="${ogImage.w}">`,
    `<meta property="og:image:height" content="${ogImage.h}">`,
    `<meta property="og:image:alt" content="${e(page.imageAlt || `${config.brand} — ${config.tagline}`)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
  ];
  if (isArticle) {
    tags.push(`<meta property="article:published_time" content="${page.published}">`);
    if (page.updated) tags.push(`<meta property="article:modified_time" content="${page.updated}">`);
    if (page.category) tags.push(`<meta property="article:section" content="${e(page.category)}">`);
  }
  tags.push(`<script type="application/ld+json">${jsonForHtml(pageGraph(page, trail))}</script>`);
  if (page.schema) {
    const raw = interpolate(page.schema, { ...globals, page }, page.file);
    try {
      tags.push(`<script type="application/ld+json">${jsonForHtml(JSON.parse(raw))}</script>`);
    } catch (err) {
      fail(`${page.file} : JSON-LD invalide (${err.message})`);
    }
  }
  return tags.join('\n');
}

/* ── Carte des zones (SVG généré depuis les coordonnées) ─── */

function zoneMapSvg() {
  const W = 440, H = 440, M = 46;
  const [center] = config.zones;
  const kmX = 111.32 * Math.cos(center.lat * Math.PI / 180);
  const kmY = 110.57;
  const pts = config.zones.map((z) => ({ ...z, x: (z.lng - center.lng) * kmX, y: (center.lat - z.lat) * kmY }));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((W - 2 * M) / (x1 - x0), (H - 2 * M) / (y1 - y0));
  const px = (p) => [M + (p.x - x0) * s + ((W - 2 * M) - (x1 - x0) * s) / 2, M + (p.y - y0) * s + ((H - 2 * M) - (y1 - y0) * s) / 2];
  const [cx, cy] = px({ x: 0, y: 0 });
  const label = { 'Besançon': 'left', 'Devecey': 'top', 'Montbéliard': 'top', 'Vesoul': 'top' };
  const rings = [20, 40, 60].map((km) =>
    `<circle class="zone-map__ring" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(km * s).toFixed(1)}"/>`
    + `<text class="zone-map__km" x="${(cx + km * s + 4).toFixed(1)}" y="${(cy + 14).toFixed(1)}">${km} km</text>`);
  const dots = pts.map((p, i) => {
    const [x, y] = px(p);
    const pos = label[p.name] || 'right';
    const tx = pos === 'left' ? x - 12 : pos === 'top' ? x : x + 12;
    const ty = pos === 'top' ? y - 14 : y + 4.5;
    const anchor = pos === 'left' ? 'end' : pos === 'top' ? 'middle' : 'start';
    const cls = i === 0 ? ' zone-map__dot--hq' : (p.slug ? '' : ' zone-map__dot--soft');
    return `<g class="zone-map__dot${cls}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 0 ? 7 : 4.5}"/>`
      + `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}">${p.name}</text></g>`;
  });
  const spokes = pts.slice(1).map((p) => {
    const [x, y] = px(p);
    return `<line class="zone-map__spoke" x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  });
  return `<svg class="zone-map" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">`
    + `<defs><radialGradient id="zm-glow"><stop offset="0" stop-color="#c9a84c" stop-opacity=".22"/><stop offset="1" stop-color="#c9a84c" stop-opacity="0"/></radialGradient></defs>`
    + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(60 * s).toFixed(1)}" fill="url(#zm-glow)"/>`
    + rings.join('') + spokes.join('') + dots.join('')
    + `<circle class="zone-map__pulse" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7"/>`
    + '</svg>';
}

/* ── Variables globales ──────────────────────────────────── */

const offerMap = Object.fromEntries(config.offers.map((o) => {
  const values = Object.values(o.prices);
  return [o.key, { ...o, from: Math.min(...values), to: Math.max(...values), anchor: o.anchor || o.id }];
}));

const globals = {
  ...config,
  siteUrl,
  year: new Date().getFullYear(),
  offer: offerMap,
  extra: Object.fromEntries(config.extras.map((x) => [x.key, x])),
  priceFrom: Math.min(...config.offers.flatMap((o) => Object.values(o.prices))),
  zoneMap: zoneMapSvg(),
  visualNote: config.visualsAreIllustrations ? "Visuel d'illustration" : 'Photo réelle, non retouchée',
  pricingJson: jsonForHtml({
    vehicles: config.vehicles,
    offers: config.offers.map(({ id, name, prices }) => ({ id, name, prices })),
  }),
};

/* ── Build ───────────────────────────────────────────────── */

async function build() {
  const t0 = Date.now();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // 1. Assets statiques (hors CSS/JS, traités à part)
  copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'),
    (f) => !/\.(css|js)$/.test(f) && f !== 'manifest.json');
  fs.copyFileSync(path.join(SRC, 'assets', 'favicon.ico'), path.join(DIST, 'favicon.ico'));

  // 2. CSS & JS minifiés, nommés par empreinte (cache immuable sans risque)
  const assets = {};
  for (const [name, loader] of [['style', 'css'], ['main', 'js']]) {
    const code = await minify(read(path.join(SRC, 'assets', `${name}.${loader}`)), loader);
    const file = `/assets/${name}.${hash(code)}.${loader}`;
    write(path.join(DIST, file), code);
    assets[loader] = file;
  }

  // 3. Composants
  const component = (n) => read(path.join(SRC, 'components', n + '.html'));
  const layout = component('layout');
  const parts = ['header', 'footer', 'mobile-cta', 'cookie-banner'].map((n) => [n, component(n)]);

  // 4. Pages
  const pages = loadPages();
  const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));
  for (const page of pages) {
    if (!page.title) fail(`${page.file} : title manquant`);
    if (!page.description) fail(`${page.file} : description manquante`);
    if (page.image && !imageManifest[page.image]) fail(`${page.file} : image inconnue « ${page.image} »`);
  }

  const articles = pages.filter((p) => p.type === 'article')
    .sort((a, b) => (b.updated || b.published).localeCompare(a.updated || a.published) || a.slug.localeCompare(b.slug));
  for (const a of articles) {
    if (!a.published || !a.category) fail(`${a.file} : article sans published/category`);
  }

  for (const page of pages) {
    const trail = breadcrumbTrail(page, bySlug);
    const ctx = {
      ...globals,
      page,
      breadcrumb: breadcrumbHtml(trail),
      pages: bySlug,
      postCards: `<div class="posts">${articles.map((a) => postCard(a)).join('\n')}</div>`,
      related: `<div class="posts posts--3">${articles.filter((a) => a !== page).slice(0, 3).map((a) => postCard(a, 'h3')).join('\n')}</div>`,
    };
    let body = interpolate(page.body, ctx, page.file);
    body = expandIncludes(body, ctx, page.file);
    page.renderedBody = body;

    let html = layout
      .replace('{{head}}', () => renderHead(page, trail, assets))
      .replace('{{content}}', () => body)
      .replace('{{script}}', assets.js);
    for (const [name, tpl] of parts) {
      html = html.replace(`{{${name}}}`, () => expandIncludes(interpolate(tpl, ctx, `components/${name}`), ctx, name));
    }
    html = interpolate(html, ctx, 'components/layout');
    html = expandPictures(expandIcons(html, page.file), page.file);
    html = frenchTypography(html);

    // Lien de navigation actif : la page elle-même, sinon sa rubrique parente.
    html = html
      .replaceAll(`data-nav="${page.slug}"`, `data-nav="${page.slug}" aria-current="page"`)
      .replaceAll(`data-nav="${page.parent}"`, `data-nav="${page.parent}" aria-current="true"`);

    write(path.join(DIST, page.slug === 'index' ? 'index.html' : page.slug + '.html'), minifyHtml(html));
  }

  const indexable = pages.filter((p) => !p.noindex);

  // 5. sitemap.xml
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...indexable.map((p) => {
      const lastmod = p.updated || p.published || config.lastUpdated;
      const images = [...new Set([p.image, ...[...p.body.matchAll(/<fr-picture\b[^>]*name="([^"]+)"/g)].map((m) => m[1])])]
        .filter(Boolean)
        .map((n) => `<image:image><image:loc>${siteUrl}${imgUrl(n, bestWidth(n, 1200), 'jpg')}</image:loc></image:image>`);
      return `<url><loc>${p.url}</loc><lastmod>${lastmod}</lastmod>${images.join('')}</url>`;
    }),
    '</urlset>',
  ].join('\n');
  write(path.join(DIST, 'sitemap.xml'), sitemap);

  // 6. robots.txt
  write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

  // 7. llms.txt — résumé lisible par les assistants IA
  const llmsSection = (title, filter) => [`## ${title}`, ...indexable.filter(filter).map((p) => `- [${p.crumb}](${p.url}) : ${p.description}`), ''];
  write(path.join(DIST, 'llms.txt'), [
    `# ${config.brand}`, '',
    `> ${config.tagline} à ${config.city} et dans le ${config.region}. ${config.shortPitch}`, '',
    `Tarifs : ${config.offers.map((o) => `${o.name} dès ${offerMap[o.key].from} €`).join(' · ')}. Devis gratuit, réponse en ${config.responseTime}.`,
    `Contact : ${config.phone} · ${config.hours}.`, '',
    ...llmsSection('Services', (p) => ['prestations', 'devis-en-ligne', 'avant-apres', 'faq', 'contact', 'a-propos'].includes(p.slug)),
    ...llmsSection('Zones desservies', (p) => p.zone || p.slug === 'zone-besancon'),
    ...llmsSection('Guides', (p) => p.type === 'article'),
  ].join('\n'));

  // 8. Web manifest
  write(path.join(DIST, 'site.webmanifest'), JSON.stringify({
    name: config.brand,
    short_name: config.brand,
    description: `${config.tagline} — ${config.city}`,
    lang: 'fr-FR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: config.themeColor,
    theme_color: config.themeColor,
    icons: [
      { src: '/assets/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/assets/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2));

  // 9. .htaccess (hébergement Apache/OVH : même comportement que vercel.json)
  write(path.join(DIST, '.htaccess'), read(path.join(SRC, 'server', 'htaccess')));

  if (errors.length) {
    console.error('\n✗ Build en échec :\n  - ' + errors.join('\n  - '));
    process.exit(1);
  }

  const kb = (f) => (fs.statSync(path.join(DIST, f)).size / 1024).toFixed(1) + ' Ko';
  console.log(`✓ ${pages.length} pages · ${indexable.length} indexables · CSS ${kb(assets.css)} · JS ${kb(assets.js)}${esbuild ? '' : ' (non minifiés : esbuild absent)'}`);
  console.log(`✓ sitemap.xml · robots.txt · llms.txt · site.webmanifest · .htaccess`);
  console.log(`✓ URL du site : ${siteUrl}`);
  console.log(`✅ dist/ prêt en ${Date.now() - t0} ms`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
