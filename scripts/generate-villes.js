#!/usr/bin/env node
/**
 * generate-villes.js
 * Génère automatiquement une page HTML par ville depuis villes.json + template
 *
 * Usage: node scripts/generate-villes.js
 * Output: dist/pages/villes/*.html
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const villes = JSON.parse(readFileSync(join(ROOT, 'src/data/villes.json'), 'utf8'));
const template = readFileSync(join(ROOT, 'src/pages/ville.template.html'), 'utf8');

const outDir = join(ROOT, 'dist/pages/villes');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// All other villes for cross-linking
const allVillesMap = Object.fromEntries(villes.map(v => [v.slug, v]));

villes.forEach(ville => {
  const villesVoisinesHTML = [
    ...ville.villesVoisines.map(slug => {
      const v = allVillesMap[slug];
      if (!v) return '';
      return `<a href="/pages/villes/${v.slug}.html" class="btn btn--ghost" style="font-size:0.78rem;padding:0.55rem 1rem">${v.nom}</a>`;
    }),
    `<a href="/zone-intervention-detailing-besancon/" class="btn btn--outline" style="font-size:0.78rem;padding:0.55rem 1rem">Toutes les zones →</a>`
  ].filter(Boolean).join('\n          ');

  const zonesLinksHTML = villes
    .filter(v => v.slug !== ville.slug)
    .slice(0, 4)
    .map(v => `<a href="/pages/villes/${v.slug}.html" style="color:inherit">Detailing ${v.nom}</a>`)
    .join(' · ');

  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Finition Royale",
    "description": `Detailing automobile à domicile à ${ville.nom} — nettoyage intérieur, shampoing sièges, lavage extérieur, rénovation phares.`,
    "url": ville.canonical,
    "telephone": "+33648079396",
    "email": "contact@finitionroyale.fr",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Besançon",
      "postalCode": "25000",
      "addressRegion": "Bourgogne-Franche-Comté",
      "addressCountry": "FR"
    },
    "areaServed": { "@type": "City", "name": ville.nom },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "bestRating": "5", "reviewCount": "47" }
  }, null, 2);

  let html = template
    .replace(/\{\{VILLE\}\}/g, ville.nom)
    .replace(/\{\{VILLE_SLUG\}\}/g, ville.slug)
    .replace(/\{\{DEPT\}\}/g, ville.dept)
    .replace(/\{\{REGION\}\}/g, ville.region)
    .replace(/\{\{DESCRIPTION\}\}/g, ville.description)
    .replace(/\{\{INTRO\}\}/g, ville.intro)
    .replace(/\{\{SEO_CONTENT\}\}/g, ville.seoContent)
    .replace(/\{\{CANONICAL\}\}/g, ville.canonical)
    .replace(/\{\{SCHEMA\}\}/g, schema)
    .replace(/\{\{VILLES_VOISINES\}\}/g, villesVoisinesHTML)
    .replace(/\{\{ZONES_LINKS\}\}/g, zonesLinksHTML);

  writeFileSync(join(outDir, `${ville.slug}.html`), html, 'utf8');
  console.log(`✓ Generated: ${ville.slug}.html`);
});

console.log(`\n✅ ${villes.length} pages générées dans dist/pages/villes/`);
