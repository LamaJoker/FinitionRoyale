/* modules/form.js — Multi-step RDV form */

const TARIFS = {
  citadine: { interieur:'45–55€', shampoing:'55–70€', exterieur:'40–50€', phares:'60–90€', pack:'80–95€' },
  berline:  { interieur:'60–75€', shampoing:'65–85€', exterieur:'50–65€', phares:'60–90€', pack:'110–150€' },
  suv:      { interieur:'80–100€', shampoing:'85–105€', exterieur:'70–90€', phares:'60–90€', pack:'140–165€' },
};

const SERVICE_LABELS = {
  interieur: 'Intérieur Complet', shampoing: 'Shampoing Sièges',
  exterieur: 'Extérieur Premium', phares: 'Rénovation Phares', pack: 'Pack Int. + Ext.',
};
const VEHICULE_LABELS = {
  citadine: 'Citadine', berline: 'Berline / SUV', suv: '4×4 / Utilitaire',
};
const JOURS  = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MOIS   = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

export function initForm() {
  const panels   = document.querySelectorAll('.form-panel');
  const steps    = document.querySelectorAll('.form-step');
  const confirmEl = document.getElementById('confirm-screen');
  const submitBtn = document.getElementById('submit-btn');
  const stepsWrap = document.querySelector('.form-steps');

  if (!panels.length) return;

  let current = 0;

  // ── Navigation ──
  document.querySelectorAll('[data-next]').forEach(btn =>
    btn.addEventListener('click', () => { if (validate(current)) goTo(current + 1); })
  );
  document.querySelectorAll('[data-prev]').forEach(btn =>
    btn.addEventListener('click', () => goTo(current - 1))
  );
  steps.forEach((s, i) => {
    s.addEventListener('click', () => { if (i < current) goTo(i); });
  });

  // ── Date: min=tomorrow, block Sunday ──
  const dateInput = document.getElementById('rdv-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.addEventListener('change', function () {
      if (new Date(this.value + 'T00:00:00').getDay() === 0) {
        showError('date-group', 'Nous sommes fermés le dimanche.');
        this.value = '';
      } else {
        clearError('date-group');
      }
    });
  }

  // ── Submit ──
  submitBtn?.addEventListener('click', handleSubmit);

  // ── Year in footer ──
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // ─────────────────────────────────────────
  function goTo(n) {
    if (n < 0 || n >= panels.length) return;
    panels.forEach((p, i) => p.classList.toggle('active', i === n));
    steps.forEach((s, i) => {
      s.classList.toggle('active', i === n);
      s.classList.toggle('done',   i < n);
    });
    current = n;
    // Update progress text
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
    window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  }

  // ─────────────────────────────────────────
  function validate(step) {
    let ok = true;

    if (step === 0) {
      ok = requireRadio('vehicule', 'vehicule-group', 'Sélectionnez un type de véhicule.') && ok;
    }
    if (step === 1) {
      ok = requireRadio('service',  'service-group',  'Sélectionnez un service.') && ok;
    }
    if (step === 2) {
      ok = requireField('rdv-date',  'date-group',    'Choisissez une date.') && ok;
      ok = requireRadio('creneau',   'creneau-group', 'Choisissez un créneau.') && ok;
      ok = requireField('localite',  'localite-group','Indiquez votre commune.') && ok;
    }
    if (step === 3) {
      ok = requireField('prenom', 'prenom-group', 'Requis.') && ok;
      ok = requireField('nom',    'nom-group',    'Requis.') && ok;
      ok = requireField('tel',    'tel-group',    'Requis.') && ok;
      const rgpd = document.getElementById('rdv-rgpd');
      if (!rgpd?.checked) {
        showError('rgpd-group', 'Vous devez accepter les conditions.');
        ok = false;
      } else {
        clearError('rgpd-group');
      }
    }
    return ok;
  }

  function requireField(id, groupId, msg) {
    const el = document.getElementById(id);
    if (!el?.value.trim()) { showError(groupId, msg); return false; }
    clearError(groupId); return true;
  }
  function requireRadio(name, groupId, msg) {
    if (!document.querySelector(`input[name="${name}"]:checked`)) {
      showError(groupId, msg); return false;
    }
    clearError(groupId); return true;
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

  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  async function handleSubmit() {
    if (!validate(3)) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Envoi en cours…';

    const fd = buildFormData();

    try {
      const res  = await fetch('/send-rdv.php', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { showConfirm(); }
      else { resetSubmitBtn('⚠ Erreur — Réessayez'); }
    } catch {
      // Fallback: open email client
      const p = val('prenom'), n = val('nom'), t = val('tel'), e = val('rdv-email');
      const sv = q('input[name="service"]:checked')?.value || '';
      const d  = val('rdv-date'), cr = q('input[name="creneau"]:checked')?.value || '', lo = val('localite');
      const body = encodeURIComponent(`Prénom: ${p}\nNom: ${n}\nTél: ${t}\nEmail: ${e}\n\nService: ${sv}\nDate: ${d} à ${cr}\nLieu: ${lo}`);
      window.location.href = `mailto:contact@finitionroyale.fr?subject=${encodeURIComponent('Demande RDV - ' + p + ' ' + n)}&body=${body}`;
      showConfirm();
    }
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append('prenom',    val('prenom'));
    fd.append('nom',       val('nom'));
    fd.append('email',     val('rdv-email'));
    fd.append('tel',       val('tel'));
    fd.append('vehicule',  q('input[name="vehicule"]:checked')?.value || '');
    fd.append('marque',    val('marque'));
    fd.append('salissure', val('etat'));
    fd.append('service',   q('input[name="service"]:checked')?.value || '');
    fd.append('date',      val('rdv-date'));
    fd.append('creneau',   q('input[name="creneau"]:checked')?.value || '');
    fd.append('localite',  val('localite'));
    fd.append('message',   val('service-comment'));
    fd.append('rgpd',      '1');
    return fd;
  }

  function showConfirm() {
    stepsWrap?.style.setProperty('display', 'none');
    panels.forEach(p => (p.style.display = 'none'));
    confirmEl?.classList.add('visible');
    setText('confirm-prenom', val('prenom'));
    setText('confirm-date',   fmtDate(val('rdv-date')));
  }

  function resetSubmitBtn(label) {
    submitBtn.disabled = false;
    submitBtn.textContent = label;
    setTimeout(() => { submitBtn.textContent = '🚀 Confirmer ma réservation'; }, 4000);
  }

  // ─────────────────────────────────────────
  // Helpers
  function q(sel)       { return document.querySelector(sel); }
  function val(id)      { return document.getElementById(id)?.value || ''; }
  function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
  function fmtDate(str) {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    const dt = new Date(y, parseInt(m) - 1, d);
    return `${JOURS[dt.getDay()]} ${d} ${MOIS[parseInt(m)-1]} ${y}`;
  }
}
