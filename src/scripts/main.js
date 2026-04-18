/**
 * main.js — Finition Royale
 * Point d'entrée — initialise tous les modules
 */

/* ── Nav ──────────────────────────────────────────────────────────────────── */
function initNav() {
  const nav     = document.getElementById('main-nav');
  const burger  = document.getElementById('burger');
  const menu    = document.getElementById('mobile-menu');
  const sticky  = document.getElementById('sticky-cta');

  const onScroll = () => {
    nav?.classList.toggle('solid', window.scrollY > 60);
    sticky?.classList.toggle('visible', window.scrollY > 300);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    menu?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    burger.setAttribute('aria-expanded', String(open));
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight || 72) - 16, behavior: 'smooth' });
      closeMenu();
    });
  });

  function closeMenu() {
    burger?.classList.remove('open');
    menu?.classList.remove('open');
    document.body.style.overflow = '';
    burger?.setAttribute('aria-expanded', 'false');
  }
}

/* ── Animations ───────────────────────────────────────────────────────────── */
function initAnimations() {
  const els = document.querySelectorAll('.appear');
  if (!els.length) return;
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    }), { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    els.forEach(el => obs.observe(el));
  } else {
    els.forEach(el => el.classList.add('in'));
  }

  // Compteurs animés
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const obsC = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = parseFloat(el.dataset.count), isFloat = el.dataset.count.includes('.');
    let current = 0;
    const inc = target / (1800 / 16);
    const t = setInterval(() => {
      current = Math.min(current + inc, target);
      el.textContent = isFloat ? current.toFixed(1) : Math.round(current).toString();
      if (current >= target) clearInterval(t);
    }, 16);
    obsC.unobserve(el);
  }), { threshold: 0.5 });
  counters.forEach(c => obsC.observe(c));
}

/* ── Tracking ─────────────────────────────────────────────────────────────── */
function push(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
  window.gtag?.('event', event, params);
}

function initTracking() {
  document.querySelectorAll('.btn--primary, [href="#rdv"]').forEach(el => {
    el.addEventListener('click', () => push('cta_click', {
      text: el.textContent.trim().slice(0, 50),
      location: el.closest('section')?.id || 'unknown'
    }));
  });
  document.querySelectorAll('a[href^="tel:"]').forEach(el  => el.addEventListener('click', () => push('phone_click')));
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => el.addEventListener('click', () => push('email_click')));
  document.querySelectorAll('a[href*="instagram"]').forEach(el => el.addEventListener('click', () => push('instagram_click')));

  const firstInput = document.querySelector('input[name="vehicule"]');
  if (firstInput) {
    let started = false;
    firstInput.addEventListener('change', () => { if (!started) { started = true; push('form_start'); } }, { once: true });
  }
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => push('form_step', { step: btn.closest('.form-panel')?.id?.replace('panel-', '') || '?' }));
  });
  document.getElementById('submit-btn')?.addEventListener('click', () => push('form_submit_attempt'));

  const depths = [25, 50, 75, 100];
  const reached = new Set();
  window.addEventListener('scroll', () => {
    const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    depths.forEach(d => { if (pct >= d && !reached.has(d)) { reached.add(d); push('scroll_depth', { percent: d }); } });
  }, { passive: true });
}

