#!/usr/bin/env node
/* ============================================================
   FINITION ROYALE — Génération des assets de marque
   ------------------------------------------------------------
   Usage : npm run brand

   Depuis le logo vectoriel src/assets/logo-mark.svg :
     - favicons PNG + favicon.ico (PNG embarqués)
     - apple-touch-icon, icônes PWA (dont « maskable »)
     - logo.png 512×512 (référencé par les données structurées)
   Depuis scripts/brand/og.html (rendu Chrome/Edge headless) :
     - src/assets/og-image.jpg 1200×630 (partage réseaux sociaux)

   Les fichiers produits sont versionnés : à relancer uniquement
   si le logo ou le visuel de partage change.
   ============================================================ */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'src', 'assets');
const MARK = fs.readFileSync(path.join(ASSETS, 'logo-mark.svg'));
const BG = '#0b0b0b';

// Logo centré sur fond noir ; `scale` = part du carré occupée par le logo.
async function icon(size, scale, file) {
  const inner = Math.round(size * scale);
  const mark = await sharp(MARK, { density: 1200 }).resize({ height: inner }).png().toBuffer();
  const buf = await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: mark, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: size <= 64 })
    .toBuffer();
  if (file) fs.writeFileSync(path.join(ASSETS, file), buf);
  return buf;
}

// Conteneur ICO minimal : en-tête + répertoire + PNG bruts (supporté depuis Vista).
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

async function ogImage() {
  const chrome = findChrome();
  if (!chrome) {
    console.warn('⚠ Chrome/Edge introuvable (CHROME_PATH) : og-image.jpg non régénérée');
    return;
  }
  const tmp = path.join(os.tmpdir(), 'fr-og.png');
  const url = 'file:///' + path.join(__dirname, 'brand', 'og.html').replace(/\\/g, '/');
  execFileSync(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--allow-file-access-from-files', '--virtual-time-budget=4000',
    '--window-size=1200,630', `--screenshot=${tmp}`, url,
  ], { stdio: 'ignore' });
  await sharp(tmp).resize(1200, 630).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(ASSETS, 'og-image.jpg'));
  fs.rmSync(tmp, { force: true });
  console.log('✓ og-image.jpg (1200×630)');
}

(async () => {
  const p16 = await icon(16, 0.94);
  const p32 = await icon(32, 0.9, 'favicon-32x32.png');
  const p48 = await icon(48, 0.86);
  fs.writeFileSync(path.join(ASSETS, 'favicon-16x16.png'), p16);
  fs.writeFileSync(path.join(ASSETS, 'favicon.ico'), ico([
    { size: 16, data: p16 }, { size: 32, data: p32 }, { size: 48, data: p48 },
  ]));
  await icon(180, 0.66, 'apple-touch-icon.png');
  await icon(192, 0.7, 'android-chrome-192x192.png');
  await icon(512, 0.7, 'android-chrome-512x512.png');
  await icon(512, 0.56, 'maskable-512x512.png');   // zone de sécurité 80 %
  await icon(512, 0.72, 'logo.png');
  console.log('✓ favicons, apple-touch-icon, icônes PWA, logo.png');
  await ogImage();
})();
