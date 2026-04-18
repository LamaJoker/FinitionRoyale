#!/usr/bin/env node
'use strict';
/**
 * generate-villes.js
 * Génère dist/pages/villes/*.html depuis villes.json + ville.template.html
 *
 * Usage: node scripts/generate-villes.js
 *
 * AJOUTER UNE VILLE → éditer src/data/villes.json uniquement.
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'src/pages/ville.template.html');
const VILLES   = require(path.join(ROOT, 'src/data/villes.json'));
const SERVICES = require(path.join(ROOT, 'src/data/services.json'));
const COMPS    = require(path.join(ROOT, 'src/components/components.js'));
const OUT_DIR  = path.join(ROOT, 'dist/pages/villes');

fs.mkdirSync(OUT_DIR, { recursive: true });

const tpl = fs.readFileSync(TEMPLATE, 'utf8');

// Map slug → ville pour les voisines
const villeMap = Object.fromEntries(VILLES.map(v => [v.slug, v]));

function buildSchema(v) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://www.finitionroyale.fr/#business`,
    name: SERVICES.meta.siteName,
    url: 'https://www.finitionroyale.fr/',
    telephone: SERVICES.meta.phone,
    email: SERVICES.meta.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Besançon', postalCode: '25000', addressRegion: 'Bourgogne-Franche-Comté', addressCountry: 'FR' },
    areaServed: { '@type': 'City', name: v.nom },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: SERVICES.meta.rating, bestRating: '5', reviewCount: SERVICES.meta.reviewCount },
  });
}

function buildVoisines(slugs) {
  return slugs
    .map(slug => villeMap[slug])
    .filter(Boolean)
    .map(v => `<a href="/pages/villes/${v.slug}.html" class="btn btn--ghost">${v.nom}</a>`)
    .join('\n          ');
}

function buildSeoLinks(current) {
  return VILLES
    .filter(v => v.slug !== current)
    .slice(0, 4)
    .map(v => `<a href="/pages/villes/${v.slug}.html">Detailing ${v.nom}</a>`)
    .join(' · ');
}

let generated = 0;

for (const v of VILLES) {
  const html = tpl
    .replace(/{{SLUG}}/g,         v.slug)
    .replace(/{{NOM}}/g,          v.nom)
    .replace(/{{DEPT}}/g,         v.dept)
    .replace(/{{CODE}}/g,         v.code)
    .replace(/{{DESCRIPTION}}/g,  v.description)
    .replace(/{{INTRO}}/g,        v.intro)
    .replace(/{{SEO}}/g,          v.seo)
    .replace(/{{SCHEMA}}/g,       buildSchema(v))
    .replace('{{GTM_HEAD}}',      COMPS.GTM_HEAD(SERVICES.meta.gtmId))
    .replace('{{GTM_NOSCRIPT}}',  COMPS.GTM_NOSCRIPT(SERVICES.meta.gtmId))
    .replace('{{COMPONENT_NAV}}',            COMPS.NAV)
    .replace('{{COMPONENT_MOBILE_MENU}}',    COMPS.MOBILE_MENU)
    .replace('{{COMPONENT_STICKY_CTA}}',     COMPS.STICKY_CTA)
    .replace('{{COMPONENT_SERVICES_GRID}}',  COMPS.SERVICES_GRID)
    .replace('{{COMPONENT_FOOTER}}',         COMPS.FOOTER)
    .replace('{{COMPONENT_COOKIES}}',        COMPS.COOKIE_BANNER)
    .replace('{{VOISINES}}',      buildVoisines(v.voisines))
    .replace('{{SEO_LINKS}}',     buildSeoLinks(v.slug));

  const outPath = path.join(OUT_DIR, `${v.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`  ✓  ${v.slug}.html`);
  generated++;
}

console.log(`\n✅  ${generated} pages générées → dist/pages/villes/\n`);
