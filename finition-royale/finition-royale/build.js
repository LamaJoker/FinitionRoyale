#!/usr/bin/env node
/* ============================================
   FINITION ROYALE — Build script
   ============================================
   Usage : node build.js

   - Lit src/config.js (source unique)
   - Assemble les composants dans chaque page
   - Injecte les variables {{xxx}}
   - Minifie CSS et JS basique
   - Génère dist/ prêt pour FTP OVH
   - Génère sitemap.xml + robots.txt + .htaccess durci
   ============================================ */

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');
const cfg  = require('./src/config.js');

// ─── Helpers ─────────────────────────────────
const read  = (p) => fs.readFileSync(p, 'utf8');
const write = (p, c) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, c);
};
const copyRecursive = (src, dst) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
};
const rmDir = (p) => fs.existsSync(p) && fs.rmSync(p, { recursive: true, force: true });

// ─── Minifiers basiques (zéro dépendance) ────
const minifyCSS = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')   // remove /* comments */
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,])\s*/g, '$1')
  .replace(/;}/g, '}')
  .replace(/\s*>\s*/g, '>')
  .replace(/\s*\+\s*/g, '+')
  .replace(/\s*~\s*/g, '~')
  .trim();

const minifyJS = (js) => js
  // remove /* block comments */ (mais pas les regex via /.../ — heuristique simple ici)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  // remove // line comments at start of line or after ;
  .replace(/(^|[\n;])\s*\/\/[^\n]*/g, '$1')
  // collapse multiple whitespace
  .replace(/\n\s*\n/g, '\n')
  .replace(/^[ \t]+/gm, '')
  .trim();

const minifyHTML = (html) => html
  .replace(/<!--(?!\[)([\s\S]*?)-->/g, '')   // remove HTML comments (keep IE conditional)
  .replace(/>\s+</g, '><')
  .replace(/\s{2,}/g, ' ')
  .trim();

// ─── Substitution de variables {{xxx}} ───────
function interpolate(str, vars) {
  return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v !== undefined && v !== null ? String(v) : '';
  });
}

// ─── Parse le front-matter YAML minimal ──────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const data = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let multiline = [];
  for (const line of lines) {
    if (line.match(/^\s+/) && currentKey) {
      multiline.push(line.replace(/^\s+/, ''));
      continue;
    }
    if (currentKey && multiline.length) {
      data[currentKey] = multiline.join('\n');
      multiline = [];
    }
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, key, val] = m;
    const v = val.trim();
    if (v === '|' || v === '') {
      currentKey = key;
    } else {
      currentKey = null;
      data[key] = v.replace(/^["'](.*)["']$/, '$1');
    }
  }
  if (currentKey && multiline.length) data[currentKey] = multiline.join('\n');
  return { data, content: match[2] };
}

// ─── Variables globales pour interpolation ───
const globalVars = {
  ...cfg,
  phoneIntl:   cfg.phoneIntl,
  phoneTel:    cfg.phoneTel,
  siteUrl:     cfg.siteUrl,
  brandUpper:  cfg.brand.toUpperCase(),
  geoLat:      cfg.geo.lat,
  geoLng:      cfg.geo.lng,
  year:        new Date().getFullYear(),
  instagram:   cfg.instagram,
  facebook:    cfg.facebook,
  googleBusiness: cfg.googleBusiness,
};

// ─── BUILD ────────────────────────────────────
console.log('🔨 Build Finition Royale\n');

// 1. Nettoyer dist/
rmDir(DIST);
fs.mkdirSync(DIST, { recursive: true });

