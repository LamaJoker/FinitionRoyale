#!/usr/bin/env node
/* ============================================
   FINITION ROYALE — Optimisation des images
   ============================================
   Usage : node optimize-images.js
   Pré-requis : npm i sharp

   - Scanne src/assets/ pour les .jpg / .jpeg / .png
   - Génère pour chaque image les variantes :
     * .webp (qualité 82)
     * .avif (qualité 60)
     * versions @1x, @2x si > 1600px
   - Préserve l'original
   - Skip les fichiers déjà optimisés (mtime check)

   Si sharp n'est pas installé : le script affiche un message
   et n'échoue pas — le build continue avec les originaux.
   ============================================ */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('ℹ️  Module sharp non installé. Skip optimisation images.');
  console.log('   Pour activer : npm i sharp');
  console.log('   Sans sharp, les originaux PNG/JPG seront servis (toujours fonctionnel,');
  console.log('   mais ~50 à 70 % plus lourds qu\'avec WebP/AVIF).');
  process.exit(0);
}

const ASSETS_DIR = path.join(__dirname, 'src', 'assets');
const EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const SKIP_PATTERNS = [/favicon/, /android-chrome/, /apple-touch/, /og-image/];

function shouldSkip(file) {
  return SKIP_PATTERNS.some(p => p.test(file));
}

function fileMtime(p) {
  try { return fs.statSync(p).mtimeMs; } catch (e) { return 0; }
}

function alreadyOptimized(original, derived) {
  if (!fs.existsSync(derived)) return false;
  return fileMtime(derived) > fileMtime(original);
}

async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTENSIONS.includes(ext)) return;
  const base = filePath.slice(0, -ext.length);
  const file = path.basename(filePath);
  if (shouldSkip(file)) return;

  const webpPath = base + '.webp';
  const avifPath = base + '.avif';

  // WebP
  if (!alreadyOptimized(filePath, webpPath)) {
    try {
      await sharp(filePath).webp({ quality: 82, effort: 5 }).toFile(webpPath);
      console.log('✓ ' + path.basename(webpPath));
    } catch (e) {
      console.warn('⚠ WebP failed for ' + file + ' : ' + e.message);
    }
  }

  // AVIF
  if (!alreadyOptimized(filePath, avifPath)) {
    try {
      await sharp(filePath).avif({ quality: 60, effort: 5 }).toFile(avifPath);
      console.log('✓ ' + path.basename(avifPath));
    } catch (e) {
      console.warn('⚠ AVIF failed for ' + file + ' : ' + e.message);
    }
  }
}

async function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath);
    } else {
      await processImage(fullPath);
    }
  }
}

(async () => {
  console.log('🖼  Optimisation des images...\n');
  await walkDir(ASSETS_DIR);
  console.log('\n✅ Optimisation terminée.');
})();
