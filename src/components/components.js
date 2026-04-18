'use strict';
/**
 * components.js
 * Composants HTML partagés entre toutes les pages.
 * Modifiez ici → toutes les pages sont mises à jour au prochain build.
 */

const { meta } = require('../data/services.json');

const NAV = `
<nav id="main-nav" role="navigation" aria-label="Navigation principale">
  <a href="/" class="nav-logo" aria-label="${meta.siteName} — Accueil">
    Finition <span>Royale</span>
    <small>${meta.tagline}</small>
  </a>
  <ul class="nav-links" role="list">
    <li><a href="/#services">Services</a></li>
    <li><a href="/#tarifs">Tarifs</a></li>
    <li><a href="/#avant-apres">Avant/Après</a></li>
    <li><a href="/#faq">FAQ</a></li>
    <li><a href="/#rdv">Réserver</a></li>
  </ul>
  <a href="/#rdv" class="btn btn--primary nav-cta">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    Prendre RDV
  </a>
  <button class="burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
</nav>`;

const MOBILE_MENU = `
<div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu mobile">
  <a href="/#services">Services</a>
  <a href="/#tarifs">Tarifs</a>
  <a href="/#avant-apres">Avant/Après</a>
  <a href="/#faq">FAQ</a>
  <a href="/#rdv">Réserver</a>
  <a href="/#rdv" class="btn btn--primary">Prendre rendez-vous</a>
</div>`;

const STICKY_CTA = `
<div class="sticky-cta" id="sticky-cta" role="complementary" aria-label="Actions rapides">
  <a href="${meta.instagram}" class="ghost" target="_blank" rel="noopener" aria-label="Instagram">📸 Instagram</a>
  <a href="/#rdv" class="primary">📅 Réserver</a>
</div>`;

const SERVICES_GRID = `
<div class="services-grid" role="list" aria-label="Nos services">
  <article class="service-card appear d1" role="listitem">
    <div class="service-num" aria-hidden="true">01</div>
    <div class="icon-box" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
    <h3 class="service-name">Intérieur Complet</h3>
    <p class="service-desc">Aspiration, plastiques, vitres, désodorisation. Habitacle remis à neuf.</p>
    <div class="service-price">45€ <small>à partir de</small></div>
    <a href="/#rdv" class="service-link">Réserver <span aria-hidden="true">→</span></a>
  </article>
  <article class="service-card appear d2" role="listitem" style="position:relative">
    <span class="tag tag--gold" style="position:absolute;top:1.2rem;right:1.2rem">Populaire</span>
    <div class="service-num" aria-hidden="true">02</div>
    <div class="icon-box" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
    </div>
    <h3 class="service-name">Shampoing Sièges</h3>
    <p class="service-desc">Injection-extraction pro. Taches, odeurs éliminés en profondeur.</p>
    <div class="service-price">55€ <small>à partir de</small></div>
    <a href="/#rdv" class="service-link">Réserver <span aria-hidden="true">→</span></a>
  </article>
  <article class="service-card appear d2" role="listitem">
    <div class="service-num" aria-hidden="true">03</div>
    <div class="icon-box" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12h20"/></svg>
    </div>
    <h3 class="service-name">Extérieur Premium</h3>
    <p class="service-desc">Lavage main, jantes, séchage microfibre, lustrage brillant.</p>
    <div class="service-price">40€ <small>à partir de</small></div>
    <a href="/#rdv" class="service-link">Réserver <span aria-hidden="true">→</span></a>
  </article>
  <article class="service-card appear d3" role="listitem">
    <div class="service-num" aria-hidden="true">04</div>
    <div class="icon-box" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
    </div>
    <h3 class="service-name">Rénovation Phares</h3>
    <p class="service-desc">Ponçage + polish machine + protection UV longue durée.</p>
    <div class="service-price">60€ <small>la paire</small></div>
    <a href="/#rdv" class="service-link">Réserver <span aria-hidden="true">→</span></a>
  </article>
</div>`;

const FOOTER = `
<footer role="contentinfo">
  <div class="footer-main">
    <div class="footer-brand">
      <a href="/" class="nav-logo">Finition <span>Royale</span><small>${meta.tagline}</small></a>
      <p>Expert en detailing automobile à domicile sur Besançon, Ornans et toute la Bourgogne-Franche-Comté depuis 2025.</p>
    </div>
    <div class="footer-col">
      <h4>Services</h4>
      <ul class="footer-links">
        <li><a href="/#services">Nettoyage Intérieur</a></li>
        <li><a href="/#services">Shampoing Sièges</a></li>
        <li><a href="/#services">Lavage Extérieur</a></li>
        <li><a href="/#services">Rénovation Phares</a></li>
        <li><a href="/#tarifs">Grille tarifaire</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Zones</h4>
      <ul class="footer-links">
        <li><a href="/pages/villes/besancon.html">Besançon</a></li>
        <li><a href="/pages/villes/ornans.html">Ornans</a></li>
        <li><a href="/pages/villes/thise.html">Thise</a></li>
        <li><a href="/pages/villes/baume-les-dames.html">Baume-les-Dames</a></li>
        <li><a href="/zone-intervention/">Voir toutes →</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <ul class="footer-links">
        <li><a href="mailto:${meta.email}">${meta.email}</a></li>
        <li><a href="${meta.instagram}" target="_blank" rel="noopener">${meta.instaHandle ?? '@finitionroyale'}</a></li>
        <li><a href="https://g.page/finitionroyale/review" target="_blank" rel="noopener">Laisser un avis Google</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© <span data-year></span> ${meta.siteName} — Tous droits réservés · Besançon (25)</p>
    <nav class="footer-bottom-links" aria-label="Liens légaux">
      <a href="/mentions-legales/">Mentions légales</a>
      <a href="/politique-confidentialite/">Confidentialité</a>
      <button data-open-cookies>Cookies</button>
      <a href="/plan-du-site/">Plan du site</a>
    </nav>
  </div>
</footer>`;

const COOKIE_BANNER = `
<div id="cookie-banner" role="dialog" aria-label="Gestion des cookies" style="position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:9999;width:min(560px,calc(100vw - 2rem));background:rgba(8,8,8,0.98);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:1.5rem 2rem;box-shadow:0 8px 40px rgba(0,0,0,0.7);backdrop-filter:blur(20px);display:none">
  <p style="font-size:0.82rem;color:rgba(176,168,152,0.8);line-height:1.75;margin-bottom:1rem">
    Nous utilisons des cookies analytiques (Google Analytics) pour améliorer votre expérience.
    <a href="/politique-confidentialite/" style="color:var(--or);text-decoration:underline">En savoir plus</a>
  </p>
  <div style="display:flex;gap:0.8rem">
    <button id="cookie-accept" class="btn btn--primary" style="font-size:0.72rem;padding:0.6rem 1.2rem">Accepter</button>
    <button id="cookie-refuse" class="btn btn--ghost"   style="font-size:0.72rem;padding:0.6rem 1.2rem">Refuser</button>
  </div>
</div>
<style>#cookie-banner.visible{display:block!important}</style>`;

function GTM_HEAD(id) {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`;
}

function GTM_NOSCRIPT(id) {
  return `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
}

module.exports = {
  NAV,
  MOBILE_MENU,
  STICKY_CTA,
  SERVICES_GRID,
  FOOTER,
  COOKIE_BANNER,
  GTM_HEAD,
  GTM_NOSCRIPT,
};
