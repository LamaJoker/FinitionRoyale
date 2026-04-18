#!/usr/bin/env node
'use strict';
/**
 * copy-static.js
 * Copie les fichiers statiques (non traités par Vite) dans dist/
 */

const fs   = require('fs');
const path = require('path');

const ROOT   = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const DIST   = path.join(ROOT, 'dist');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else { fs.copyFileSync(s, d); console.log(`  → ${d.replace(ROOT + '/', '')}`); }
  }
}

const FILES = [
  '.htaccess',
  'robots.txt',
  'favicon.ico',
  'favicon-32x32.png',
  'favicon-16x16.png',
  'apple-touch-icon.png',
];

const DIRS = [
  'mentions-legales',
  'politique-confidentialite',
  'zone-intervention',
];

console.log('\n📦  Copie des fichiers statiques...\n');

for (const f of FILES) {
  const src = path.join(PUBLIC, f);
  if (!fs.existsSync(src)) { console.log(`  ⚠  Manquant: ${f}`); continue; }
  fs.mkdirSync(DIST, { recursive: true });
  fs.copyFileSync(src, path.join(DIST, f));
  console.log(`  → ${f}`);
}

for (const d of DIRS) {
  copyDir(path.join(PUBLIC, d), path.join(DIST, d));
}

// send-rdv.php
const php = path.join(PUBLIC, 'send-rdv.php');
if (fs.existsSync(php)) {
  fs.copyFileSync(php, path.join(DIST, 'send-rdv.php'));
  console.log('  → send-rdv.php');
}

console.log('\n✅  Fichiers statiques copiés.\n');
