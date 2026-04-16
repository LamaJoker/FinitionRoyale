/**
 * modules/tracking.js
 * Tracking analytique : CTA, formulaire, interactions
 */

export function initTracking() {
  trackCTAClicks();
  trackFormInteractions();
  trackScrollDepth();
}

function trackCTAClicks() {
  // Tous les boutons CTA primaires
  document.querySelectorAll('.btn--primary, [href="#rdv"]').forEach(el => {
    el.addEventListener('click', () => {
      push('cta_click', {
        text: el.textContent.trim().slice(0, 50),
        location: el.closest('section')?.id || 'unknown'
      });
    });
  });

  // Lien téléphone
  document.querySelectorAll('a[href^="tel:"]').forEach(el => {
    el.addEventListener('click', () => push('phone_click'));
  });

  // Lien email
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
    el.addEventListener('click', () => push('email_click'));
  });

  // Instagram
  document.querySelectorAll('a[href*="instagram"]').forEach(el => {
    el.addEventListener('click', () => push('instagram_click'));
  });
}

function trackFormInteractions() {
  // Début de formulaire
  const firstInput = document.querySelector('input[name="vehicule"]');
  if (firstInput) {
    let started = false;
    firstInput.addEventListener('change', () => {
      if (!started) {
        started = true;
        push('form_start');
      }
    }, { once: true });
  }

  // Progression par étape
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.closest('.form-panel')?.id?.replace('panel-', '') || '?';
      push('form_step', { step });
    });
  });

  // Soumission
  document.getElementById('submit-btn')?.addEventListener('click', () => {
    push('form_submit_attempt');
  });
}

function trackScrollDepth() {
  const depths = [25, 50, 75, 100];
  const reached = new Set();

  window.addEventListener('scroll', () => {
    const pct = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    depths.forEach(d => {
      if (pct >= d && !reached.has(d)) {
        reached.add(d);
        push('scroll_depth', { percent: d });
      }
    });
  }, { passive: true });
}

/**
 * Push un event GTM/GA4
 * @param {string} event
 * @param {object} params
 */
function push(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });

  if (window.gtag) {
    window.gtag('event', event, params);
  }
}
