/* ============================================
   FINITION ROYALE — JS comportemental
   ============================================
   - Nav scroll state
   - Menu mobile accessible (focus trap minimal)
   - aria-current dynamique
   - Reveal on scroll
   - GA4 différé (après consentement + interaction)
   - Cookie banner (CNIL-friendly)
   - Back to top
   - Before/After slider (sliders interactifs)
   - Devis calculator (page /devis-en-ligne)
   ============================================ */

(function () {
  'use strict';

  // ── Nav scroll state ────────────────────────
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Menu mobile ─────────────────────────────
  const burger = document.getElementById('burger');
  const menu   = document.getElementById('mobileMenu');
  const menuClose = document.getElementById('mobileMenuClose');
  if (burger && menu) {
    const openMenu = () => {
      menu.hidden = false;
      menu.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      const firstLink = menu.querySelector('a, button');
      if (firstLink) firstLink.focus();
    };
    const closeMenu = () => {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      burger.focus();
      setTimeout(() => { menu.hidden = true; }, 250);
    };
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMenu() : openMenu();
    });
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') closeMenu();
    });
  }

  // ── aria-current sur lien actif ─────────────
  const page = document.body.dataset.page;
  if (page) {
    document.querySelectorAll('[data-page="' + page + '"]').forEach(a => {
      a.setAttribute('aria-current', 'page');
      a.classList.add('is-active');
    });
  }

  // ── Reveal on scroll ────────────────────────
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => obs.observe(el));
  }

  // ── Cookie banner ───────────────────────────
  const COOKIE_KEY = 'fr_consent_v1';
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAccept');
  const declineBtn = document.getElementById('cookieDecline');
  const getConsent = () => {
    try { return localStorage.getItem(COOKIE_KEY); } catch (e) { return null; }
  };
  const setConsent = (val) => {
    try { localStorage.setItem(COOKIE_KEY, val); } catch (e) {}
  };
  const showBanner = () => { if (banner) { banner.hidden = false; banner.classList.add('visible'); } };
  const hideBanner = () => { if (banner) { banner.classList.remove('visible'); setTimeout(() => banner.hidden = true, 250); } };

  let consent = getConsent();
  if (!consent && banner) {
    setTimeout(showBanner, 1200);
  }
  if (acceptBtn) acceptBtn.addEventListener('click', () => { setConsent('accept'); consent = 'accept'; hideBanner(); loadGA(); });
  if (declineBtn) declineBtn.addEventListener('click', () => { setConsent('decline'); consent = 'decline'; hideBanner(); });

  // ── GA4 différé (après consentement + 1ère interaction) ──
  let gaLoaded = false;
  function loadGA() {
    if (gaLoaded) return;
    if (consent !== 'accept') return;
    const id = window.__gaId;
    if (!id || id.indexOf('G-') !== 0) return;
    gaLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    if (typeof window.gtag === 'function') {
      window.gtag('js', new Date());
      window.gtag('config', id, { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
    }
  }
  ['scroll','mousemove','touchstart','keydown'].forEach(ev =>
    window.addEventListener(ev, loadGA, { once: true, passive: true })
  );
  setTimeout(loadGA, 8000);

  // ── Tracking des CTA ────────────────────────
  document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', 'cta_click', {
        cta_id: el.dataset.track,
        page: document.body.dataset.page || 'unknown'
      });
    });
  });

  // ── Back to top ─────────────────────────────
  const backTop = document.getElementById('backToTop');
  if (backTop) {
    const toggleBack = () => {
      const visible = window.scrollY > 600;
      backTop.hidden = !visible;
      backTop.classList.toggle('visible', visible);
    };
    window.addEventListener('scroll', toggleBack, { passive: true });
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    toggleBack();
  }

  // ── Before/After slider (interactif) ────────
  document.querySelectorAll('.ba-slider').forEach((wrap) => {
    const range  = wrap.querySelector('.ba-range');
    const after  = wrap.querySelector('.ba-after');
    const handle = wrap.querySelector('.ba-handle');
    if (!range || !after) return;
    const apply = (v) => {
      after.style.clipPath = 'inset(0 0 0 ' + v + '%)';
      if (handle) handle.style.left = v + '%';
    };
    range.addEventListener('input', () => apply(range.value));
    apply(range.value || 50);
  });

  // ── Devis Calculator ────────────────────────
  const calc = document.getElementById('devisCalc');
  if (calc) {
    const PRICES = {
      'eclat-essentiel':       { 'citadine': 80,  'berline': 95,  'suv': 115, 'utilitaire': 130 },
      'prestige-complet':      { 'citadine': 180, 'berline': 220, 'suv': 260, 'utilitaire': 300 },
      'protection-ceramique':  { 'citadine': 350, 'berline': 420, 'suv': 500, 'utilitaire': 580 },
    };
    const formula = calc.querySelector('[name="formule"]');
    const vehicle = calc.querySelector('[name="vehicule"]');
    const out     = calc.querySelector('#devisResult');
    const cta     = calc.querySelector('#devisCta');
    const update = () => {
      const f = formula && formula.value;
      const v = vehicle && vehicle.value;
      if (!f || !v) { out.textContent = '—'; cta.hidden = true; return; }
      const price = PRICES[f] && PRICES[f][v];
      if (!price) { out.textContent = '—'; cta.hidden = true; return; }
      out.innerHTML = 'À partir de <strong>' + price + ' €</strong>';
      cta.hidden = false;
      const label = formula.options[formula.selectedIndex].text;
      const vLabel = vehicle.options[vehicle.selectedIndex].text;
      const msg = encodeURIComponent('Bonjour, je voudrais réserver une ' + label + ' pour ma ' + vLabel + ' (devis estimé ' + price + ' €).');
      cta.href = 'https://wa.me/' + (window.__phoneIntl || '33771229038') + '?text=' + msg;
    };
    if (formula) formula.addEventListener('change', update);
    if (vehicle) vehicle.addEventListener('change', update);
    update();
  }

  // ── Toast pour formulaire contact (post-submit redirection /merci) ──
  if (document.body.dataset.page === 'merci' && typeof window.gtag === 'function') {
    window.gtag('event', 'lead_submitted', { page: 'contact' });
  }

  // ── Images responsive — fade in au chargement ──
  document.querySelectorAll('img.rimg-fade').forEach(function(img){
    if (img.complete && img.naturalHeight !== 0) {
      img.classList.add('is-loaded');
    } else {
      img.addEventListener('load', function(){ img.classList.add('is-loaded'); }, { once: true });
      img.addEventListener('error', function(){ img.classList.add('is-loaded'); }, { once: true });
    }
  });
})();

