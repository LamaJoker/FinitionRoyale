(function () {
'use strict';
const nav = document.getElementById('nav');
if (nav) {
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
}
const burger = document.getElementById('burger');
const menu   = document.getElementById('mobileMenu');
const menuClose = document.getElementById('mobileMenuClose');
if (burger && menu) {
const openMenu = () => {
menu.hidden = false;
menu.classList.add('open');
burger.setAttribute('aria-expanded', 'true');
document.body.style.overflow = 'hidden';
const firstLink = menu.querySelector('a, button');
if (firstLink) firstLink.focus();
};
const closeMenu = () => {
menu.classList.remove('open');
burger.setAttribute('aria-expanded', 'false');
document.body.style.overflow = '';
burger.focus();
setTimeout(() => { menu.hidden = true; }, 250);
};
burger.addEventListener('click', () => {
const isOpen = burger.getAttribute('aria-expanded') === 'true';
isOpen ? closeMenu() : openMenu();
});
if (menuClose) menuClose.addEventListener('click', closeMenu);
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') closeMenu();
});
}
const page = document.body.dataset.page;
if (page) {
document.querySelectorAll('[data-page="' + page + '"]').forEach(a => {
a.setAttribute('aria-current', 'page');
a.classList.add('is-active');
});
}
const reveals = document.querySelectorAll('.reveal');
if (reveals.length && 'IntersectionObserver' in window) {
const obs = new IntersectionObserver((entries) => {
entries.forEach(e => {
if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
});
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => obs.observe(el));
}
const COOKIE_KEY = 'fr_consent_v1';
const banner = document.getElementById('cookieBanner');
const acceptBtn = document.getElementById('cookieAccept');
const declineBtn = document.getElementById('cookieDecline');
const getConsent = () => {
try { return localStorage.getItem(COOKIE_KEY); } catch (e) { return null; }
};
const setConsent = (val) => {
try { localStorage.setItem(COOKIE_KEY, val); } catch (e) {}
};
const showBanner = () => { if (banner) { banner.hidden = false; banner.classList.add('visible'); } };
const hideBanner = () => { if (banner) { banner.classList.remove('visible'); setTimeout(() => banner.hidden = true, 250); } };
let consent = getConsent();
if (!consent && banner) {
setTimeout(showBanner, 1200);
}
if (acceptBtn) acceptBtn.addEventListener('click', () => { setConsent('accept'); consent = 'accept'; hideBanner(); loadGA(); });
if (declineBtn) declineBtn.addEventListener('click', () => { setConsent('decline'); consent = 'decline'; hideBanner(); });
let gaLoaded = false;
function loadGA() {
if (gaLoaded) return;
if (consent !== 'accept') return;
const id = window.__gaId;
if (!id || id.indexOf('G-') !== 0) return;
gaLoaded = true;
const s = document.createElement('script');
s.async = true;
s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
document.head.appendChild(s);
if (typeof window.gtag === 'function') {
window.gtag('js', new Date());
window.gtag('config', id, { anonymize_ip: true, cookie_flags: 'SameSite=None;Secure' });
}
}
['scroll','mousemove','touchstart','keydown'].forEach(ev =>
window.addEventListener(ev, loadGA, { once: true, passive: true })
);
setTimeout(loadGA, 8000);
document.querySelectorAll('[data-track]').forEach(el => {
el.addEventListener('click', () => {
if (typeof window.gtag !== 'function') return;
window.gtag('event', 'cta_click', {
cta_id: el.dataset.track,
page: document.body.dataset.page || 'unknown'
});
});
});
const backTop = document.getElementById('backToTop');
if (backTop) {
const toggleBack = () => {
const visible = window.scrollY > 600;
backTop.hidden = !visible;
backTop.classList.toggle('visible', visible);
};
window.addEventListener('scroll', toggleBack, { passive: true });
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
toggleBack();
}
document.querySelectorAll('.ba-slider').forEach((wrap) => {
const range  = wrap.querySelector('.ba-range');
const after  = wrap.querySelector('.ba-after');
const handle = wrap.querySelector('.ba-handle');
if (!range || !after) return;
const apply = (v) => {
after.style.clipPath = 'inset(0 0 0 ' + v + '%)';
if (handle) handle.style.left = v + '%';
};
range.addEventListener('input', () => apply(range.value));
apply(range.value || 50);
});
const calc = document.getElementById('devisCalc');
if (calc) {
const PRICES = {
'eclat-essentiel':       { 'citadine': 80,  'berline': 95,  'suv': 115, 'utilitaire': 130 },
'prestige-complet':      { 'citadine': 180, 'berline': 220, 'suv': 260, 'utilitaire': 300 },
'protection-ceramique':  { 'citadine': 350, 'berline': 420, 'suv': 500, 'utilitaire': 580 },
};
const formula = calc.querySelector('[name="formule"]');
const vehicle = calc.querySelector('[name="vehicule"]');
const out     = calc.querySelector('#devisResult');
const cta     = calc.querySelector('#devisCta');
const update = () => {
const f = formula && formula.value;
const v = vehicle && vehicle.value;
if (!f || !v) { out.textContent = '—'; cta.hidden = true; return; }
const price = PRICES[f] && PRICES[f][v];
if (!price) { out.textContent = '—'; cta.hidden = true; return; }
out.innerHTML = 'À partir de <strong>' + price + ' €</strong>';
cta.hidden = false;
const label = formula.options[formula.selectedIndex].text;
const vLabel = vehicle.options[vehicle.selectedIndex].text;
const msg = encodeURIComponent('Bonjour, je voudrais réserver une ' + label + ' pour ma ' + vLabel + ' (devis estimé ' + price + ' €).');
cta.href = 'https://wa.me/' + (window.__phoneIntl || '33771229038') + '?text=' + msg;
};
if (formula) formula.addEventListener('change', update);
if (vehicle) vehicle.addEventListener('change', update);
update();
}
if (document.body.dataset.page === 'merci' && typeof window.gtag === 'function') {
window.gtag('event', 'lead_submitted', { page: 'contact' });
}
})();