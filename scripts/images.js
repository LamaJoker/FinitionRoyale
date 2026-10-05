#!/usr/bin/env node
/* ============================================================
   FINITION ROYALE — Pipeline d'images
   ------------------------------------------------------------
   Usage : npm run images

   Source  : src/images/<nom>.jpg   (originaux haute qualité)
   Sortie  : src/assets/img/<nom>-<largeur>.{avif,webp,jpg}
             src/assets/img/manifest.json

   Chaque image est déclinée en plusieurs largeurs et trois
   formats. Le manifeste est lu par le build pour générer les
   balises <picture> (srcset + sizes + width/height → zéro CLS).

   Les variantes sont versionnées dans le dépôt : le build de
   production n'a pas besoin de sharp, il reste déterministe.
   ============================================================ */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('✗ sharp est requis : npm install');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'images');
const OUT = path.join(ROOT, 'src', 'assets', 'img');

// Recadrages spécifiques : les montages avant/après d'origine portent
// un bandeau-titre incrusté (avec une erreur de marque) qu'on retire.
const TRANSFORMS = {
  'ap-lavage-qashqai': { cropTop: 88 },
  'ap-phares-clio':    { cropTop: 66 },
  'ap-sieges-308':     { cropTop: 58 },
};

const WIDTHS = [480, 800, 1200, 1696];
const QUALITY = { avif: 55, webp: 78, jpg: 80 };

async function processImage(file) {
  const name = path.basename(file, path.extname(file));
  const t = TRANSFORMS[name] || {};
  let pipeline = sharp(path.join(SRC, file));
  const meta = await pipeline.metadata();

  let width = meta.width;
  let height = meta.height;
  if (t.cropTop) {
    height -= t.cropTop;
    pipeline = pipeline.extract({ left: 0, top: t.cropTop, width, height });
  }
  const base = await pipeline.toBuffer();

  // Largeurs standard nettement inférieures à l'original, puis l'original.
  const widths = WIDTHS.filter((w) => w < width * 0.9).concat(width);
  for (const w of widths) {
    const resized = sharp(base).resize({ width: w, withoutEnlargement: true });
    const stem = path.join(OUT, `${name}-${w}`);
    await Promise.all([
      resized.clone().avif({ quality: QUALITY.avif, effort: 6 }).toFile(stem + '.avif'),
      resized.clone().webp({ quality: QUALITY.webp, effort: 6 }).toFile(stem + '.webp'),
      resized.clone().jpeg({ quality: QUALITY.jpg, mozjpeg: true, progressive: true }).toFile(stem + '.jpg'),
    ]);
  }
  console.log(`✓ ${name} (${width}×${height}) → ${widths.join(', ')} px`);
  return [name, { width, height, widths }];
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  const manifest = Object.fromEntries(await Promise.all(files.map(processImage)));
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n✅ ${files.length} images → src/assets/img/manifest.json`);
})();