/* ── Cookies ──────────────────────────────────────────────────────────────── */
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name) {
  const c = document.cookie.split(';').find(c => c.trim().startsWith(name + '='));
  return c ? c.trim().split('=')[1] : null;
}
function loadAnalytics() {
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
function initCookies() {
  const banner    = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  const refuseBtn = document.getElementById('cookie-refuse');
  if (!banner) return;
  const consent = getCookie('fr_consent');
  if (!consent) setTimeout(() => banner.classList.add('visible'), 1500);
  else if (consent === 'accepted') loadAnalytics();
  acceptBtn?.addEventListener('click', () => { setCookie('fr_consent', 'accepted', 365); banner.classList.remove('visible'); loadAnalytics(); push('cookie_accept'); });
  refuseBtn?.addEventListener('click', () => { setCookie('fr_consent', 'refused', 365); banner.classList.remove('visible'); push('cookie_refuse'); });
  document.querySelectorAll('[data-open-cookies]').forEach(btn => btn.addEventListener('click', () => banner.classList.add('visible')));
}

/* ── Formulaire RDV multi-étapes ──────────────────────────────────────────── */
const TARIFS = {
  citadine: { interieur:'45–55€', shampoing:'55–70€', exterieur:'40–50€', phares:'60–90€', pack:'80–95€' },
  berline:  { interieur:'60–75€', shampoing:'65–85€', exterieur:'50–65€', phares:'60–90€', pack:'110–150€' },
  suv:      { interieur:'80–100€', shampoing:'85–105€', exterieur:'70–90€', phares:'60–90€', pack:'140–165€' },
};
const SERVICE_LABELS = { interieur:'Intérieur Complet', shampoing:'Shampoing Sièges', exterieur:'Extérieur Premium', phares:'Rénovation Phares', pack:'Pack Int. + Ext.' };
const VEHICULE_LABELS = { citadine:'Citadine', berline:'Berline / SUV', suv:'4×4 / Utilitaire' };
const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MOIS  = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

function q(sel) { return document.querySelector(sel); }
function val(id) { return document.getElementById(id)?.value || ''; }
function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }
function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  const dt = new Date(+y, +m - 1, +d);
  return `${JOURS[dt.getDay()]} ${d} ${MOIS[+m - 1]} ${y}`;
}
function showError(groupId, msg) {
  const g = document.getElementById(groupId);
  if (!g) return;
  g.classList.add('has-error');
  const e = g.querySelector('.form-error');
  if (e) e.textContent = msg;
}
function clearError(groupId) { document.getElementById(groupId)?.classList.remove('has-error'); }
function requireField(id, groupId, msg) {
  const el = document.getElementById(id);
  if (!el?.value.trim()) { showError(groupId, msg); return false; }
  clearError(groupId); return true;
}
function requireRadio(name, groupId, msg) {
  if (!document.querySelector(`input[name="${name}"]:checked`)) { showError(groupId, msg); return false; }
  clearError(groupId); return true;
}

function validate(step) {
  const rules = {
    0: () => requireRadio('vehicule', 'vehicule-group', 'Sélectionnez un type de véhicule.'),
    1: () => requireRadio('service', 'service-group', 'Sélectionnez un service.'),
    2: () => {
      let r = requireField('rdv-date', 'date-group', 'Choisissez une date.');
      r = requireRadio('creneau', 'creneau-group', 'Choisissez un créneau.') && r;
      r = requireField('localite', 'localite-group', 'Indiquez votre commune.') && r;
      return r;
    },
    3: () => {
      let r = requireField('prenom', 'prenom-group', 'Requis.');
      r = requireField('nom', 'nom-group', 'Requis.') && r;
      r = requireField('tel', 'tel-group', 'Requis.') && r;
      const rgpd = document.getElementById('rdv-rgpd');
      if (!rgpd?.checked) { showError('rgpd-group', 'Vous devez accepter les conditions.'); r = false; }
      else clearError('rgpd-group');
      return r;
    }
  };
  return (rules[step] ?? (() => true))();
}

function updateRecap() {
  const v = q('input[name="vehicule"]:checked')?.value || '';
  const s = q('input[name="service"]:checked')?.value  || '';
  setText('r-vehicule', VEHICULE_LABELS[v] || '—');
  setText('r-service',  SERVICE_LABELS[s]  || '—');
  setText('r-date',     fmtDate(val('rdv-date')));
  setText('r-creneau',  q('input[name="creneau"]:checked')?.value || '—');
  setText('r-lieu',     val('localite') || '—');
  setText('r-prix',     TARIFS[v]?.[s] ?? 'Sur devis');
}