/* ============================================================
   PATCH CONVERSION — à coller À LA FIN de src/assets/main.js
   (après le `})();` existant — c'est un bloc indépendant)
   Capture des leads du calculateur + envoi Web3Forms + GA4.
   ============================================================ */
(function () {
  'use strict';

  var calc = document.getElementById('devisCalc');
  var lead = document.getElementById('devisLead');
  if (!calc || !lead) { initMerci(); return; }

  var formule  = document.getElementById('d-formule');
  var vehicule = document.getElementById('d-vehicule');
  var prenom   = document.getElementById('d-prenom');
  var tel      = document.getElementById('d-tel');
  var commune  = document.getElementById('d-commune');
  var message  = document.getElementById('d-message');
  var botcheck = document.getElementById('d-botcheck');
  var errorBox = document.getElementById('devisError');
  var waCta    = document.getElementById('devisCta');
  var sendBtn  = document.getElementById('devisSend');
  var hidPrix  = document.getElementById('d-prix');
  var hidForm  = document.getElementById('d-formule-label');
  var hidVeh   = document.getElementById('d-vehicule-label');

  var PRICES = {
    'eclat-essentiel':      { citadine: 80,  berline: 95,  suv: 115, utilitaire: 130 },
    'prestige-complet':     { citadine: 180, berline: 220, suv: 260, utilitaire: 300 },
    'protection-ceramique': { citadine: 350, berline: 420, suv: 500, utilitaire: 580 }
  };

  function currentPrice() {
    var f = formule && formule.value;
    var v = vehicule && vehicule.value;
    if (!f || !v) return null;
    return (PRICES[f] && PRICES[f][v]) || null;
  }
  function labelOf(sel) {
    return sel && sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].text : '';
  }

  function syncLead() {
    var price = currentPrice();
    lead.hidden = !price;
    if (!price) return;
    if (hidPrix) hidPrix.value = price + ' €';
    if (hidForm) hidForm.value = labelOf(formule);
    if (hidVeh)  hidVeh.value  = labelOf(vehicule);
  }
  if (formule)  formule.addEventListener('change', syncLead);
  if (vehicule) vehicule.addEventListener('change', syncLead);
  syncLead();

  /* ── Validation ───────────────────────────── */
  function cleanTel(v) { return (v || '').replace(/[^0-9+]/g, ''); }

  function validate() {
    var problems = [];
    [prenom, tel, commune].forEach(function (el) { if (el) el.classList.remove('is-invalid'); });

    if (!prenom || prenom.value.trim().length < 2) {
      problems.push('votre prénom'); if (prenom) prenom.classList.add('is-invalid');
    }
    var t = cleanTel(tel && tel.value);
    if (t.length < 9) {
      problems.push('un numéro de téléphone valide'); if (tel) tel.classList.add('is-invalid');
    }
    if (!commune || commune.value.trim().length < 2) {
      problems.push('votre commune'); if (commune) commune.classList.add('is-invalid');
    }

    if (!problems.length) { if (errorBox) errorBox.hidden = true; return true; }

    if (errorBox) {
      errorBox.textContent = 'Il manque ' + problems.join(', ') + '.';
      errorBox.hidden = false;
    }
    var first = lead.querySelector('.is-invalid');
    if (first) first.focus();
    return false;
  }

  /* ── Envoi Web3Forms ──────────────────────── */
  function payload(channel) {
    var price = currentPrice();
    return {
      access_key: (lead.querySelector('[name="access_key"]') || {}).value,
      subject: 'Devis en ligne — ' + labelOf(formule) + ' — ' + (prenom ? prenom.value.trim() : ''),
      from_name: 'Finition Royale — Devis en ligne',
      prenom: prenom ? prenom.value.trim() : '',
      telephone: tel ? tel.value.trim() : '',
      commune: commune ? commune.value.trim() : '',
      formule: labelOf(formule),
      vehicule: labelOf(vehicule),
      prix_estime: price ? price + ' €' : '',
      message: message ? message.value.trim() : '',
      canal: channel,
      botcheck: botcheck && botcheck.checked ? 'true' : ''
    };
  }

  function send(channel, keepalive) {
    var data = payload(channel);
    try {
      sessionStorage.setItem('fr_lead_prix', data.prix_estime);
      sessionStorage.setItem('fr_lead_formule', data.formule);
    } catch (e) { /* stockage indisponible : sans effet */ }

    track(currentPrice(), channel);

    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      keepalive: !!keepalive
    });
  }

  function track(price, channel) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'generate_lead', {
      currency: 'EUR',
      value: price || 0,
      canal: channel,
      formule: formule ? formule.value : '',
      vehicule: vehicule ? vehicule.value : ''
    });
  }

  /* ── Bouton WhatsApp : capture PUIS ouverture ── */
  if (waCta) {
    waCta.addEventListener('click', function (e) {
      if (!validate()) { e.preventDefault(); return; }
      var price = currentPrice();
      var msg = 'Bonjour, je suis ' + prenom.value.trim() + ' (' + commune.value.trim() + ').'
              + '\nJe souhaite réserver : ' + labelOf(formule)
              + '\nVéhicule : ' + labelOf(vehicule)
              + (price ? '\nEstimation site : ' + price + ' €' : '')
              + (message && message.value.trim() ? '\nPrécision : ' + message.value.trim() : '');
      waCta.href = 'https://wa.me/' + (window.__phoneIntl || '33771229038')
                 + '?text=' + encodeURIComponent(msg);
      send('whatsapp', true).catch(function () { /* le lead part quand même sur WhatsApp */ });
      setTimeout(function () { window.location.href = '/merci?src=whatsapp'; }, 600);
    });
  }

  /* ── Bouton « rappelez-moi » : capture seule ── */
  if (sendBtn) {
    sendBtn.addEventListener('click', function () {
      if (!validate()) return;
      sendBtn.classList.add('is-sending');
      sendBtn.textContent = 'Envoi…';
      send('rappel', false)
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.success) { window.location.href = '/merci?src=rappel'; return; }
          throw new Error('refus');
        })
        .catch(function () {
          sendBtn.classList.remove('is-sending');
          sendBtn.textContent = 'Envoyer, rappelez-moi';
          if (errorBox) {
            errorBox.textContent = "L'envoi n'a pas abouti. Écrivez-nous sur WhatsApp ou au "
                                 + (document.querySelector('.mobile-menu-tel') ? document.querySelector('.mobile-menu-tel').textContent.trim() : '07 71 22 90 38') + '.';
            errorBox.hidden = false;
          }
        });
    });
  }

  initMerci();

  /* ── Page /merci : conversion ─────────────── */
  function initMerci() {
    if (document.body.dataset.page !== 'merci') return;
    var src = new URLSearchParams(window.location.search).get('src') || 'direct';
    var prix = '';
    try { prix = sessionStorage.getItem('fr_lead_prix') || ''; } catch (e) { prix = ''; }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'lead_confirmed', { canal: src, prix_estime: prix });
    }
  }
})();
