/* main.js — Entry point. Initialise all modules. */

import { initNav }        from './modules/nav.js';
import { initAnimations } from './modules/animations.js';
import { initForm }       from './modules/form.js';
import { initCookies }    from './modules/cookies.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initAnimations();
  initForm();
  initCookies();

  // Footer year
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});