function showConfirm(stepsWrap, panels, confirmEl) {
  stepsWrap?.style.setProperty('display', 'none');
  panels.forEach(p => (p.style.display = 'none'));
  confirmEl?.classList.add('visible');
  setText('confirm-prenom', val('prenom'));
}

async function handleSubmit(stepsWrap, panels, confirmEl, submitBtn) {
  if (!validate(3)) return;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Envoi…';
  const fd = new FormData();
  ['prenom','nom','rdv-email','tel','marque','etat','rdv-date','localite','service-comment'].forEach(id => fd.append(id.replace('rdv-', ''), val(id)));
  fd.append('vehicule', q('input[name="vehicule"]:checked')?.value || '');
  fd.append('service',  q('input[name="service"]:checked')?.value  || '');
  fd.append('creneau',  q('input[name="creneau"]:checked')?.value  || '');
  fd.append('rgpd', '1');

  try {
    const res  = await fetch('/send-rdv.php', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) { showConfirm(stepsWrap, panels, confirmEl); push('form_success'); }
    else {
      submitBtn.disabled = false;
      submitBtn.textContent = '⚠ Erreur — Réessayez';
      setTimeout(() => { submitBtn.textContent = '🚀 Confirmer ma réservation'; }, 4000);
    }
  } catch {
    // Fallback mailto
    const p = val('prenom'), n = val('nom'), t = val('tel'), e = val('rdv-email');
    const sv = q('input[name="service"]:checked')?.value || '';
    const body = encodeURIComponent(`Prénom: ${p}\nNom: ${n}\nTél: ${t}\nEmail: ${e}\nService: ${sv}`);
    window.location.href = `mailto:contact@finitionroyale.fr?subject=${encodeURIComponent('RDV - ' + p + ' ' + n)}&body=${body}`;
    showConfirm(stepsWrap, panels, confirmEl);
  }
}

function initForm() {
  const panels    = document.querySelectorAll('.form-panel');
  const steps     = document.querySelectorAll('.form-step');
  const confirmEl = document.getElementById('confirm-screen');
  const submitBtn = document.getElementById('submit-btn');
  const stepsWrap = document.querySelector('.form-steps');
  if (!panels.length) return;

  let currentStep = 0;

  function goTo(n) {
    if (n < 0 || n >= panels.length) return;
    panels.forEach((p, i) => p.classList.toggle('active', i === n));
    steps.forEach((s, i) => { s.classList.toggle('active', i === n); s.classList.toggle('done', i < n); });
    currentStep = n;
    document.querySelectorAll('[data-progress]').forEach(el => el.textContent = `Étape ${n + 1} / ${panels.length}`);
    if (n === panels.length - 1) updateRecap();
    const section = document.getElementById('rdv');
    if (section) {
      const offset = (document.getElementById('main-nav')?.offsetHeight || 72) + 16;
      window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    }
  }

  document.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', () => { if (validate(currentStep)) goTo(currentStep + 1); }));
  document.querySelectorAll('[data-prev]').forEach(btn => btn.addEventListener('click', () => goTo(currentStep - 1)));
  steps.forEach((s, i) => s.addEventListener('click', () => { if (i < currentStep) goTo(i); }));

  // Date min = demain, pas de dimanche
  const dateInput = document.getElementById('rdv-date');
  if (dateInput) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.addEventListener('change', function () {
      const day = new Date(this.value + 'T00:00:00').getDay();
      if (day === 0) { showError('date-group', 'Nous sommes fermés le dimanche.'); this.value = ''; }
      else clearError('date-group');
    });
  }

  submitBtn?.addEventListener('click', () => handleSubmit(stepsWrap, panels, confirmEl, submitBtn));

  // Honeypot silencieux
  const honeypot = document.querySelector('input[name="_honeypot"]');
  submitBtn?.addEventListener('click', e => {
    if (honeypot?.value) { e.stopImmediatePropagation(); showConfirm(stepsWrap, panels, confirmEl); }
  }, true);
}

/* ── Boot ─────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initAnimations();
  initTracking();
  if (document.getElementById('rdv')) initForm();
  initCookies();
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
});
