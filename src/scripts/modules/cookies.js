/**
 * cookies.js — Bandeau RGPD + chargement conditionnel GA4
 */

const KEY = 'fr_consent';

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const c = document.cookie.split(';').find(c => c.trim().startsWith(name + '='));
  return c ? c.trim().split('=')[1] : null;
}

export function loadAnalytics() {
  if (window._gaLoaded) return;
  window._gaLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-2EMJFFFFEZ';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-2EMJFFFFEZ', { anonymize_ip: true });
}

export function initCookies() {
  const banner = document.getElementById('cookie-banner');
  if (!banner) return;

  const consent = getCookie(KEY);
  if (!consent) setTimeout(() => banner.classList.add('visible'), 1500);
  else if (consent === 'accepted') loadAnalytics();

  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    setCookie(KEY, 'accepted', 365);
    banner.classList.remove('visible');
    loadAnalytics();
    window.dataLayer?.push({ event: 'cookie_accept' });
  });

  document.getElementById('cookie-refuse')?.addEventListener('click', () => {
    setCookie(KEY, 'refused', 365);
    banner.classList.remove('visible');
    window.dataLayer?.push({ event: 'cookie_refuse' });
  });

  document.querySelectorAll('[data-open-cookies]').forEach(btn =>
    btn.addEventListener('click', () => banner.classList.add('visible'))
  );
}
