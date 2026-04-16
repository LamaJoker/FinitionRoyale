/**
 * modules/form.js
 * Formulaire RDV multi-étapes
 * Validation robuste + anti-spam honeypot + envoi PHP
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const TARIFS = {
  citadine: { interieur: '45–55€', shampoing: '55–70€', exterieur: '40–50€', phares: '60–90€', pack: '80–95€' },
  berline:  { interieur: '60–75€', shampoing: '65–85€', exterieur: '50–65€', phares: '60–90€', pack: '110–150€' },
  suv:      { interieur: '80–100€', shampoing: '85–105€', exterieur: '70–90€', phares: '60–90€', pack: '140–165€' },
};

const SERVICE_LABELS = {
  interieur: 'Intérieur Complet',
  shampoing: 'Shampoing Sièges',
  exterieur: 'Extérieur Premium',
  phares:    'Rénovation Phares',
  pack:      'Pack Int. + Ext.',
};

const VEHICULE_LABELS = {
  citadine: 'Citadine',
  berline:  'Berline / SUV',
  suv:      '4×4 / Utilitaire',
};

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS  = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// ─── State ───────────────────────────────────────────────────────────────────

let currentStep = 0;

// ─── Init ────────────────────────────────────────────────────────────────────

export function initForm() {
  const panels    = document.querySelectorAll('.form-panel');
  const steps     = document.querySelectorAll('.form-step');
  const confirmEl = document.getElementById('confirm-screen');
  const submitBtn = document.getElementById('submit-btn');
  const stepsWrap = document.querySelector('.form-steps');

  if (!panels.length) return;

  // Navigation boutons
  document.querySelectorAll('[data-next]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (validate(currentStep)) goTo(currentStep + 1, panels, steps);
    })
  );

  document.querySelectorAll('[data-prev]').forEach(btn =>
    btn.addEventListener('click', () => goTo(currentStep - 1, panels, steps))
  );

  // Navigation steps header
  steps.forEach((s, i) => {
    s.addEventListener('click', () => { if (i < currentStep) goTo(i, panels, steps); });
  });

  // Date : min = demain, bloquer dimanche
  const dateInput = document.getElementById('rdv-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];

    dateInput.addEventListener('change', function() {
      const day = new Date(this.value + 'T00:00:00').getDay();
      if (day === 0) {
        showError('date-group', 'Nous sommes fermés le dimanche.');
        this.value = '';
      } else {
        clearError('date-group');
      }
    });
  }

  // Submit
  submitBtn?.addEventListener('click', () => handleSubmit(stepsWrap, panels, confirmEl, submitBtn));

  // Honeypot — détecter les bots
  const honeypot = document.querySelector('input[name="_honeypot"]');
  submitBtn?.addEventListener('click', (e) => {
    if (honeypot?.value) {
      e.stopImmediatePropagation();
      // Simuler succès silencieux pour les bots
      showConfirm(stepsWrap, panels, confirmEl);
    }
  }, true);

  function goTo(n, panels, steps) {
    if (n < 0 || n >= panels.length) return;

    panels.forEach((p, i) => p.classList.toggle('active', i === n));
    steps.forEach((s, i) => {
      s.classList.toggle('active', i === n);
      s.classList.toggle('done', i < n);
    });

    currentStep = n;
    document.querySelectorAll('[data-progress]').forEach(el => {
      el.textContent = `Étape ${n + 1} / ${panels.length}`;
    });

    if (n === panels.length - 1) updateRecap();
    scrollToForm();
  }

  function scrollToForm() {
    const section = document.getElementById('rdv');
    if (!section) return;
    const offset = (document.getElementById('main-nav')?.offsetHeight || 72) + 16;
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth'
    });
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validate(step) {
  let ok = true;

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
      r = requireEmail('rdv-email', 'email-group') && r;
      const rgpd = document.getElementById('rdv-rgpd');
      if (!rgpd?.checked) {
        showError('rgpd-group', 'Vous devez accepter les conditions.');
        r = false;
      } else {
        clearError('rgpd-group');
      }
      return r;
    }
  };

  ok = (rules[step] ?? (() => true))();
  return ok;
}

function requireField(id, groupId, msg) {
  const el = document.getElementById(id);
  if (!el?.value.trim()) { showError(groupId, msg); return false; }
  clearError(groupId);
  return true;
}

function requireRadio(name, groupId, msg) {
  if (!document.querySelector(`input[name="${name}"]:checked`)) {
    showError(groupId, msg);
    return false;
  }
  clearError(groupId);
  return true;
}

function requireEmail(id, groupId) {
  const el = document.getElementById(id);
  if (!el) return true; // optionnel
  if (el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
    showError(groupId, 'Email invalide.');
    return false;
  }
  clearError(groupId);
  return true;
}

function showError(groupId, msg) {
  const g = document.getElementById(groupId);
  if (!g) return;
  g.classList.add('has-error');
  const errEl = g.querySelector('.form-error');
  if (errEl) errEl.textContent = msg;
}

function clearError(groupId) {
  document.getElementById(groupId)?.classList.remove('has-error');
}

// ─── Recap ───────────────────────────────────────────────────────────────────

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

// ─── Submit ───────────────────────────────────────────────────────────────────

async function handleSubmit(stepsWrap, panels, confirmEl, submitBtn) {
  if (!validate(3)) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Envoi…';

  const fd = buildFormData();

  try {
    const res  = await fetch('/send-rdv.php', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
      showConfirm(stepsWrap, panels, confirmEl);
      // Track succès
      window.dataLayer?.push({ event: 'form_success' });
    } else {
      resetBtn(submitBtn, '⚠ Erreur — Réessayez');
    }
  } catch {
    // Fallback mailto
    const p = val('prenom'), n = val('nom'), t = val('tel'), e = val('rdv-email');
    const sv = q('input[name="service"]:checked')?.value || '';
    const d  = val('rdv-date'), cr = q('input[name="creneau"]:checked')?.value || '', lo = val('localite');
    const body = encodeURIComponent(`Prénom: ${p}\nNom: ${n}\nTél: ${t}\nEmail: ${e}\n\nService: ${sv}\nDate: ${d} à ${cr}\nLieu: ${lo}`);
    window.location.href = `mailto:contact@finitionroyale.fr?subject=${encodeURIComponent('RDV - ' + p + ' ' + n)}&body=${body}`;
    showConfirm(stepsWrap, panels, confirmEl);
  }
}

function buildFormData() {
  const fd = new FormData();
  const fields = ['prenom', 'nom', 'rdv-email', 'tel', 'marque', 'etat', 'rdv-date', 'localite', 'service-comment'];
  fields.forEach(id => fd.append(id.replace('rdv-', ''), val(id)));
  fd.append('vehicule', q('input[name="vehicule"]:checked')?.value || '');
  fd.append('service',  q('input[name="service"]:checked')?.value  || '');
  fd.append('creneau',  q('input[name="creneau"]:checked')?.value  || '');
  fd.append('rgpd', '1');
  return fd;
}

function showConfirm(stepsWrap, panels, confirmEl) {
  stepsWrap?.style.setProperty('display', 'none');
  panels.forEach(p => (p.style.display = 'none'));
  confirmEl?.classList.add('visible');
  setText('confirm-prenom', val('prenom'));
  setText('confirm-date', fmtDate(val('rdv-date')));
}

function resetBtn(btn, label) {
  btn.disabled = false;
  btn.textContent = label;
  setTimeout(() => { btn.textContent = '🚀 Confirmer ma réservation'; }, 4000);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function q(sel)        { return document.querySelector(sel); }
function val(id)       { return document.getElementById(id)?.value || ''; }
function setText(id, t){ const el = document.getElementById(id); if (el) el.textContent = t; }

function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  const dt = new Date(+y, +m - 1, +d);
  return `${JOURS[dt.getDay()]} ${d} ${MOIS[+m - 1]} ${y}`;
}
