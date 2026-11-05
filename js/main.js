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

// ---- Brand marquee ----
(() => {
  const BRANDS = ['Vaporesso', 'GeekVape', 'Voopoo', 'SMOK', 'Aspire', 'Eleaf', 'Innokin', 'Lost Vape', 'Uwell', 'Vandy Vape', 'Dovpo', 'Hellvape', 'Wotofo', 'Freemax', 'OXVA', 'Joyetech', 'Justfog', 'Steam Crave', 'BP Mods', 'Dotmod', 'Suprem-e', 'Flavourart', 'Dea Flavor', 'Azhad\'s Elixirs', 'Valkiria', 'Svapo Wave', 'Enjoy Svapo', 'La Tabaccheria', 'Vaporart', 'Seven Wonders', 'Blendfeel', 'TNT Vape', 'Clamour Vape', 'Angolo della Guancia'];
  const track = document.getElementById('brandTrack');
  const items = BRANDS.map((b) => `<li>${b}</li>`).join('');
  track.innerHTML = items + items.replace(/<li>/g, '<li aria-hidden="true">'); // doppio per scorrimento continuo
})();

// ---- YouTube: ultimo video in evidenza + carosello ----
(async () => {
  let data;
  try { data = await (await fetch('data/videos.json', { cache: 'no-cache' })).json(); } catch (e) { return; }
  const videos = (data && data.videos) || [];
  if (!videos.length) return;

  const player = document.getElementById('ytPlayer');
  const title = document.getElementById('ytTitle');
  const date = document.getElementById('ytDate');
  const badge = document.getElementById('ytBadge');
  const fmt = (d) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const show = (v, autoplay) => {
    player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0${autoplay ? '&autoplay=1' : ''}" title="${esc(v.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    title.textContent = v.title;
    date.textContent = 'Pubblicato il ' + fmt(v.published);
    badge.hidden = v !== videos[0];
    document.querySelectorAll('.vcard').forEach((c) => c.setAttribute('aria-current', String(c.dataset.id === v.id)));
  };

  const track = document.getElementById('track');
  track.innerHTML = videos.map((v) => `
    <li><button type="button" class="vcard" data-id="${v.id}">
      <span class="thumb"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy"></span>
      <span class="vt">${esc(v.title)}</span>
      <time datetime="${v.published}">${fmt(v.published)}</time>
    </button></li>`).join('');
  track.addEventListener('click', (e) => {
    const c = e.target.closest('.vcard');
    if (!c) return;
    show(videos.find((v) => v.id === c.dataset.id), true);
    player.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.querySelectorAll('#carousel .cbtn').forEach((b) => b.addEventListener('click', () => {
    track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.9, behavior: 'smooth' });
  }));

  show(videos[0], false);
  document.getElementById('carousel').hidden = videos.length < 2;
})();

// ---- Recensioni Google + dati di contatto ----
(async () => {
  let g;
  try { g = await (await fetch('data/reviews.json', { cache: 'no-cache' })).json(); } catch (e) { return; }
  if (!g || !g.placeId) return;
  const $ = (id) => document.getElementById(id);
  const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stars = (r) => `<span class="stars" aria-label="${r} su 5"><span>★★★★★</span><span class="fill" style="width:${(r / 5) * 100}%">★★★★★</span></span>`;

  if (g.rating) {
    $('gRating').textContent = g.rating.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    $('gStars').querySelector('.fill').style.width = (g.rating / 5) * 100 + '%';
    $('gCount').textContent = `Media su ${g.count} recensioni`;
  }
  if (g.reviewUrl) $('gWrite').href = g.reviewUrl;
  if (g.url) $('gAll').href = g.url;

  // Contatti
  if (g.address) $('cAddr').textContent = g.address;
  if (g.phone) $('cPhone').innerHTML = `<a href="tel:${g.phone.replace(/\s/g, '')}">${esc(g.phone)}</a>`;
  if (g.hours.length) $('cHours').innerHTML = '<ul class="hours">' + g.hours.map((h) => {
    const [d, ...t] = h.split(': ');
    return `<li><b>${esc(d)}</b><span>${esc(t.join(': '))}</span></li>`;
  }).join('') + '</ul>';
  const q = encodeURIComponent([g.name || 'Vapor Inside', g.address || 'Castelfranco Veneto'].join(', '));
  $('cMap').src = `https://www.google.com/maps?q=${q}&z=17&output=embed`;

  // Carosello
  const list = (g.reviews || []).filter((r) => r.rating >= 4);
  if (!list.length) return;
  $('rTrack').innerHTML = list.map((r) => `
    <li><article class="rcard">
      <div class="rhead">
        ${r.photo ? `<img src="${esc(r.photo)}" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer">` : `<span class="avatar">${esc((r.author || '?')[0])}</span>`}
        <div><a href="${esc(r.authorUrl || g.url)}" target="_blank" rel="noopener" class="rname">${esc(r.author)}</a><small>${esc(r.when)}</small></div>
      </div>
      ${stars(r.rating)}
      <p>${esc(r.text)}</p>
    </article></li>`).join('');
  $('rCarousel').hidden = false;
  const track = $('rTrack');
  document.querySelectorAll('#rCarousel .cbtn').forEach((b) => b.addEventListener('click', () => {
    track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.9, behavior: 'smooth' });
  }));
  // scorrimento automatico, in pausa al passaggio del mouse
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let pause = false;
    track.addEventListener('mouseenter', () => (pause = true));
    track.addEventListener('mouseleave', () => (pause = false));
    track.addEventListener('touchstart', () => (pause = true), { passive: true });
    setInterval(() => {
      if (pause || document.hidden) return;
      const end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
      track.scrollTo({ left: end ? 0 : track.scrollLeft + track.firstElementChild.offsetWidth + 18, behavior: 'smooth' });
    }, 5000);
  }
})();
