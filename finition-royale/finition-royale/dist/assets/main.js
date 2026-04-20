/* ============================================
   FINITION ROYALE — JS comportemental
   ============================================ */

// ── Nav scroll state ──────────────────────────
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ── Menu mobile ───────────────────────────────
(function () {
  const burger = document.getElementById('burger');
  const menu   = document.getElementById('mobileMenu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    })
  );
})();

// ── Highlight page active ─────────────────────
(function () {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(`[data-page="${page}"]`).forEach(a => {
    a.style.color = 'var(--gold)';
  });
})();

// ── Reveal on scroll ──────────────────────────
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
})();

// ── GA4 tracking des CTA ──────────────────────
(function () {
  if (typeof gtag !== 'function') return;
  document.querySelectorAll('[data-track]').forEach(el => {
    el.addEventListener('click', () => {
      gtag('event', 'cta_click', {
        cta_id: el.dataset.track,
        page:   document.body.dataset.page || 'unknown'
      });
    });
  });
})();
