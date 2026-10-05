/* ============================================================
   FINITION ROYALE — Comportements
   ------------------------------------------------------------
   Amélioration progressive : chaque module vérifie la présence
   de ses éléments. Le site reste utilisable sans JavaScript
   (liens directs, formulaire HTML natif, galerie en liens).
   Aucun script inline : compatible avec une CSP stricte.
   ============================================================ */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var body = document.body;
  var PAGE = body.dataset.page || '';

  /* ── Mesure d'audience (après consentement uniquement) ── */

  var CONSENT_KEY = 'fr_consent_v2';
  var storage = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* navigation privée */ } },
  };
  var gaId = body.dataset.ga;
  var gaLoaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function loadAnalytics() {
    if (gaLoaded || !/^G-/.test(gaId || '') || storage.get(CONSENT_KEY) !== 'accept') return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', gaId, { anonymize_ip: true });
  }

  function track(name, params) {
    if (gaLoaded) gtag('event', name, params || {});
  }

  var banner = $('#cookieBanner');
  if (banner) {
    if (!storage.get(CONSENT_KEY)) setTimeout(function () { banner.hidden = false; }, 1200);
    $$('[data-consent]', banner).forEach(function (btn) {
      btn.addEventListener('click', function () {
        storage.set(CONSENT_KEY, btn.dataset.consent);
        banner.hidden = true;
        loadAnalytics();
      });
    });
    $$('[data-cookie-settings]').forEach(function (btn) {
      btn.addEventListener('click', function () { banner.hidden = false; $('[data-consent="accept"]', banner).focus(); });
    });
  }
  loadAnalytics();

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) track('cta_click', { cta_id: el.dataset.track, page: PAGE });
  });

  /* ── En-tête, barre mobile, retour en haut ── */

  var header = $('#siteHeader');
  var mobileCta = $('.mobile-cta');
  var backTop = $('[data-back-to-top]');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (mobileCta) mobileCta.classList.toggle('is-visible', y > 320);
    if (backTop) backTop.hidden = y < 900;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  if (backTop) backTop.addEventListener('click', function () { window.scrollTo({ top: 0 }); $('#main').focus({ preventScroll: true }); });

  /* ── Menu mobile (<dialog> natif : focus piégé, Échap) ── */

  var menu = $('#mobileMenu');
  if (menu && typeof menu.showModal === 'function') {
    var lockScroll = function (on) { document.documentElement.style.overflow = on ? 'hidden' : ''; };
    $$('[data-menu-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { menu.showModal(); lockScroll(true); });
    });
    $$('[data-menu-close]', menu).forEach(function (btn) {
      btn.addEventListener('click', function () { menu.close(); });
    });
    menu.addEventListener('close', function () { lockScroll(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.close(); }); });
    window.matchMedia('(min-width: 1101px)').addEventListener('change', function (mq) { if (mq.matches && menu.open) menu.close(); });
  }

  /* ── Visionneuse d'images ── */

  var links = $$('[data-lightbox]');
  if (links.length && typeof HTMLDialogElement === 'function') {
    var box = document.createElement('dialog');
    box.className = 'lightbox';
    box.setAttribute('aria-label', 'Image agrandie');
    box.innerHTML = '<button class="lightbox__close" type="button" aria-label="Fermer"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button><img alt=""><p></p>';
    body.appendChild(box);
    var boxImg = $('img', box);
    var boxText = $('p', box);
    $('button', box).addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var img = $('img', link);
        var caption = link.closest('figure') && $('figcaption', link.closest('figure'));
        var title = caption && ($('h2, strong', caption) || caption);
        boxImg.src = link.href;
        boxImg.alt = img ? img.alt : '';
        boxText.textContent = title ? title.textContent.replace(/\s+/g, ' ').trim() : '';
        box.showModal();
        track('gallery_zoom', { image: link.getAttribute('href') });
      });
    });
  }

  /* ── Galerie défilante ── */

  $$('[data-rail]').forEach(function (rail) {
    var track = $('.rail__track', rail);
    var prev = $('[data-rail-prev]', rail);
    var next = $('[data-rail-next]', rail);
    if (!track || !prev || !next) return;
    var step = function () { var s = $('.rail__slide', track); return s ? s.getBoundingClientRect().width + 24 : track.clientWidth; };
    var update = function () {
      prev.disabled = track.scrollLeft < 8;
      next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
    };
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ── Filtres de la galerie complète ── */

  var filterBar = $('[data-filters]');
  if (filterBar) {
    var items = $$('[data-cat]');
    filterBar.hidden = false;
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      $$('button', filterBar).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      items.forEach(function (it) { it.hidden = btn.dataset.filter !== 'all' && it.dataset.cat !== btn.dataset.filter; });
    });
  }

  /* ── Sommaire d'article : section courante ── */

  var tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
        if (byId[en.target.id]) byId[en.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(byId).forEach(function (id) { var h = document.getElementById(id); if (h) obs.observe(h); });
  }

  /* ── Envoi Web3Forms (partagé devis / contact) ── */

  function submitLead(data) {
    return fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || !res.success) throw new Error((res && res.message) || 'refus');
      return res;
    });
  }

  function remember(prix, formule) {
    try {
      sessionStorage.setItem('fr_lead_prix', prix || '');
      sessionStorage.setItem('fr_lead_formule', formule || '');
    } catch (e) { /* sans effet */ }
  }

  function validate(fields, errorBox) {
    var missing = [];
    fields.forEach(function (f) {
      var ok = f.check(f.el.value.trim());
      f.el.setAttribute('aria-invalid', String(!ok));
      if (!ok) missing.push(f.label);
    });
    if (!missing.length) { errorBox.hidden = true; return true; }
    errorBox.textContent = 'Il manque ' + missing.join(', ') + '.';
    errorBox.hidden = false;
    var first = fields.filter(function (f) { return f.el.getAttribute('aria-invalid') === 'true'; })[0];
    if (first) first.el.focus();
    return false;
  }
  var isName = function (v) { return v.length >= 2; };
  var isPhone = function (v) { return v.replace(/[^\d+]/g, '').length >= 9; };

  /* ── Calculateur de devis ── */

  var calc = $('#devisCalc');
  var pricingEl = $('#pricing');
  if (calc && pricingEl) {
    var pricing = JSON.parse(pricingEl.textContent);
    var value = $('#estimateValue');
    var detail = $('#estimateDetail');
    var live = $('#estimateLive');
    var lead = $('#leadForm');
    var errorBox = $('#leadError');
    var waBtn = $('#leadWhatsapp');
    var callBtn = $('#leadCallback');
    var euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

    var selected = function () {
      var f = $('input[name="formule"]:checked', calc);
      var v = $('input[name="vehicule"]:checked', calc);
      var offer = f && pricing.offers.filter(function (o) { return o.id === f.value; })[0];
      var vehicle = v && pricing.vehicles.filter(function (x) { return x.id === v.value; })[0];
      return { offer: offer, vehicle: vehicle, price: offer && vehicle ? offer.prices[vehicle.id] : null };
    };

    var shown = 0;
    var animate = function (to) {
      var from = shown;
      var start = performance.now();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var frame = function (t) {
        var k = reduce ? 1 : Math.min(1, (t - start) / 450);
        var eased = 1 - Math.pow(1 - k, 3);
        value.firstChild.textContent = euro.format(Math.round(from + (to - from) * eased));
        if (k < 1) requestAnimationFrame(frame); else shown = to;
      };
      requestAnimationFrame(frame);
    };

    var update = function () {
      var s = selected();
      if (s.price) {
        value.classList.remove('is-empty');
        animate(s.price);
        detail.textContent = s.offer.name + ' · ' + s.vehicle.label;
        live.textContent = 'Estimation : ' + euro.format(s.price) + ', ' + s.offer.name + ', ' + s.vehicle.label + '.';
        if (lead.hidden) { lead.hidden = false; track('devis_estimate', { formule: s.offer.id, vehicule: s.vehicle.id, value: s.price }); }
      } else {
        detail.textContent = s.offer ? 'Choisissez maintenant votre véhicule' : 'Choisissez une formule et un véhicule';
      }
    };
    calc.addEventListener('change', update);

    var wanted = new URLSearchParams(location.search).get('formule');
    var preset = wanted && $('input[name="formule"][value="' + wanted.replace(/[^\w-]/g, '') + '"]', calc);
    if (preset) preset.checked = true;
    update();

    var fields = [
      { el: $('#d-prenom'), label: 'votre prénom', check: isName },
      { el: $('#d-tel'), label: 'un numéro de téléphone valide', check: isPhone },
      { el: $('#d-commune'), label: 'votre commune', check: isName },
    ];
    var payload = function (canal) {
      var s = selected();
      return {
        access_key: $('[name="access_key"]', lead).value,
        subject: 'Devis en ligne — ' + s.offer.name + ' — ' + $('#d-prenom').value.trim(),
        from_name: 'Finition Royale — Devis en ligne',
        prenom: $('#d-prenom').value.trim(),
        telephone: $('#d-tel').value.trim(),
        commune: $('#d-commune').value.trim(),
        formule: s.offer.name,
        vehicule: s.vehicle.label,
        prix_estime: euro.format(s.price),
        message: $('#d-message').value.trim(),
        canal: canal,
        botcheck: $('[name="botcheck"]', lead).checked,
      };
    };
    var converted = function (canal) {
      var s = selected();
      remember(euro.format(s.price), s.offer.name);
      track('generate_lead', { currency: 'EUR', value: s.price, canal: canal, formule: s.offer.id });
    };

    waBtn.addEventListener('click', function (e) {
      if (!validate(fields, errorBox)) { e.preventDefault(); return; }
      var data = payload('whatsapp');
      var msg = 'Bonjour, je suis ' + data.prenom + ' (' + data.commune + ').\nJe souhaite réserver : ' + data.formule
        + '\nVéhicule : ' + data.vehicule + '\nEstimation du site : ' + data.prix_estime
        + (data.message ? '\nPrécision : ' + data.message : '');
      waBtn.href = 'https://wa.me/' + waBtn.dataset.phone + '?text=' + encodeURIComponent(msg);
      converted('whatsapp');
      submitLead(data).catch(function () { /* la demande part de toute façon sur WhatsApp */ });
      setTimeout(function () { location.href = '/merci?src=whatsapp'; }, 700);
    });

    lead.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(fields, errorBox)) return;
      callBtn.setAttribute('aria-busy', 'true');
      callBtn.textContent = 'Envoi…';
      submitLead(payload('rappel')).then(function () {
        converted('rappel');
        location.href = '/merci?src=rappel';
      }).catch(function () {
        callBtn.removeAttribute('aria-busy');
        callBtn.textContent = 'Envoyer, rappelez-moi';
        errorBox.textContent = "L'envoi n'a pas abouti. Écrivez-nous sur WhatsApp ou appelez le " + callBtn.dataset.phone + '.';
        errorBox.hidden = false;
      });
    });
  }

  /* ── Formulaire de contact (repli HTML natif si JS absent) ── */

  var contact = $('#contactForm');
  if (contact) {
    var cError = $('#contactError');
    var cSubmit = $('button[type="submit"]', contact);
    var cFields = [
      { el: $('#c-prenom'), label: 'votre prénom', check: isName },
      { el: $('#c-tel'), label: 'un numéro de téléphone valide', check: isPhone },
      { el: $('#c-commune'), label: 'votre commune', check: isName },
    ];
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(cFields, cError)) return;
      var consent = $('#c-consent');
      if (!consent.checked) { cError.textContent = 'Merci de cocher la case de consentement.'; cError.hidden = false; consent.focus(); return; }
      var data = Object.fromEntries(new FormData(contact).entries());
      data.botcheck = !!data.botcheck;
      cSubmit.setAttribute('aria-busy', 'true');
      submitLead(data).then(function () {
        remember('', data.formule);
        track('generate_lead', { canal: 'formulaire', formule: data.formule || 'conseil' });
        location.href = '/merci?src=formulaire';
      }).catch(function () {
        cSubmit.removeAttribute('aria-busy');
        cError.textContent = "L'envoi n'a pas abouti. Réessayez, ou écrivez-nous sur WhatsApp.";
        cError.hidden = false;
      });
    });
  }

  /* ── Page de remerciement ── */

  if (PAGE === 'merci') {
    var prix = '', formule = '';
    try { prix = sessionStorage.getItem('fr_lead_prix') || ''; formule = sessionStorage.getItem('fr_lead_formule') || ''; } catch (e) { /* vide */ }
    track('lead_confirmed', { canal: new URLSearchParams(location.search).get('src') || 'direct' });
    var recap = $('#merciRecap');
    if (recap && formule) {
      recap.textContent = '';
      recap.append('Votre demande : ');
      var strong = document.createElement('strong');
      strong.textContent = formule + (prix ? ' · estimation ' + prix : '');
      recap.append(strong);
      recap.hidden = false;
    }
    var wa = $('#merciWa');
    if (wa && formule) {
      var text = 'Bonjour, je viens d\'envoyer ma demande de devis sur le site (' + formule + (prix ? ', estimation ' + prix : '') + '). Voici les photos de mon véhicule :';
      wa.href = 'https://wa.me/' + wa.dataset.phone + '?text=' + encodeURIComponent(text);
    }
  }
})();
