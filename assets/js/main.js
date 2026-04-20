/* ============================================================
   FINITION ROYALE — main.js
   Vanilla JS — no dependencies
   ============================================================ */

(function(){
  'use strict';

  const CONFIG = {
    apiEndpoint: '/api/send-rdv.php',
    fallbackEmail: 'contact@finitionroyale.fr',
    stickyScrollThreshold: 0.3, // 30% viewport scroll
    cookieKey: 'fr_cookies_v1',
  };

  const dl = () => (window.dataLayer = window.dataLayer || []);
  const track = (event, params = {}) => {
    dl().push({ event, ...params });
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ========== NAV ========== */
  function initNav() {
    const nav = $('#nav');
    const burger = $('#burger');
    const menu = $('#mobile-menu');
    if (!nav) return;

    const onScroll = () => {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger && menu) {
      burger.addEventListener('click', () => {
        const open = burger.getAttribute('aria-expanded') === 'true';
        burger.setAttribute('aria-expanded', String(!open));
        menu.hidden = open;
      });
      $$('a', menu).forEach(a => {
        a.addEventListener('click', () => {
          burger.setAttribute('aria-expanded', 'false');
          menu.hidden = true;
        });
      });
    }

    // Smooth scroll on internal anchors (backup to CSS)
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ========== STICKY CTA (mobile) ========== */
  function initStickyCTA() {
    const sticky = $('#stickyCTA');
    if (!sticky) return;

    const onScroll = () => {
      const threshold = window.innerHeight * CONFIG.stickyScrollThreshold;
      if (window.scrollY > threshold) {
        sticky.classList.add('visible');
        sticky.setAttribute('aria-hidden', 'false');
      } else {
        sticky.classList.remove('visible');
        sticky.setAttribute('aria-hidden', 'true');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ========== CTA TRACKING ========== */
  function initTracking() {
    // Universal CTA click tracker
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-cta]');
      if (!el) return;

      const location = el.dataset.cta;
      const href = el.getAttribute('href') || '';
      let type = 'cta_click';

      if (href.startsWith('tel:')) type = 'phone_click';
      else if (href.includes('wa.me')) type = 'whatsapp_click';
      else if (href.startsWith('mailto:')) type = 'email_click';
      else if (href.includes('instagram')) type = 'instagram_click';
      else if (location.includes('form') || location.includes('rdv') || location === 'nav_reserver') type = 'cta_click';

      track(type, { location });
    });

    // Scroll depth
    const marks = [25, 50, 75, 100];
    const hit = new Set();
    const onScroll = () => {
      const h = document.documentElement;
      const pct = Math.round(((window.scrollY + window.innerHeight) / h.scrollHeight) * 100);
      marks.forEach(m => {
        if (pct >= m && !hit.has(m)) {
          hit.add(m);
          track('scroll_depth', { percent: m });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Time on page buckets
    const times = [15, 30, 60, 120, 300];
    times.forEach(t => {
      setTimeout(() => track('time_on_page', { seconds: t }), t * 1000);
    });
  }

  /* ========== BEFORE / AFTER SLIDER ========== */
  function initBeforeAfter() {
    $$('[data-ba]').forEach((slider) => {
      const range = $('.ba-range', slider);
      const handle = $('.ba-handle', slider);
      const after = $('.ba-after', slider);
      if (!range || !handle || !after) return;

      const apply = (v) => {
        const pct = Math.max(0, Math.min(100, v));
        handle.style.left = pct + '%';
        after.style.clipPath = `inset(0 0 0 ${pct}%)`;
      };

      range.addEventListener('input', (e) => apply(e.target.value));
      apply(50);

      // Auto-animate on first view
      let animated = false;
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !animated) {
            animated = true;
            let p = 50;
            let dir = 1;
            let count = 0;
            const id = setInterval(() => {
              p += dir * 2;
              if (p >= 78) dir = -1;
              if (p <= 22) dir = 1;
              apply(p);
              range.value = p;
              count++;
              if (count > 50) {
                clearInterval(id);
                apply(50);
                range.value = 50;
                track('before_after_interaction', { type: 'auto_demo' });
              }
            }, 40);
          }
        });
      }, { threshold: 0.6 });
      io.observe(slider);

      // Track user drag
      let userInteracted = false;
      range.addEventListener('input', () => {
        if (!userInteracted) {
          userInteracted = true;
          track('before_after_interaction', { type: 'user_drag' });
        }
      });
    });
  }

  /* ========== FAQ TRACKING ========== */
  function initFAQ() {
    $$('.faq-item').forEach((item, i) => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          track('faq_open', { question_id: i + 1 });
        }
      });
    });
  }

  /* ========== RDV FORM (short version) ========== */
  function initForm() {
    const form = $('#rdvForm');
    if (!form) return;

    const btn = $('#rdvSubmit', form);
    const result = $('#rdvResult', form);
    let started = false;

    // Track form start
    $$('input, textarea', form).forEach(input => {
      input.addEventListener('focus', () => {
        if (!started) {
          started = true;
          track('form_start');
        }
      });
      input.addEventListener('blur', () => {
        if (input.value.trim()) {
          track('form_field_filled', { field_name: input.name });
        }
      });
    });

    const showError = (msg) => {
      if (!result) return;
      result.hidden = false;
      result.className = 'rdv-result error';
      result.textContent = msg;
    };
    const showSuccess = (msg) => {
      if (!result) return;
      result.hidden = false;
      result.className = 'rdv-result success';
      result.textContent = msg;
    };

    const validatePhone = (v) => {
      const clean = v.replace(/[\s.\-]/g, '');
      return /^(\+33|0)[1-9]\d{8}$/.test(clean);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      // Clear errors
      $$('.error', form).forEach(el => el.classList.remove('error'));

      const data = {
        name: $('#f-name', form).value.trim(),
        phone: $('#f-phone', form).value.trim(),
        city: $('#f-city', form).value.trim(),
        need: $('#f-need', form).value.trim(),
        website: form.querySelector('input[name="website"]').value, // honeypot
        source: 'short_form_home',
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
      };

      // Validation
      if (!data.name || data.name.length < 2) {
        $('#f-name').classList.add('error');
        return showError('Merci de renseigner votre prénom.');
      }
      if (!validatePhone(data.phone)) {
        $('#f-phone').classList.add('error');
        return showError('Numéro de téléphone invalide. Ex : 06 12 34 56 78');
      }
      if (!data.city || data.city.length < 2) {
        $('#f-city').classList.add('error');
        return showError('Merci de préciser votre ville.');
      }

      track('form_submit_attempt');

      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = 'Envoi en cours…';

      try {
        const response = await fetch(CONFIG.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);
        const json = await response.json();
        if (!json.ok) throw new Error(json.error || 'Erreur');

        track('form_success', { city: data.city });
        form.style.display = 'none';
        showSuccess('✓ Demande envoyée ! On vous rappelle dans l\'heure (9h–19h). Pour un RDV plus rapide, appelez-nous au 07 71 22 90 38.');

      } catch (err) {
        // Fallback mailto — never lose a lead
        track('form_success_fallback', { reason: err.message });
        const subject = encodeURIComponent('Demande de RDV — ' + data.name + ' (' + data.city + ')');
        const body = encodeURIComponent(
          'Bonjour,\n\n' +
          'Je souhaite réserver un créneau.\n\n' +
          'Prénom : ' + data.name + '\n' +
          'Téléphone : ' + data.phone + '\n' +
          'Ville : ' + data.city + '\n' +
          'Demande : ' + (data.need || 'À définir') + '\n\n' +
          'Merci de me rappeler pour fixer le créneau.'
        );
        window.location.href = 'mailto:' + CONFIG.fallbackEmail + '?subject=' + subject + '&body=' + body;
        showSuccess('✓ Demande préparée dans votre messagerie. Envoyez-la, ou appelez-nous directement au 07 71 22 90 38.');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  /* ========== COOKIES ========== */
  function initCookies() {
    const banner = $('#cookies');
    if (!banner) return;

    const already = localStorage.getItem(CONFIG.cookieKey);
    if (already) return;

    setTimeout(() => { banner.hidden = false; }, 1200);

    const close = (choice) => {
      localStorage.setItem(CONFIG.cookieKey, choice);
      banner.hidden = true;
      track('cookies_' + choice);
    };

    $('#ckAccept', banner).addEventListener('click', () => close('accept'));
    $('#ckRefuse', banner).addEventListener('click', () => close('refuse'));
  }

  /* ========== YEAR ========== */
  function initYear() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ========== BOOT ========== */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initStickyCTA();
    initTracking();
    initBeforeAfter();
    initFAQ();
    initForm();
    initCookies();
    initYear();
  });

})();
