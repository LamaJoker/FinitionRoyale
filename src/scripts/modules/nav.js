/**
 * modules/nav.js
 * Navigation : scroll solid + burger menu + smooth scroll
 */

export function initNav() {
  const nav = document.getElementById('main-nav');
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobile-menu');
  const stickyCta = document.getElementById('sticky-cta');

  // Scroll → nav solid + sticky CTA visible
  const onScroll = () => {
    const scrolled = window.scrollY > 60;
    nav?.classList.toggle('solid', scrolled);
    stickyCta?.classList.toggle('visible', window.scrollY > 300);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // état initial

  // Burger toggle
  burger?.addEventListener('click', () => {
    const isOpen = burger.classList.toggle('open');
    menu?.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  // Fermer menu sur lien
  menu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Fermer menu sur ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  // Smooth scroll sur ancres internes
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = (nav?.offsetHeight || 72) + 16;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth'
      });
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
