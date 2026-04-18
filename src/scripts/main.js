/**
 * main.js — Finition Royale
 * Entry point. Importe et initialise tous les modules.
 */

import { initNav }        from './modules/nav.js';
import { initAnimations } from './modules/animations.js';
import { initForm }       from './modules/form.js';
import { initCookies }    from './modules/cookies.js';
import { initTracking }   from './modules/tracking.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initAnimations();
  initTracking();
  if (document.getElementById('rdv')) initForm();
  initCookies();
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
