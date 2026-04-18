/**
 * tracking.js — Events GTM/GA4
 */

function push(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
  window.gtag?.('event', event, params);
}

export function initTracking() {
  // CTA clicks
  document.querySelectorAll('.btn--primary, [href="#rdv"]').forEach(el => {
    el.addEventListener('click', () => push('cta_click', {
      text: el.textContent.trim().slice(0, 50),
      section: el.closest('[id]')?.id ?? 'unknown',
    }));
  });

  // Contact
  document.querySelectorAll('a[href^="tel:"]').forEach(el    => el.addEventListener('click', () => push('phone_click')));
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => el.addEventListener('click', () => push('email_click')));
  document.querySelectorAll('a[href*="instagram"]').forEach(el => el.addEventListener('click', () => push('instagram_click')));

  // Form progression
  let formStarted = false;
  document.querySelector('input[name="vehicule"]')?.addEventListener('change', () => {
    if (!formStarted) { formStarted = true; push('form_start'); }
  }, { once: true });

  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () =>
      push('form_step', { step: btn.closest('.form-panel')?.id?.replace('panel-', '') ?? '?' })
    );
  });

  document.getElementById('submit-btn')?.addEventListener('click', () => push('form_submit_attempt'));

  // Scroll depth
  const depths = [25, 50, 75, 100];
  const reached = new Set();
  window.addEventListener('scroll', () => {
    const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    depths.forEach(d => { if (pct >= d && !reached.has(d)) { reached.add(d); push('scroll_depth', { percent: d }); } });
  }, { passive: true });
}
