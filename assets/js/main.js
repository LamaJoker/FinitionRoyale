/* ════════════════════════════════════════════════════════════
   FINITION ROYALE — MAIN.JS
   Vanilla JS · Mobile-first · Conversion-optimized
════════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  // ─── Config ──────────────────────────────────────────────
  const CONFIG = {
    apiEndpoint: '/api/send-rdv.php',
    phoneNumber: '+33648079396',
    email: 'contact@finitionroyale.fr'
  };

  const TARIFS = {
    citadine: { interieur: '45–55€', shampoing: '55–70€', exterieur: '40–50€', phares: '60–90€', pack: '80–95€' },
    berline:  { interieur: '60–75€', shampoing: '65–85€', exterieur: '50–65€', phares: '60–90€', pack: '110–150€' },
    suv:      { interieur: '80–100€', shampoing: '85–105€', exterieur: '70–90€', phares: '60–90€', pack: '140–165€' }
  };

  const SERVICE_LABELS = {
    interieur: 'Intérieur Complet',
    shampoing: 'Shampoing Sièges',
    exterieur: 'Extérieur Premium',
    phares:    'Rénovation Phares',
    pack:      'Pack Int. + Ext.'
  };

  const VEHICULE_LABELS = {
    citadine: 'Citadine',
    berline:  'Berline / Break',
    suv:      'SUV / 4×4'
  };

  const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  // ─── Utilities ──────────────────────────────────────────
  const $  = (s, ctx) => (ctx || document).querySelector(s);
  const $$ = (s, ctx) => Array.from((ctx || document).querySelectorAll(s));

  function track(event, data) {
    try {
      if (window.dataLayer) {
        window.dataLayer.push(Object.assign({ event: event }, data || {}));
      }
    } catch(e) {}
  }

  // ─── Navigation ─────────────────────────────────────────
  function initNav() {
    const nav = $('#main-nav');
    const burger = $('#burger');
    const mobileMenu = $('#mobile-menu');

    if (nav) {
      const onScroll = () => {
        if (window.scrollY > 20) nav.classList.add('solid');
        else nav.classList.remove('solid');
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    if (burger && mobileMenu) {
      const close = () => {
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.hidden = true;
        document.body.style.overflow = '';
      };
      const open = () => {
        burger.classList.add('active');
        burger.setAttribute('aria-expanded', 'true');
        mobileMenu.hidden = false;
        document.body.style.overflow = 'hidden';
      };
      burger.addEventListener('click', () => {
        if (mobileMenu.hidden) open(); else close();
      });
      $$('a', mobileMenu).forEach(a => a.addEventListener('click', close));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !mobileMenu.hidden) close();
      });
    }

    // Smooth scroll
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navH = (nav && nav.offsetHeight) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  // ─── Sticky CTA ─────────────────────────────────────────
  function initStickyCTA() {
    const sticky = $('#sticky-cta');
    if (!sticky) return;
    const hero = $('#accueil');
    if (!hero) { sticky.classList.add('visible'); return; }

    const toggle = () => {
      if (window.scrollY > (hero.offsetHeight * 0.6)) {
        sticky.classList.add('visible');
      } else {
        sticky.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();
  }

  // ─── Scroll reveal ──────────────────────────────────────
  function initAnimations() {
    if (!('IntersectionObserver' in window)) {
      $$('.appear').forEach(el => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    $$('.appear').forEach(el => io.observe(el));
  }

  // ─── Tracking global ────────────────────────────────────
  function initTracking() {
    // CTA clicks
    $$('[data-track]').forEach(el => {
      el.addEventListener('click', () => {
        track(el.dataset.track, { label: el.dataset.label || '' });
      });
    });

    // Scroll depth (25/50/75/100)
    const marks = [25, 50, 75, 100];
    const fired = new Set();
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop + window.innerHeight) / h.scrollHeight * 100;
      marks.forEach(m => {
        if (scrolled >= m && !fired.has(m)) {
          fired.add(m);
          track('scroll_depth', { depth: m });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ─── Avant / Après slider ───────────────────────────────
  function initBeforeAfter() {
    $$('.ba-compare').forEach(wrap => {
      // Build slider UI
      const line = document.createElement('div');
      line.className = 'ba-slider-line';
      const handle = document.createElement('div');
      handle.className = 'ba-slider-handle';
      wrap.appendChild(line);
      wrap.appendChild(handle);

      const afterImg = $('.ba-after', wrap);
      let pos = 50;

      const setPos = (p) => {
        pos = Math.max(0, Math.min(100, p));
        if (afterImg) afterImg.style.clipPath = `inset(0 0 0 ${pos}%)`;
        line.style.left = pos + '%';
        handle.style.left = pos + '%';
      };
      setPos(50);

      const getX = (e) => {
        const rect = wrap.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        return ((clientX - rect.left) / rect.width) * 100;
      };

      let dragging = false;
      const start = (e) => { dragging = true; setPos(getX(e)); };
      const move  = (e) => { if (dragging) { e.preventDefault(); setPos(getX(e)); } };
      const end   = () => { dragging = false; };

      wrap.addEventListener('mousedown', start);
      wrap.addEventListener('touchstart', start, { passive: true });
      window.addEventListener('mousemove', move);
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('mouseup', end);
      window.addEventListener('touchend', end);

      // Auto-animate on first visibility
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              let p = 30, dir = 1;
              const iv = setInterval(() => {
                p += dir * 2;
                if (p >= 70) dir = -1;
                if (p <= 30) { clearInterval(iv); setPos(50); }
                setPos(p);
              }, 20);
              io.unobserve(wrap);
            }
          });
        }, { threshold: 0.5 });
        io.observe(wrap);
      }
    });
  }

  // ─── Formulaire RDV ─────────────────────────────────────
  function initForm() {
    const form = $('#rdv-form');
    if (!form) return;

    const panels = $$('.form-panel:not(.confirm-panel)', form);
    const steps = $$('.form-step', form);
    const confirmEl = $('#confirm-screen', form);
    const submitBtn = $('#submit-btn', form);

    let currentStep = 0;
    let started = false;

    // Min date = demain
    const dateInput = $('#rdv-date');
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split('T')[0];

      // Par défaut demain
      dateInput.value = tomorrow.toISOString().split('T')[0];

      dateInput.addEventListener('change', function() {
        const d = new Date(this.value + 'T00:00:00');
        if (d.getDay() === 0) {
          showError('date-group', 'Nous sommes fermés le dimanche.');
          this.value = '';
        } else {
          clearError('date-group');
        }
      });
    }

    // Track form start
    form.addEventListener('change', () => {
      if (!started) {
        started = true;
        track('form_start');
      }
    }, { once: false });

    // Next / Prev
    $$('[data-next]', form).forEach(btn => {
      btn.addEventListener('click', () => {
        if (validate(currentStep)) {
          goTo(currentStep + 1);
          track('form_step', { step: currentStep + 1 });
        }
      });
    });
    $$('[data-prev]', form).forEach(btn => {
      btn.addEventListener('click', () => goTo(currentStep - 1));
    });

    // Click on step header
    steps.forEach((s, i) => {
      s.addEventListener('click', () => {
        if (i < currentStep) goTo(i);
      });
    });

    // Submit
    form.addEventListener('submit', (e) => { e.preventDefault(); });
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleSubmit();
      });
    }

    function goTo(n) {
      if (n < 0 || n >= panels.length) return;
      panels.forEach((p, i) => p.classList.toggle('active', i === n));
      steps.forEach((s, i) => {
        s.classList.toggle('active', i === n);
        s.classList.toggle('done', i < n);
      });
      currentStep = n;
      if (n === panels.length - 1) updateRecap();
      scrollToForm();
    }

    function scrollToForm() {
      const section = $('#rdv');
      if (!section) return;
      const offset = ($('#main-nav')?.offsetHeight || 72) + 12;
      window.scrollTo({
        top: section.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth'
      });
    }

    function validate(step) {
      switch(step) {
        case 0: return requireRadio('vehicule', 'vehicule-group', 'Sélectionnez un type de véhicule.');
        case 1: return requireRadio('service', 'service-group', 'Sélectionnez une prestation.');
        case 2:
          let r = requireField('rdv-date', 'date-group', 'Choisissez une date.');
          r = requireRadio('creneau', 'creneau-group', 'Choisissez un créneau.') && r;
          r = requireField('localite', 'localite-group', 'Indiquez votre commune.') && r;
          return r;
        case 3:
          let q = requireField('prenom', 'prenom-group', 'Requis.');
          q = requireField('nom', 'nom-group', 'Requis.') && q;
          q = requirePhone('tel', 'tel-group') && q;
          q = requireEmail('rdv-email', 'email-group') && q;
          const rgpd = $('#rdv-rgpd');
          if (!rgpd?.checked) {
            showError('rgpd-group', 'Vous devez accepter les conditions.');
            q = false;
          } else clearError('rgpd-group');
          return q;
        default: return true;
      }
    }

    function requireField(id, groupId, msg) {
      const el = $('#' + id);
      if (!el || !el.value.trim()) { showError(groupId, msg); return false; }
      clearError(groupId);
      return true;
    }

    function requireRadio(name, groupId, msg) {
      if (!$(`input[name="${name}"]:checked`)) {
        showError(groupId, msg);
        return false;
      }
      clearError(groupId);
      return true;
    }

    function requireEmail(id, groupId) {
      const el = $('#' + id);
      if (!el || !el.value) return true; // optionnel
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
        showError(groupId, 'Email invalide.');
        return false;
      }
      clearError(groupId);
      return true;
    }

    function requirePhone(id, groupId) {
      const el = $('#' + id);
      const val = el?.value.replace(/[\s.\-]/g, '') || '';
      if (!val) { showError(groupId, 'Téléphone requis.'); return false; }
      if (!/^(\+33|0)[1-9]\d{8}$/.test(val)) {
        showError(groupId, 'Numéro français invalide.');
        return false;
      }
      clearError(groupId);
      return true;
    }

    function showError(groupId, msg) {
      const g = $('#' + groupId);
      if (!g) return;
      g.classList.add('has-error');
      const err = g.querySelector('.form-error');
      if (err && msg) err.textContent = msg;
    }

    function clearError(groupId) {
      $('#' + groupId)?.classList.remove('has-error');
    }

    function fmtDate(v) {
      if (!v) return '—';
      const d = new Date(v + 'T00:00:00');
      if (isNaN(d)) return v;
      return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
    }

    function updateRecap() {
      const v = $('input[name="vehicule"]:checked')?.value || '';
      const s = $('input[name="service"]:checked')?.value || '';
      setText('r-vehicule', VEHICULE_LABELS[v] || '—');
      setText('r-service', SERVICE_LABELS[s] || '—');
      setText('r-date', fmtDate($('#rdv-date')?.value));
      setText('r-creneau', $('input[name="creneau"]:checked')?.value || '—');
      setText('r-lieu', $('#localite')?.value || '—');
      setText('r-prix', (TARIFS[v] && TARIFS[v][s]) || 'Sur devis');
    }

    function setText(id, txt) {
      const el = $('#' + id);
      if (el) el.textContent = txt;
    }

    async function handleSubmit() {
      // Honeypot
      const hp = $('input[name="_honeypot"]');
      if (hp && hp.value) {
        showConfirm();
        return;
      }

      if (!validate(3)) return;

      submitBtn.disabled = true;
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Envoi en cours…</span>';

      const data = {
        vehicule: $('input[name="vehicule"]:checked')?.value,
        service: $('input[name="service"]:checked')?.value,
        date: $('#rdv-date')?.value,
        creneau: $('input[name="creneau"]:checked')?.value,
        localite: $('#localite')?.value,
        prenom: $('#prenom')?.value,
        nom: $('#nom')?.value,
        tel: $('#tel')?.value,
        email: $('#rdv-email')?.value,
        commentaire: $('#service-comment')?.value,
        prix_estime: (TARIFS[$('input[name="vehicule"]:checked')?.value] || {})[$('input[name="service"]:checked')?.value] || 'Sur devis',
        url: window.location.href,
        referrer: document.referrer,
        _timestamp: new Date().toISOString()
      };

      track('form_submit_attempt', { service: data.service, vehicule: data.vehicule });

      try {
        const response = await fetch(CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          track('form_success', { service: data.service, vehicule: data.vehicule });
          showConfirm();
        } else {
          throw new Error('Erreur serveur');
        }
      } catch (err) {
        // Fallback mailto si API indispo
        console.warn('API error, using mailto fallback', err);
        const subject = encodeURIComponent(`Demande de RDV — ${data.prenom} ${data.nom}`);
        const body = encodeURIComponent(
          `Véhicule : ${VEHICULE_LABELS[data.vehicule]}\n` +
          `Prestation : ${SERVICE_LABELS[data.service]}\n` +
          `Date : ${data.date}\n` +
          `Créneau : ${data.creneau}\n` +
          `Commune : ${data.localite}\n\n` +
          `Nom : ${data.prenom} ${data.nom}\n` +
          `Téléphone : ${data.tel}\n` +
          `Email : ${data.email || '—'}\n\n` +
          `Précisions : ${data.commentaire || '—'}\n\n` +
          `Tarif estimé : ${data.prix_estime}`
        );
        window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;

        setTimeout(() => {
          track('form_success_fallback');
          showConfirm();
        }, 800);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }

    function showConfirm() {
      panels.forEach(p => p.classList.remove('active'));
      if (confirmEl) confirmEl.classList.add('active');
      steps.forEach(s => { s.classList.add('done'); s.classList.remove('active'); });
      scrollToForm();
    }
  }

  // ─── Cookie Banner ──────────────────────────────────────
  function initCookies() {
    const banner = $('#cookie-banner');
    if (!banner) return;

    const KEY = 'fr_cookies_v1';
    const stored = localStorage.getItem(KEY);
    if (stored) return;

    banner.hidden = false;

    const accept = () => {
      localStorage.setItem(KEY, 'accepted');
      banner.style.display = 'none';
      track('cookies_accept');
    };
    const refuse = () => {
      localStorage.setItem(KEY, 'refused');
      banner.style.display = 'none';
      track('cookies_refuse');
    };
    $('#cookie-accept')?.addEventListener('click', accept);
    $('#cookie-refuse')?.addEventListener('click', refuse);
  }

  // ─── Year ───────────────────────────────────────────────
  function initYear() {
    const y = $('#current-year');
    if (y) y.textContent = new Date().getFullYear();
  }

  // ─── Init ───────────────────────────────────────────────
  function init() {
    initNav();
    initStickyCTA();
    initAnimations();
    initTracking();
    initBeforeAfter();
    initForm();
    initCookies();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
