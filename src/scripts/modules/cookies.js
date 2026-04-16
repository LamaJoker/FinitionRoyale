/**
 * modules/cookies.js
 * Bandeau RGPD + chargement conditionnel Analytics
 */

const KEY      = 'fr_consent';
const DURATION = 365;

export function initCookies() {
  const banner    = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  const refuseBtn = document.getElementById('cookie-refuse');

  if (!banner) return;

  const consent = getCookie(KEY);

  if (!consent) {
    setTimeout(() => banner.classList.add('visible'), 1500);
  } else if (consent === 'accepted') {
    loadAnalytics();
  }

  acceptBtn?.addEventListener('click', () => {
    setCookie(KEY, 'accepted', DURATION);
    banner.classList.remove('visible');
    loadAnalytics();
    window.dataLayer?.push({ event: 'cookie_accept' });
  });

  refuseBtn?.addEventListener('click', () => {
    setCookie(KEY, 'refused', DURATION);
    banner.classList.remove('visible');
    window.dataLayer?.push({ event: 'cookie_refuse' });
  });

  document.querySelectorAll('[data-open-cookies]').forEach(btn => {
    btn.addEventListener('click', () => banner.classList.add('visible'));
  });
}

function loadAnalytics() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-2EMJFFFFEZ';
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-2EMJFFFFEZ', { anonymize_ip: true });
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const c = document.cookie.split(';').find(c => c.trim().startsWith(name + '='));
  return c ? c.trim().split('=')[1] : null;
}
