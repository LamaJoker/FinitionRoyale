#!/usr/bin/env node
/* ============================================
   FINITION ROYALE — Build script
   ============================================
   Usage : node build.js
   
   - Lit src/config.js (source unique)
   - Assemble les composants dans chaque page
   - Injecte les variables {{xxx}}
   - Génère dist/ prêt pour FTP OVH
   - Génère sitemap.xml + robots.txt + .htaccess
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
      // Remove quotes
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
  siteUrl:     cfg.siteUrl,
  brandUpper:  cfg.brand.toUpperCase(),
  geoLat:      cfg.geo.lat,
  geoLng:      cfg.geo.lng,
  year:        new Date().getFullYear(),
};

// ─── BUILD ────────────────────────────────────
console.log('🔨 Build Finition Royale\n');

// 1. Nettoyer dist/
rmDir(DIST);
fs.mkdirSync(DIST, { recursive: true });

// 2. Copier assets
copyRecursive(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
console.log('✓ assets/ copié');

// 3. Charger les composants
const layout    = read(path.join(SRC, 'components', '_layout.html'));
const head      = read(path.join(SRC, 'components', 'head.html'));
const nav       = read(path.join(SRC, 'components', 'nav.html'));
const footer    = read(path.join(SRC, 'components', 'footer.html'));
const stickyCta = read(path.join(SRC, 'components', 'sticky-cta.html'));

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
    extraHead:       data.extraSchema || '',
  };

  // Interpoler composants
  const headOut   = interpolate(head,      pageVars);
  const navOut    = interpolate(nav,       pageVars);
  const footerOut = interpolate(footer,    pageVars);
  const stickyOut = interpolate(stickyCta, pageVars);
  const contentOut = interpolate(content,  pageVars);

  // Assembler dans le layout
  let html = layout
    .replace('{{head}}',       headOut)
    .replace('{{extraHead}}',  data.extraSchema ? interpolate(data.extraSchema, pageVars) : '')
    .replace('{{nav}}',        navOut)
    .replace('{{content}}',    contentOut)
    .replace('{{footer}}',     footerOut)
    .replace('{{stickyCta}}',  stickyOut)
    .replace('{{currentPage}}', pageVars.currentPage);

  // Injecter noindex si demandé
  if (data.noindex) {
    html = html.replace('<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex,nofollow">');
  }

  // Nom du fichier de sortie
  const outName = path.basename(file, '.html') === 'index' ? 'index.html' : path.basename(file);
  write(path.join(DIST, outName), html);

  builtPages.push({
    slug: pageVars.currentPage,
    path: pageVars.canonicalPath,
    noindex: !!data.noindex,
  });

  console.log(`✓ ${outName}`);
}

// 5. Sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${builtPages.filter(p => !p.noindex).map(p => `  <url>
    <loc>${cfg.siteUrl}${p.path === '/' ? '' : p.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${p.path === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
write(path.join(DIST, 'sitemap.xml'), sitemap);
console.log('✓ sitemap.xml');

// 6. robots.txt
const robots = `User-agent: *
Allow: /

Sitemap: ${cfg.siteUrl}/sitemap.xml`;
write(path.join(DIST, 'robots.txt'), robots);
console.log('✓ robots.txt');

// 7. .htaccess (URL propres + cache + compression + redirect www)
const htaccess = `# ============================================
# FINITION ROYALE — Apache configuration
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

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript text/xml application/javascript application/json image/svg+xml
</IfModule>

# Cache navigateur
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html                "access plus 1 hour"
  ExpiresByType text/css                 "access plus 1 year"
  ExpiresByType application/javascript   "access plus 1 year"
  ExpiresByType image/png                "access plus 1 year"
  ExpiresByType image/jpeg               "access plus 1 year"
  ExpiresByType image/webp               "access plus 1 year"
  ExpiresByType image/svg+xml            "access plus 1 year"
  ExpiresByType image/x-icon             "access plus 1 year"
  ExpiresByType application/manifest+json "access plus 1 week"
</IfModule>

# Sécurité
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>

# Bloquer accès aux fichiers sensibles
<FilesMatch "^\\.(htaccess|git|env)">
  Require all denied
</FilesMatch>

# Options
Options -Indexes
DirectoryIndex index.html
`;
write(path.join(DIST, '.htaccess'), htaccess);
console.log('✓ .htaccess');

// 8. webmanifest
const manifest = {
  name:             cfg.brand,
  short_name:       cfg.brand,
  description:      `${cfg.tagline} — ${cfg.city}`,
  start_url:        '/',
  display:          'standalone',
  background_color: '#0a0a0a',
  theme_color:      '#C9A84C',
  icons: [
    { src: '/assets/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
  ],
};
write(path.join(DIST, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log('✓ site.webmanifest');

// 9. 404 page minimale
const page404 = `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"><title>Page introuvable — ${cfg.brand}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/assets/style.css">
<link rel="icon" href="/assets/favicon.ico">
</head><body>
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px">
  <div>
    <h1 style="font-family:'Cormorant Garamond',serif;font-size:clamp(48px,8vw,96px);color:#C9A84C;margin:0 0 16px">404</h1>
    <p style="color:#9a9a9a;font-size:18px;margin-bottom:24px">Cette page n'existe pas ou a été déplacée.</p>
    <a href="/" style="background:#C9A84C;color:#0a0a0a;font-weight:600;padding:14px 28px;border-radius:4px;text-decoration:none;display:inline-block">Retour à l'accueil</a>
  </div>
</div>
</body></html>`;
write(path.join(DIST, '404.html'), page404);
console.log('✓ 404.html');

console.log(`\n✅ Build terminé : ${builtPages.length} pages dans dist/`);
console.log(`📦 Prêt à uploader sur OVH via FTP.\n`);
