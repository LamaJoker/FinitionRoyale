#!/usr/bin/env node
/**
 * copy-extras.js
 * Copie les fichiers qui ne passent pas par Vite :
 * .htaccess, send-rdv.php, sitemap.xml, robots.txt, pages statiques
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC  = join(ROOT, 'src');
const PUB  = join(ROOT, 'public');
const DIST = join(ROOT, 'dist');

// Helper: copie récursive
function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    statSync(s).isDirectory() ? copyDir(s, d) : copyFileSync(s, d);
  }
}

// Helper: copie unique avec création du dossier
function copy(src, dest) {
  if (!existsSync(src)) { console.warn(`⚠ Skip (not found): ${src}`); return; }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`✓ ${src.replace(ROOT, '.')} → ${dest.replace(ROOT, '.')}`);
}

console.log('\n📦 Copie des extras...\n');

// Fichiers à la racine de public/
const rootFiles = [
  '.htaccess',
  'sitemap.xml',
  'robots.txt',
  'send-rdv.php',
];
rootFiles.forEach(f => copy(join(PUB, f), join(DIST, f)));

// Pages statiques
const staticDirs = [
  'mentions-legales',
  'politique-confidentialite',
  'zone-intervention-detailing-besancon',
];
staticDirs.forEach(d => copyDir(join(PUB, d), join(DIST, d)));

// Pages villes (générées séparément par generate-villes.js)
copyDir(join(DIST, 'pages'), join(DIST, 'pages')); // no-op si déjà là

console.log('\n✅ Extras copiés.\n');
