(() => {
  // Age gate
  const gate = document.getElementById('ageGate');
  let ok = false;
  try { ok = localStorage.getItem('vi-age-ok') === '1'; } catch (e) {}
  if (!ok) {
    gate.hidden = false;
    document.getElementById('ageYes').addEventListener('click', () => {
      try { localStorage.setItem('vi-age-ok', '1'); } catch (e) {}
      gate.hidden = true;
    });
  }

  // Nav background on scroll
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  document.getElementById('year').textContent = new Date().getFullYear();
})();