// 2. Copier assets
copyRecursive(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
console.log('✓ assets/ copié');

// 2b. Minifier CSS & JS dans dist/
const cssPath = path.join(DIST, 'assets', 'style.css');
const jsPath  = path.join(DIST, 'assets', 'main.js');
if (fs.existsSync(cssPath)) {
  const cssRaw = read(cssPath);
  write(cssPath, minifyCSS(cssRaw));
  console.log('✓ style.css minifié (' + cssRaw.length + ' → ' + read(cssPath).length + ' octets)');
}
if (fs.existsSync(jsPath)) {
  const jsRaw = read(jsPath);
  write(jsPath, minifyJS(jsRaw));
  console.log('✓ main.js minifié (' + jsRaw.length + ' → ' + read(jsPath).length + ' octets)');
}

// 3. Charger les composants
const layout      = read(path.join(SRC, 'components', '_layout.html'));
const head        = read(path.join(SRC, 'components', 'head.html'));
const nav         = read(path.join(SRC, 'components', 'nav.html'));
const footer      = read(path.join(SRC, 'components', 'footer.html'));
const stickyCta   = read(path.join(SRC, 'components', 'sticky-cta.html'));
const cookieBanner = read(path.join(SRC, 'components', 'cookie-banner.html'));

// 4. Build chaque page
const pages = fs.readdirSync(path.join(SRC, 'pages')).filter(f => f.endsWith('.html'));
const builtPages = [];

for (const file of pages) {
  const raw = read(path.join(SRC, 'pages', file));
  const { data, content } = parseFrontmatter(raw);

  const pageVars = {
    ...globalVars,
    pageTitle:       data.title || cfg.brand,
    pageDescription: data.description || cfg.tagline,
    canonicalPath:   data.path || '/',
    currentPage:     data.slug || path.basename(file, '.html'),
  };

  const headOut    = interpolate(head,         pageVars);
  const navOut     = interpolate(nav,          pageVars);
  const footerOut  = interpolate(footer,       pageVars);
  const stickyOut  = interpolate(stickyCta,    pageVars);
  const cookieOut  = interpolate(cookieBanner, pageVars);
  const contentOut = interpolate(content,      pageVars);
  const extraHeadOut = data.extraSchema ? interpolate(data.extraSchema, pageVars) : '';

  let html = layout
    .replace('{{head}}',         headOut)
    .replace('{{extraHead}}',    extraHeadOut)
    .replace('{{nav}}',          navOut)
    .replace('{{content}}',      contentOut)
    .replace('{{footer}}',       footerOut)
    .replace('{{stickyCta}}',    stickyOut)
    .replace('{{cookieBanner}}', cookieOut)
    .replace('{{currentPage}}',  pageVars.currentPage);

  if (data.noindex) {
    html = html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex,nofollow">');
  }

  // Minification HTML (gain ~15-20%)
  html = minifyHTML(html);

  const outName = path.basename(file, '.html') === 'index' ? 'index.html' : path.basename(file);
  write(path.join(DIST, outName), html);

  builtPages.push({
    slug: pageVars.currentPage,
    path: pageVars.canonicalPath,
    noindex: !!data.noindex,
    priority: (cfg.pages.find(p => p.slug === pageVars.currentPage) || {}).priority || 0.5,
  });

  console.log('✓ ' + outName);
}

// 5. Sitemap.xml enrichi (avec lastmod, priorité, image fallback)
const lastmod = new Date().toISOString().split('T')[0];
const indexablePages = builtPages.filter(p => !p.noindex);
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  indexablePages.map(p =>
    '  <url>\n' +
    '    <loc>' + cfg.siteUrl + (p.path === '/' ? '' : p.path) + '</loc>\n' +
    '    <lastmod>' + lastmod + '</lastmod>\n' +
    '    <changefreq>monthly</changefreq>\n' +
    '    <priority>' + (p.path === '/' ? '1.0' : p.priority.toFixed(1)) + '</priority>\n' +
    '    <image:image>\n' +
    '      <image:loc>' + cfg.siteUrl + '/assets/og-image.jpg</image:loc>\n' +
    '      <image:title>' + cfg.brand + '</image:title>\n' +
    '    </image:image>\n' +
    '  </url>'
  ).join('\n') +
  '\n</urlset>';
write(path.join(DIST, 'sitemap.xml'), sitemap);
console.log('✓ sitemap.xml (' + indexablePages.length + ' URLs)');

// 6. robots.txt
const robots = 'User-agent: *\n' +
  'Allow: /\n' +
  'Disallow: /merci\n' +
  'Disallow: /cgv\n' +
  'Disallow: /mentions-legales\n' +
  'Disallow: /politique-confidentialite\n' +
  '\n' +
  '# Bloque les bots agressifs IA si souhaité (à activer si besoin)\n' +
  '# User-agent: GPTBot\n' +
  '# Disallow: /\n' +
  '\n' +
  'Sitemap: ' + cfg.siteUrl + '/sitemap.xml\n';
write(path.join(DIST, 'robots.txt'), robots);
console.log('✓ robots.txt');

// 7. .htaccess durci (HSTS, CSP, Brotli, etc.)
const htaccess = `# ============================================
# FINITION ROYALE — Apache configuration durcie
# ============================================

# Force HTTPS + suppression www
RewriteEngine On
RewriteCond %{HTTPS} off [OR]
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [L,R=301]

# URLs propres : /prestations au lieu de /prestations.html
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}\\.html -f
RewriteRule ^([^\\.]+)$ $1.html [NC,L]

# Rediriger .html vers URL propre (301)
RewriteCond %{THE_REQUEST} \\s/+(.+?)\\.html[\\s?] [NC]
RewriteRule ^ /%1 [R=301,L]

# Page 404
ErrorDocument 404 /404.html
ErrorDocument 403 /404.html

# Compression Brotli (si dispo) + fallback gzip
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css text/javascript application/javascript application/json text/xml application/xml image/svg+xml
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json text/xml application/xml image/svg+xml
</IfModule>

# Cache navigateur (immutable pour assets versionnés)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html                "access plus 1 hour"
  ExpiresByType text/css                 "access plus 1 year"
  ExpiresByType application/javascript   "access plus 1 year"
  ExpiresByType text/javascript          "access plus 1 year"
  ExpiresByType image/png                "access plus 1 year"
  ExpiresByType image/jpeg               "access plus 1 year"
  ExpiresByType image/webp               "access plus 1 year"
  ExpiresByType image/avif               "access plus 1 year"
  ExpiresByType image/svg+xml            "access plus 1 year"
  ExpiresByType image/x-icon             "access plus 1 year"
  ExpiresByType font/woff2               "access plus 1 year"
  ExpiresByType application/manifest+json "access plus 1 week"
  ExpiresByType application/xml          "access plus 1 day"
  ExpiresByType text/xml                 "access plus 1 day"
</IfModule>

# Headers de sécurité (durcis)
<IfModule mod_headers.c>
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "geolocation=(), microphone=(), camera=(), interest-cohort=(), browsing-topics=()"
  Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://api.web3forms.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://api.web3forms.com;"
  Header unset X-Powered-By
  Header unset Server
  # Immutable cache pour assets
  <FilesMatch "\\.(css|js|woff2|png|jpg|jpeg|webp|avif|svg|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  # HTML jamais en cache long
  <FilesMatch "\\.html$">
    Header set Cache-Control "public, max-age=3600, must-revalidate"
  </FilesMatch>
</IfModule>

# Bloquer accès aux fichiers sensibles
<FilesMatch "^\\.(htaccess|git|env)|\\.bak$|\\.sql$|\\.log$|^(package\\.json|build\\.js)">
  Require all denied
</FilesMatch>

# Options
Options -Indexes -MultiViews
DirectoryIndex index.html

# Encoding par défaut
AddDefaultCharset UTF-8

# Types MIME modernes
<IfModule mod_mime.c>
  AddType image/webp .webp
  AddType image/avif .avif
  AddType font/woff2 .woff2
  AddType application/manifest+json .webmanifest
</IfModule>
`;
write(path.join(DIST, '.htaccess'), htaccess);
console.log('✓ .htaccess (durci)');

// 8. webmanifest
const manifest = {
  name:             cfg.brand,
  short_name:       cfg.brand,
  description:      cfg.tagline + ' — ' + cfg.city,
  start_url:        '/',
  scope:            '/',
  display:          'standalone',
  background_color: '#0a0a0a',
  theme_color:      '#0a0a0a',
  lang:             'fr-FR',
  dir:              'ltr',
  icons: [
    { src: '/assets/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/assets/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
write(path.join(DIST, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log('✓ site.webmanifest');

// 9. 404 page
const page404 = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"><title>Page introuvable — ${cfg.brand}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<link rel="stylesheet" href="/assets/style.css">
<link rel="icon" href="/assets/favicon.ico">
</head><body>
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;background:#0a0a0a;color:#f8f6f1">
  <div>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(64px,10vw,128px);color:#C9A84C;margin:0 0 16px;line-height:1">404</h1>
    <p style="color:#9a9a9a;font-size:18px;margin-bottom:32px;max-width:480px;line-height:1.6">Cette page n'existe pas, a été déplacée, ou le lien que vous avez suivi est cassé.</p>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
      <a href="/" style="background:#C9A84C;color:#0a0a0a;font-weight:600;padding:14px 28px;border-radius:4px;text-decoration:none;display:inline-block">Retour à l'accueil</a>
      <a href="/contact" style="background:transparent;border:1px solid rgba(248,246,241,0.25);color:#f8f6f1;font-weight:500;padding:14px 28px;border-radius:4px;text-decoration:none;display:inline-block">Nous contacter</a>
    </div>
  </div>
</div>
</body></html>`;
write(path.join(DIST, '404.html'), page404);
console.log('✓ 404.html');

// 10. og-image placeholder SVG (à remplacer par un vrai JPG 1200x630)
const ogPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
    <radialGradient id="r" cx="80%" cy="50%">
      <stop offset="0%" stop-color="#C9A84C" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#r)"/>
  <text x="80" y="280" font-family="Georgia,serif" font-size="80" font-weight="700" fill="#f8f6f1">${cfg.brand}</text>
  <text x="80" y="350" font-family="Georgia,serif" font-size="50" font-weight="700" fill="#C9A84C">${cfg.tagline}</text>
  <text x="80" y="430" font-family="sans-serif" font-size="28" fill="#9a9a9a">${cfg.city} &amp; ${cfg.region}</text>
  <text x="80" y="470" font-family="sans-serif" font-size="22" fill="#6b6b6b">${cfg.siteUrl}</text>
</svg>`;
const ogSvgPath = path.join(DIST, 'assets', 'og-image.svg');
write(ogSvgPath, ogPlaceholder);
console.log('✓ og-image.svg (placeholder — remplacer par og-image.jpg 1200x630)');

console.log('\n✅ Build terminé : ' + builtPages.length + ' pages dans dist/');
console.log('📦 Prêt à uploader sur OVH via FTP.\n');
console.log('⚠️ TODO :');
console.log('  1. Créer /assets/og-image.jpg (1200×630) — placeholder SVG en attendant');
console.log('  2. Compléter SIRET / statut juridique / nom directeur dans src/config.js');
console.log('  3. Remplacer la clé Web3Forms dans src/pages/contact.html');
console.log('  4. Ajouter les vraies photos avant/après dans src/assets/');
