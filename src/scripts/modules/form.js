/**
 * form.js — Formulaire RDV multi-étapes
 * Validation robuste + honeypot + tracking
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const TARIFS = {
  citadine: { interieur:'45–55€', shampoing:'55–70€', exterieur:'40–50€', phares:'60–90€', pack:'80–95€' },
  berline:  { interieur:'60–75€', shampoing:'65–85€', exterieur:'50–65€', phares:'60–90€', pack:'110–150€' },
  suv:      { interieur:'80–100€', shampoing:'85–105€', exterieur:'70–90€', phares:'60–90€', pack:'140–165€' },
};

const SERVICE_LABELS  = { interieur:'Intérieur Complet', shampoing:'Shampoing Sièges', exterieur:'Extérieur Premium', phares:'Rénovation Phares', pack:'Pack Int. + Ext.' };
const VEHICULE_LABELS = { citadine:'Citadine', berline:'Berline / SUV', suv:'4×4 / Utilitaire' };
const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MOIS  = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const q   = sel => document.querySelector(sel);
const val = id  => document.getElementById(id)?.value?.trim() ?? '';
const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };

function fmtDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  const dt = new Date(+y, +m - 1, +d);
  return `${JOURS[dt.getDay()]} ${d} ${MOIS[+m - 1]} ${y}`;
}

function setError(groupId, msg) {
  const g = document.getElementById(groupId);
  if (!g) return;
  g.classList.add('has-error');
  const el = g.querySelector('.form-error');
  if (el) el.textContent = msg;
}

function clearError(groupId) {
  document.getElementById(groupId)?.classList.remove('has-error');
}

function requireField(id, groupId, msg) {
  if (!val(id)) { setError(groupId, msg); return false; }
  clearError(groupId);
  return true;
}

function requireRadio(name, groupId, msg) {
  if (!q(`input[name="${name}"]:checked`)) { setError(groupId, msg); return false; }
  clearError(groupId);
  return true;
}

// ─── Validation par étape ────────────────────────────────────────────────────

function validate(step) {
  const rules = {
    0: () => requireRadio('vehicule', 'vehicule-group', 'Sélectionnez un type de véhicule.'),
    1: () => requireRadio('service', 'service-group', 'Sélectionnez un service.'),
    2: () => {
      let ok = requireField('rdv-date', 'date-group', 'Choisissez une date.');
      ok = requireRadio('creneau', 'creneau-group', 'Choisissez un créneau.') && ok;
      ok = requireField('localite', 'localite-group', 'Indiquez votre commune.') && ok;
      return ok;
    },
    3: () => {
      let ok = requireField('prenom', 'prenom-group', 'Requis.');
      ok = requireField('nom', 'nom-group', 'Requis.') && ok;
      ok = requireField('tel', 'tel-group', 'Requis.') && ok;
      const rgpd = document.getElementById('rdv-rgpd');
      if (!rgpd?.checked) { setError('rgpd-group', 'Veuillez accepter les conditions.'); ok = false; }
      else clearError('rgpd-group');
      return ok;
    },
  };
  return (rules[step] ?? (() => true))();
}

// ─── Récapitulatif ────────────────────────────────────────────────────────────

function updateRecap() {
  const v = q('input[name="vehicule"]:checked')?.value ?? '';
  const s = q('input[name="service"]:checked')?.value  ?? '';
  setText('r-vehicule', VEHICULE_LABELS[v] ?? '—');
  setText('r-service',  SERVICE_LABELS[s]  ?? '—');
  setText('r-date',     fmtDate(val('rdv-date')));
  setText('r-creneau',  q('input[name="creneau"]:checked')?.value ?? '—');
  setText('r-lieu',     val('localite') ?? '—');
  setText('r-prix',     TARIFS[v]?.[s] ?? 'Sur devis');
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function handleSubmit(stepsWrap, panels, confirmEl, submitBtn) {
  if (!validate(3)) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Envoi…';

  const fd = new FormData();
  ['prenom','nom','tel','marque','etat','localite'].forEach(id => fd.append(id, val(id)));
  fd.append('email',    val('rdv-email'));
  fd.append('date',     val('rdv-date'));
  fd.append('comment',  val('service-comment'));
  fd.append('vehicule', q('input[name="vehicule"]:checked')?.value ?? '');
  fd.append('service',  q('input[name="service"]:checked')?.value  ?? '');
  fd.append('creneau',  q('input[name="creneau"]:checked')?.value  ?? '');
  fd.append('rgpd', '1');

  try {
    const res  = await fetch('/send-rdv.php', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.success) {
      showConfirm(stepsWrap, panels, confirmEl);
      window.dataLayer?.push({ event: 'form_success' });
    } else {
      resetBtn(submitBtn);
    }
  } catch {
    // Fallback mailto si serveur PHP indisponible
    const body = encodeURIComponent(`Prénom: ${val('prenom')}\nNom: ${val('nom')}\nTél: ${val('tel')}\nService: ${q('input[name="service"]:checked')?.value ?? ''}\nDate: ${val('rdv-date')}\nLieu: ${val('localite')}`);
    window.location.href = `mailto:contact@finitionroyale.fr?subject=${encodeURIComponent('RDV - ' + val('prenom') + ' ' + val('nom'))}&body=${body}`;
    showConfirm(stepsWrap, panels, confirmEl);
  }
}

function showConfirm(stepsWrap, panels, confirmEl) {
  stepsWrap?.style.setProperty('display', 'none');
  panels.forEach(p => p.style.setProperty('display', 'none'));
  confirmEl?.classList.add('visible');
  setText('confirm-prenom', val('prenom'));
}

function resetBtn(btn) {
  btn.disabled = false;
  btn.textContent = '⚠ Erreur — Réessayez';
  setTimeout(() => { btn.textContent = '🚀 Confirmer ma réservation'; }, 4000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initForm() {
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
    steps.forEach((s, i) => {
      s.classList.toggle('active', i === n);
      s.classList.toggle('done', i < n);
    });
    currentStep = n;
    document.querySelectorAll('[data-progress]').forEach(el => el.textContent = `Étape ${n + 1} / ${panels.length}`);
    if (n === panels.length - 1) updateRecap();
    // Scroll vers le form
    const section = document.getElementById('rdv');
    if (section) {
      const offset = (document.getElementById('main-nav')?.offsetHeight ?? 72) + 16;
      window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    }
  }

  document.querySelectorAll('[data-next]').forEach(btn =>
    btn.addEventListener('click', () => { if (validate(currentStep)) goTo(currentStep + 1); })
  );
  document.querySelectorAll('[data-prev]').forEach(btn =>
    btn.addEventListener('click', () => goTo(currentStep - 1))
  );
  steps.forEach((s, i) => s.addEventListener('click', () => { if (i < currentStep) goTo(i); }));

  // Date : min = demain, pas de dimanche
  const dateInput = document.getElementById('rdv-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.addEventListener('change', function () {
      const day = new Date(this.value + 'T00:00:00').getDay();
      if (day === 0) { setError('date-group', 'Nous sommes fermés le dimanche.'); this.value = ''; }
      else clearError('date-group');
    });
  }

  // Submit
  submitBtn?.addEventListener('click', () => handleSubmit(stepsWrap, panels, confirmEl, submitBtn));

  // Honeypot — bot détecté → faux succès silencieux
  submitBtn?.addEventListener('click', e => {
    const honeypot = document.querySelector('input[name="_honeypot"]');
    if (honeypot?.value) { e.stopImmediatePropagation(); showConfirm(stepsWrap, panels, confirmEl); }
  }, true);
}
