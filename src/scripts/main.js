/**
 * main.js — Entry point
 * Initialise tous les modules de manière conditionnelle
 */

import { initNav } from './modules/nav.js';
import { initAnimations } from './modules/animations.js';
import { initForm } from './modules/form.js';
import { initCookies } from './modules/cookies.js';
import { initTracking } from './modules/tracking.js';

document.addEventListener('DOMContentLoaded', () => {
  // Core — toujours actifs
  initNav();
  initAnimations();
  initTracking();

  // Form — uniquement sur les pages avec formulaire RDV
  if (document.getElementById('rdv')) {
    initForm();
  }

  // Cookies — toujours actif
  initCookies();

  // Footer year — partout
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
