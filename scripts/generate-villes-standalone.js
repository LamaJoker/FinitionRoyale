#!/usr/bin/env node
/**
 * generate-villes-standalone.js
 * Génère toutes les pages villes dans public/pages/villes/
 * Usage: node generate-villes-standalone.js
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../public/pages/villes');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const villes = [
  { slug: 'besancon', nom: 'Besançon', dept: 'Doubs', codePostal: '25000',
    description: 'Detailing automobile à domicile à Besançon (25). Nettoyage intérieur, shampoing sièges, lavage extérieur, rénovation phares. Devis gratuit — réponse sous 2h.',
    intro: 'Finition Royale intervient directement chez vous à <strong>Besançon</strong> pour tous vos besoins en <strong>detailing automobile à domicile</strong>. Intérieur, sièges, extérieur, phares — sans que vous ayez à vous déplacer.',
    seoContent: 'Vous habitez à <strong>Besançon</strong> et vous cherchez un service de <strong>nettoyage voiture à domicile</strong> professionnel ? Finition Royale intervient directement chez vous — domicile, parking, lieu de travail. Nous couvrons tout Besançon : Centre-ville, Planoise, Montrapon, Palente, Clairs-Soleils, Champagne, Saint-Ferjeux, Bregille. Produits Meguiar\'s et Shine, résultat garanti.',
    voisines: ['ornans', 'thise', 'baume-les-dames'] },
  { slug: 'ornans', nom: 'Ornans', dept: 'Doubs', codePostal: '25290',
    description: 'Detailing automobile à domicile à Ornans (25). Nettoyage intérieur, shampoing sièges, lavage extérieur, rénovation phares. Devis gratuit — réponse sous 2h.',
    intro: 'Finition Royale intervient directement chez vous à <strong>Ornans</strong> pour tous vos besoins en <strong>detailing automobile à domicile</strong>. Sans déplacement de votre part, résultat professionnel garanti.',
    seoContent: 'Vous habitez à <strong>Ornans</strong> dans la belle vallée de la Loue et vous cherchez un service de <strong>nettoyage voiture à domicile</strong> ? Finition Royale intervient directement chez vous. Produits professionnels Meguiar\'s et Shine.',
    voisines: ['besancon', 'thise', 'quingey'] },
  { slug: 'thise', nom: 'Thise', dept: 'Doubs', codePostal: '25220',
    description: 'Detailing automobile à domicile à Thise (25). Nettoyage intérieur, shampoing sièges, lavage extérieur. Devis gratuit — réponse sous 2h.',
    intro: 'Finition Royale intervient directement chez vous à <strong>Thise</strong> pour tous vos besoins en <strong>detailing automobile à domicile</strong>. Réponse sous 2h, intervention dès le lendemain.',
    seoContent: 'Vous habitez à <strong>Thise</strong> et vous cherchez un service de <strong>nettoyage voiture à domicile</strong> professionnel ? Finition Royale intervient chez vous. Nous couvrons Thise et tout le secteur de Besançon. Produits Meguiar\'s et Shine.',
    voisines: ['besancon', 'ornans', 'baume-les-dames'] },
  { slug: 'baume-les-dames', nom: 'Baume-les-Dames', dept: 'Doubs', codePostal: '25110',
    description: 'Detailing automobile à domicile à Baume-les-Dames (25). Nettoyage intérieur, shampoing sièges, lavage extérieur. Devis gratuit — réponse sous 2h.',
    intro: 'Finition Royale intervient directement chez vous à <strong>Baume-les-Dames</strong> pour tous vos besoins en <strong>detailing automobile à domicile</strong>.',
    seoContent: 'Vous habitez à <strong>Baume-les-Dames</strong> et vous cherchez un service de <strong>nettoyage voiture à domicile</strong> ? Finition Royale intervient chez vous. Notre équipe couvre tout le Doubs. Produits professionnels, résultat garanti.',
    voisines: ['besancon', 'thise', 'ornans'] },
  { slug: 'quingey', nom: 'Quingey', dept: 'Doubs', codePostal: '25440',
    description: 'Detailing automobile à domicile à Quingey (25). Nettoyage intérieur, shampoing sièges, lavage extérieur. Devis gratuit — réponse sous 2h.',
    intro: 'Finition Royale intervient directement chez vous à <strong>Quingey</strong> pour tous vos besoins en <strong>detailing automobile à domicile</strong>.',
    seoContent: 'Vous habitez à <strong>Quingey</strong> et vous cherchez un service de <strong>nettoyage voiture à domicile</strong> ? Finition Royale intervient chez vous. Produits Meguiar\'s et Shine, résultat garanti.',
    voisines: ['besancon', 'ornans', 'saone'] },
  { slug: 'saone', nom: 'Saône', dept: 'Doubs', codePostal: '25660',
    description: 'Detailing automobile à domicile à Saône (25). Nettoyage intérieur, shampoing sièges, lavage extérieur. Devis gratuit — réponse sous 2h.',
    intro: 'Finition Royale intervient directement chez vous à <strong>Saône</strong> pour tous vos besoins en <strong>detailing automobile à domicile</strong>.',
    seoContent: 'Vous habitez à <strong>Saône</strong> et vous cherchez un service de <strong>nettoyage voiture à domicile</strong> ? Finition Royale intervient chez vous, sur votre lieu de travail ou dans votre parking. Produits professionnels Meguiar\'s et Shine.',
    voisines: ['besancon', 'ornans', 'quingey'] },
  { slug: 'audeux', nom: 'Audeux', dept: 'Doubs', codePostal: '25170',
    description: 'Detailing automobile à domicile à Audeux (25). Nettoyage intérieur, shampoing sièges, lavage extérieur. Devis gratuit — réponse sous 2h.',
    intro: 'Finition Royale intervient directement chez vous à <strong>Audeux</strong> pour tous vos besoins en <strong>detailing automobile à domicile</strong>.',
    seoContent: 'Vous habitez à <strong>Audeux</strong> et vous cherchez un service de <strong>nettoyage voiture à domicile</strong> ? Finition Royale intervient chez vous. Nous couvrons Audeux et toutes les communes du Doubs.',
    voisines: ['besancon', 'thise', 'saone'] },
  { slug: 'morre', nom: 'Morre', dept: 'Doubs', codePostal: '25660',
    description: 'Detailing automobile à domicile à Morre (25). Nettoyage intérieur, shampoing sièges, lavage extérieur. Devis gratuit — réponse sous 2h.',
    intro: 'Finition Royale intervient directement chez vous à <strong>Morre</strong> pour tous vos besoins en <strong>detailing automobile à domicile</strong>.',
    seoContent: 'Vous habitez à <strong>Morre</strong> et vous cherchez un service de <strong>nettoyage voiture à domicile</strong> ? Finition Royale intervient chez vous. Produits professionnels Meguiar\'s et Shine, résultat garanti.',
    voisines: ['besancon', 'ornans', 'saone'] },
];

const villesMap = Object.fromEntries(villes.map(v => [v.slug, v]));

function buildVoisines(voisines) {
  const links = voisines
    .map(slug => villesMap[slug])
    .filter(Boolean)
    .map(v => `<a href="/pages/villes/${v.slug}.html" class="btn btn--ghost" style="font-size:0.78rem;padding:0.55rem 1rem">${v.nom}</a>`)
    .join('\n          ');
  return links + '\n          <a href="/zone-intervention-detailing-besancon/" class="btn btn--outline" style="font-size:0.78rem;padding:0.55rem 1rem">Toutes les zones →</a>';
}

function buildPage(v) {
  const voisinesHTML = buildVoisines(v.voisines);
  const schemaStr = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Finition Royale",
    "url": "https://www.finitionroyale.fr/",
    "telephone": "+33648079396",
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "bestRating": "5", "reviewCount": "47" },
    "areaServed": { "@type": "City", "name": v.nom }
  });

  return `<!DOCTYPE html>
<html lang="fr-FR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${v.description}">
  <link rel="canonical" href="https://www.finitionroyale.fr/pages/villes/${v.slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="icon" href="/favicon.ico">
  <title>Detailing Auto à Domicile ${v.nom} — Finition Royale</title>
  <script type="application/ld+json">${schemaStr}</script>
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5FPWLHB4');</script>
</head>
<body>

  <nav id="main-nav" role="navigation" aria-label="Navigation principale">
    <a href="/" class="nav-logo">Finition <span>Royale</span><small>Detailing Automobile · Besançon</small></a>
    <ul class="nav-links" role="list">
      <li><a href="/#services">Services</a></li>
      <li><a href="/#tarifs">Tarifs</a></li>
      <li><a href="/zone-intervention-detailing-besancon/">Zone</a></li>
      <li><a href="/#faq">FAQ</a></li>
      <li><a href="/#rdv">Réserver</a></li>
    </ul>
    <a href="/#rdv" class="btn btn--primary nav-cta">Prendre RDV</a>
    <button class="burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </nav>

  <div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu mobile">
    <a href="/#services">Services</a>
    <a href="/#tarifs">Tarifs</a>
    <a href="/zone-intervention-detailing-besancon/">Zone</a>
    <a href="/#faq">FAQ</a>
    <a href="/#rdv">Réserver</a>
    <a href="/#rdv" class="btn btn--primary">Prendre rendez-vous</a>
  </div>

  <div class="sticky-cta" id="sticky-cta" role="complementary">
    <a href="https://www.instagram.com/finitionroyale" class="ghost" target="_blank" rel="noopener">📸 Instagram</a>
    <a href="/#rdv" class="primary">📅 Réserver</a>
  </div>

  <main id="contenu-principal">

    <section class="satellite-hero section" aria-labelledby="hero-titre">
      <div class="container">
        <nav class="breadcrumb" aria-label="Fil d'Ariane">
          <a href="/">Accueil</a><span class="sep">›</span>
          <a href="/zone-intervention-detailing-besancon/">Zone d'intervention</a><span class="sep">›</span>
          <span class="current">${v.nom}</span>
        </nav>
        <div class="eyebrow">Detailing à domicile</div>
        <h1 class="section-title" id="hero-titre">Nettoyage Auto à Domicile<br><em>${v.nom} — ${v.dept}</em></h1>
        <div class="divider"></div>
        <p style="font-size:1rem;color:var(--gris-light);max-width:560px;line-height:1.85;margin-bottom:2rem">${v.intro}</p>
        <div style="display:flex;flex-wrap:wrap;gap:1rem">
          <a href="/#rdv" class="btn btn--primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Réserver à ${v.nom}
          </a>
          <a href="/#tarifs" class="btn btn--outline">Voir les tarifs →</a>
        </div>
      </div>
    </section>

    <section class="section section--soft" aria-labelledby="services-titre">
      <div class="container">
        <div class="eyebrow appear">Nos prestations à ${v.nom}</div>
        <h2 class="section-title appear" id="services-titre">Detailing Auto à Domicile<br><em>à ${v.nom}</em></h2>
        <div class="divider appear"></div>
      </div>
      <div class="services-grid" role="list">
        <article class="service-card appear d1" role="listitem">
          <div class="service-num">01</div>
          <div class="icon-box" style="margin-bottom:1.2rem"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
          <h3 class="service-name">Intérieur Complet</h3>
          <p class="service-desc">Aspiration, plastiques, vitres, désodorisation. Habitacle remis à neuf.</p>
          <div class="service-price">45€ <small>à partir de</small></div>
          <a href="/#rdv" class="service-link">Réserver <span>→</span></a>
        </article>
        <article class="service-card appear d2" role="listitem" style="position:relative">
          <span class="tag tag--gold" style="position:absolute;top:1.2rem;right:1.2rem">Populaire</span>
          <div class="service-num">02</div>
          <div class="icon-box" style="margin-bottom:1.2rem"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></div>
          <h3 class="service-name">Shampoing Sièges</h3>
          <p class="service-desc">Injection-extraction pro. Taches et odeurs éliminés en profondeur.</p>
          <div class="service-price">55€ <small>à partir de</small></div>
          <a href="/#rdv" class="service-link">Réserver <span>→</span></a>
        </article>
        <article class="service-card appear d2" role="listitem">
          <div class="service-num">03</div>
          <div class="icon-box" style="margin-bottom:1.2rem"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg></div>
          <h3 class="service-name">Extérieur Premium</h3>
          <p class="service-desc">Lavage manuel, jantes, séchage microfibre, lustrage brillant.</p>
          <div class="service-price">40€ <small>à partir de</small></div>
          <a href="/#rdv" class="service-link">Réserver <span>→</span></a>
        </article>
        <article class="service-card appear d3" role="listitem">
          <div class="service-num">04</div>
          <div class="icon-box" style="margin-bottom:1.2rem"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/></svg></div>
          <h3 class="service-name">Rénovation Phares</h3>
          <p class="service-desc">Ponçage + polish machine + protection UV longue durée.</p>
          <div class="service-price">60€ <small>la paire</small></div>
          <a href="/#rdv" class="service-link">Réserver <span>→</span></a>
        </article>
      </div>
    </section>

    <section class="section section--dark" aria-label="À propos de Finition Royale à ${v.nom}">
      <div class="container" style="max-width:760px">
        <h2 class="section-title appear">Finition Royale à <em>${v.nom}</em></h2>
        <div class="divider appear"></div>
        <div class="appear" style="font-size:0.9rem;color:var(--gris-light);line-height:1.9">${v.seoContent}</div>
      </div>
    </section>

    <div class="cta-band appear">
      <div class="container">
        <h2>Votre voiture à ${v.nom} <em>mérite le meilleur.</em></h2>
        <p class="cta-band-sub">-10% sur votre 1ère prestation · Intervention possible dès demain.</p>
        <div class="cta-band-actions">
          <a href="/#rdv" class="btn btn--primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Réserver à ${v.nom}
          </a>
        </div>
      </div>
    </div>

    <section class="section section--soft">
      <div class="container">
        <h2 class="section-title appear">Zones <em>voisines</em></h2>
        <div class="divider appear"></div>
        <p class="appear" style="font-size:0.85rem;color:var(--gris-light);margin-bottom:2rem">Nous intervenons également dans toutes les communes du secteur de ${v.nom} :</p>
        <div class="appear" style="display:flex;flex-wrap:wrap;gap:0.6rem">
          ${voisinesHTML}
        </div>
      </div>
    </section>

  </main>

  <footer role="contentinfo">
    <div class="footer-main">
      <div class="footer-brand">
        <a href="/" class="nav-logo">Finition <span>Royale</span><small>Detailing Automobile · Besançon</small></a>
        <p>Expert en detailing automobile à domicile sur Besançon, Ornans et toute la Bourgogne-Franche-Comté depuis 2025.</p>
      </div>
      <div class="footer-col">
        <h4>Services</h4>
        <ul class="footer-links">
          <li><a href="/#services">Nettoyage Intérieur</a></li>
          <li><a href="/#services">Shampoing Sièges</a></li>
          <li><a href="/#tarifs">Grille tarifaire</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        <ul class="footer-links">
          <li><a href="mailto:contact@finitionroyale.fr">contact@finitionroyale.fr</a></li>
          <li><a href="https://www.instagram.com/finitionroyale" target="_blank" rel="noopener">@finitionroyale</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© <span data-year></span> Finition Royale · Besançon (25)</p>
      <nav class="footer-bottom-links">
        <a href="/mentions-legales/">Mentions légales</a>
        <a href="/politique-confidentialite/">Confidentialité</a>
        <a href="/plan-du-site/">Plan du site</a>
      </nav>
    </div>
  </footer>

  <script src="/assets/js/main.js"></script>

</body>
</html>`;
}

villes.forEach(v => {
  const html = buildPage(v);
  const outPath = path.join(OUT_DIR, v.slug + '.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('✓ ' + v.slug + '.html');
});

console.log('\n✅ ' + villes.length + ' pages générées dans public/pages/villes/');
