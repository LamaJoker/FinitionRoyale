/* modules/nav.js — Navigation scroll + burger menu */

export function initNav() {
  const nav      = document.getElementById('main-nav');
  const burger   = document.getElementById('burger');
  const menu     = document.getElementById('mobile-menu');
  const stickyCta = document.getElementById('sticky-cta');

  // Scroll → solid nav + show sticky CTA
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('solid', window.scrollY > 60);
    stickyCta?.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  // Initial check (page reload mid-scroll)
  if (nav && window.scrollY > 60) nav.classList.add('solid');

  // Burger toggle
  burger?.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    menu?.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    burger.setAttribute('aria-expanded', String(open));
  });

  // Close menu on link click
  menu?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger?.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = (document.getElementById('main-nav')?.offsetHeight || 72) + 16;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth'
      });
    });
  });
}
