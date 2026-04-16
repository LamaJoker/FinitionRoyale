/**
 * modules/animations.js
 * Scroll-triggered appear + animated counters
 */

export function initAnimations() {
  initScrollReveal();
  initCounters();
}

function initScrollReveal() {
  const els = document.querySelectorAll('.appear');
  if (!els.length) return;

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach(el => obs.observe(el));
  } else {
    els.forEach(el => el.classList.add('in'));
  }
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      animateCounter(e.target);
      obs.unobserve(e.target);
    }),
    { threshold: 0.5 }
  );

  counters.forEach(c => obs.observe(c));
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const isFloat = el.dataset.count.includes('.');
  const duration = 1800;
  const steps = duration / 16;
  const inc = target / steps;
  let current = 0;

  const timer = setInterval(() => {
    current += inc;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = isFloat
      ? current.toFixed(1)
      : Math.round(current).toString();
  }, 16);
}
