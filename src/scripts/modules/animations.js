/**
 * animations.js — Scroll reveal + compteurs animés
 */
export function initAnimations() {
  // Scroll reveal
  const els = document.querySelectorAll('.appear');
  if (els.length) {
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
      }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
      els.forEach(el => obs.observe(el));
    } else {
      els.forEach(el => el.classList.add('in'));
    }
  }

  // Compteurs animés
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const isFloat = el.dataset.count.includes('.');
      let current = 0;
      const inc = target / (1800 / 16);
      const t = setInterval(() => {
        current = Math.min(current + inc, target);
        el.textContent = isFloat ? current.toFixed(1) : Math.round(current).toString();
        if (current >= target) clearInterval(t);
      }, 16);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}
