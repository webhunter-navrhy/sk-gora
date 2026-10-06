(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* navigácia */
  const nav = $('#nav');
  const hero = $('#uvod');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > hero.offsetHeight - 90);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const burger = $('.burger');
  const menu = $('#menu');
  const closeMenu = () => { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('is-open'); nav.classList.remove('menu-open'); };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
  });
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));

  /* hero: slová nadpisu + rozsvietenie steny */
  const h1 = $('[data-words]');
  let wi = 0;
  const wrapWords = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const s = document.createElement('span');
          s.textContent = part;
          s.style.setProperty('--i', wi++);
          w.append(s);
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };
  wrapWords(h1);

  const sw = $('#heroSwitch');
  const swT = $('small', sw);
  const setLit = on => {
    hero.classList.toggle('is-lit', on);
    sw.setAttribute('aria-pressed', String(on));
    swT.textContent = on ? swT.dataset.on : swT.dataset.off;
  };
  sw.addEventListener('click', () => setLit(!hero.classList.contains('is-lit')));
  const lightUp = () => setTimeout(() => setLit(true), reduce ? 0 : 1300);
  const onImg = $('.hero__img--on');
  if (onImg.complete) lightUp(); else onImg.addEventListener('load', lightUp, { once: true });

  /* odhaľovanie pri scrolle */
  $$('.vy.reveal').forEach((el, i) => el.style.setProperty('--d', i % 5));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: .08 });
  $$('.reveal, .reveal-clip').forEach(el => io.observe(el));

  /* počítadlá */
  const fmt = n => n >= 10000 ? n.toLocaleString('sk-SK').replace(/ /g, ' ') : String(n);
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', pre = suf ? '' : '+';
    if (reduce) return;
    const t0 = performance.now(), dur = 1600;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = pre + fmt(v) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* čo vyrábame: fotka pri kurzore */
  const fl = $('#vyFloat');
  if (fine && fl) {
    const fimg = $('img', fl);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, on = false;
    const loop = () => {
      x += (tx - x) * .18; y += (ty - y) * .18;
      fl.style.transform = `translate(${x + 28}px, ${y - 110}px)`;
      raf = (on || Math.abs(tx - x) > .5) ? requestAnimationFrame(loop) : 0;
    };
    $$('.vy').forEach(li => {
      li.addEventListener('mouseenter', e => {
        fimg.src = li.dataset.img; on = true; fl.classList.add('is-on');
        if (!raf) { x = tx = e.clientX; y = ty = e.clientY; raf = requestAnimationFrame(loop); }
      });
      li.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
      li.addEventListener('mouseleave', () => { on = false; fl.classList.remove('is-on'); });
    });
  }

  /* konfigurátor kameňa */
  const VZ = JSON.parse($('#vzData').textContent);
  const scene = $('#scene'), room = $('#room'), grid = $('#swGrid');
  const optWall = $('#optWall'), optLit = $('#optLit'), litHint = $('#litHint');
  const selK = $('#selK'), selN = $('#selN'), selU = $('#selU');
  let cat = 'Quartzit', q = '', cur = VZ.find(v => v.s === window.VZ_START) || VZ[0];
  const fit = () => { room.style.setProperty('--s', Math.min(1.15, scene.clientWidth / 900).toFixed(3)); };
  addEventListener('resize', fit, { passive: true });
  fit();
  const faces = $$('.f, .bm', scene);
  const apply = (v, anim = true) => {
    cur = v;
    const url = `url("vz/${v.s}.jpg")`;
    const img = new Image();
    img.onload = () => {
      faces.forEach(f => { f.style.backgroundImage = url; });
      if (anim && !reduce) { scene.classList.remove('is-swap'); void scene.offsetWidth; scene.classList.add('is-swap'); }
    };
    img.src = `vz/${v.s}.jpg`;
    selK.textContent = v.k; selN.textContent = v.n; selU.textContent = v.u ? `povrch: ${v.u}` : '';
    const onyx = v.k === 'Onyx';
    optLit.disabled = !onyx;
    if (!onyx) { optLit.checked = false; scene.dataset.lit = '0'; }
    litHint.textContent = onyx ? 'Onyx prepúšťa svetlo – zapnite podsvietenie.' : 'Podsvietiť sa dá priesvitný kameň – vyberte si onyx.';
    $$('.sw', grid).forEach(b => b.setAttribute('aria-selected', String(b.dataset.s === v.s)));
  };
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const render = () => {
    const list = q ? VZ.filter(v => norm(v.n).includes(norm(q))) : VZ.filter(v => v.k === cat);
    grid.innerHTML = list.length ? list.map(v =>
      `<button type="button" class="sw" role="option" data-s="${v.s}" aria-selected="${v.s === cur.s}" title="${v.n} – ${v.u}">` +
      `<img src="vz/t/${v.s}.jpg" alt="" width="200" height="200" loading="lazy" decoding="async"><span>${v.n}${q ? ' · ' + v.k : ''}</span></button>`
    ).join('') : '<p class="sw-empty">Taký kameň sme vo vzorkovníku nenašli. Napíšte nám – v sklade máme viac ako 600 druhov.</p>';
    grid.scrollTop = 0;
  };
  grid.addEventListener('click', e => {
    const b = e.target.closest('.sw');
    if (b) apply(VZ.find(v => v.s === b.dataset.s));
  });
  $$('.vt').forEach(t => t.addEventListener('click', () => {
    cat = t.dataset.k; q = ''; $('#vzSearch').value = '';
    $$('.vt').forEach(x => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-pressed', String(x === t)); });
    render();
    const first = VZ.find(v => v.k === cat);
    if (cat === 'Onyx') apply(VZ.find(v => v.s === 'onyx-honey-onyx-polished') || first);
  }));
  $('#vzSearch').addEventListener('input', e => { q = e.target.value.trim(); render(); });
  optWall.addEventListener('change', () => { scene.dataset.wall = optWall.checked ? '1' : '0'; });
  optLit.addEventListener('change', () => { scene.dataset.lit = optLit.checked ? '1' : '0'; });
  render();
  apply(cur, false);

  /* svetlo: porovnanie */
  const cmp = $('#cmp');
  if (cmp) {
    const r = $('input', cmp);
    r.addEventListener('input', () => cmp.style.setProperty('--x', r.value + '%'));
    let played = false;
    const cio2 = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting || played || reduce) return;
      played = true; cio2.disconnect();
      const t0 = performance.now();
      const step = t => {
        const p = Math.min(1, (t - t0) / 1800);
        const v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p);
        cmp.style.setProperty('--x', v + '%'); r.value = v;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    cio2.observe(cmp);
  }

  /* povrchové úpravy */
  $$('.ut').forEach(t => t.addEventListener('click', () => {
    const k = t.dataset.u;
    $$('.ut').forEach(x => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', String(x === t)); });
    $$('.uv').forEach(x => x.classList.toggle('is-on', x.dataset.u === k));
    $$('.up').forEach(x => { x.hidden = x.id !== 'up-' + k; });
  }));

  /* realizácie */
  const G = JSON.parse($('#galData').textContent);
  const items = $$('.g');
  const more = $('#galMore');
  let kat = 'vse', expanded = false;
  const N_VIS = items.filter(li => !li.classList.contains('is-more')).length;
  const refresh = () => {
    let shown = 0, total = 0;
    items.forEach(li => {
      const ok = kat === 'vse' || li.dataset.kat === kat;
      if (ok) total++;
      const vis = ok && (expanded || kat !== 'vse' || shown < N_VIS);
      li.classList.remove('is-more');
      li.classList.toggle('is-hid', !vis);
      if (vis) { shown++; li.classList.remove('is-in'); void li.offsetWidth; li.classList.add('is-in'); }
    });
    more.hidden = expanded || kat !== 'vse' || total <= N_VIS;
  };
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    kat = c.dataset.kat;
    $$('.chip').forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    refresh();
  }));
  more.addEventListener('click', () => { expanded = true; refresh(); });

  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let li = 0, order = [];
  const show = i => {
    li = (i + order.length) % order.length;
    const g = G[order[li]];
    lbImg.src = g.s; lbImg.width = g.w; lbImg.height = g.h; lbImg.alt = g.p;
    lbCap.innerHTML = `<b>${g.k}</b>${g.p}`;
  };
  $('#gal').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    order = items.filter(x => !x.classList.contains('is-hid')).map(x => +$('button', x).dataset.i);
    show(order.indexOf(+b.dataset.i));
    lb.showModal();
  });
  $('.lb__x').addEventListener('click', () => lb.close());
  $('.lb__nav--p').addEventListener('click', () => show(li - 1));
  $('.lb__nav--n').addEventListener('click', () => show(li + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(li - 1); if (e.key === 'ArrowRight') show(li + 1); });
  let sx = 0;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(li + (dx < 0 ? 1 : -1)); });

  /* formulár */
  const form = $('#form'), fs = $('#formStone');
  $('#cfgCta').addEventListener('click', () => {
    fs.hidden = false;
    $('b', fs).textContent = `${cur.n} (${cur.k.toLowerCase()}${cur.u ? ', ' + cur.u : ''})${scene.dataset.lit === '1' ? ' s podsvietením' : ''}`;
  });
  $('button', fs).addEventListener('click', () => { fs.hidden = true; });
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(inp => {
      const bad = inp.type === 'checkbox' ? !inp.checked : !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value));
      inp.closest('.fld, .chk').classList.toggle('is-err', bad);
      if (bad) ok = false;
    });
    if (!ok) { $('.is-err input', form)?.focus(); return; }
    $('#formOk').hidden = false;
  });
})();
