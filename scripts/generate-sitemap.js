#!/usr/bin/env node
'use strict';
/**
 * generate-sitemap.js
 * Génère dist/sitemap.xml depuis villes.json
 * Le sitemap est toujours à jour avec les villes réelles.
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const VILLES = require(path.join(ROOT, 'src/data/villes.json'));
const DIST   = path.join(ROOT, 'dist');

fs.mkdirSync(DIST, { recursive: true });

const today = new Date().toISOString().split('T')[0];
const BASE  = 'https://www.finitionroyale.fr';

const staticUrls = [
  { loc: `${BASE}/`,                                    priority: '1.0', freq: 'weekly' },
  { loc: `${BASE}/zone-intervention/`,                  priority: '0.8', freq: 'monthly' },
  { loc: `${BASE}/mentions-legales/`,                   priority: '0.2', freq: 'yearly' },
  { loc: `${BASE}/politique-confidentialite/`,          priority: '0.2', freq: 'yearly' },
];

const villeUrls = VILLES.map(v => ({
  loc: `${BASE}/pages/villes/${v.slug}.html`,
  priority: String(v.priority),
  freq: 'monthly',
}));

const all = [...staticUrls, ...villeUrls];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml, 'utf8');
console.log(`✅  sitemap.xml généré (${all.length} URLs)`);
